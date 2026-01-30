import { describe, it, expect } from "vitest";
import { parseRecipeText, validateParsedText } from "../text_normalize";

describe("parseRecipeText", () => {
  describe("with explicit headings", () => {
    it("parses text with Ingredients: and Instructions: headings", () => {
      const input = `
Classic Pancakes

Ingredients:
- 1 cup flour
- 2 eggs
- 1 cup milk
- 2 tbsp butter, melted

Instructions:
1. Mix the dry ingredients in a bowl.
2. Add eggs and milk, whisk until smooth.
3. Pour butter into the batter and stir.
4. Cook on a hot griddle until bubbles form.
5. Flip and cook until golden brown.
`;

      const result = parseRecipeText(input);

      expect(result.title).toBe("Classic Pancakes");
      expect(result.ingredientLines).toHaveLength(4);
      expect(result.ingredientLines[0]).toBe("1 cup flour");
      expect(result.ingredientLines[1]).toBe("2 eggs");
      expect(result.ingredientLines[2]).toBe("1 cup milk");
      expect(result.ingredientLines[3]).toBe("2 tbsp butter, melted");

      expect(result.instructionLines).toHaveLength(5);
      expect(result.instructionLines[0]).toBe(
        "Mix the dry ingredients in a bowl."
      );
      expect(result.instructionLines[4]).toBe(
        "Flip and cook until golden brown."
      );
    });

    it("parses text with Directions: heading instead of Instructions:", () => {
      const input = `
Simple Salad

Ingredients
2 cups lettuce
1 tomato
1/4 cup dressing

Directions
Chop the lettuce.
Slice the tomato.
Toss with dressing and serve.
`;

      const result = parseRecipeText(input);

      expect(result.title).toBe("Simple Salad");
      expect(result.ingredientLines.length).toBeGreaterThan(0);
      expect(result.instructionLines.length).toBeGreaterThan(0);
      expect(result.ingredientLines).toContain("2 cups lettuce");
      expect(result.instructionLines).toContain("Chop the lettuce.");
    });

    it("handles reversed order (Instructions before Ingredients)", () => {
      const input = `
Quick Recipe

Instructions:
Mix everything together.
Bake at 350F.

Ingredients:
1 cup sugar
2 cups flour
`;

      const result = parseRecipeText(input);

      expect(result.ingredientLines).toContain("1 cup sugar");
      expect(result.ingredientLines).toContain("2 cups flour");
      expect(result.instructionLines).toContain("Mix everything together.");
      expect(result.instructionLines).toContain("Bake at 350F.");
    });
  });

  describe("with heuristics (no explicit headings)", () => {
    it("parses text with bullet points and quantities", () => {
      const input = `
Garlic Bread

- 1 loaf French bread
- 4 cloves garlic, minced
- 1/2 cup butter, softened
- 2 tbsp parsley, chopped

1. Preheat oven to 375F.
2. Mix butter with garlic and parsley.
3. Slice bread and spread butter mixture.
4. Wrap in foil and bake for 15 minutes.
`;

      const result = parseRecipeText(input);

      expect(result.title).toBe("Garlic Bread");
      expect(result.ingredientLines.length).toBeGreaterThan(0);
      expect(result.instructionLines.length).toBeGreaterThan(0);

      // Should identify ingredients by bullet + quantity pattern
      expect(result.ingredientLines).toContain("1 loaf French bread");
      expect(result.ingredientLines).toContain("4 cloves garlic, minced");

      // Should identify instructions by numbered step pattern
      expect(result.instructionLines).toContain("Preheat oven to 375F.");
    });

    it("parses text with quantities but no bullets", () => {
      const input = `
Easy Omelette

2 eggs
1 tbsp butter
Salt to taste

Beat eggs in a bowl.
Melt butter in pan over medium heat.
Pour eggs and cook until set.
`;

      const result = parseRecipeText(input);

      expect(result.ingredientLines.length).toBeGreaterThan(0);
      expect(result.instructionLines.length).toBeGreaterThan(0);
    });

    it("identifies action verbs as instruction starts", () => {
      const input = `
Test Recipe

1 cup flour
2 eggs

Preheat the oven to 350F.
Mix flour and eggs together.
Pour into a greased pan.
Bake for 30 minutes.
`;

      const result = parseRecipeText(input);

      // Action verbs should trigger instruction mode
      expect(result.instructionLines.some((l) => l.includes("Preheat"))).toBe(
        true
      );
      expect(result.instructionLines.some((l) => l.includes("Mix"))).toBe(true);
      expect(result.instructionLines.some((l) => l.includes("Bake"))).toBe(
        true
      );
    });
  });

  describe("skips irrelevant lines", () => {
    it("skips UI elements and metadata", () => {
      const input = `
My Recipe

Print
Save
Share

Prep Time: 10 min
Cook Time: 20 min

Ingredients:
1 cup rice
2 cups water

Instructions:
Boil water.
Add rice and simmer.
`;

      const result = parseRecipeText(input);

      // Should not include "Print", "Save", "Share", or time metadata
      expect(result.ingredientLines).not.toContain("Print");
      expect(result.ingredientLines).not.toContain("Save");
      expect(result.instructionLines).not.toContain("Prep Time: 10 min");

      // Should still get actual content
      expect(result.ingredientLines).toContain("1 cup rice");
      expect(result.instructionLines).toContain("Boil water.");
    });

    it("skips separator lines", () => {
      const input = `
Recipe Title

Ingredients:
1 cup sugar
---
2 cups flour
===

Instructions:
Mix together.
***
Bake it.
`;

      const result = parseRecipeText(input);

      expect(result.ingredientLines).not.toContain("---");
      expect(result.ingredientLines).not.toContain("===");
      expect(result.instructionLines).not.toContain("***");
    });
  });
});

