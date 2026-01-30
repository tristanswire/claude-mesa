import { describe, it, expect } from "vitest";
import { renderInstructionStep, renderInstructions, buildIngredientsById } from "@/lib/render";
import type { Ingredient, InstructionStep } from "@/lib/schemas";

describe("renderInstructionStep", () => {
  const makeIngredient = (
    id: string,
    name: string,
    qty: number,
    unit: string
  ): Ingredient => ({
    id,
    name,
    originalQuantity: qty,
    originalUnit: unit,
    originalText: `${qty} ${unit} ${name}`,
    canonicalQuantity: unit === "ml" ? qty : qty * 236.59,
    canonicalUnit: "ml",
    ingredientType: "volume",
    orderIndex: 0,
  });

  it("injects measurement before ingredient mention for inline placement", () => {
    const ingredients = [makeIngredient("ing-1", "olive oil", 15, "ml")];
    const ingredientsById = buildIngredientsById(ingredients);
    const step: InstructionStep = {
      id: "step-1",
      stepNumber: 1,
      text: "Heat olive oil in a pan",
      refs: [
        {
          ingredientIds: ["ing-1"],
          placement: "inline",
          charRange: { start: 5, end: 14 }, // "olive oil"
        },
      ],
    };

    const result = renderInstructionStep(step, ingredientsById, "original");

    expect(result).toBe("Heat 15 ml olive oil in a pan");
  });

  it("injects multiple measurements in correct positions", () => {
    const ingredients = [
      makeIngredient("ing-1", "flour", 2, "cups"),
      makeIngredient("ing-2", "sugar", 1, "cup"),
    ];
    const ingredientsById = buildIngredientsById(ingredients);
    const step: InstructionStep = {
      id: "step-1",
      stepNumber: 1,
      text: "Mix flour and sugar together",
      refs: [
        {
          ingredientIds: ["ing-1"],
          placement: "inline",
          charRange: { start: 4, end: 9 }, // "flour"
        },
        {
          ingredientIds: ["ing-2"],
          placement: "inline",
          charRange: { start: 14, end: 19 }, // "sugar"
        },
      ],
    };

    const result = renderInstructionStep(step, ingredientsById, "original");

    expect(result).toBe("Mix 2 cups flour and 1 cup sugar together");
  });

  it("appends ingredients at end for end placement (legacy)", () => {
    const ingredients = [makeIngredient("ing-1", "butter", 2, "tbsp")];
    const ingredientsById = buildIngredientsById(ingredients);
    const step: InstructionStep = {
      id: "step-1",
      stepNumber: 1,
      text: "Let the mixture rest",
      refs: [
        {
          ingredientIds: ["ing-1"],
          placement: "end",
        },
      ],
    };

    const result = renderInstructionStep(step, ingredientsById, "original");

    expect(result).toBe("Let the mixture rest (2 tbsp butter)");
  });

  it("handles both inline and end refs in same step", () => {
    const ingredients = [
      makeIngredient("ing-1", "flour", 2, "cups"),
      makeIngredient("ing-2", "butter", 1, "tbsp"),
    ];
    const ingredientsById = buildIngredientsById(ingredients);
    const step: InstructionStep = {
      id: "step-1",
      stepNumber: 1,
      text: "Add the flour slowly",
      refs: [
        {
          ingredientIds: ["ing-1"],
          placement: "inline",
          charRange: { start: 8, end: 13 }, // "flour"
        },
        {
          ingredientIds: ["ing-2"],
          placement: "end",
        },
      ],
    };

    const result = renderInstructionStep(step, ingredientsById, "original");

    expect(result).toBe("Add the 2 cups flour slowly (1 tbsp butter)");
  });

  it("returns unchanged text when no refs", () => {
    const ingredients = [makeIngredient("ing-1", "salt", 1, "tsp")];
    const ingredientsById = buildIngredientsById(ingredients);
    const step: InstructionStep = {
      id: "step-1",
      stepNumber: 1,
      text: "Let rest for 10 minutes",
      refs: [],
    };

    const result = renderInstructionStep(step, ingredientsById, "original");

    expect(result).toBe("Let rest for 10 minutes");
  });

  it("skips refs with missing ingredients", () => {
    const ingredients: Ingredient[] = [];
    const ingredientsById = buildIngredientsById(ingredients);
    const step: InstructionStep = {
      id: "step-1",
      stepNumber: 1,
      text: "Add flour",
      refs: [
        {
          ingredientIds: ["nonexistent"],
          placement: "inline",
          charRange: { start: 4, end: 9 },
        },
      ],
    };

    const result = renderInstructionStep(step, ingredientsById, "original");

    expect(result).toBe("Add flour");
  });

  it("converts to metric units when unitSystem is metric", () => {
    const ingredients = [makeIngredient("ing-1", "olive oil", 15, "ml")];
    const ingredientsById = buildIngredientsById(ingredients);
    const step: InstructionStep = {
      id: "step-1",
      stepNumber: 1,
      text: "Heat olive oil",
      refs: [
        {
          ingredientIds: ["ing-1"],
          placement: "inline",
          charRange: { start: 5, end: 14 },
        },
      ],
    };

    const result = renderInstructionStep(step, ingredientsById, "metric");

    // Should inject metric measurement before "olive oil"
    expect(result).toMatch(/Heat \d+ ml olive oil/);
  });

  it("converts to imperial units when unitSystem is imperial", () => {
    const ingredients: Ingredient[] = [{
      id: "ing-1",
      name: "olive oil",
      originalQuantity: 15,
      originalUnit: "ml",
      originalText: "15 ml olive oil",
      canonicalQuantity: 15,
      canonicalUnit: "ml",
      ingredientType: "volume",
      orderIndex: 0,
    }];
    const ingredientsById = buildIngredientsById(ingredients);
    const step: InstructionStep = {
      id: "step-1",
      stepNumber: 1,
      text: "Heat olive oil",
      refs: [
        {
          ingredientIds: ["ing-1"],
          placement: "inline",
          charRange: { start: 5, end: 14 },
        },
      ],
    };

    const result = renderInstructionStep(step, ingredientsById, "imperial");

    // 15 ml ≈ 1 tbsp
    expect(result).toMatch(/tbsp|tsp/);
  });
});

describe("renderInstructions", () => {
  it("renders all steps with measurements", () => {
    const ingredients: Ingredient[] = [{
      id: "ing-1",
      name: "butter",
      originalQuantity: 2,
      originalUnit: "tbsp",
      originalText: "2 tbsp butter",
      canonicalQuantity: 30,
      canonicalUnit: "ml",
      ingredientType: "volume",
      orderIndex: 0,
    }];
    const instructions: InstructionStep[] = [
      {
        id: "step-1",
        stepNumber: 1,
        text: "Melt butter in a pan",
        refs: [
          {
            ingredientIds: ["ing-1"],
            placement: "inline",
            charRange: { start: 5, end: 11 },
          },
        ],
      },
      {
        id: "step-2",
        stepNumber: 2,
        text: "Let it cool",
        refs: [],
      },
    ];

    const result = renderInstructions(instructions, ingredients, "original");

    expect(result).toHaveLength(2);
    expect(result[0].text).toBe("Melt 2 tbsp butter in a pan");
    expect(result[1].text).toBe("Let it cool");
  });
});
