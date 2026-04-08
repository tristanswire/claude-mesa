import { createClient } from "@/lib/supabase/server";
import type { Recipe } from "@/lib/schemas";
import { parseRecipeFromDb } from "@/lib/validation/recipes";
import { trackEventAsync } from "@/lib/analytics/events";

export interface Collection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CollectionWithCount extends Collection {
  recipeCount: number;
}

export type DbResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Transform snake_case DB row to camelCase Collection.
 */
function transformCollectionRow(row: Record<string, unknown>): Collection {
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
 * List all collections for the current user with recipe counts.
 */
export async function listCollections(): Promise<DbResult<CollectionWithCount[]>> {
  const supabase = await createClient();

  // Get collections with recipe counts via a join
  const { data, error } = await supabase
    .from("stacks")
    .select(`
      *,
      recipe_stacks(count)
    `)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error listing collections:", error);
    return { success: false, error: error.message };
  }

  const collections: CollectionWithCount[] = (data || []).map((row) => ({
    ...transformCollectionRow(row),
    recipeCount: (row.recipe_stacks as { count: number }[])?.[0]?.count || 0,
  }));

  return { success: true, data: collections };
}

/**
 * Get a single collection by ID.
 */
export async function getCollectionById(id: string): Promise<DbResult<Collection>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("stacks")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return { success: false, error: "Collection not found" };
    }
    console.error("Error getting collection:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data: transformCollectionRow(data) };
}

/**
 * Create a new collection.
 */
export async function createCollection(payload: {
  name: string;
  description?: string;
}): Promise<DbResult<Collection>> {
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
      return { success: false, error: "A collection with this name already exists" };
    }
    console.error("Error creating collection:", error);
    return { success: false, error: error.message };
  }

  const collection = transformCollectionRow(data);

  // Track event (non-blocking)
  trackEventAsync("stack_created", {
    collectionId: collection.id,
    collectionName: collection.name,
  });

  return { success: true, data: collection };
}

/**
 * Update an existing collection.
 */
export async function updateCollection(
  id: string,
  payload: { name?: string; description?: string }
): Promise<DbResult<Collection>> {
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
      return { success: false, error: "Collection not found" };
    }
    if (error.code === "23505") {
      return { success: false, error: "A collection with this name already exists" };
    }
    console.error("Error updating collection:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data: transformCollectionRow(data) };
}

/**
 * Delete a collection. Associated recipe_stacks are deleted via CASCADE.
 */
export async function deleteCollection(id: string): Promise<DbResult<void>> {
  const supabase = await createClient();

  const { error } = await supabase.from("stacks").delete().eq("id", id);

  if (error) {
    console.error("Error deleting collection:", error);
    return { success: false, error: error.message };
  }

  return { success: true, data: undefined };
}

/**
 * List recipes in a collection.
 */
export async function listRecipesForCollection(
  collectionId: string
): Promise<DbResult<Recipe[]>> {
  const supabase = await createClient();

  // Get recipe IDs in this collection
  const { data: recipeStacks, error: rsError } = await supabase
    .from("recipe_stacks")
    .select("recipe_id")
    .eq("stack_id", collectionId)
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
    console.error("Error listing recipes for collection:", recipeError);
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
 * Add a recipe to a collection.
 */
export async function addRecipeToCollection(
  recipeId: string,
  collectionId: string
): Promise<DbResult<void>> {
  const supabase = await createClient();

  const { error } = await supabase.from("recipe_stacks").insert({
    recipe_id: recipeId,
    stack_id: collectionId,
  });

  if (error) {
    // Handle duplicate
    if (error.code === "23505") {
      return { success: false, error: "Recipe is already in this collection" };
    }
    console.error("Error adding recipe to collection:", error);
    return { success: false, error: error.message };
  }

  // Track event (non-blocking)
  trackEventAsync("added_to_stack", {
    recipeId,
    collectionId,
  });

  return { success: true, data: undefined };
}

/**
 * Remove a recipe from a collection.
 */
export async function removeRecipeFromCollection(
  recipeId: string,
  collectionId: string
): Promise<DbResult<void>> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("recipe_stacks")
    .delete()
    .eq("recipe_id", recipeId)
    .eq("stack_id", collectionId);

  if (error) {
    console.error("Error removing recipe from collection:", error);
    return { success: false, error: error.message };
  }

  // Track event (non-blocking)
  trackEventAsync("removed_from_stack", {
    recipeId,
    collectionId,
  });

  return { success: true, data: undefined };
}

/**
 * Sync a recipe's collection memberships.
 * Sets the recipe to be in exactly the specified collections.
 */
export async function syncRecipeCollections(
  recipeId: string,
  collectionIds: string[]
): Promise<DbResult<void>> {
  const supabase = await createClient();

  // Get current collection memberships
  const { data: current, error: fetchError } = await supabase
    .from("recipe_stacks")
    .select("stack_id")
    .eq("recipe_id", recipeId);

  if (fetchError) {
    console.error("Error fetching current collections:", fetchError);
    return { success: false, error: fetchError.message };
  }

  const currentIds = new Set((current || []).map((r) => r.stack_id));
  const targetIds = new Set(collectionIds);

  // Determine what to add and remove
  const toAdd = collectionIds.filter((id) => !currentIds.has(id));
  const toRemove = [...currentIds].filter((id) => !targetIds.has(id));

  // Remove old memberships
  if (toRemove.length > 0) {
    const { error: removeError } = await supabase
      .from("recipe_stacks")
      .delete()
      .eq("recipe_id", recipeId)
      .in("stack_id", toRemove);

    if (removeError) {
      console.error("Error removing collections:", removeError);
      return { success: false, error: removeError.message };
    }
  }

  // Add new memberships
  if (toAdd.length > 0) {
    const { error: addError } = await supabase.from("recipe_stacks").insert(
      toAdd.map((collectionId) => ({
        recipe_id: recipeId,
        stack_id: collectionId,
      }))
    );

    if (addError) {
      console.error("Error adding collections:", addError);
      return { success: false, error: addError.message };
    }
  }

  return { success: true, data: undefined };
}

/**
 * Get collections that contain a specific recipe.
 */
export async function getCollectionsForRecipe(
  recipeId: string
): Promise<DbResult<Collection[]>> {
  const supabase = await createClient();

  const { data: recipeStacks, error: rsError } = await supabase
    .from("recipe_stacks")
    .select("stack_id")
    .eq("recipe_id", recipeId);

  if (rsError) {
    console.error("Error getting collections for recipe:", rsError);
    return { success: false, error: rsError.message };
  }

  if (!recipeStacks || recipeStacks.length === 0) {
    return { success: true, data: [] };
  }

  const collectionIds = recipeStacks.map((rs) => rs.stack_id);

  const { data: collections, error: collectionsError } = await supabase
    .from("stacks")
    .select("*")
    .in("id", collectionIds)
    .order("name", { ascending: true });

  if (collectionsError) {
    console.error("Error getting collections:", collectionsError);
    return { success: false, error: collectionsError.message };
  }

  return {
    success: true,
    data: (collections || []).map(transformCollectionRow),
  };
}
