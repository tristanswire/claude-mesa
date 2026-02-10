/**
 * Automatic linking of ingredients to instruction steps.
 * Finds exact positions of ingredient mentions for inline measurement injection.
 */

import type { Ingredient, InstructionStep, IngredientRef } from "@/lib/schemas";

// Descriptors to strip when matching (helps match "olive oil" to "extra virgin olive oil")
const STRIP_DESCRIPTORS = [
  "fresh",
  "freshly",
  "dried",
  "ground",
  "minced",
  "chopped",
  "diced",
  "sliced",
  "grated",
  "shredded",
  "crushed",
  "whole",
  "large",
  "medium",
  "small",
  "extra",
  "virgin",
  "raw",
  "cooked",
  "frozen",
  "canned",
  "organic",
  "unsalted",
  "salted",
  "low-sodium",
  "low sodium",
  "boneless",
  "skinless",
];

// Words that should not be matched alone (too generic)
const SKIP_WORDS = new Set([
  "a", "an", "the", "to", "and", "or", "of", "in", "on", "for", "with",
  "at", "by", "is", "it", "as", "if", "be", "so", "no", "up", "do",
]);

// Minimum word length to consider
const MIN_WORD_LENGTH = 3;

/**
 * Normalize a string for comparison (lowercase, strip punctuation).
 */
