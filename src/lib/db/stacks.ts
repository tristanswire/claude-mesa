import { createClient } from "@/lib/supabase/server";
import type { Recipe } from "@/lib/schemas";
import { parseRecipeFromDb } from "@/lib/validation/recipes";

export interface Stack {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StackWithCount extends Stack {
  recipeCount: number;
}

export type DbResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Transform snake_case DB row to camelCase Stack.
 */
function transformStackRow(row: Record<string, unknown>): Stack {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    description: (row.description as string) || undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

/**
 * List all stacks for the current user with recipe counts.
 */
export async function listStacks(): Promise<DbResult<StackWithCount[]>> {
  const supabase = await createClient();

  // Get stacks with recipe counts via a join
  const { data, error } = await supabase
    .from("stacks")
    .select(`
      *,
      recipe_stacks(count)
    `)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error listing stacks:", error);
    return { success: false, error: error.message };
  }

  const stacks: StackWithCount[] = (data || []).map((row) => ({
    ...transformStackRow(row),
    recipeCount: (row.recipe_stacks as { count: number }[])?.[0]?.count || 0,
  }));

  return { success: true, data: stacks };
}

/**
 * Get a single stack by ID.
 */
export async function getStackById(id: string): Promise<DbResult<Stack>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("stacks")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return { success: false, error: "Stack not found" };
    }
    console.error("Error getting stack:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data: transformStackRow(data) };
}

/**
 * Create a new stack.
 */
export async function createStack(payload: {
  name: string;
  description?: string;
}): Promise<DbResult<Stack>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("stacks")
    .insert({
      user_id: user.id,
      name: payload.name.trim(),
      description: payload.description?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    // Handle unique constraint violation
    if (error.code === "23505") {
      return { success: false, error: "A stack with this name already exists" };
    }
    console.error("Error creating stack:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data: transformStackRow(data) };
}

/**
 * Update an existing stack.
 */
export async function updateStack(
  id: string,
  payload: { name?: string; description?: string }
): Promise<DbResult<Stack>> {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = {};
  if (payload.name !== undefined) {
    updateData.name = payload.name.trim();
  }
  if (payload.description !== undefined) {
    updateData.description = payload.description.trim() || null;
  }

  const { data, error } = await supabase
    .from("stacks")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return { success: false, error: "Stack not found" };
    }
    if (error.code === "23505") {
      return { success: false, error: "A stack with this name already exists" };
    }
    console.error("Error updating stack:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data: transformStackRow(data) };
}

/**
 * Delete a stack. Associated recipe_stacks are deleted via CASCADE.
 */
export async function deleteStack(id: string): Promise<DbResult<void>> {
  const supabase = await createClient();

  const { error } = await supabase.from("stacks").delete().eq("id", id);

  if (error) {
    console.error("Error deleting stack:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data: undefined };
}

/**
 * List recipes in a stack.
 */
export async function listRecipesForStack(
  stackId: string
): Promise<DbResult<Recipe[]>> {
  const supabase = await createClient();

  // Get recipe IDs in this stack
  const { data: recipeStacks, error: rsError } = await supabase
    .from("recipe_stacks")
    .select("recipe_id")
    .eq("stack_id", stackId)
    .order("added_at", { ascending: false });

  if (rsError) {
    console.error("Error listing recipe_stacks:", rsError);
    return { success: false, error: rsError.message };
  }

  if (!recipeStacks || recipeStacks.length === 0) {
    return { success: true, data: [] };
  }

  const recipeIds = recipeStacks.map((rs) => rs.recipe_id);

  // Get the actual recipes
  const { data: recipes, error: recipeError } = await supabase
    .from("recipes")
    .select("*")
    .in("id", recipeIds);

  if (recipeError) {
    console.error("Error listing recipes for stack:", recipeError);
    return { success: false, error: recipeError.message };
  }

  // Parse and validate recipes
  const validRecipes: Recipe[] = [];
  for (const row of recipes || []) {
    const result = parseRecipeFromDb(row);
    if (result.success) {
      validRecipes.push(result.data);
    }
  }

  // Maintain order from recipe_stacks
  const orderedRecipes = recipeIds
    .map((id) => validRecipes.find((r) => r.id === id))
    .filter((r): r is Recipe => r !== undefined);

  return { success: true, data: orderedRecipes };
}

/**
 * Add a recipe to a stack.
 */
export async function addRecipeToStack(
  recipeId: string,
  stackId: string
): Promise<DbResult<void>> {
  const supabase = await createClient();

  const { error } = await supabase.from("recipe_stacks").insert({
    recipe_id: recipeId,
    stack_id: stackId,
  });

  if (error) {
    // Handle duplicate
    if (error.code === "23505") {
      return { success: false, error: "Recipe is already in this stack" };
    }
    console.error("Error adding recipe to stack:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data: undefined };
}

/**
 * Remove a recipe from a stack.
 */
export async function removeRecipeFromStack(
  recipeId: string,
  stackId: string
): Promise<DbResult<void>> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("recipe_stacks")
    .delete()
    .eq("recipe_id", recipeId)
    .eq("stack_id", stackId);

  if (error) {
    console.error("Error removing recipe from stack:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data: undefined };
}

/**
 * Get stacks that contain a specific recipe.
 */
export async function getStacksForRecipe(
  recipeId: string
): Promise<DbResult<Stack[]>> {
  const supabase = await createClient();

  const { data: recipeStacks, error: rsError } = await supabase
    .from("recipe_stacks")
    .select("stack_id")
    .eq("recipe_id", recipeId);

  if (rsError) {
    console.error("Error getting stacks for recipe:", rsError);
    return { success: false, error: rsError.message };
  }

  if (!recipeStacks || recipeStacks.length === 0) {
    return { success: true, data: [] };
  }

  const stackIds = recipeStacks.map((rs) => rs.stack_id);

  const { data: stacks, error: stacksError } = await supabase
    .from("stacks")
    .select("*")
    .in("id", stackIds)
    .order("name", { ascending: true });

  if (stacksError) {
    console.error("Error getting stacks:", stacksError);
    return { success: false, error: stacksError.message };
  }

  return {
    success: true,
    data: (stacks || []).map(transformStackRow),
  };
}
