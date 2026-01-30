import type { Ingredient, InstructionStep, IngredientRef } from "@/lib/schemas";
import { formatIngredient, formatMeasurement, type UnitSystem } from "@/lib/units";

/**
 * Build a lookup map of ingredients by ID.
 */
export function buildIngredientsById(
  ingredients: Ingredient[]
): Map<string, Ingredient> {
  return new Map(ingredients.map((ing) => [ing.id, ing]));
}

/**
 * Render an instruction step with inline ingredient measurements.
 *
 * For inline placement: inserts measurement before the ingredient mention.
 *   "heat olive oil in a pan" → "heat 15 ml olive oil in a pan"
 *
 * For end placement (legacy): appends as "(ingredient1, ingredient2, ...)".
 */
export function renderInstructionStep(
  step: InstructionStep,
  ingredientsById: Map<string, Ingredient>,
  unitSystem: UnitSystem
): string {
  let result = step.text;

  // Separate inline and end refs
  const inlineRefs = step.refs.filter(
    (ref) => ref.placement === "inline" && ref.charRange
  );
  const endRefs = step.refs.filter((ref) => ref.placement === "end");

  // Process inline refs (in reverse order to preserve character positions)
  if (inlineRefs.length > 0) {
    // Sort by position descending so we can insert without shifting positions
    const sortedInlineRefs = [...inlineRefs].sort(
      (a, b) => (b.charRange?.start ?? 0) - (a.charRange?.start ?? 0)
    );

    for (const ref of sortedInlineRefs) {
      if (!ref.charRange || ref.ingredientIds.length === 0) continue;

      const ingredientId = ref.ingredientIds[0];
      const ingredient = ingredientsById.get(ingredientId);
      if (!ingredient) continue;

      // Format just the measurement (quantity + unit)
      const measurement = formatMeasurement(ingredient, unitSystem);
      if (!measurement) continue;

      // Insert measurement before the ingredient mention
      const { start } = ref.charRange;
      result = result.slice(0, start) + measurement + " " + result.slice(start);
    }
  }

  // Process end refs (legacy behavior)
  if (endRefs.length > 0) {
    const allIngredientIds: string[] = [];
    for (const ref of endRefs) {
      allIngredientIds.push(...ref.ingredientIds);
    }

    const formattedIngredients: string[] = [];
    for (const id of allIngredientIds) {
      const ingredient = ingredientsById.get(id);
      if (ingredient) {
        formattedIngredients.push(formatIngredient(ingredient, unitSystem));
      }
    }

    if (formattedIngredients.length > 0) {
      result += ` (${formattedIngredients.join(", ")})`;
    }
  }

  return result;
}

/**
 * Render all instruction steps with inline measurements.
 */
export function renderInstructions(
  instructions: InstructionStep[],
  ingredients: Ingredient[],
  unitSystem: UnitSystem
): { stepNumber: number; text: string; id: string }[] {
  const ingredientsById = buildIngredientsById(ingredients);

  return instructions.map((step) => ({
    id: step.id,
    stepNumber: step.stepNumber,
    text: renderInstructionStep(step, ingredientsById, unitSystem),
  }));
}
