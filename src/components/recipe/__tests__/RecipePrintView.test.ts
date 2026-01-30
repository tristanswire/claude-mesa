import { describe, it, expect } from "vitest";
import { formatRecipeAsText } from "../RecipePrintView";
import type { Recipe } from "@/lib/schemas";

describe("formatRecipeAsText", () => {
  const mockRecipe: Recipe = {
    id: "test-id",
    userId: "user-id",
    title: "Test Recipe",
    description: "A test recipe description",
    servings: 4,
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    sourceUrl: "https://example.com/recipe",
    ingredients: [
      {
        id: "ing-1",
        name: "flour",
        originalText: "2 cups flour",
        originalQuantity: 2,
        originalUnit: "cups",
        ingredientType: "volume",
        canonicalQuantity: 473.18,
        canonicalUnit: "ml",
        orderIndex: 0,
      },
      {
        id: "ing-2",
        name: "sugar",
        originalText: "1 cup sugar",
        originalQuantity: 1,
        originalUnit: "cup",
        ingredientType: "volume",
        canonicalQuantity: 236.59,
        canonicalUnit: "ml",
        orderIndex: 1,
      },
    ],
    instructions: [
      {
        id: "step-1",
        stepNumber: 1,
        text: "Mix dry ingredients",
        refs: [{ ingredientIds: ["ing-1", "ing-2"], placement: "end" }],
      },
      {
        id: "step-2",
        stepNumber: 2,
        text: "Bake at 350F",
        refs: [],
      },
    ],
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  };

  it("formats recipe as text with original units", () => {
    const text = formatRecipeAsText(mockRecipe, "original");

    expect(text).toContain("Test Recipe");
    expect(text).toContain("Servings: 4");
    expect(text).toContain("INGREDIENTS");
    expect(text).toContain("- 2 cups flour");
    expect(text).toContain("- 1 cup sugar");
    expect(text).toContain("INSTRUCTIONS");
    expect(text).toContain("1. Mix dry ingredients");
    expect(text).toContain("2. Bake at 350F");
    expect(text).toContain("Source: https://example.com/recipe");
  });

  it("includes inline callouts in instructions", () => {
    const text = formatRecipeAsText(mockRecipe, "original");

    // Step 1 should have inline callouts
    expect(text).toMatch(/1\. Mix dry ingredients.*flour.*sugar/);
  });

  it("formats recipe with metric units", () => {
    const text = formatRecipeAsText(mockRecipe, "metric");

    expect(text).toContain("INGREDIENTS");
    // Metric conversion should show grams (based on actual conversion logic)
    expect(text).toMatch(/\d+\s*g\s*flour/);
  });

  it("handles recipe without source URL", () => {
    const recipeNoSource = { ...mockRecipe, sourceUrl: undefined };
    const text = formatRecipeAsText(recipeNoSource, "original");

    expect(text).not.toContain("Source:");
  });

  it("handles recipe without times", () => {
    const recipeNoTimes = {
      ...mockRecipe,
      prepTimeMinutes: undefined,
      cookTimeMinutes: undefined,
      servings: undefined,
    };
    const text = formatRecipeAsText(recipeNoTimes, "original");

    expect(text).not.toContain("Servings:");
    expect(text).not.toContain("Prep:");
    expect(text).not.toContain("Cook:");
  });
});
