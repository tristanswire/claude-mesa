import { createClient } from "@/lib/supabase/server";
import {
  parseRecipeFromDb,
  parseRecipePayload,
  type ValidationResult,
} from "@/lib/validation/recipes";
import type { Recipe } from "@/lib/schemas";
import { linkIngredientsToInstructions, allRefsEmpty } from "@/lib/import";
import { canCreateRecipe } from "@/lib/db/entitlements";
import { trackEventAsync } from "@/lib/analytics/events";

export type DbResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * List all recipes for the current user, sorted by updated_at desc.
 */
export async function listRecipes(): Promise<DbResult<Recipe[]>> {
  const supabase = await createClient();

  // Check authentication status first
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[listRecipes] Database error:", {
      userId: user.id.slice(0, 8),
      code: error.code,
      message: error.message,
    });
    return { success: false, error: "Failed to load recipes" };
  }

  // Validate each recipe from DB
  const recipes: Recipe[] = [];
  for (const row of data || []) {
    const result = parseRecipeFromDb(row);
    if (!result.success) {
      console.error("[listRecipes] Invalid recipe data:", row.id, result.details);
      // Skip invalid recipes but continue
      continue;
    }
    recipes.push(result.data);
  }

  return { success: true, data: recipes };
}

/**
 * Get a single recipe by ID.
 * Returns appropriate error messages for different failure cases.
 */
export async function getRecipeById(id: string): Promise<DbResult<Recipe>> {
  const supabase = await createClient();

  // Check authentication status first
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // Dev-only logging for debugging RLS issues
  if (process.env.NODE_ENV === "development") {
    console.log("[getRecipeById] Debug:", {
      recipeId: id,
      userId: user?.id ? `${user.id.slice(0, 8)}...` : "not authenticated",
      authError: authError?.message || null,
    });
  }

  // If not authenticated, return early with clear message
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    // PGRST116 = "JSON object requested, multiple (or no) rows returned"
    // This happens when: 1) recipe doesn't exist, or 2) RLS blocked access
    if (error.code === "PGRST116") {
      // Check if recipe exists at all (using a count query that bypasses single())
      // This helps distinguish "not found" from "no permission"
      // Note: If user doesn't own the recipe, RLS will return 0 rows
      // So we can only definitively say "not found" if they own 0 recipes with this ID
      return { success: false, error: "Recipe not found" };
    }

    // RLS policy violation (rare - usually returns 0 rows instead)
    if (error.code === "42501" || error.message.includes("permission")) {
      console.error("[getRecipeById] Permission denied:", {
        recipeId: id,
        userId: user.id.slice(0, 8),
        error: error.message,
      });
      return { success: false, error: "You don't have permission to view this recipe" };
    }

    console.error("[getRecipeById] Database error:", {
      recipeId: id,
      userId: user.id.slice(0, 8),
      code: error.code,
      message: error.message,
    });
    return { success: false, error: "Failed to load recipe" };
  }

  const result = parseRecipeFromDb(data);
  if (!result.success) {
    console.error("[getRecipeById] Invalid recipe data:", id, result.details);
    return { success: false, error: "Recipe data is corrupted" };
  }

  return { success: true, data: result.data };
}

/**
 * Create a new recipe.
 */
