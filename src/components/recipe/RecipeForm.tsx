"use client";

import { useActionState, useState } from "react";
import type { Recipe, Ingredient, InstructionStep, IngredientRef } from "@/lib/schemas";
import type { FormState } from "@/lib/actions/recipes";
import { UpgradeCallout } from "@/components/ui/UpgradeCallout";

interface RecipeFormProps {
  recipe?: Recipe;
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
}

function generateUUID(): string {
  return crypto.randomUUID();
}

const emptyIngredient = (): Ingredient => ({
  id: generateUUID(),
  name: "",
  originalText: "",
  originalQuantity: null,
  originalUnit: null,
  ingredientType: "count",
  canonicalQuantity: null,
  canonicalUnit: null,
  orderIndex: 0,
});

const emptyInstruction = (): InstructionStep => ({
  id: generateUUID(),
  stepNumber: 1,
  text: "",
  refs: [],
});

// Helper to get selected ingredient IDs from refs
function getSelectedIngredientIds(refs: IngredientRef[]): Set<string> {
  const ids = new Set<string>();
  for (const ref of refs) {
    for (const id of ref.ingredientIds) {
      ids.add(id);
    }
  }
  return ids;
}

export function RecipeForm({ recipe, action, submitLabel }: RecipeFormProps) {
  const [state, formAction, isPending] = useActionState(action, {
    success: true,
  });

  const [ingredients, setIngredients] = useState<Ingredient[]>(
    recipe?.ingredients?.length ? recipe.ingredients : [emptyIngredient()]
  );

  const [instructions, setInstructions] = useState<InstructionStep[]>(
    recipe?.instructions?.length ? recipe.instructions : [emptyInstruction()]
  );

  // Toggle an ingredient reference for an instruction step
  const toggleIngredientRef = (instructionIndex: number, ingredientId: string) => {
    setInstructions((prev) =>
      prev.map((instruction, i) => {
        if (i !== instructionIndex) return instruction;

        const selectedIds = getSelectedIngredientIds(instruction.refs);

        if (selectedIds.has(ingredientId)) {
          // Remove the ingredient from refs
          selectedIds.delete(ingredientId);
        } else {
          // Add the ingredient to refs
          selectedIds.add(ingredientId);
        }

        // Rebuild refs array - for MVP, we use a single ref with all selected ingredients
        const refs: IngredientRef[] =
          selectedIds.size > 0
            ? [{ ingredientIds: Array.from(selectedIds), placement: "end" as const }]
            : [];

        return { ...instruction, refs };
      })
    );
  };

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      { ...emptyIngredient(), orderIndex: ingredients.length },
    ]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const addInstruction = () => {
    setInstructions([
      ...instructions,
      { ...emptyInstruction(), stepNumber: instructions.length + 1 },
    ]);
  };

  const removeInstruction = (index: number) => {
    if (instructions.length > 1) {
      setInstructions(instructions.filter((_, i) => i !== index));
    }
  };

  return (
    <form action={formAction} className="space-y-8">
      {!state.success && state.error && (
        state.fieldErrors?._code?.[0] === "RECIPE_LIMIT_REACHED" ? (
          <UpgradeCallout
            message={state.error}
            limit={state.fieldErrors?._limit ? parseInt(state.fieldErrors._limit[0], 10) : undefined}
          />
        ) : (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {state.error}
            {state.fieldErrors?._form && (
              <ul className="mt-2 list-disc list-inside">
                {state.fieldErrors._form.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )
      )}

      {/* Basic Info */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Basic Info</h2>

        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            defaultValue={recipe?.title}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          {state.fieldErrors?.title && (
            <p className="mt-1 text-sm text-red-600">
              {state.fieldErrors.title[0]}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={recipe?.description || ""}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="servings"
              className="block text-sm font-medium text-gray-700"
            >
              Servings
            </label>
            <input
              type="number"
              id="servings"
              name="servings"
              min="1"
              defaultValue={recipe?.servings || ""}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="prepTimeMinutes"
              className="block text-sm font-medium text-gray-700"
            >
              Prep Time (min)
            </label>
            <input
              type="number"
              id="prepTimeMinutes"
              name="prepTimeMinutes"
              min="0"
              defaultValue={recipe?.prepTimeMinutes || ""}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="cookTimeMinutes"
              className="block text-sm font-medium text-gray-700"
            >
              Cook Time (min)
            </label>
            <input
              type="number"
              id="cookTimeMinutes"
              name="cookTimeMinutes"
              min="0"
              defaultValue={recipe?.cookTimeMinutes || ""}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Ingredients */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Ingredients</h2>
          <button
            type="button"
            onClick={addIngredient}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            + Add Ingredient
          </button>
        </div>

        {state.fieldErrors?.ingredients && (
          <p className="text-sm text-red-600">
            {state.fieldErrors.ingredients[0]}
          </p>
        )}

        <div className="space-y-3">
          {ingredients.map((ingredient, index) => (
            <div
              key={ingredient.id}
              className="p-4 bg-gray-50 rounded-lg space-y-3"
            >
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-gray-500">
                  Ingredient {index + 1}
                </span>
                {ingredients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>

              <input type="hidden" name="ingredient_id" value={ingredient.id} />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="ingredient_name"
                    defaultValue={ingredient.name}
                    placeholder="e.g., cumin"
                    className="mt-1 block w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    Original Text *
                  </label>
                  <input
                    type="text"
                    name="ingredient_originalText"
                    defaultValue={ingredient.originalText}
                    placeholder="e.g., 1 tsp cumin, ground"
                    className="mt-1 block w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    Quantity
                  </label>
                  <input
                    type="number"
                    name="ingredient_originalQuantity"
                    step="any"
                    defaultValue={ingredient.originalQuantity ?? ""}
                    placeholder="1"
                    className="mt-1 block w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    Unit
                  </label>
                  <input
                    type="text"
                    name="ingredient_originalUnit"
                    defaultValue={ingredient.originalUnit ?? ""}
                    placeholder="tsp"
                    className="mt-1 block w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    Type *
                  </label>
                  <select
                    name="ingredient_ingredientType"
                    defaultValue={ingredient.ingredientType}
                    className="mt-1 block w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                  >
                    <option value="volume">Volume</option>
                    <option value="weight">Weight</option>
                    <option value="count">Count</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    Canonical Unit
                  </label>
                  <select
                    name="ingredient_canonicalUnit"
                    defaultValue={ingredient.canonicalUnit ?? ""}
                    className="mt-1 block w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                  >
                    <option value="">None</option>
                    <option value="ml">ml</option>
                    <option value="g">g</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Canonical Quantity
                </label>
                <input
                  type="number"
                  name="ingredient_canonicalQuantity"
                  step="any"
                  defaultValue={ingredient.canonicalQuantity ?? ""}
                  placeholder="e.g., 4.93 for ml"
                  className="mt-1 block w-32 px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Instructions</h2>
          <button
            type="button"
            onClick={addInstruction}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            + Add Step
          </button>
        </div>

        {state.fieldErrors?.instructions && (
          <p className="text-sm text-red-600">
            {state.fieldErrors.instructions[0]}
          </p>
        )}

        <div className="space-y-3">
          {instructions.map((instruction, index) => {
            const selectedIds = getSelectedIngredientIds(instruction.refs);
            const validIngredients = ingredients.filter((ing) => ing.name.trim());

            return (
              <div
                key={instruction.id}
                className="p-4 bg-gray-50 rounded-lg space-y-3"
              >
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-500">
                    Step {index + 1}
                  </span>
                  {instructions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeInstruction(index)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <input
                  type="hidden"
                  name="instruction_id"
                  value={instruction.id}
                />

                {/* Store refs as JSON in hidden input */}
                <input
                  type="hidden"
                  name="instruction_refs"
                  value={JSON.stringify(instruction.refs)}
                />

                <textarea
                  name="instruction_text"
                  rows={2}
                  defaultValue={instruction.text}
                  placeholder="Describe this step..."
                  className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                />

                {/* Ingredient refs selector */}
                {validIngredients.length > 0 && (
                  <div className="pt-2 border-t border-gray-200">
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Link ingredients (shown at end of step):
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {validIngredients.map((ing) => {
                        const isSelected = selectedIds.has(ing.id);
                        return (
                          <button
                            key={ing.id}
                            type="button"
                            onClick={() => toggleIngredientRef(index, ing.id)}
                            className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                              isSelected
                                ? "bg-blue-100 border-blue-400 text-blue-700"
                                : "bg-white border-gray-300 text-gray-600 hover:border-gray-400"
                            }`}
                          >
                            {isSelected && "✓ "}
                            {ing.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end space-x-4">
        <a
          href="/recipes"
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </a>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
