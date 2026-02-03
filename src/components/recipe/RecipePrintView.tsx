"use client";

import type { Recipe } from "@/lib/schemas";
import type { UnitSystem } from "@/lib/units";
import { formatIngredient } from "@/lib/units";
import { renderInstructions } from "@/lib/render";

interface RecipePrintViewProps {
  recipe: Recipe;
  unitSystem: UnitSystem;
  showPrintButton?: boolean;
  showAttribution?: boolean;
}

export function RecipePrintView({
  recipe,
  unitSystem,
  showPrintButton = true,
  showAttribution = false,
}: RecipePrintViewProps) {
  const renderedInstructions = renderInstructions(
    recipe.instructions,
    recipe.ingredients,
    unitSystem
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="print-container max-w-3xl mx-auto px-6 py-8">
      {/* Print button - hidden when printing */}
      {showPrintButton && (
        <div className="print:hidden mb-6 flex justify-end">
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Print Recipe
          </button>
        </div>
      )}

      {/* Recipe Header */}
      <header className="mb-8 border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{recipe.title}</h1>
        {recipe.description && (
          <p className="text-gray-600 text-lg">{recipe.description}</p>
        )}

        {/* Meta info */}
        <div className="flex flex-wrap gap-6 mt-4 text-sm text-gray-600">
          {recipe.servings && (
            <span>
              <strong>Servings:</strong> {recipe.servings}
            </span>
          )}
          {recipe.prepTimeMinutes && (
            <span>
              <strong>Prep Time:</strong> {recipe.prepTimeMinutes} minutes
            </span>
          )}
          {recipe.cookTimeMinutes && (
            <span>
              <strong>Cook Time:</strong> {recipe.cookTimeMinutes} minutes
            </span>
          )}
          {recipe.prepTimeMinutes && recipe.cookTimeMinutes && (
            <span>
              <strong>Total Time:</strong>{" "}
              {recipe.prepTimeMinutes + recipe.cookTimeMinutes} minutes
            </span>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 print:grid-cols-3">
        {/* Ingredients - 1/3 width */}
        <section className="md:col-span-1">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
            Ingredients
          </h2>
          {recipe.ingredients.length === 0 ? (
            <p className="text-gray-500 italic">No ingredients listed.</p>
          ) : (
            <ul className="space-y-2">
              {recipe.ingredients.map((ingredient) => (
                <li
                  key={ingredient.id}
                  className="flex items-start text-gray-700"
                >
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0 print:bg-black" />
                  <span>{formatIngredient(ingredient, unitSystem)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Instructions - 2/3 width */}
        <section className="md:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
            Instructions
          </h2>
          {recipe.instructions.length === 0 ? (
            <p className="text-gray-500 italic">No instructions listed.</p>
          ) : (
            <ol className="space-y-4">
              {renderedInstructions.map((step) => (
                <li key={step.id} className="flex text-gray-700">
                  <span className="flex-shrink-0 w-7 h-7 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-sm font-semibold mr-4 print:bg-gray-200">
                    {step.stepNumber}
                  </span>
                  <span className="pt-0.5 leading-relaxed">{step.text}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {/* Source URL */}
      {recipe.sourceUrl && (
        <footer className="mt-8 pt-4 border-t border-gray-200 text-sm text-gray-500">
          <strong>Source:</strong>{" "}
          <span className="print:hidden">
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {recipe.sourceUrl}
            </a>
          </span>
          <span className="hidden print:inline">{recipe.sourceUrl}</span>
        </footer>
      )}

      {/* Attribution for shared recipes */}
      {showAttribution && (
        <footer className="mt-4 text-sm text-gray-400 text-center print:text-gray-500">
          Shared via Mesa Recipe App
        </footer>
      )}
    </div>
  );
}

/**
 * Format recipe as plain text for clipboard.
 */
export function formatRecipeAsText(
  recipe: Recipe,
  unitSystem: UnitSystem
): string {
  const renderedInstructions = renderInstructions(
    recipe.instructions,
    recipe.ingredients,
    unitSystem
  );

  const lines: string[] = [];

  // Image URL (if available)
  if (recipe.imageUrl) {
    lines.push(`Image: ${recipe.imageUrl}`);
    lines.push("");
  }

  // Title
  lines.push(recipe.title);
  lines.push("=".repeat(recipe.title.length));
  lines.push("");

  // Meta info
  const metaParts: string[] = [];
  if (recipe.servings) metaParts.push(`Servings: ${recipe.servings}`);
  if (recipe.prepTimeMinutes) metaParts.push(`Prep: ${recipe.prepTimeMinutes} min`);
  if (recipe.cookTimeMinutes) metaParts.push(`Cook: ${recipe.cookTimeMinutes} min`);
  if (metaParts.length > 0) {
    lines.push(metaParts.join(" | "));
    lines.push("");
  }

  // Ingredients
  lines.push("INGREDIENTS");
  lines.push("-----------");
  for (const ingredient of recipe.ingredients) {
    lines.push(`- ${formatIngredient(ingredient, unitSystem)}`);
  }
  lines.push("");

  // Instructions
  lines.push("INSTRUCTIONS");
  lines.push("------------");
  for (const step of renderedInstructions) {
    lines.push(`${step.stepNumber}. ${step.text}`);
  }

  // Source
  if (recipe.sourceUrl) {
    lines.push("");
    lines.push(`Source: ${recipe.sourceUrl}`);
  }

  return lines.join("\n");
}

/**
 * Format recipe as HTML for rich clipboard.
 */
export function formatRecipeAsHtml(
  recipe: Recipe,
  unitSystem: UnitSystem
): string {
  const renderedInstructions = renderInstructions(
    recipe.instructions,
    recipe.ingredients,
    unitSystem
  );

  const parts: string[] = [];

  // Image (if available)
  if (recipe.imageUrl) {
    parts.push(`<img src="${recipe.imageUrl}" alt="${recipe.title}" style="max-width: 400px; border-radius: 8px; margin-bottom: 16px;" />`);
  }

  // Title
  parts.push(`<h1>${escapeHtml(recipe.title)}</h1>`);

  // Description
  if (recipe.description) {
    parts.push(`<p><em>${escapeHtml(recipe.description)}</em></p>`);
  }

  // Meta info
  const metaParts: string[] = [];
  if (recipe.servings) metaParts.push(`<strong>Servings:</strong> ${recipe.servings}`);
  if (recipe.prepTimeMinutes) metaParts.push(`<strong>Prep:</strong> ${recipe.prepTimeMinutes} min`);
  if (recipe.cookTimeMinutes) metaParts.push(`<strong>Cook:</strong> ${recipe.cookTimeMinutes} min`);
  if (metaParts.length > 0) {
    parts.push(`<p>${metaParts.join(" &nbsp;|&nbsp; ")}</p>`);
  }

  // Ingredients
  parts.push("<h2>Ingredients</h2>");
  parts.push("<ul>");
  for (const ingredient of recipe.ingredients) {
    parts.push(`<li>${escapeHtml(formatIngredient(ingredient, unitSystem))}</li>`);
  }
  parts.push("</ul>");

  // Instructions
  parts.push("<h2>Instructions</h2>");
  parts.push("<ol>");
  for (const step of renderedInstructions) {
    parts.push(`<li>${escapeHtml(step.text)}</li>`);
  }
  parts.push("</ol>");

  // Source
  if (recipe.sourceUrl) {
    parts.push(`<p><strong>Source:</strong> <a href="${recipe.sourceUrl}">${escapeHtml(recipe.sourceUrl)}</a></p>`);
  }

  return parts.join("\n");
}

/**
 * Escape HTML special characters.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
