"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createStack,
  updateStack,
  deleteStack,
  addRecipeToStack,
  removeRecipeFromStack,
} from "@/lib/db/stacks";

export type FormState = {
  success: boolean;
  error?: string;
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

  const result = await createStack({ name, description });

  if (!result.success) {
    return { success: false, error: result.error };
  }

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

  const result = await updateStack(id, { name, description });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath("/stacks");
  revalidatePath(`/stacks/${id}`);
  redirect(`/stacks/${id}`);
}

/**
 * Delete a stack.
 */
export async function deleteStackAction(id: string): Promise<FormState> {
  const result = await deleteStack(id);

  if (!result.success) {
    return { success: false, error: result.error };
  }

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
  const result = await addRecipeToStack(recipeId, stackId);

  if (!result.success) {
    return { success: false, error: result.error };
  }

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
  const result = await removeRecipeFromStack(recipeId, stackId);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath(`/stacks/${stackId}`);
  return { success: true };
}
