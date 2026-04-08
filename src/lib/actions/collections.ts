"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createCollection,
  updateCollection,
  deleteCollection,
  addRecipeToCollection,
  removeRecipeFromCollection,
  syncRecipeCollections,
} from "@/lib/db/collections";
import { createClient } from "@/lib/supabase/server";
import { logCollectionAction, generateErrorId } from "@/lib/logger";
import { mapErrorToFriendlyMessage } from "@/lib/errors";

export type FormState = {
  success: boolean;
  error?: string;
  errorId?: string;
};

/**
 * Create a new collection.
 */
export async function createCollectionAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || undefined;

  if (!name?.trim()) {
    return { success: false, error: "Name is required" };
  }

  // Get user for logging
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const result = await createCollection({ name, description });

  if (!result.success) {
    const errorId = generateErrorId();
    const { message } = mapErrorToFriendlyMessage(result.error);
    logCollectionAction("create", false, {
      userId: user?.id,
      errorId,
      error: result.error,
    });
    return { success: false, error: message, errorId };
  }

  logCollectionAction("create", true, {
    collectionId: result.data.id,
    userId: user?.id,
  });

  revalidatePath("/collections");
  redirect(`/collections/${result.data.id}`);
}

/**
 * Update an existing collection.
 */
export async function updateCollectionAction(
  id: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || undefined;

  if (!name?.trim()) {
    return { success: false, error: "Name is required" };
  }

  // Get user for logging
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const result = await updateCollection(id, { name, description });

  if (!result.success) {
    const errorId = generateErrorId();
    const { message } = mapErrorToFriendlyMessage(result.error);
    logCollectionAction("update", false, {
      collectionId: id,
      userId: user?.id,
      errorId,
      error: result.error,
    });
    return { success: false, error: message, errorId };
  }

  logCollectionAction("update", true, {
    collectionId: id,
    userId: user?.id,
  });

  revalidatePath("/collections");
  revalidatePath(`/collections/${id}`);
  redirect(`/collections/${id}`);
}

/**
 * Delete a collection.
 */
export async function deleteCollectionAction(id: string): Promise<FormState> {
  // Get user for logging
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const result = await deleteCollection(id);

  if (!result.success) {
    const errorId = generateErrorId();
    const { message } = mapErrorToFriendlyMessage(result.error);
    logCollectionAction("delete", false, {
      collectionId: id,
      userId: user?.id,
      errorId,
      error: result.error,
    });
    return { success: false, error: message, errorId };
  }

  logCollectionAction("delete", true, {
    collectionId: id,
    userId: user?.id,
  });

  revalidatePath("/collections");
  redirect("/collections");
}

/**
 * Add a recipe to a collection.
 */
export async function addRecipeToCollectionAction(
  recipeId: string,
  collectionId: string
): Promise<FormState> {
  // Get user for logging
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const result = await addRecipeToCollection(recipeId, collectionId);

  if (!result.success) {
    const errorId = generateErrorId();
    const { message } = mapErrorToFriendlyMessage(result.error);
    logCollectionAction("add_recipe", false, {
      collectionId,
      recipeId,
      userId: user?.id,
      errorId,
      error: result.error,
    });
    return { success: false, error: message, errorId };
  }

  logCollectionAction("add_recipe", true, {
    collectionId,
    recipeId,
    userId: user?.id,
  });

  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath(`/collections/${collectionId}`);
  return { success: true };
}

/**
 * Remove a recipe from a collection.
 */
export async function removeRecipeFromCollectionAction(
  recipeId: string,
  collectionId: string
): Promise<FormState> {
  // Get user for logging
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const result = await removeRecipeFromCollection(recipeId, collectionId);

  if (!result.success) {
    const errorId = generateErrorId();
    const { message } = mapErrorToFriendlyMessage(result.error);
    logCollectionAction("remove_recipe", false, {
      collectionId,
      recipeId,
      userId: user?.id,
      errorId,
      error: result.error,
    });
    return { success: false, error: message, errorId };
  }

  logCollectionAction("remove_recipe", true, {
    collectionId,
    recipeId,
    userId: user?.id,
  });

  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath(`/collections/${collectionId}`);
  return { success: true };
}

/**
 * Sync a recipe's collection memberships (batch add/remove).
 */
export async function syncRecipeCollectionsAction(
  recipeId: string,
  collectionIds: string[]
): Promise<FormState> {
  // Get user for logging
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const result = await syncRecipeCollections(recipeId, collectionIds);

  if (!result.success) {
    const errorId = generateErrorId();
    const { message } = mapErrorToFriendlyMessage(result.error);
    logCollectionAction("update", false, {
      recipeId,
      userId: user?.id,
      errorId,
      error: result.error,
    });
    return { success: false, error: message, errorId };
  }

  logCollectionAction("update", true, {
    recipeId,
    userId: user?.id,
  });

  // Revalidate recipe detail and all collection pages in one call
  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath("/collections", "layout");

  return { success: true };
}