function normalizeForComparison(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Get the core ingredient name by stripping descriptors.
 */
function getCoreIngredientName(name: string): string {
  let result = normalizeForComparison(name);

  for (const descriptor of STRIP_DESCRIPTORS) {
    // Remove descriptor as a whole word
    const regex = new RegExp(`\\b${descriptor}\\b`, "gi");
    result = result.replace(regex, " ");
  }

  return result.replace(/\s+/g, " ").trim();
}

/**
 * Generate singular/plural variants of a word.
 */
function getWordVariants(word: string): string[] {
  const variants = [word];

  // Add plural forms
  if (word.endsWith("y") && word.length > 2 && !/[aeiou]y$/i.test(word)) {
    variants.push(word.slice(0, -1) + "ies");
  }
  if (word.endsWith("o") || word.endsWith("s") || word.endsWith("x") ||
      word.endsWith("ch") || word.endsWith("sh")) {
    variants.push(word + "es");
  }
  if (!word.endsWith("s")) {
    variants.push(word + "s");
  }

  // Add singular forms
  if (word.endsWith("ies") && word.length > 3) {
    variants.push(word.slice(0, -3) + "y");
  }
  if (word.endsWith("oes") && word.length > 3) {
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
 * Build a regex pattern that matches the ingredient name with word boundaries.
 * Handles pluralization and partial matching for multi-word ingredients.
 */
function buildIngredientPattern(ingredientName: string): RegExp | null {
  const coreName = getCoreIngredientName(ingredientName);
  const words = coreName.split(/\s+/).filter(w => w.length >= MIN_WORD_LENGTH && !SKIP_WORDS.has(w));

  if (words.length === 0) return null;

  // Build pattern: for multi-word ingredients, match all words in sequence (allowing words between)
  // For single-word ingredients, match just that word with boundaries
  if (words.length === 1) {
    const variants = getWordVariants(words[0]);
    return new RegExp(`\\b(${variants.join("|")})\\b`, "gi");
  }

  // Multi-word: match the full phrase or just the last significant word
  // Try full phrase first, then fall back to primary noun (usually last word)
  const allVariants = words.map(w => getWordVariants(w));
  const fullPhrasePattern = allVariants.map(v => `(${v.join("|")})`).join("\\s+");

  return new RegExp(`\\b${fullPhrasePattern}\\b`, "gi");
}

/**
 * Check if there's already a quantity/unit near a position in the text.
 * This prevents double-injection if measurement is already present.
 */
function hasQuantityNearPosition(text: string, position: number, window: number = 20): boolean {
  const start = Math.max(0, position - window);
  const end = Math.min(text.length, position + window);
  const context = text.slice(start, end);

  // Pattern for common quantity formats: "15 ml", "1/2 cup", "2 tbsp", "100g", etc.
  const quantityPattern = /\b\d+(?:\/\d+)?(?:\.\d+)?\s*(?:ml|g|oz|lb|cup|cups|tbsp|tsp|tablespoon|teaspoon|pound|ounce|gram|liter|litre|quart|pint|gallon)\b/i;

  return quantityPattern.test(context);
}

interface IngredientMatch {
  ingredientId: string;
  start: number;
  end: number;
  matchedText: string;
}

/**
 * Find all ingredient mentions in step text with their exact positions.
 * Returns matches sorted by position, longest matches first (for overlapping).
 */
function findIngredientMentions(
  text: string,
  ingredients: Ingredient[]
): IngredientMatch[] {
  const matches: IngredientMatch[] = [];
  const normalizedText = text.toLowerCase();

  // Sort ingredients by name length (descending) to prefer longer matches
  const sortedIngredients = [...ingredients].sort(
    (a, b) => getCoreIngredientName(b.name).length - getCoreIngredientName(a.name).length
  );

  for (const ingredient of sortedIngredients) {
    const pattern = buildIngredientPattern(ingredient.name);
    if (!pattern) continue;

    let match;
    while ((match = pattern.exec(normalizedText)) !== null) {
      const start = match.index;
      const end = match.index + match[0].length;

      // Check if this position already has a measurement nearby
      if (hasQuantityNearPosition(text, start)) {
        continue;
      }

      // Check for word boundary issues (avoid "oil" inside "boil")
      // The regex already handles this, but double-check
      const charBefore = start > 0 ? normalizedText[start - 1] : " ";
      const charAfter = end < normalizedText.length ? normalizedText[end] : " ";

      if (/[a-z]/i.test(charBefore) || /[a-z]/i.test(charAfter)) {
        continue;
      }

      matches.push({
        ingredientId: ingredient.id,
        start,
        end,
        matchedText: text.slice(start, end),
      });
    }
  }

  // Sort by position, then remove overlapping matches (keep longest)
  matches.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

  // Remove overlapping matches
  const filtered: IngredientMatch[] = [];
  let lastEnd = -1;

  for (const match of matches) {
    if (match.start >= lastEnd) {
      filtered.push(match);
      lastEnd = match.end;
    }
  }

  return filtered;
}

/**
 * Link ingredients to a single instruction step with inline placement.
 * Creates refs with exact character positions for measurement injection.
 */
function linkIngredientsToStepInline(
  step: InstructionStep,
  ingredients: Ingredient[]
): InstructionStep {
  // Only process ingredients that have a quantity
  const ingredientsWithQuantity = ingredients.filter(
    ing => ing.originalQuantity !== null || ing.canonicalQuantity !== null
  );

  const mentions = findIngredientMentions(step.text, ingredientsWithQuantity);

  if (mentions.length === 0) {
    return step;
  }

  // Cap at 5 inline refs per step to avoid clutter
  const cappedMentions = mentions.slice(0, 5);

  // Track which ingredients we've already added (avoid duplicates for same ingredient)
  const seenIngredients = new Set<string>();
  const refs: IngredientRef[] = [];

  for (const mention of cappedMentions) {
    // Only add first mention of each ingredient
    if (seenIngredients.has(mention.ingredientId)) {
      continue;
    }
    seenIngredients.add(mention.ingredientId);

    refs.push({
      ingredientIds: [mention.ingredientId],
      placement: "inline",
      charRange: {
        start: mention.start,
        end: mention.end,
      },
    });
  }

  return { ...step, refs };
}

/**
 * Link ingredients to all instruction steps with inline placement.
 * This is the main entry point for automatic measurement injection.
 */
export function linkIngredientsToInstructions(
  instructions: InstructionStep[],
  ingredients: Ingredient[]
): InstructionStep[] {
  return instructions.map(step => linkIngredientsToStepInline(step, ingredients));
}

/**
 * Check if all instruction steps have empty refs.
 */
export function allRefsEmpty(instructions: InstructionStep[]): boolean {
  return instructions.every(step => step.refs.length === 0);
}

/**
 * Clear all refs from instructions (useful for re-linking).
 */
export function clearAllRefs(instructions: InstructionStep[]): InstructionStep[] {
  return instructions.map(step => ({ ...step, refs: [] }));
}
