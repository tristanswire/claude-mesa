"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createRecipe,
  updateRecipe,
  deleteRecipe,
  updateRecipeImage,
} from "@/lib/db/recipes";
import { canCreateRecipe } from "@/lib/db/entitlements";
import { createClient } from "@/lib/supabase/server";
import { logRecipeAction, generateErrorId } from "@/lib/logger";
import { mapErrorToFriendlyMessage } from "@/lib/errors";
import { trackEventAsync } from "@/lib/analytics/events";
import type { Ingredient, InstructionStep, IngredientRef } from "@/lib/schemas";

export type FormState = {
  success: boolean;
  error?: string;
  errorId?: string;
  fieldErrors?: Record<string, string[]>;
  /** Set when the user has hit a plan limit. */
  code?: "RECIPE_LIMIT_REACHED";
  /** True when a former Plus subscriber hit the limit after their plan expired. */
  isLapsedPlus?: boolean;
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
  imageUrl?: string;
  ingredients: Ingredient[];
  instructions: InstructionStep[];
} {
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || undefined;
  const servingsStr = formData.get("servings") as string;
  const prepTimeStr = formData.get("prepTimeMinutes") as string;
  const cookTimeStr = formData.get("cookTimeMinutes") as string;
  const sourceUrlStr = formData.get("sourceUrl") as string;
  const imageUrlStr = formData.get("imageUrl") as string;

  const servings = servingsStr ? parseInt(servingsStr, 10) : undefined;
  const prepTimeMinutes = prepTimeStr ? parseInt(prepTimeStr, 10) : undefined;
  const cookTimeMinutes = cookTimeStr ? parseInt(cookTimeStr, 10) : undefined;
  const sourceUrl = sourceUrlStr?.trim() || undefined;
  const imageUrl = imageUrlStr?.trim() || undefined;

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
    imageUrl,
    ingredients,
    instructions,
  };
}

export async function createRecipeAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  // Get user for logging
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Check if user can create more recipes (plan limits)
  const limitCheck = await canCreateRecipe();
  if (!limitCheck.allowed) {
    return {
      success: false,
      error: limitCheck.reason || "You cannot create more recipes at this time.",
      code: limitCheck.code === "RECIPE_LIMIT_REACHED" ? "RECIPE_LIMIT_REACHED" : undefined,
      isLapsedPlus: limitCheck.isLapsedPlus,
    };
  }

  const payload = parseFormData(formData);

  const result = await createRecipe(payload);

  if (!result.success) {
    const errorId = generateErrorId();
    const { message } = mapErrorToFriendlyMessage(result.error);
    logRecipeAction("save", false, {
      userId: user?.id,
      errorId,
      error: result.error,
    });
    return {
      success: false,
      error: message,
      errorId,
      fieldErrors: result.details,
    };
  }

  const recipeId = result.data.id;

  logRecipeAction("save", true, {
    recipeId,
    userId: user?.id,
  });

  // Save image URL if provided (for imported recipes with external images)
  if (payload.imageUrl) {
    // For external images, we only store the URL (no image_path since it's not in our storage)
    const imageResult = await updateRecipeImage(recipeId, null, payload.imageUrl);
    if (!imageResult.success) {
      // Log but don't fail - the recipe was created successfully
      logRecipeAction("update", false, {
        recipeId,
        userId: user?.id,
        error: `Image URL save failed: ${imageResult.error}`,
      });
    }
  }

  revalidatePath("/recipes");
  redirect(`/recipes/${recipeId}`);
}

export async function updateRecipeAction(
  id: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  // Get user for logging
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const payload = parseFormData(formData);

  const result = await updateRecipe(id, payload);

  if (!result.success) {
    const errorId = generateErrorId();
    const { message } = mapErrorToFriendlyMessage(result.error);
    logRecipeAction("update", false, {
      recipeId: id,
      userId: user?.id,
      errorId,
      error: result.error,
    });
    return {
      success: false,
      error: message,
      errorId,
      fieldErrors: result.details,
    };
  }

  logRecipeAction("update", true, {
    recipeId: id,
    userId: user?.id,
  });

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${id}`);
  redirect(`/recipes/${id}`);
}

export async function deleteRecipeAction(id: string): Promise<FormState> {
  // Get user for logging
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const result = await deleteRecipe(id);

  if (!result.success) {
    const errorId = generateErrorId();
    const { message } = mapErrorToFriendlyMessage(result.error);
    logRecipeAction("delete", false, {
      recipeId: id,
      userId: user?.id,
      errorId,
      error: result.error,
    });
    return {
      success: false,
      error: message,
      errorId,
    };
  }

  logRecipeAction("delete", true, {
    recipeId: id,
    userId: user?.id,
  });

  // Track recipe deletion (non-blocking)
  trackEventAsync("recipe_deleted", { recipeId: id });

  revalidatePath("/recipes");
  redirect("/recipes");
}
