import { describe, it, expect } from "vitest";
import {
  linkIngredientsToInstructions,
  allRefsEmpty,
} from "@/lib/import/linker";
import type { Ingredient, InstructionStep } from "@/lib/schemas";

describe("linkIngredientsToInstructions", () => {
  const makeIngredient = (
    id: string,
    name: string
  ): Ingredient => ({
    id,
    name,
    originalQuantity: 1,
    originalUnit: "cup",
    originalText: `1 cup ${name}`,
    canonicalQuantity: 236.59,
    canonicalUnit: "ml",
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

  it("links ingredient mentioned in step text", () => {
    const ingredients = [makeIngredient("ing-1", "flour")];
    const instructions = [makeStep("step-1", 1, "Add the flour and mix well")];

    const result = linkIngredientsToInstructions(instructions, ingredients);

    expect(result[0].refs).toHaveLength(1);
    expect(result[0].refs[0].ingredientIds).toContain("ing-1");
    expect(result[0].refs[0].placement).toBe("end");
  });

  it("links multiple ingredients mentioned in same step", () => {
    const ingredients = [
      makeIngredient("ing-1", "flour"),
      makeIngredient("ing-2", "sugar"),
    ];
    const instructions = [
      makeStep("step-1", 1, "Combine the flour and sugar in a bowl"),
    ];

    const result = linkIngredientsToInstructions(instructions, ingredients);

    expect(result[0].refs).toHaveLength(1);
    expect(result[0].refs[0].ingredientIds).toContain("ing-1");
    expect(result[0].refs[0].ingredientIds).toContain("ing-2");
  });

  it("handles plural forms", () => {
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

  it("preserves existing refs and does not overwrite", () => {
    const ingredients = [makeIngredient("ing-1", "flour")];
    const instructions: InstructionStep[] = [
      {
        id: "step-1",
        stepNumber: 1,
        text: "Add the flour",
        refs: [{ ingredientIds: ["existing-ref"], placement: "end" }],
      },
    ];

    const result = linkIngredientsToInstructions(instructions, ingredients);

    // Should keep existing refs, not overwrite
    expect(result[0].refs).toHaveLength(1);
    expect(result[0].refs[0].ingredientIds).toContain("existing-ref");
    expect(result[0].refs[0].ingredientIds).not.toContain("ing-1");
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
      makeStep([{ ingredientIds: ["ing-1"], placement: "end" }]),
      makeStep([]),
    ];
    expect(allRefsEmpty(instructions)).toBe(false);
  });

  it("returns true for empty instructions array", () => {
    expect(allRefsEmpty([])).toBe(true);
  });
});
