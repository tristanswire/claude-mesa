import { describe, it, expect } from "vitest";
import {
  linkIngredientsToInstructions,
  allRefsEmpty,
  clearAllRefs,
} from "@/lib/import/linker";
import type { Ingredient, InstructionStep } from "@/lib/schemas";

describe("linkIngredientsToInstructions", () => {
  const makeIngredient = (
    id: string,
    name: string,
    qty: number | null = 1,
    unit: string | null = "cup"
  ): Ingredient => ({
    id,
    name,
    originalQuantity: qty,
    originalUnit: unit,
    originalText: qty !== null ? `${qty} ${unit} ${name}` : name,
    canonicalQuantity: qty !== null ? qty * 236.59 : null,
    canonicalUnit: unit ? "ml" : null,
    ingredientType: "volume",
    orderIndex: 0,
  });

  const makeStep = (
    id: string,
    stepNumber: number,
    text: string
  ): InstructionStep => ({
    id,
    stepNumber,
    text,
    refs: [],
  });

  it("creates inline ref with charRange for ingredient mentioned in step text", () => {
    const ingredients = [makeIngredient("ing-1", "flour")];
    const instructions = [makeStep("step-1", 1, "Add the flour and mix well")];

    const result = linkIngredientsToInstructions(instructions, ingredients);

    expect(result[0].refs).toHaveLength(1);
    expect(result[0].refs[0].ingredientIds).toContain("ing-1");
    expect(result[0].refs[0].placement).toBe("inline");
    expect(result[0].refs[0].charRange).toBeDefined();
    expect(result[0].refs[0].charRange?.start).toBe(8); // "Add the " = 8 chars
    expect(result[0].refs[0].charRange?.end).toBe(13); // "flour" = 5 chars
  });

  it("creates separate refs for multiple ingredients mentioned in same step", () => {
    const ingredients = [
      makeIngredient("ing-1", "flour"),
      makeIngredient("ing-2", "sugar"),
    ];
    const instructions = [
      makeStep("step-1", 1, "Combine the flour and sugar in a bowl"),
    ];

    const result = linkIngredientsToInstructions(instructions, ingredients);

    // Each ingredient gets its own ref with position
    expect(result[0].refs).toHaveLength(2);
    expect(result[0].refs.map(r => r.ingredientIds[0])).toContain("ing-1");
    expect(result[0].refs.map(r => r.ingredientIds[0])).toContain("ing-2");
  });

  it("handles plural forms (tomato/tomatoes)", () => {
    const ingredients = [makeIngredient("ing-1", "tomato")];
    const instructions = [makeStep("step-1", 1, "Dice the tomatoes")];

    const result = linkIngredientsToInstructions(instructions, ingredients);

    expect(result[0].refs).toHaveLength(1);
    expect(result[0].refs[0].ingredientIds).toContain("ing-1");
  });

  it("does not match short common words", () => {
    const ingredients = [makeIngredient("ing-1", "to")]; // too short
    const instructions = [makeStep("step-1", 1, "Add salt to taste")];

    const result = linkIngredientsToInstructions(instructions, ingredients);

    expect(result[0].refs).toHaveLength(0);
  });

  it("handles case-insensitive matching", () => {
    const ingredients = [makeIngredient("ing-1", "Olive Oil")];
    const instructions = [makeStep("step-1", 1, "Heat the olive oil in a pan")];

    const result = linkIngredientsToInstructions(instructions, ingredients);

    expect(result[0].refs).toHaveLength(1);
    expect(result[0].refs[0].ingredientIds).toContain("ing-1");
  });

  it("returns empty refs when no matches found", () => {
    const ingredients = [makeIngredient("ing-1", "flour")];
    const instructions = [makeStep("step-1", 1, "Let rest for 10 minutes")];

    const result = linkIngredientsToInstructions(instructions, ingredients);

    expect(result[0].refs).toHaveLength(0);
  });

  it("skips ingredients without quantity", () => {
    const ingredients = [makeIngredient("ing-1", "salt", null, null)];
    const instructions = [makeStep("step-1", 1, "Add salt to taste")];

    const result = linkIngredientsToInstructions(instructions, ingredients);

    // Salt without quantity should not be linked
    expect(result[0].refs).toHaveLength(0);
  });

  it("does not inject when measurement already exists nearby", () => {
    const ingredients = [makeIngredient("ing-1", "butter")];
    const instructions = [makeStep("step-1", 1, "Add 2 tbsp butter to the pan")];

    const result = linkIngredientsToInstructions(instructions, ingredients);

    // Should not create ref since "2 tbsp" already exists before "butter"
    expect(result[0].refs).toHaveLength(0);
  });

  it("avoids matching substrings (oil should not match boil)", () => {
    const ingredients = [makeIngredient("ing-1", "oil")];
    const instructions = [makeStep("step-1", 1, "Boil water for 10 minutes")];

    const result = linkIngredientsToInstructions(instructions, ingredients);

    expect(result[0].refs).toHaveLength(0);
  });

  it("caps inline refs at 5 per step", () => {
    const ingredients = Array.from({ length: 10 }, (_, i) =>
      makeIngredient(`ing-${i}`, `ingredient${i}`)
    );
    const stepText = ingredients.map(i => i.name).join(" and ");
    const instructions = [makeStep("step-1", 1, stepText)];

    const result = linkIngredientsToInstructions(instructions, ingredients);

    expect(result[0].refs.length).toBeLessThanOrEqual(5);
  });

  it("only injects first mention of each ingredient (no duplicates)", () => {
    const ingredients = [makeIngredient("ing-1", "butter")];
    const instructions = [
      makeStep("step-1", 1, "Melt butter in pan. Add more butter if needed."),
    ];

    const result = linkIngredientsToInstructions(instructions, ingredients);

    // Should only have one ref for butter (first mention)
    expect(result[0].refs).toHaveLength(1);
  });

  it("strips descriptors when matching (fresh garlic matches garlic)", () => {
    const ingredients = [makeIngredient("ing-1", "fresh garlic")];
    const instructions = [makeStep("step-1", 1, "Mince the garlic")];

    const result = linkIngredientsToInstructions(instructions, ingredients);

    expect(result[0].refs).toHaveLength(1);
    expect(result[0].refs[0].ingredientIds).toContain("ing-1");
  });
});

describe("allRefsEmpty", () => {
  const makeStep = (refs: InstructionStep["refs"]): InstructionStep => ({
    id: "step-1",
    stepNumber: 1,
    text: "Test step",
    refs,
  });

  it("returns true when all steps have empty refs", () => {
    const instructions = [makeStep([]), makeStep([]), makeStep([])];
    expect(allRefsEmpty(instructions)).toBe(true);
  });

  it("returns false when any step has refs", () => {
    const instructions = [
      makeStep([]),
      makeStep([{ ingredientIds: ["ing-1"], placement: "inline", charRange: { start: 0, end: 5 } }]),
      makeStep([]),
    ];
    expect(allRefsEmpty(instructions)).toBe(false);
  });

  it("returns true for empty instructions array", () => {
    expect(allRefsEmpty([])).toBe(true);
  });
});

describe("clearAllRefs", () => {
  it("removes all refs from instructions", () => {
    const instructions: InstructionStep[] = [
      {
        id: "step-1",
        stepNumber: 1,
        text: "Test step",
        refs: [{ ingredientIds: ["ing-1"], placement: "inline", charRange: { start: 0, end: 5 } }],
      },
    ];

    const result = clearAllRefs(instructions);

    expect(result[0].refs).toHaveLength(0);
    // Original should be unchanged
    expect(instructions[0].refs).toHaveLength(1);
  });
});
