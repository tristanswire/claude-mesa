"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createRecipe,
  updateRecipe,
  deleteRecipe,
} from "@/lib/db/recipes";
import type { Ingredient, InstructionStep, IngredientRef } from "@/lib/schemas";

export type FormState = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Parse form data into a recipe payload.
 */
function parseFormData(formData: FormData): {
  title: string;
  description?: string;
  servings?: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  sourceUrl?: string;
  ingredients: Ingredient[];
  instructions: InstructionStep[];
} {
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || undefined;
  const servingsStr = formData.get("servings") as string;
  const prepTimeStr = formData.get("prepTimeMinutes") as string;
  const cookTimeStr = formData.get("cookTimeMinutes") as string;
  const sourceUrlStr = formData.get("sourceUrl") as string;
  // NOTE: imageUrl is not included here - it's handled separately via updateRecipeImage
  // to avoid errors if the migration hasn't been applied yet.

  const servings = servingsStr ? parseInt(servingsStr, 10) : undefined;
  const prepTimeMinutes = prepTimeStr ? parseInt(prepTimeStr, 10) : undefined;
  const cookTimeMinutes = cookTimeStr ? parseInt(cookTimeStr, 10) : undefined;
  const sourceUrl = sourceUrlStr?.trim() || undefined;

  // Parse ingredients from form arrays
  const ingredientIds = formData.getAll("ingredient_id") as string[];
  const ingredientNames = formData.getAll("ingredient_name") as string[];
  const ingredientTexts = formData.getAll("ingredient_originalText") as string[];
  const ingredientQuantities = formData.getAll("ingredient_originalQuantity") as string[];
  const ingredientUnits = formData.getAll("ingredient_originalUnit") as string[];
  const ingredientTypes = formData.getAll("ingredient_ingredientType") as string[];
  const ingredientCanonicalQuantities = formData.getAll("ingredient_canonicalQuantity") as string[];
  const ingredientCanonicalUnits = formData.getAll("ingredient_canonicalUnit") as string[];

  const ingredients: Ingredient[] = ingredientNames
    .map((name, i) => {
      if (!name.trim()) return null;

      const originalQuantity = ingredientQuantities[i]
        ? parseFloat(ingredientQuantities[i])
        : null;
      const canonicalQuantity = ingredientCanonicalQuantities[i]
        ? parseFloat(ingredientCanonicalQuantities[i])
        : null;

      return {
        id: ingredientIds[i] || generateUUID(),
        name: name.trim(),
        originalText: ingredientTexts[i] || name.trim(),
        originalQuantity: isNaN(originalQuantity as number) ? null : originalQuantity,
        originalUnit: ingredientUnits[i] || null,
        ingredientType: (ingredientTypes[i] as "volume" | "weight" | "count") || "count",
        canonicalQuantity: isNaN(canonicalQuantity as number) ? null : canonicalQuantity,
        canonicalUnit: (ingredientCanonicalUnits[i] as "ml" | "g" | null) || null,
        orderIndex: i,
      };
    })
    .filter((ing): ing is Ingredient => ing !== null);

  // Parse instructions from form arrays
  const instructionIds = formData.getAll("instruction_id") as string[];
  const instructionTexts = formData.getAll("instruction_text") as string[];
  const instructionRefsJson = formData.getAll("instruction_refs") as string[];

  const instructions: InstructionStep[] = instructionTexts
    .map((text, i): InstructionStep | null => {
      if (!text.trim()) return null;

      // Parse refs from JSON, with validation
      let refs: IngredientRef[] = [];
      try {
        const parsedRefs = JSON.parse(instructionRefsJson[i] || "[]");
        if (Array.isArray(parsedRefs)) {
          refs = parsedRefs.filter(
            (ref): ref is IngredientRef =>
              ref &&
              Array.isArray(ref.ingredientIds) &&
              ref.ingredientIds.length > 0 &&
              ref.placement === "end"
          );
        }
      } catch {
        // Invalid JSON, use empty refs
        refs = [];
      }

      return {
        id: instructionIds[i] || generateUUID(),
        stepNumber: i + 1,
        text: text.trim(),
        refs,
      };
    })
    .filter((step): step is InstructionStep => step !== null);

  return {
    title,
    description,
    servings,
    prepTimeMinutes,
    cookTimeMinutes,
    sourceUrl,
    ingredients,
    instructions,
  };
}

export async function createRecipeAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const payload = parseFormData(formData);

  const result = await createRecipe(payload);

  if (!result.success) {
    return {
      success: false,
      error: result.error,
      fieldErrors: result.details,
    };
  }

  revalidatePath("/recipes");
  redirect(`/recipes/${result.data.id}`);
}

export async function updateRecipeAction(
  id: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const payload = parseFormData(formData);

  const result = await updateRecipe(id, payload);

  if (!result.success) {
    return {
      success: false,
      error: result.error,
      fieldErrors: result.details,
    };
  }

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${id}`);
  redirect(`/recipes/${id}`);
}

export async function deleteRecipeAction(id: string): Promise<FormState> {
  const result = await deleteRecipe(id);

  if (!result.success) {
    return {
      success: false,
      error: result.error,
    };
  }

  revalidatePath("/recipes");
  redirect("/recipes");
}
