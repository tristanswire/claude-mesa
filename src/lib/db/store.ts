import { createClient } from "@/lib/supabase/server";

export interface StoreItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  affiliateUrl: string;
  category: string;
  tag: string | null;
  sortOrder: number;
}

export interface StoreItemsByCategory {
  category: string;
  items: StoreItem[];
}

/**
 * Get all active store items grouped by category.
 */
export async function getStoreItemsByCategory(): Promise<StoreItemsByCategory[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("store_items")
    .select("*")
    .eq("is_active", true)
    .order("category")
    .order("sort_order")
    .order("name");

  if (error) {
    console.error("Error fetching store items:", error);
    return [];
  }

  // Group by category
  const categoryMap = new Map<string, StoreItem[]>();

  for (const item of data) {
    const storeItem: StoreItem = {
      id: item.id,
      name: item.name,
      description: item.description,
      imageUrl: item.image_url,
      affiliateUrl: item.affiliate_url,
      category: item.category,
      tag: item.tag,
      sortOrder: item.sort_order,
    };

    const existing = categoryMap.get(item.category) || [];
    existing.push(storeItem);
    categoryMap.set(item.category, existing);
  }

  // Convert to array with preferred category order
  const categoryOrder = ["Pans", "Knives", "Tools", "Appliances", "Pantry", "Meal Prep"];
  const result: StoreItemsByCategory[] = [];

  // Add categories in preferred order first
  for (const category of categoryOrder) {
    const items = categoryMap.get(category);
    if (items && items.length > 0) {
      result.push({ category, items });
      categoryMap.delete(category);
    }
  }

  // Add any remaining categories alphabetically
  const remaining = Array.from(categoryMap.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );
  for (const [category, items] of remaining) {
    result.push({ category, items });
  }

  return result;
}

/**
 * Get store items for a specific recipe.
 */
export async function getStoreItemsForRecipe(
  recipeId: string
): Promise<StoreItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("recipe_store_items")
    .select(`
      sort_order,
      store_items!inner (
        id,
        name,
        description,
        image_url,
        affiliate_url,
        category,
        tag,
        sort_order,
        is_active
      )
    `)
    .eq("recipe_id", recipeId)
    .eq("store_items.is_active", true)
    .order("sort_order");

  if (error) {
    console.error("Error fetching recipe store items:", error);
    return [];
  }

  return data.map((row) => {
    // Supabase returns the joined data as a single object when using !inner
    const item = row.store_items as unknown as {
      id: string;
      name: string;
      description: string | null;
      image_url: string | null;
      affiliate_url: string;
      category: string;
      tag: string | null;
      sort_order: number;
    };
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      imageUrl: item.image_url,
      affiliateUrl: item.affiliate_url,
      category: item.category,
      tag: item.tag,
      sortOrder: row.sort_order,
    };
  });
}
