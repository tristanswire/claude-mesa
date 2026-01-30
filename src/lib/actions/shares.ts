"use server";

import { revalidatePath } from "next/cache";
import {
  createRecipeShare,
  revokeRecipeShare,
  getActiveShareForRecipe,
} from "@/lib/db/recipe-shares";

export interface ShareActionResult {
  success: boolean;
  error?: string;
  token?: string;
  shareId?: string;
}

/**
 * Create a share link for a recipe.
 */
export async function createShareAction(
  recipeId: string
): Promise<ShareActionResult> {
  const result = await createRecipeShare(recipeId);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath(`/recipes/${recipeId}`);

  return {
    success: true,
    token: result.data.token,
    shareId: result.data.id,
  };
}

/**
 * Revoke a share link.
 */
export async function revokeShareAction(
  shareId: string,
  recipeId: string
): Promise<ShareActionResult> {
  const result = await revokeRecipeShare(shareId);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath(`/recipes/${recipeId}`);

  return { success: true };
}

/**
 * Get the active share for a recipe.
 */
export async function getShareAction(
  recipeId: string
): Promise<ShareActionResult> {
  const result = await getActiveShareForRecipe(recipeId);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  if (!result.data) {
    return { success: true };
  }

  return {
    success: true,
    token: result.data.token,
    shareId: result.data.id,
  };
}
