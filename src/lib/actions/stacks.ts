"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createStack,
  updateStack,
  deleteStack,
  addRecipeToStack,
  removeRecipeFromStack,
  syncRecipeStacks,
} from "@/lib/db/stacks";
import { createClient } from "@/lib/supabase/server";
import { logStackAction, generateErrorId } from "@/lib/logger";
import { mapErrorToFriendlyMessage } from "@/lib/errors";

export type FormState = {
  success: boolean;
  error?: string;
  errorId?: string;
};

/**
 * Create a new stack.
 */
export async function createStackAction(
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

  const result = await createStack({ name, description });

  if (!result.success) {
    const errorId = generateErrorId();
    const { message } = mapErrorToFriendlyMessage(result.error);
    logStackAction("create", false, {
      userId: user?.id,
      errorId,
      error: result.error,
    });
    return { success: false, error: message, errorId };
  }

  logStackAction("create", true, {
    stackId: result.data.id,
    userId: user?.id,
  });

  revalidatePath("/stacks");
  redirect(`/stacks/${result.data.id}`);
}

/**
 * Update an existing stack.
 */
export async function updateStackAction(
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

  const result = await updateStack(id, { name, description });

  if (!result.success) {
    const errorId = generateErrorId();
    const { message } = mapErrorToFriendlyMessage(result.error);
    logStackAction("update", false, {
      stackId: id,
      userId: user?.id,
      errorId,
      error: result.error,
    });
    return { success: false, error: message, errorId };
  }

  logStackAction("update", true, {
    stackId: id,
    userId: user?.id,
  });

  revalidatePath("/stacks");
  revalidatePath(`/stacks/${id}`);
  redirect(`/stacks/${id}`);
}

/**
 * Delete a stack.
 */
export async function deleteStackAction(id: string): Promise<FormState> {
  // Get user for logging
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const result = await deleteStack(id);

  if (!result.success) {
    const errorId = generateErrorId();
    const { message } = mapErrorToFriendlyMessage(result.error);
    logStackAction("delete", false, {
      stackId: id,
      userId: user?.id,
      errorId,
      error: result.error,
    });
    return { success: false, error: message, errorId };
  }

  logStackAction("delete", true, {
    stackId: id,
    userId: user?.id,
  });

  revalidatePath("/stacks");
  redirect("/stacks");
}

/**
 * Add a recipe to a stack.
 */
export async function addRecipeToStackAction(
  recipeId: string,
  stackId: string
): Promise<FormState> {
  // Get user for logging
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const result = await addRecipeToStack(recipeId, stackId);

  if (!result.success) {
    const errorId = generateErrorId();
    const { message } = mapErrorToFriendlyMessage(result.error);
    logStackAction("add_recipe", false, {
      stackId,
      recipeId,
      userId: user?.id,
      errorId,
      error: result.error,
    });
    return { success: false, error: message, errorId };
  }

  logStackAction("add_recipe", true, {
    stackId,
    recipeId,
    userId: user?.id,
  });

  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath(`/stacks/${stackId}`);
  return { success: true };
}

/**
 * Remove a recipe from a stack.
 */
export async function removeRecipeFromStackAction(
  recipeId: string,
  stackId: string
): Promise<FormState> {
  // Get user for logging
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const result = await removeRecipeFromStack(recipeId, stackId);

  if (!result.success) {
    const errorId = generateErrorId();
    const { message } = mapErrorToFriendlyMessage(result.error);
    logStackAction("remove_recipe", false, {
      stackId,
      recipeId,
      userId: user?.id,
      errorId,
      error: result.error,
    });
    return { success: false, error: message, errorId };
  }

  logStackAction("remove_recipe", true, {
    stackId,
    recipeId,
    userId: user?.id,
  });

  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath(`/stacks/${stackId}`);
  return { success: true };
}

/**
 * Sync a recipe's stack memberships (batch add/remove).
 */
export async function syncRecipeStacksAction(
  recipeId: string,
  stackIds: string[]
): Promise<FormState> {
  // Get user for logging
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const result = await syncRecipeStacks(recipeId, stackIds);

  if (!result.success) {
    const errorId = generateErrorId();
    const { message } = mapErrorToFriendlyMessage(result.error);
    logStackAction("update", false, {
      recipeId,
      userId: user?.id,
      errorId,
      error: result.error,
    });
    return { success: false, error: message, errorId };
  }

  logStackAction("update", true, {
    recipeId,
    userId: user?.id,
  });

  // Revalidate recipe detail and all stack pages in one call
  // Using "layout" type revalidates the entire /stacks subtree
  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath("/stacks", "layout");

  return { success: true };
}
