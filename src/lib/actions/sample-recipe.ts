"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createRecipe } from "@/lib/db/recipes";
import { trackEventAsync } from "@/lib/analytics/events";
import type { RecipePayload, Ingredient, InstructionStep } from "@/lib/schemas";

/**
 * Sample recipe: Classic Chocolate Chip Cookies
 * A universally loved recipe that's easy to follow and demonstrates
 * the app's features (measurements, multiple steps, common ingredients).
 */
const SAMPLE_RECIPE: RecipePayload = {
  title: "Classic Chocolate Chip Cookies",
  description: "Soft and chewy chocolate chip cookies with crispy edges. A timeless recipe that never disappoints.",
  servings: 24,
  prepTimeMinutes: 15,
  cookTimeMinutes: 12,
  ingredients: [
    {
      id: crypto.randomUUID(),
      name: "all-purpose flour",
      originalText: "2 1/4 cups all-purpose flour",
      originalQuantity: 2.25,
      originalUnit: "cups",
      ingredientType: "volume",
      canonicalQuantity: 281,
      canonicalUnit: "g",
      orderIndex: 0,
    },
    {
      id: crypto.randomUUID(),
      name: "butter",
      originalText: "1 cup butter, softened",
      originalQuantity: 1,
      originalUnit: "cup",
      ingredientType: "volume",
      canonicalQuantity: 227,
      canonicalUnit: "g",
      orderIndex: 1,
    },
    {
      id: crypto.randomUUID(),
      name: "granulated sugar",
      originalText: "3/4 cup granulated sugar",
      originalQuantity: 0.75,
      originalUnit: "cup",
      ingredientType: "volume",
      canonicalQuantity: 150,
      canonicalUnit: "g",
      orderIndex: 2,
    },
    {
      id: crypto.randomUUID(),
      name: "brown sugar",
      originalText: "3/4 cup packed brown sugar",
      originalQuantity: 0.75,
      originalUnit: "cup",
      ingredientType: "volume",
      canonicalQuantity: 165,
      canonicalUnit: "g",
      orderIndex: 3,
    },
    {
      id: crypto.randomUUID(),
      name: "eggs",
      originalText: "2 large eggs",
      originalQuantity: 2,
      originalUnit: null,
      ingredientType: "count",
      canonicalQuantity: null,
      canonicalUnit: null,
      orderIndex: 4,
    },
    {
      id: crypto.randomUUID(),
      name: "vanilla extract",
      originalText: "1 teaspoon vanilla extract",
      originalQuantity: 1,
      originalUnit: "tsp",
      ingredientType: "volume",
      canonicalQuantity: 5,
      canonicalUnit: "ml",
      orderIndex: 5,
    },
    {
      id: crypto.randomUUID(),
      name: "baking soda",
      originalText: "1 teaspoon baking soda",
      originalQuantity: 1,
      originalUnit: "tsp",
      ingredientType: "volume",
      canonicalQuantity: 5,
      canonicalUnit: "g",
      orderIndex: 6,
    },
    {
      id: crypto.randomUUID(),
      name: "salt",
      originalText: "1 teaspoon salt",
      originalQuantity: 1,
      originalUnit: "tsp",
      ingredientType: "volume",
      canonicalQuantity: 6,
      canonicalUnit: "g",
      orderIndex: 7,
    },
    {
      id: crypto.randomUUID(),
      name: "chocolate chips",
      originalText: "2 cups chocolate chips",
      originalQuantity: 2,
      originalUnit: "cups",
      ingredientType: "volume",
      canonicalQuantity: 340,
      canonicalUnit: "g",
      orderIndex: 8,
    },
  ] as Ingredient[],
  instructions: [
    {
      id: crypto.randomUUID(),
      stepNumber: 1,
      text: "Preheat your oven to 375°F (190°C). Line baking sheets with parchment paper.",
      refs: [],
    },
    {
      id: crypto.randomUUID(),
      stepNumber: 2,
      text: "In a large bowl, cream together the butter, granulated sugar, and brown sugar until light and fluffy, about 3-4 minutes.",
      refs: [],
    },
    {
      id: crypto.randomUUID(),
      stepNumber: 3,
      text: "Beat in the eggs one at a time, then stir in the vanilla extract.",
      refs: [],
    },
    {
      id: crypto.randomUUID(),
      stepNumber: 4,
      text: "In a separate bowl, whisk together the flour, baking soda, and salt.",
      refs: [],
    },
    {
      id: crypto.randomUUID(),
      stepNumber: 5,
      text: "Gradually add the flour mixture to the butter mixture, mixing until just combined.",
      refs: [],
    },
    {
      id: crypto.randomUUID(),
      stepNumber: 6,
      text: "Fold in the chocolate chips until evenly distributed.",
      refs: [],
    },
    {
      id: crypto.randomUUID(),
      stepNumber: 7,
      text: "Drop rounded tablespoons of dough onto the prepared baking sheets, spacing them about 2 inches apart.",
      refs: [],
    },
    {
      id: crypto.randomUUID(),
      stepNumber: 8,
      text: "Bake for 9-12 minutes, or until the edges are golden brown but the centers still look slightly underdone.",
      refs: [],
    },
    {
      id: crypto.randomUUID(),
      stepNumber: 9,
      text: "Let cool on the baking sheet for 5 minutes, then transfer to a wire rack. Enjoy warm!",
      refs: [],
    },
  ] as InstructionStep[],
};

export interface SampleRecipeResult {
  success: boolean;
  error?: string;
  recipeId?: string;
}

/**
 * Creates a sample recipe for the user to explore the app.
 * The recipe is owned by the user and can be edited/deleted like any other recipe.
 */
export async function createSampleRecipeAction(): Promise<SampleRecipeResult> {
  // Generate fresh UUIDs for this instance
  const ingredients = SAMPLE_RECIPE.ingredients.map((ing, index) => ({
    ...ing,
    id: crypto.randomUUID(),
    orderIndex: index,
  }));

  const instructions = SAMPLE_RECIPE.instructions.map((step, index) => ({
    ...step,
    id: crypto.randomUUID(),
    stepNumber: index + 1,
  }));

  const payload: RecipePayload = {
    ...SAMPLE_RECIPE,
    ingredients,
    instructions,
  };

  const result = await createRecipe(payload);

  if (!result.success) {
    return {
      success: false,
      error: result.error || "Failed to create sample recipe",
    };
  }

  // Track sample recipe specifically (in addition to recipe_created in createRecipe)
  trackEventAsync("sample_recipe_created", {
    recipeId: result.data.id,
    recipeTitle: result.data.title,
  });

  // Revalidate recipe list so new recipe appears
  revalidatePath("/recipes");

  redirect(`/recipes/${result.data.id}`);
}