export async function createRecipe(
  payload: unknown
): Promise<ValidationResult<Recipe>> {
  // Validate input payload
  const validationResult = parseRecipePayload(payload);
  if (!validationResult.success) {
    return validationResult;
  }

  const validPayload = validationResult.data;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      success: false,
      error: "Not authenticated",
      details: { _form: ["You must be logged in to create a recipe"] },
    };
  }

  // Check recipe limit before creating
  const limitCheck = await canCreateRecipe();
  if (!limitCheck.allowed) {
    return {
      success: false,
      error: limitCheck.reason || "Cannot create recipe",
      details: {
        _form: [limitCheck.reason || "Recipe limit reached"],
        _code: [limitCheck.code || "UNKNOWN"],
        ...(limitCheck.limit !== undefined && { _limit: [String(limitCheck.limit)] }),
      },
    };
  }

  // Auto-link ingredients to instructions if all refs are empty
  let instructions = validPayload.instructions;
  if (allRefsEmpty(instructions)) {
    instructions = linkIngredientsToInstructions(
      instructions,
      validPayload.ingredients
    );
  }

  // Insert recipe
  // NOTE: image_path and image_url are updated separately via updateRecipeImage()
  // to avoid errors if the migration hasn't been applied yet.
  const { data, error } = await supabase
    .from("recipes")
    .insert({
      user_id: user.id,
      title: validPayload.title,
      description: validPayload.description,
      servings: validPayload.servings,
      prep_time_minutes: validPayload.prepTimeMinutes,
      cook_time_minutes: validPayload.cookTimeMinutes,
      source_url: validPayload.sourceUrl,
      ingredients: validPayload.ingredients,
      instructions,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating recipe:", error);
    return {
      success: false,
      error: "Failed to create recipe",
      details: { _form: [error.message] },
    };
  }

  // Validate the returned data
  const result = parseRecipeFromDb(data);
  if (!result.success) {
    console.error("Invalid recipe data returned from insert:", result.details);
    return {
      success: false,
      error: "Recipe created but data is invalid",
      details: result.details,
    };
  }

  // Track event (non-blocking)
  trackEventAsync("recipe_created", {
    recipeId: result.data.id,
    recipeTitle: result.data.title,
    sourceUrl: result.data.sourceUrl,
    importMethod: result.data.sourceUrl ? "url" : "manual",
  });

  return { success: true, data: result.data };
}

/**
 * Update an existing recipe.
 */
export async function updateRecipe(
  id: string,
  payload: unknown
): Promise<ValidationResult<Recipe>> {
  // Validate input payload
  const validationResult = parseRecipePayload(payload);
  if (!validationResult.success) {
    return validationResult;
  }

  const validPayload = validationResult.data;
  const supabase = await createClient();

  // Auto-link ingredients to instructions if all refs are empty
  let instructions = validPayload.instructions;
  if (allRefsEmpty(instructions)) {
    instructions = linkIngredientsToInstructions(
      instructions,
      validPayload.ingredients
    );
  }

  // Update recipe (RLS ensures user can only update their own)
  // NOTE: image_path and image_url are updated separately via updateRecipeImage()
  // to avoid errors if the migration hasn't been applied yet.
  const { data, error } = await supabase
    .from("recipes")
    .update({
      title: validPayload.title,
      description: validPayload.description,
      servings: validPayload.servings,
      prep_time_minutes: validPayload.prepTimeMinutes,
      cook_time_minutes: validPayload.cookTimeMinutes,
      source_url: validPayload.sourceUrl,
      ingredients: validPayload.ingredients,
      instructions,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return {
        success: false,
        error: "Recipe not found",
        details: { _form: ["Recipe not found or you don't have permission"] },
      };
    }
    console.error("Error updating recipe:", error);
    return {
      success: false,
      error: "Failed to update recipe",
      details: { _form: [error.message] },
    };
  }

  // Validate the returned data
  const result = parseRecipeFromDb(data);
  if (!result.success) {
    console.error("Invalid recipe data returned from update:", result.details);
    return {
      success: false,
      error: "Recipe updated but data is invalid",
      details: result.details,
    };
  }

  return { success: true, data: result.data };
}

/**
 * Delete a recipe.
 */
export async function deleteRecipe(id: string): Promise<DbResult<void>> {
  const supabase = await createClient();

  const { error } = await supabase.from("recipes").delete().eq("id", id);

  if (error) {
    console.error("Error deleting recipe:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data: undefined };
}

/**
 * Update only the image fields for a recipe.
 *
 * TODO: This requires the image_path and image_url columns to exist.
 * Run the migration: supabase/migrations/0005_recipe_images.sql
 * If you get "column not found" errors, see README for migration steps.
 */
export async function updateRecipeImage(
  id: string,
  imagePath: string | null,
  imageUrl: string | null
): Promise<DbResult<void>> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("recipes")
    .update({
      image_path: imagePath,
      image_url: imageUrl,
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating recipe image:", error);

    // Provide helpful error message if columns don't exist
    if (error.message.includes("column") && error.message.includes("schema cache")) {
      return {
        success: false,
        error:
          "Recipe image columns not found. Please run the database migration (0005_recipe_images.sql) and refresh the schema cache. See README for details.",
      };
    }

    return { success: false, error: error.message };
  }

  return { success: true, data: undefined };
}
