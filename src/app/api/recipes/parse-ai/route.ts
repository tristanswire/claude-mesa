import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { canUseAiAction, incrementAiActionsUsed } from "@/lib/db/entitlements";
import { trackEventAsync } from "@/lib/analytics/events";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a recipe parser. Extract recipe data from the provided text and return it as valid JSON only. No markdown, no explanation, just the JSON object.

Return this exact shape (omit optional fields if they cannot be determined):
{
  "title": "string",
  "description": "string (optional)",
  "servings": number (optional, positive integer),
  "prepTimeMinutes": number (optional, non-negative integer),
  "cookTimeMinutes": number (optional, non-negative integer),
  "ingredients": [
    {
      "name": "string (ingredient name only, e.g. 'flour')",
      "originalText": "string (full line as written, e.g. '2 cups all-purpose flour')",
      "quantity": number or null,
      "unit": "string or null (e.g. 'cup', 'tbsp', 'g')"
    }
  ],
  "instructions": [
    { "text": "string (single step)" }
  ]
}

Rules:
- ingredients and instructions arrays must be present and non-empty
- Parse each ingredient line into name, quantity, and unit if possible
- Split instructions into individual steps (do not combine multiple steps)
- If the text is not a recipe, return: {"error": "not a recipe"}`;

interface RawIngredient {
  name: string;
  originalText: string;
  quantity?: number | null;
  unit?: string | null;
}

interface RawInstruction {
  text: string;
}

interface ParsedRecipeResponse {
  title: string;
  description?: string;
  servings?: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  ingredients: RawIngredient[];
  instructions: RawInstruction[];
  error?: string;
}

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Plan check
  const aiCheck = await canUseAiAction();
  if (!aiCheck.allowed) {
    return NextResponse.json(
      { error: aiCheck.reason ?? "AI actions not available on your plan" },
      { status: 403 }
    );
  }

  // Parse request body
  let text: string;
  let titleOverride: string | undefined;
  let sourceUrl: string | undefined;

  try {
    const body = await req.json();
    text = body.text;
    titleOverride = body.title;
    sourceUrl = body.sourceUrl;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!text || typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  // Call Claude
  let parsed: ParsedRecipeResponse;
  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: text.trim(),
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    parsed = JSON.parse(content.text) as ParsedRecipeResponse;
  } catch (err) {
    console.error("Claude parse error:", err);
    return NextResponse.json(
      { error: "AI parsing failed. Try the standard parser instead." },
      { status: 500 }
    );
  }

  if (parsed.error) {
    return NextResponse.json(
      { error: "The pasted text doesn't appear to be a recipe." },
      { status: 422 }
    );
  }

  if (
    !parsed.title ||
    !Array.isArray(parsed.ingredients) ||
    !Array.isArray(parsed.instructions) ||
    parsed.ingredients.length === 0 ||
    parsed.instructions.length === 0
  ) {
    return NextResponse.json(
      { error: "AI could not extract a complete recipe from the text." },
      { status: 422 }
    );
  }

  // Increment AI usage counter
  await incrementAiActionsUsed();

  // Track AI parse used (non-blocking)
  trackEventAsync("recipe_import_started", { importMethod: "text", aiParse: true });

  // Transform to RecipePayload format
  const ingredients = parsed.ingredients.map((ing, index) => ({
    id: crypto.randomUUID(),
    name: ing.name || ing.originalText,
    originalText: ing.originalText || ing.name,
    originalQuantity: ing.quantity ?? null,
    originalUnit: ing.unit ?? null,
    canonicalQuantity: null,
    canonicalUnit: null,
    ingredientType: "count" as const,
    orderIndex: index,
  }));

  const instructions = parsed.instructions.map((step, index) => ({
    id: crypto.randomUUID(),
    stepNumber: index + 1,
    text: step.text,
    refs: [],
  }));

  const recipe = {
    title: titleOverride || parsed.title,
    description: parsed.description,
    servings: parsed.servings,
    prepTimeMinutes: parsed.prepTimeMinutes,
    cookTimeMinutes: parsed.cookTimeMinutes,
    sourceUrl: sourceUrl || undefined,
    ingredients,
    instructions,
  };

  return NextResponse.json({ success: true, recipe });
}
