"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Ingredient, InstructionStep, IngredientRef } from "@/lib/schemas";
import type { UnitSystem } from "@/lib/units";
import { formatIngredient } from "@/lib/units";
import { renderInstructions } from "@/lib/render";
import { importRecipeAction, importRecipeFromTextAction } from "@/lib/actions/import";
import { createRecipeAction } from "@/lib/actions/recipes";
import { UnitToggle } from "@/components/recipe/UnitToggle";
import { UpgradeCallout } from "@/components/ui/UpgradeCallout";

type ImportMode = "url" | "text";
type ImportStep = "input" | "review";

function generateUUID(): string {
  return crypto.randomUUID();
}

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

export default function ImportRecipePage() {
  const [mode, setMode] = useState<ImportMode>("url");
  const [step, setStep] = useState<ImportStep>("input");
  const [error, setError] = useState<string | null>(null);
  const [saveFieldErrors, setSaveFieldErrors] = useState<Record<string, string[]> | undefined>();
  const [isImporting, startImport] = useTransition();
  const [isSaving, startSave] = useTransition();

  // URL mode state
  const [url, setUrl] = useState("");

  // Text mode state
  const [pasteText, setPasteText] = useState("");
  const [textSourceUrl, setTextSourceUrl] = useState("");
  const [textTitleOverride, setTextTitleOverride] = useState("");

  // Imported recipe data for review
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [servings, setServings] = useState<number | undefined>();
  const [prepTime, setPrepTime] = useState<number | undefined>();
  const [cookTime, setCookTime] = useState<number | undefined>();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [instructions, setInstructions] = useState<InstructionStep[]>([]);
  const [sourceUrl, setSourceUrl] = useState("");
  const [imageUrl, setImageUrl] = useState<string | undefined>();

  // For preview
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("original");

  const handleImportUrl = () => {
    setError(null);

    startImport(async () => {
      const result = await importRecipeAction(url);

      if (!result.success) {
        setError(result.error);
        return;
      }

      populateReviewForm(result.recipe, url);
    });
  };

  const handleImportText = () => {
    setError(null);

    startImport(async () => {
      const result = await importRecipeFromTextAction({
        text: pasteText,
        sourceUrl: textSourceUrl || undefined,
        title: textTitleOverride || undefined,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      populateReviewForm(result.recipe, textSourceUrl);
    });
  };

  const populateReviewForm = (
    recipe: {
      title: string;
      description?: string;
      servings?: number;
      prepTimeMinutes?: number;
      cookTimeMinutes?: number;
      sourceUrl?: string;
      imageUrl?: string;
      ingredients: Ingredient[];
      instructions: InstructionStep[];
    },
    fallbackSourceUrl: string
  ) => {
    setTitle(recipe.title);
    setDescription(recipe.description || "");
    setServings(recipe.servings);
    setPrepTime(recipe.prepTimeMinutes);
    setCookTime(recipe.cookTimeMinutes);
    setIngredients(recipe.ingredients);
    setInstructions(recipe.instructions);
    setSourceUrl(recipe.sourceUrl || fallbackSourceUrl);
    setImageUrl(recipe.imageUrl);
    setStep("review");
  };

  const handleSave = () => {
    setError(null);
    setSaveFieldErrors(undefined);

    startSave(async () => {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      if (servings) formData.append("servings", String(servings));
      if (prepTime) formData.append("prepTimeMinutes", String(prepTime));
      if (cookTime) formData.append("cookTimeMinutes", String(cookTime));
      formData.append("sourceUrl", sourceUrl);
      // Include imageUrl for external images from imports
      if (imageUrl) {
        formData.append("imageUrl", imageUrl);
      }

      for (const ing of ingredients) {
        formData.append("ingredient_id", ing.id);
        formData.append("ingredient_name", ing.name);
        formData.append("ingredient_originalText", ing.originalText);
        formData.append(
          "ingredient_originalQuantity",
          ing.originalQuantity !== null ? String(ing.originalQuantity) : ""
        );
        formData.append("ingredient_originalUnit", ing.originalUnit || "");
        formData.append("ingredient_ingredientType", ing.ingredientType);
        formData.append(
          "ingredient_canonicalQuantity",
          ing.canonicalQuantity !== null ? String(ing.canonicalQuantity) : ""
        );
        formData.append("ingredient_canonicalUnit", ing.canonicalUnit || "");
      }

      for (const s of instructions) {
        formData.append("instruction_id", s.id);
        formData.append("instruction_text", s.text);
        formData.append("instruction_refs", JSON.stringify(s.refs));
      }

      const result = await createRecipeAction({ success: true }, formData);

      if (!result.success) {
        setError(result.error || "Failed to save recipe");
        setSaveFieldErrors(result.fieldErrors);
      }
    });
  };

  const resetToInput = () => {
    setStep("input");
    setError(null);
    setSaveFieldErrors(undefined);
  };

  // Ingredient editing helpers
  const updateIngredient = (index: number, updates: Partial<Ingredient>) => {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, ...updates } : ing))
    );
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const addIngredient = () => {
    setIngredients((prev) => [
      ...prev,
      {
        id: generateUUID(),
        name: "",
        originalText: "",
        originalQuantity: null,
        originalUnit: null,
        ingredientType: "count",
        canonicalQuantity: null,
        canonicalUnit: null,
        orderIndex: prev.length,
      },
    ]);
  };

  // Instruction editing helpers
  const updateInstruction = (index: number, text: string) => {
    setInstructions((prev) =>
      prev.map((s, i) => (i === index ? { ...s, text } : s))
    );
  };

  const removeInstruction = (index: number) => {
    if (instructions.length > 1) {
      setInstructions((prev) =>
        prev
          .filter((_, i) => i !== index)
          .map((s, i) => ({ ...s, stepNumber: i + 1 }))
      );
    }
  };

  const addInstruction = () => {
    setInstructions((prev) => [
      ...prev,
      {
        id: generateUUID(),
        stepNumber: prev.length + 1,
        text: "",
        refs: [],
      },
    ]);
  };

  const toggleIngredientRef = (instructionIndex: number, ingredientId: string) => {
    setInstructions((prev) =>
      prev.map((instruction, i) => {
        if (i !== instructionIndex) return instruction;

        const selectedIds = getSelectedIngredientIds(instruction.refs);

        if (selectedIds.has(ingredientId)) {
          selectedIds.delete(ingredientId);
        } else {
          selectedIds.add(ingredientId);
        }

        const refs: IngredientRef[] =
          selectedIds.size > 0
            ? [{ ingredientIds: Array.from(selectedIds), placement: "end" as const }]
            : [];

        return { ...instruction, refs };
      })
    );
  };

  const renderedInstructions = renderInstructions(instructions, ingredients, unitSystem);

  // Input step
  if (step === "input") {
    return (
      <div className="max-w-xl mx-auto">
        <div className="mb-6">
          <Link
            href="/recipes"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            &larr; Back to recipes
          </Link>
          <h1 className="text-2xl font-bold text-foreground mt-2">Import Recipe</h1>
          <p className="mt-1 text-muted">
            Import a recipe from a URL or paste the text directly.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex mb-6 bg-surface-2 rounded-xl p-1">
          <button
            type="button"
            onClick={() => {
              setMode("url");
              setError(null);
            }}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              mode === "url"
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            Import from URL
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("text");
              setError(null);
            }}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              mode === "text"
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            Paste Text
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-error/10 border border-error/30 text-error px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="bg-surface rounded-xl p-6">
          {mode === "url" ? (
            <>
              <label
                htmlFor="url"
                className="block text-sm font-medium text-foreground"
              >
                Recipe URL
              </label>
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/recipe/..."
                className="mt-1 block w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <p className="mt-2 text-sm text-muted">
                Works best with recipe sites that use structured data (JSON-LD).
              </p>

              <div className="mt-6 flex justify-end space-x-4">
                <Link
                  href="/recipes"
                  className="px-4 py-2 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-2 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="button"
                  onClick={handleImportUrl}
                  disabled={isImporting || !url.trim()}
                  className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {isImporting ? "Importing..." : "Import"}
                </button>
              </div>
            </>
          ) : (
            <>
              <label
                htmlFor="pasteText"
                className="block text-sm font-medium text-foreground"
              >
                Recipe Text
              </label>
              <textarea
                id="pasteText"
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={`Paste your recipe here...

Example format:

Chocolate Chip Cookies

Ingredients:
- 2 cups flour
- 1 cup butter
- 1 cup sugar
- 2 eggs
- 1 cup chocolate chips

Instructions:
1. Preheat oven to 350°F
2. Mix flour and butter
3. Add sugar and eggs
4. Fold in chocolate chips
5. Bake for 12 minutes`}
                rows={12}
                className="mt-1 block w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-mono text-sm"
              />
              <p className="mt-2 text-sm text-muted">
                Include &quot;Ingredients:&quot; and &quot;Instructions:&quot; headings for best results.
              </p>

              {/* Optional fields */}
              <div className="mt-4 pt-4 border-t border-border space-y-4">
                <div>
                  <label
                    htmlFor="textTitle"
                    className="block text-sm font-medium text-foreground"
                  >
                    Title Override (optional)
                  </label>
                  <input
                    type="text"
                    id="textTitle"
                    value={textTitleOverride}
                    onChange={(e) => setTextTitleOverride(e.target.value)}
                    placeholder="Leave blank to auto-detect"
                    className="mt-1 block w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label
                    htmlFor="textSourceUrl"
                    className="block text-sm font-medium text-foreground"
                  >
                    Source URL (optional)
                  </label>
                  <input
                    type="url"
                    id="textSourceUrl"
                    value={textSourceUrl}
                    onChange={(e) => setTextSourceUrl(e.target.value)}
                    placeholder="https://example.com/original-recipe"
                    className="mt-1 block w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-4">
                <Link
                  href="/recipes"
                  className="px-4 py-2 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-2 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="button"
                  onClick={handleImportText}
                  disabled={isImporting || !pasteText.trim()}
                  className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {isImporting ? "Parsing..." : "Parse"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Review step
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          type="button"
          onClick={resetToInput}
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          &larr; Back to import
        </button>
        <h1 className="text-2xl font-bold text-foreground mt-2">
          Review Imported Recipe
        </h1>
        <p className="mt-1 text-muted">
          Review and edit the imported recipe before saving.
        </p>
      </div>

      {error && (
        saveFieldErrors?._code?.[0] === "RECIPE_LIMIT_REACHED" ? (
          <div className="mb-4">
            <UpgradeCallout
              message={error}
              limit={saveFieldErrors?._limit ? parseInt(saveFieldErrors._limit[0], 10) : undefined}
            />
          </div>
        ) : (
          <div className="mb-4 bg-error/10 border border-error/30 text-error px-4 py-3 rounded-xl">
            {error}
          </div>
        )
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Edit Form */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-surface rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Basic Info</h2>

            <div>
              <label className="block text-sm font-medium text-foreground">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="mt-1 block w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground">
                  Servings
                </label>
                <input
                  type="number"
                  value={servings || ""}
                  onChange={(e) =>
                    setServings(e.target.value ? parseInt(e.target.value) : undefined)
                  }
                  min="1"
                  className="mt-1 block w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">
                  Prep (min)
                </label>
                <input
                  type="number"
                  value={prepTime || ""}
                  onChange={(e) =>
                    setPrepTime(e.target.value ? parseInt(e.target.value) : undefined)
                  }
                  min="0"
                  className="mt-1 block w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">
                  Cook (min)
                </label>
                <input
                  type="number"
                  value={cookTime || ""}
                  onChange={(e) =>
                    setCookTime(e.target.value ? parseInt(e.target.value) : undefined)
                  }
                  min="0"
                  className="mt-1 block w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">
                Source URL
              </label>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-border rounded-lg bg-background text-muted text-sm"
              />
            </div>
          </div>

          {/* Ingredients */}
          <div className="bg-surface rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-foreground">
                Ingredients ({ingredients.length})
              </h2>
              <button
                type="button"
                onClick={addIngredient}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                + Add
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {ingredients.map((ing, index) => (
                <div key={ing.id} className="p-3 bg-surface-2 rounded-lg space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-medium text-muted">
                      #{index + 1}
                    </span>
                    {ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeIngredient(index)}
                        className="text-xs text-error hover:text-error/80 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={ing.name}
                      onChange={(e) =>
                        updateIngredient(index, { name: e.target.value })
                      }
                      placeholder="Name"
                      className="px-2 py-1 text-sm border border-border rounded-lg bg-background text-foreground"
                    />
                    <input
                      type="text"
                      value={ing.originalText}
                      onChange={(e) =>
                        updateIngredient(index, { originalText: e.target.value })
                      }
                      placeholder="Original text"
                      className="px-2 py-1 text-sm border border-border rounded-lg bg-background text-foreground"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-surface rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-foreground">
                Instructions ({instructions.length})
              </h2>
              <button
                type="button"
                onClick={addInstruction}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                + Add
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {instructions.map((s, index) => {
                const selectedIds = getSelectedIngredientIds(s.refs);
                const validIngredients = ingredients.filter((ing) => ing.name.trim());

                return (
                  <div key={s.id} className="p-3 bg-surface-2 rounded-lg space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-medium text-muted">
                        Step {index + 1}
                      </span>
                      {instructions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeInstruction(index)}
                          className="text-xs text-error hover:text-error/80 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <textarea
                      value={s.text}
                      onChange={(e) => updateInstruction(index, e.target.value)}
                      rows={2}
                      className="block w-full px-2 py-1 text-sm border border-border rounded-lg bg-background text-foreground"
                    />
                    {validIngredients.length > 0 && (
                      <div className="pt-2 border-t border-border">
                        <label className="block text-xs text-muted mb-1">
                          Link ingredients:
                        </label>
                        <div className="flex flex-wrap gap-1">
                          {validIngredients.map((ing) => {
                            const isSelected = selectedIds.has(ing.id);
                            return (
                              <button
                                key={ing.id}
                                type="button"
                                onClick={() => toggleIngredientRef(index, ing.id)}
                                className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                                  isSelected
                                    ? "bg-primary/10 border-primary text-primary"
                                    : "bg-surface border-border text-muted"
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
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <div className="bg-surface rounded-xl p-6 sticky top-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-foreground">Preview</h2>
              <UnitToggle
                initialUnitSystem="original"
                onUnitChange={setUnitSystem}
              />
            </div>

            {/* Imported image preview */}
            {imageUrl && (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-4">
                <Image
                  src={imageUrl}
                  alt={title || "Recipe image"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 448px) 100vw, 448px"
                />
              </div>
            )}

            <h3 className="text-xl font-bold text-foreground mb-2">
              {title || "Untitled"}
            </h3>
            {description && (
              <p className="text-sm text-muted mb-4">{description}</p>
            )}

            <div className="flex items-center space-x-4 text-xs text-muted mb-4">
              {servings && <span>Servings: {servings}</span>}
              {prepTime && <span>Prep: {prepTime}m</span>}
              {cookTime && <span>Cook: {cookTime}m</span>}
            </div>

            {/* Ingredients Preview */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-foreground mb-2">
                Ingredients
              </h4>
              {ingredients.length > 0 ? (
                <ul className="text-sm space-y-1">
                  {ingredients.map((ing) => (
                    <li key={ing.id} className="flex items-start text-foreground">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 mr-2 flex-shrink-0" />
                      {formatIngredient(ing, unitSystem)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">No ingredients</p>
              )}
            </div>

            {/* Instructions Preview */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">
                Instructions
              </h4>
              {renderedInstructions.length > 0 ? (
                <ol className="text-sm space-y-2">
                  {renderedInstructions.map((rs) => (
                    <li key={rs.id} className="flex">
                      <span className="flex-shrink-0 w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-medium mr-2">
                        {rs.stepNumber}
                      </span>
                      <span className="text-foreground">{rs.text}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted">No instructions</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end space-x-4">
        <button
          type="button"
          onClick={resetToInput}
          className="px-4 py-2 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-2 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !title.trim()}
          className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isSaving ? "Saving..." : "Save Recipe"}
        </button>
      </div>
    </div>
  );
}
