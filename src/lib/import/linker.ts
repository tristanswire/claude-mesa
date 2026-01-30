/**
 * Automatic linking of ingredients to instruction steps.
 * Matches ingredient mentions in step text and populates refs[].
 */

import type { Ingredient, InstructionStep, IngredientRef } from "@/lib/schemas";

// Words to skip when matching (too common/short)
const SKIP_WORDS = new Set([
  "a",
  "an",
  "the",
  "to",
  "and",
  "or",
  "of",
  "in",
  "on",
  "for",
  "with",
  "at",
  "by",
  "is",
  "it",
  "as",
  "if",
  "be",
  "so",
  "no",
  "up",
  "do",
]);

// Minimum token length to consider
const MIN_TOKEN_LENGTH = 3;

/**
 * Normalize a string for matching.
 */
function normalize(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim();
}

/**
 * Get matchable tokens from an ingredient name.
 * Filters out common words and short tokens.
 */
function getIngredientTokens(name: string): string[] {
  const normalized = normalize(name);
  const words = normalized.split(/\s+/).filter(Boolean);

  return words.filter(
    (word) => word.length >= MIN_TOKEN_LENGTH && !SKIP_WORDS.has(word)
  );
}

/**
 * Simple pluralization handling.
 * Returns both singular and plural forms.
 */
function getWordVariants(word: string): string[] {
  const variants = [word];

  // Add plural forms
  if (word.endsWith("y") && word.length > 2 && !/[aeiou]y$/i.test(word)) {
    // berry -> berries (consonant + y)
    variants.push(word.slice(0, -1) + "ies");
  }
  if (
    word.endsWith("o") ||
    word.endsWith("s") ||
    word.endsWith("x") ||
    word.endsWith("ch") ||
    word.endsWith("sh")
  ) {
    // tomato -> tomatoes, box -> boxes
    variants.push(word + "es");
  }
  if (!word.endsWith("s")) {
    // Simple plural
    variants.push(word + "s");
  }

  // Add singular forms (if already plural)
  if (word.endsWith("ies") && word.length > 3) {
    // berries -> berry
    variants.push(word.slice(0, -3) + "y");
  }
  if (word.endsWith("oes") && word.length > 3) {
    // tomatoes -> tomato
    variants.push(word.slice(0, -2));
  }
  if (word.endsWith("es") && word.length > 2) {
    variants.push(word.slice(0, -2));
    variants.push(word.slice(0, -1));
  }
  if (word.endsWith("s") && word.length > 1 && !word.endsWith("ss")) {
    variants.push(word.slice(0, -1));
  }

  return [...new Set(variants)];
}

/**
 * Check if an ingredient is mentioned in the step text.
 */
function ingredientMentionedInStep(
  ingredient: Ingredient,
  stepText: string
): boolean {
  const tokens = getIngredientTokens(ingredient.name);
  if (tokens.length === 0) return false;

  const normalizedStep = normalize(stepText);

  // For single-token ingredients, require word boundary match
  // For multi-token ingredients, require all significant tokens present
  if (tokens.length === 1) {
    const variants = getWordVariants(tokens[0]);
    const stepWords = normalizedStep.split(/\s+/);
    return variants.some((variant) => stepWords.includes(variant));
  }

  // Multi-token: all tokens must be present
  return tokens.every((token) => {
    const variants = getWordVariants(token);
    const stepWords = normalizedStep.split(/\s+/);
    return variants.some((variant) => stepWords.includes(variant));
  });
}

/**
 * Link ingredients to a single instruction step.
 * Returns updated step with refs populated.
 */
function linkIngredientsToStep(
  step: InstructionStep,
  ingredients: Ingredient[]
): InstructionStep {
  // Skip if step already has refs
  if (step.refs.length > 0) {
    return step;
  }

  const matchedIds: string[] = [];

  for (const ingredient of ingredients) {
    if (ingredientMentionedInStep(ingredient, step.text)) {
      matchedIds.push(ingredient.id);
    }
  }

  if (matchedIds.length === 0) {
    return step;
  }

  const refs: IngredientRef[] = [
    {
      ingredientIds: matchedIds,
      placement: "end",
    },
  ];

  return { ...step, refs };
}

/**
 * Link ingredients to all instruction steps.
 * Only populates refs for steps that don't already have them.
 */
export function linkIngredientsToInstructions(
  instructions: InstructionStep[],
  ingredients: Ingredient[]
): InstructionStep[] {
  return instructions.map((step) => linkIngredientsToStep(step, ingredients));
}

/**
 * Check if all instruction steps have empty refs.
 */
export function allRefsEmpty(instructions: InstructionStep[]): boolean {
  return instructions.every((step) => step.refs.length === 0);
}
