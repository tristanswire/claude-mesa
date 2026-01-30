import { describe, it, expect } from "vitest";
import { formatIngredient } from "@/lib/units";
import { isLikelyLiquid } from "@/lib/liquids";
import { getDensity, mlToGrams } from "@/lib/density";
import type { Ingredient } from "@/lib/schemas";

describe("isLikelyLiquid", () => {
  it("returns true for water", () => {
    expect(isLikelyLiquid("water")).toBe(true);
  });

  it("returns true for milk", () => {
    expect(isLikelyLiquid("milk")).toBe(true);
  });

  it("returns true for olive oil", () => {
    expect(isLikelyLiquid("olive oil")).toBe(true);
  });

  it("returns true for chicken broth", () => {
    expect(isLikelyLiquid("chicken broth")).toBe(true);
  });

  it("returns true for soy sauce", () => {
    expect(isLikelyLiquid("soy sauce")).toBe(true);
  });

  it("returns true for lemon juice", () => {
    expect(isLikelyLiquid("lemon juice")).toBe(true);
  });

  it("returns false for flour", () => {
    expect(isLikelyLiquid("flour")).toBe(false);
  });

  it("returns false for sugar", () => {
    expect(isLikelyLiquid("sugar")).toBe(false);
  });

  it("returns false for cumin", () => {
    expect(isLikelyLiquid("cumin")).toBe(false);
  });

  it("returns false for chicken", () => {
    expect(isLikelyLiquid("chicken")).toBe(false);
  });
});

describe("getDensity", () => {
  it("returns density for flour", () => {
    const density = getDensity("flour");
    expect(density).toBeDefined();
    expect(density).toBeCloseTo(0.53, 2);
  });

  it("returns density for sugar", () => {
    const density = getDensity("sugar");
    expect(density).toBeDefined();
    expect(density).toBeCloseTo(0.85, 2);
  });

  it("returns density for all-purpose flour (partial match)", () => {
    const density = getDensity("all-purpose flour");
    expect(density).toBeDefined();
    expect(density).toBeCloseTo(0.53, 2);
  });

  it("returns undefined for unknown ingredient", () => {
    const density = getDensity("unicorn dust");
    expect(density).toBeUndefined();
  });
});

describe("mlToGrams", () => {
  it("converts flour ml to grams using density", () => {
    // 1 cup flour = 236.59 ml * 0.53 = ~125g
    const grams = mlToGrams(236.59, "flour");
    expect(grams).toBeCloseTo(125, 0);
  });

  it("converts sugar ml to grams using density", () => {
    // 1 cup sugar = 236.59 ml * 0.85 = ~201g
    const grams = mlToGrams(236.59, "sugar");
    expect(grams).toBeCloseTo(201, 0);
  });

  it("falls back to 1:1 for unknown ingredients", () => {
    const grams = mlToGrams(100, "unicorn dust");
    expect(grams).toBe(100);
  });
});

describe("formatIngredient - metric mode", () => {
  const makeIngredient = (
    overrides: Partial<Ingredient>
  ): Ingredient => ({
    id: "123e4567-e89b-12d3-a456-426614174000",
    name: "test",
    originalQuantity: 1,
    originalUnit: "cup",
    originalText: "1 cup test",
    canonicalQuantity: 236.59,
    canonicalUnit: "ml",
    ingredientType: "volume",
    orderIndex: 0,
    ...overrides,
  });

  it("displays whole numbers only for metric volume", () => {
    const ingredient = makeIngredient({
      name: "milk",
      canonicalQuantity: 14.78, // 1 tbsp
      canonicalUnit: "ml",
    });
    const result = formatIngredient(ingredient, "metric");
    expect(result).toBe("15 ml milk");
    expect(result).not.toContain(".");
  });

  it("displays whole numbers only for metric weight", () => {
    const ingredient = makeIngredient({
      name: "flour",
      canonicalQuantity: 125.4,
      canonicalUnit: "g",
      ingredientType: "weight",
    });
    const result = formatIngredient(ingredient, "metric");
    expect(result).toBe("125 g flour");
    expect(result).not.toContain(".");
  });

  it("displays grams for non-liquid ingredients with ml canonical unit", () => {
    const ingredient = makeIngredient({
      name: "flour",
      canonicalQuantity: 236.59, // 1 cup in ml
      canonicalUnit: "ml",
    });
    const result = formatIngredient(ingredient, "metric");
    // flour density is 0.53, so 236.59 * 0.53 ≈ 125g
    expect(result).toContain("g flour");
    expect(result).not.toContain("ml");
  });

  it("displays ml for liquid ingredients with ml canonical unit", () => {
    const ingredient = makeIngredient({
      name: "milk",
      canonicalQuantity: 236.59,
      canonicalUnit: "ml",
    });
    const result = formatIngredient(ingredient, "metric");
    expect(result).toContain("ml milk");
    expect(result).not.toContain("g");
  });

  it("displays ml for olive oil", () => {
    const ingredient = makeIngredient({
      name: "olive oil",
      canonicalQuantity: 15,
      canonicalUnit: "ml",
    });
    const result = formatIngredient(ingredient, "metric");
    expect(result).toBe("15 ml olive oil");
  });

  it("displays grams for cumin (not a liquid)", () => {
    const ingredient = makeIngredient({
      name: "cumin",
      canonicalQuantity: 4.93, // 1 tsp in ml
      canonicalUnit: "ml",
    });
    const result = formatIngredient(ingredient, "metric");
    // cumin has density ~0.5, so 4.93 * 0.5 ≈ 2g
    expect(result).toContain("g cumin");
    expect(result).not.toContain("ml");
  });

  it("handles unknown ingredient with ml - defaults to grams with 1:1 fallback", () => {
    const ingredient = makeIngredient({
      name: "unicorn dust",
      canonicalQuantity: 100,
      canonicalUnit: "ml",
    });
    const result = formatIngredient(ingredient, "metric");
    // Falls back to 1:1 ratio
    expect(result).toBe("100 g unicorn dust");
  });
});

describe("formatIngredient - original and imperial modes unchanged", () => {
  const makeIngredient = (
    overrides: Partial<Ingredient>
  ): Ingredient => ({
    id: "123e4567-e89b-12d3-a456-426614174000",
    name: "flour",
    originalQuantity: 2,
    originalUnit: "cups",
    originalText: "2 cups flour",
    canonicalQuantity: 473.18,
    canonicalUnit: "ml",
    ingredientType: "volume",
    orderIndex: 0,
    ...overrides,
  });

  it("displays originalText in original mode", () => {
    const ingredient = makeIngredient({});
    const result = formatIngredient(ingredient, "original");
    expect(result).toBe("2 cups flour");
  });

  it("displays imperial with fractions", () => {
    const ingredient = makeIngredient({
      canonicalQuantity: 118.29, // 0.5 cups
    });
    const result = formatIngredient(ingredient, "imperial");
    expect(result).toContain("1/2");
    expect(result).toContain("cup");
  });
});
