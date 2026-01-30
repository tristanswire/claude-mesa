/**
 * Recipe import pipeline.
 * Supports importing from URL (JSON-LD) or pasted text.
 */

import { RecipePayloadSchema, type RecipePayload } from "@/lib/schemas";
import { fetchRecipeHtml } from "./fetcher";
import { parseJsonLd } from "./jsonld";
import { parseIngredients } from "./canonicalize";
import { normalizeInstructions } from "./instructions_normalize";
import { linkIngredientsToInstructions } from "./linker";
import { parseRecipeText, validateParsedText } from "./text_normalize";

export interface ImportResult {
  success: true;
  recipe: RecipePayload;
}

export interface ImportError {
  success: false;
  error: string;
}

export type ImportResponse = ImportResult | ImportError;

/**
 * Import a recipe from a URL.
 * Returns a validated RecipePayload ready for review/editing.
 */
export async function importRecipeFromUrl(url: string): Promise<ImportResponse> {
  // Step 1: Fetch HTML
  const fetchResult = await fetchRecipeHtml(url);
  if (!fetchResult.success) {
    return { success: false, error: fetchResult.error };
  }

  // Step 2: Parse JSON-LD
  const parseResult = parseJsonLd(fetchResult.html, fetchResult.url);
  if (!parseResult.success) {
    return { success: false, error: parseResult.error };
  }

  const raw = parseResult.data;

  // Step 3: Parse ingredients
  const ingredients = parseIngredients(raw.ingredientLines);

  // Step 4: Normalize instructions
  const normalizedInstructions = normalizeInstructions(raw.instructionLines);

  // Step 5: Auto-link ingredients to instructions
  const instructions = linkIngredientsToInstructions(
    normalizedInstructions,
    ingredients
  );

  // Step 6: Build recipe payload
  const payload: RecipePayload = {
    title: raw.title,
    description: raw.description,
    servings: raw.servings,
    prepTimeMinutes: raw.prepTimeMinutes,
    cookTimeMinutes: raw.cookTimeMinutes,
    sourceUrl: raw.sourceUrl,
    imageUrl: raw.imageUrl,
    ingredients,
    instructions,
  };

  // Step 7: Validate with Zod
  const validation = RecipePayloadSchema.safeParse(payload);
  if (!validation.success) {
    // This shouldn't happen if our parsing is correct, but handle it gracefully
    console.error("Import validation failed:", validation.error.flatten());
    return {
      success: false,
      error: "Failed to parse recipe data into valid format",
    };
  }

  return { success: true, recipe: validation.data };
}

/**
 * Import a recipe from pasted text.
 * Returns a validated RecipePayload ready for review/editing.
 */
export async function importRecipeFromText(payload: {
  text: string;
  sourceUrl?: string;
  title?: string;
}): Promise<ImportResponse> {
  // Step 1: Parse text into sections
  const parsed = parseRecipeText(payload.text);

  // Step 2: Validate we have usable content
  const validation = validateParsedText(parsed);
  if (!validation.valid) {
    return { success: false, error: validation.error! };
  }

  // Step 3: Parse ingredients
  const ingredients = parseIngredients(parsed.ingredientLines);

  // Step 4: Normalize instructions
  const normalizedInstructions = normalizeInstructions(parsed.instructionLines);

  // Step 5: Auto-link ingredients to instructions
  const instructions = linkIngredientsToInstructions(
    normalizedInstructions,
    ingredients
  );

  // Step 6: Determine title
  const title = payload.title || parsed.title || "Imported Recipe";

  // Step 7: Build recipe payload
  const recipePayload: RecipePayload = {
    title,
    sourceUrl: payload.sourceUrl,
    ingredients,
    instructions,
  };

  // Step 8: Validate with Zod
  const zodValidation = RecipePayloadSchema.safeParse(recipePayload);
  if (!zodValidation.success) {
    console.error("Text import validation failed:", zodValidation.error.flatten());
    return {
      success: false,
      error: "Failed to parse recipe text into valid format. Please check your input.",
    };
  }

  return { success: true, recipe: zodValidation.data };
}

// Re-export types and utilities that may be useful
export { type RawRecipeData } from "./jsonld";
export { parseIngredients } from "./canonicalize";
export { normalizeInstructions } from "./instructions_normalize";
export { simplifyInstructionLines } from "./simplifier";
export { linkIngredientsToInstructions, allRefsEmpty } from "./linker";
export { parseRecipeText, validateParsedText } from "./text_normalize";