describe("validateParsedText", () => {
  it("returns valid for complete result", () => {
    const result = validateParsedText({
      title: "Test",
      ingredientLines: ["1 cup flour"],
      instructionLines: ["Mix it."],
    });

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("returns error when both arrays are empty", () => {
    const result = validateParsedText({
      title: "Test",
      ingredientLines: [],
      instructionLines: [],
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain("Could not identify");
  });

  it("returns error when only ingredients are missing", () => {
    const result = validateParsedText({
      title: "Test",
      ingredientLines: [],
      instructionLines: ["Do something."],
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain("ingredients");
  });

  it("returns error when only instructions are missing", () => {
    const result = validateParsedText({
      title: "Test",
      ingredientLines: ["1 cup flour"],
      instructionLines: [],
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain("instructions");
  });
});

describe("integration: full text import flow", () => {
  it("handles a realistic copied recipe", () => {
    const input = `
Grandma's Chocolate Chip Cookies

The best cookies you'll ever make!

Ingredients:
2 1/4 cups all-purpose flour
1 tsp baking soda
1 tsp salt
1 cup butter, softened
3/4 cup granulated sugar
3/4 cup packed brown sugar
2 large eggs
2 tsp vanilla extract
2 cups chocolate chips

Instructions:
1. Preheat oven to 375 degrees F.
2. Combine flour, baking soda and salt in small bowl.
3. Beat butter, granulated sugar, brown sugar and vanilla extract in large mixer bowl until creamy.
4. Add eggs, one at a time, beating well after each addition.
5. Gradually beat in flour mixture.
6. Stir in chocolate chips.
7. Drop rounded tablespoon of dough onto ungreased baking sheets.
8. Bake for 9 to 11 minutes or until golden brown.
9. Cool on baking sheets for 2 minutes.
10. Remove to wire racks to cool completely.
`;

    const result = parseRecipeText(input);

    expect(result.title).toBe("Grandma's Chocolate Chip Cookies");
    expect(result.ingredientLines).toHaveLength(9);
    expect(result.instructionLines).toHaveLength(10);

    // Validate passes
    const validation = validateParsedText(result);
    expect(validation.valid).toBe(true);
  });
});
