import type { Ingredient, InstructionStep } from "@/lib/schemas";
import { formatIngredient, type UnitSystem } from "@/lib/units";

/**
 * Build a lookup map of ingredients by ID.
 */
export function buildIngredientsById(
  ingredients: Ingredient[]
): Map<string, Ingredient> {
  return new Map(ingredients.map((ing) => [ing.id, ing]));
}

/**
 * Render an instruction step with inline ingredient callouts.
 * Appends refs with placement === 'end' as "(ingredient1, ingredient2, ...)".
 */
export function renderInstructionStep(
  step: InstructionStep,
  ingredientsById: Map<string, Ingredient>,
  unitSystem: UnitSystem
): string {
  let result = step.text;

  // Collect all end-placement refs
  const endRefs = step.refs.filter((ref) => ref.placement === "end");

  if (endRefs.length === 0) {
    return result;
  }

  // Gather all ingredient IDs from end refs
  const allIngredientIds: string[] = [];
  for (const ref of endRefs) {
    allIngredientIds.push(...ref.ingredientIds);
  }

  // Format each ingredient, skipping missing ones
  const formattedIngredients: string[] = [];
  for (const id of allIngredientIds) {
    const ingredient = ingredientsById.get(id);
    if (ingredient) {
      formattedIngredients.push(formatIngredient(ingredient, unitSystem));
    }
  }

  // Append formatted ingredients in parentheses if any
  if (formattedIngredients.length > 0) {
    result += ` (${formattedIngredients.join(", ")})`;
  }

  return result;
}

/**
 * Render all instruction steps with inline callouts.
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
