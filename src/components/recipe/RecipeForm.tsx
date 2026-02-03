"use client";

import { useActionState, useState } from "react";
import type { Recipe, Ingredient, InstructionStep } from "@/lib/schemas";
import type { FormState } from "@/lib/actions/recipes";
import { UpgradeCallout } from "@/components/ui/UpgradeCallout";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

interface RecipeFormProps {
  recipe?: Recipe;
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  formId?: string;
  hideSubmitButton?: boolean;
  imageUploadSlot?: React.ReactNode;
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

export function RecipeForm({ recipe, action, submitLabel, formId = "recipe-form", hideSubmitButton = false, imageUploadSlot }: RecipeFormProps) {
  const [state, formAction, isPending] = useActionState(action, {
    success: true,
  });

  const [ingredients, setIngredients] = useState<Ingredient[]>(
    recipe?.ingredients?.length ? recipe.ingredients : [emptyIngredient()]
  );

  const [instructions, setInstructions] = useState<InstructionStep[]>(
    recipe?.instructions?.length ? recipe.instructions : [emptyInstruction()]
  );

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
    <form id={formId} action={formAction} className="space-y-6">
      {/* Error display - outside cards */}
      {!state.success && state.error && (
        state.fieldErrors?._code?.[0] === "RECIPE_LIMIT_REACHED" ? (
          <UpgradeCallout
            message={state.error}
            limit={state.fieldErrors?._limit ? parseInt(state.fieldErrors._limit[0], 10) : undefined}
          />
        ) : (
          <div className="bg-error-subtle border border-error/20 text-error px-4 py-3 rounded-lg">
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

      {/* Basic Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Image upload slot - renders at top of Basic Info if provided */}
          {imageUploadSlot && (
            <div className="pb-4 border-b border-border">
              {imageUploadSlot}
            </div>
          )}

          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-foreground"
            >
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              defaultValue={recipe?.title}
              className="mt-1 block w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
            {state.fieldErrors?.title && (
              <p className="mt-1 text-sm text-error">
                {state.fieldErrors.title[0]}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-foreground"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={recipe?.description || ""}
              className="mt-1 block w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="servings"
                className="block text-sm font-medium text-foreground"
              >
                Servings
              </label>
              <input
                type="number"
                id="servings"
                name="servings"
                min="1"
                defaultValue={recipe?.servings || ""}
                className="mt-1 block w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>

            <div>
              <label
                htmlFor="prepTimeMinutes"
                className="block text-sm font-medium text-foreground"
              >
                Prep Time (min)
              </label>
              <input
                type="number"
                id="prepTimeMinutes"
                name="prepTimeMinutes"
                min="0"
                defaultValue={recipe?.prepTimeMinutes || ""}
                className="mt-1 block w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>

            <div>
              <label
                htmlFor="cookTimeMinutes"
                className="block text-sm font-medium text-foreground"
              >
                Cook Time (min)
              </label>
              <input
                type="number"
                id="cookTimeMinutes"
                name="cookTimeMinutes"
                min="0"
                defaultValue={recipe?.cookTimeMinutes || ""}
                className="mt-1 block w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ingredients + Instructions - responsive grid of cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingredients Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Ingredients</CardTitle>
            <button
              type="button"
              onClick={addIngredient}
              className="text-sm text-primary hover:text-primary-hover transition-colors cursor-pointer"
            >
              + Add
            </button>
          </CardHeader>
          <CardContent className="space-y-3">
            {state.fieldErrors?.ingredients && (
              <p className="text-sm text-error">
                {state.fieldErrors.ingredients[0]}
              </p>
            )}

            {ingredients.map((ingredient, index) => (
              <div
                key={ingredient.id}
                className="p-3 bg-surface-2 rounded-lg space-y-2"
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-medium text-muted">
                    #{index + 1}
                  </span>
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="text-xs text-error hover:text-error/80 transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <input type="hidden" name="ingredient_id" value={ingredient.id} />

                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-muted">
                      Original Text *
                    </label>
                    <input
                      type="text"
                      name="ingredient_originalText"
                      defaultValue={ingredient.originalText}
                      placeholder="e.g., 1 tsp cumin, ground"
                      className="mt-1 block w-full px-2 py-1.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-muted">
                        Name *
                      </label>
                      <input
                        type="text"
                        name="ingredient_name"
                        defaultValue={ingredient.name}
                        placeholder="cumin"
                        className="mt-1 block w-full px-2 py-1.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted">
                        Type
                      </label>
                      <select
                        name="ingredient_ingredientType"
                        defaultValue={ingredient.ingredientType}
                        className="mt-1 block w-full px-2 py-1.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent cursor-pointer"
                      >
                        <option value="volume">Volume</option>
                        <option value="weight">Weight</option>
                        <option value="count">Count</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-muted">
                        Qty
                      </label>
                      <input
                        type="number"
                        name="ingredient_originalQuantity"
                        step="any"
                        defaultValue={ingredient.originalQuantity ?? ""}
                        placeholder="1"
                        className="mt-1 block w-full px-2 py-1.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted">
                        Unit
                      </label>
                      <input
                        type="text"
                        name="ingredient_originalUnit"
                        defaultValue={ingredient.originalUnit ?? ""}
                        placeholder="tsp"
                        className="mt-1 block w-full px-2 py-1.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted">
                        Canon
                      </label>
                      <input
                        type="number"
                        name="ingredient_canonicalQuantity"
                        step="any"
                        defaultValue={ingredient.canonicalQuantity ?? ""}
                        placeholder="4.93"
                        className="mt-1 block w-full px-2 py-1.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted">
                        C.Unit
                      </label>
                      <select
                        name="ingredient_canonicalUnit"
                        defaultValue={ingredient.canonicalUnit ?? ""}
                        className="mt-1 block w-full px-2 py-1.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent cursor-pointer"
                      >
                        <option value="">-</option>
                        <option value="ml">ml</option>
                        <option value="g">g</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Instructions</CardTitle>
              <p className="text-xs text-muted mt-1">
                Measurements shown automatically when viewing.
              </p>
            </div>
            <button
              type="button"
              onClick={addInstruction}
              className="text-sm text-primary hover:text-primary-hover transition-colors cursor-pointer"
            >
              + Add
            </button>
          </CardHeader>
          <CardContent className="space-y-3">
            {state.fieldErrors?.instructions && (
              <p className="text-sm text-error">
                {state.fieldErrors.instructions[0]}
              </p>
            )}

            {instructions.map((instruction, index) => (
              <div
                key={instruction.id}
                className="p-3 bg-surface-2 rounded-lg space-y-2"
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-medium text-muted">
                    Step {index + 1}
                  </span>
                  {instructions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeInstruction(index)}
                      className="text-xs text-error hover:text-error/80 transition-colors cursor-pointer"
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
                  rows={3}
                  defaultValue={instruction.text}
                  placeholder="Describe this step..."
                  className="block w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Submit - only shown if not hidden (for inline use) */}
      {!hideSubmitButton && (
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending} isLoading={isPending}>
            {isPending ? "Saving..." : submitLabel}
          </Button>
        </div>
      )}
    </form>
  );
}

// Export a hook to get the form's pending state for external submit buttons
export function useRecipeFormPending() {
  // This is a placeholder - the actual pending state is managed inside RecipeForm
  // For external buttons, we'll use the form attribute approach
  return false;
}
