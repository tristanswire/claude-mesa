/**
 * Recipe sharing functionality - create, revoke, and lookup share links.
 */

import { createClient } from "@/lib/supabase/server";
import { parseRecipeFromDb } from "@/lib/validation/recipes";
import type { Recipe } from "@/lib/schemas";

export interface RecipeShare {
  id: string;
  recipeId: string;
  userId: string;
  token: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ShareResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Generate a URL-safe random token.
 */
function generateToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  // Convert to base64 and make URL-safe
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Get the active share for a recipe (if any).
 */
export async function getActiveShareForRecipe(
  recipeId: string
): Promise<ShareResult<RecipeShare | null>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("recipe_shares")
    .select("*")
    .eq("recipe_id", recipeId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("Error fetching share:", error);
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: true, data: null };
  }

  return {
    success: true,
    data: {
      id: data.id,
      recipeId: data.recipe_id,
      userId: data.user_id,
      token: data.token,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    },
  };
}

/**
 * Create a new share link for a recipe.
 * If an active share already exists, returns it instead.
 */
export async function createRecipeShare(
  recipeId: string
): Promise<ShareResult<RecipeShare>> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Check if active share already exists
  const existingResult = await getActiveShareForRecipe(recipeId);
  if (existingResult.success && existingResult.data) {
    return { success: true, data: existingResult.data };
  }

  // Generate a unique token
  const token = generateToken();

  const { data, error } = await supabase
    .from("recipe_shares")
    .insert({
      recipe_id: recipeId,
      user_id: user.id,
      token,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating share:", error);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: {
      id: data.id,
      recipeId: data.recipe_id,
      userId: data.user_id,
      token: data.token,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    },
  };
}

/**
 * Revoke (deactivate) a share link.
 */
export async function revokeRecipeShare(
  shareId: string
): Promise<ShareResult<void>> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("recipe_shares")
    .update({ is_active: false })
    .eq("id", shareId);

  if (error) {
    console.error("Error revoking share:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data: undefined };
}

/**
 * Get a recipe by share token (for public access).
 * Returns the recipe data if the share is active.
 */
export async function getRecipeByShareToken(
  token: string
): Promise<ShareResult<{ recipe: Recipe; shareId: string }>> {
  const supabase = await createClient();

  // First, find the active share with this token
  const { data: shareData, error: shareError } = await supabase
    .from("recipe_shares")
    .select("id, recipe_id")
    .eq("token", token)
    .eq("is_active", true)
    .maybeSingle();

  if (shareError) {
    console.error("Error fetching share by token:", shareError);
    return { success: false, error: shareError.message };
  }

  if (!shareData) {
    return { success: false, error: "Share link not found or has been revoked" };
  }

  // Now fetch the recipe using the recipe_id from the share
  // We need to use a service-level query or bypass RLS for public access
  // For now, we'll query directly since RLS allows reading via active share token
  const { data: recipeData, error: recipeError } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", shareData.recipe_id)
    .single();

  if (recipeError) {
    console.error("Error fetching shared recipe:", recipeError);
    return { success: false, error: "Recipe not found" };
  }

  // Validate the recipe data
  const result = parseRecipeFromDb(recipeData);
  if (!result.success) {
    console.error("Invalid recipe data:", result.details);
    return { success: false, error: "Recipe data is invalid" };
  }

  return {
    success: true,
    data: {
      recipe: result.data,
      shareId: shareData.id,
    },
  };
}
