/**
 * Parse raw pasted recipe text into structured sections.
 * Extracts title, ingredient lines, and instruction lines.
 */

export interface ParsedTextResult {
  title: string;
  ingredientLines: string[];
  instructionLines: string[];
}

// Heading patterns for ingredients section
const INGREDIENT_HEADINGS = [
  /^ingredients?\s*:?$/i,
  /^what\s+you('ll)?\s+need\s*:?$/i,
  /^you('ll)?\s+need\s*:?$/i,
  /^shopping\s+list\s*:?$/i,
];

// Heading patterns for instructions section
const INSTRUCTION_HEADINGS = [
  /^instructions?\s*:?$/i,
  /^directions?\s*:?$/i,
  /^method\s*:?$/i,
  /^steps?\s*:?$/i,
  /^how\s+to\s+make\s*:?$/i,
  /^preparation\s*:?$/i,
  /^procedure\s*:?$/i,
];

// Patterns that indicate an ingredient line (when no headings found)
const INGREDIENT_LINE_PATTERNS = [
  /^\s*[-•*]\s+\d/, // Bullet with number (e.g., "- 2 cups")
  /^\s*[-•*]\s+\w/, // Bullet with word
  /^\s*\d+[\s\/\d]*\s*(cup|tbsp|tsp|oz|lb|g|kg|ml|l|teaspoon|tablespoon|ounce|pound|gram|kilogram|liter|litre|pinch|dash|clove|can|package|pkg|bunch|head|stalk|slice|piece)/i,
  /^\s*\d+[\s\/\d]*\s+\w+/, // Number followed by word (e.g., "2 eggs")
  /^\s*½|⅓|⅔|¼|¾|⅛/, // Unicode fractions at start
  /^\s*\d+\/\d+\s+/, // Text fractions (e.g., "1/2 cup")
];

// Patterns that indicate an instruction line
const INSTRUCTION_LINE_PATTERNS = [
  /^\s*\d+[.)]\s+\w/, // Numbered step (e.g., "1. Preheat")
  /^\s*step\s+\d+/i, // "Step 1" format
  /^(preheat|heat|add|mix|stir|combine|pour|place|cook|bake|let|allow|set|remove|serve|enjoy)/i, // Action verbs
];

// Lines to skip entirely
const SKIP_LINE_PATTERNS = [
  /^\s*$/, // Empty
  /^[-=_*]{3,}$/, // Separators
  /^\s*#/, // Markdown headers with just #
  /^\s*\*{2,}/, // Bold markdown
  /^(print|save|share|pin|tweet|email|jump\s+to\s+recipe)/i, // UI elements
  /^(nutrition|calories|macros|per\s+serving)/i, // Nutrition info
  /^(prep\s+time|cook\s+time|total\s+time|servings?|yield|course|cuisine):/i, // Meta info
  /^(advertisement|sponsored|affiliate)/i, // Ads
];

/**
 * Clean a single line of text.
 */
function cleanLine(line: string): string {
  return line
    .replace(/^\s*[-•*]\s*/, "") // Remove bullets
    .replace(/^\s*\d+[.)]\s*/, "") // Remove numbered prefixes
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
}

/**
 * Check if a line matches any pattern in a list.
 */
function matchesAny(line: string, patterns: RegExp[]): boolean {
  const trimmed = line.trim();
  return patterns.some((p) => p.test(trimmed));
}

/**
 * Check if a line is a section heading.
 */
function isIngredientHeading(line: string): boolean {
  return matchesAny(line, INGREDIENT_HEADINGS);
}

function isInstructionHeading(line: string): boolean {
  return matchesAny(line, INSTRUCTION_HEADINGS);
}

/**
 * Check if a line looks like an ingredient.
 */
function looksLikeIngredient(line: string): boolean {
  return matchesAny(line, INGREDIENT_LINE_PATTERNS);
}

/**
 * Check if a line looks like an instruction.
 */
function looksLikeInstruction(line: string): boolean {
  return matchesAny(line, INSTRUCTION_LINE_PATTERNS);
}

/**
 * Check if a line should be skipped.
 */
function shouldSkip(line: string): boolean {
  return matchesAny(line, SKIP_LINE_PATTERNS);
}

/**
 * Extract title from the first meaningful line.
 */
function extractTitle(lines: string[]): string {
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (shouldSkip(trimmed)) continue;
    if (isIngredientHeading(trimmed)) continue;
    if (isInstructionHeading(trimmed)) continue;
    if (looksLikeIngredient(trimmed)) continue;
    if (looksLikeInstruction(trimmed)) continue;
    // First non-special line is likely the title
    if (trimmed.length > 3 && trimmed.length < 200) {
      return trimmed;
    }
  }
  return "";
}

/**
 * Parse text with explicit section headings.
 */
function parseWithHeadings(lines: string[]): ParsedTextResult | null {
  let ingredientStartIdx = -1;
  let instructionStartIdx = -1;

  // Find section headings
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isIngredientHeading(line) && ingredientStartIdx === -1) {
      ingredientStartIdx = i;
    } else if (isInstructionHeading(line) && instructionStartIdx === -1) {
      instructionStartIdx = i;
    }
  }

  // Need at least one heading to use this method
  if (ingredientStartIdx === -1 && instructionStartIdx === -1) {
    return null;
  }

  const title = extractTitle(
    lines.slice(0, Math.max(ingredientStartIdx, 0) || instructionStartIdx || 5)
  );

  let ingredientLines: string[] = [];
  let instructionLines: string[] = [];

  if (ingredientStartIdx !== -1 && instructionStartIdx !== -1) {
    // Both headings found
    const [first, second] =
      ingredientStartIdx < instructionStartIdx
        ? [ingredientStartIdx, instructionStartIdx]
        : [instructionStartIdx, ingredientStartIdx];

    const firstLines = lines.slice(first + 1, second);
    const secondLines = lines.slice(second + 1);

    if (ingredientStartIdx < instructionStartIdx) {
      ingredientLines = firstLines;
      instructionLines = secondLines;
    } else {
      instructionLines = firstLines;
      ingredientLines = secondLines;
    }
  } else if (ingredientStartIdx !== -1) {
    // Only ingredients heading found
    ingredientLines = lines.slice(ingredientStartIdx + 1);
  } else {
    // Only instructions heading found
    instructionLines = lines.slice(instructionStartIdx + 1);
  }

  // Clean and filter lines
  ingredientLines = ingredientLines
    .map(cleanLine)
    .filter((l) => l && !shouldSkip(l) && !isInstructionHeading(l));

  instructionLines = instructionLines
    .map(cleanLine)
    .filter((l) => l && !shouldSkip(l) && !isIngredientHeading(l));

  return { title, ingredientLines, instructionLines };
}

/**
 * Parse text using heuristics (no explicit headings).
 */
function parseWithHeuristics(lines: string[]): ParsedTextResult {
  const title = extractTitle(lines);
  const ingredientLines: string[] = [];
  const instructionLines: string[] = [];

  let mode: "unknown" | "ingredients" | "instructions" = "unknown";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || shouldSkip(trimmed)) continue;
    if (trimmed === title) continue; // Skip title line

    const cleaned = cleanLine(trimmed);
    if (!cleaned) continue;

    // Determine mode based on line characteristics
    if (looksLikeIngredient(trimmed)) {
      if (mode === "unknown" || mode === "ingredients") {
        mode = "ingredients";
        ingredientLines.push(cleaned);
      } else {
        // Already in instructions mode, might be an inline ingredient mention
        instructionLines.push(cleaned);
      }
    } else if (looksLikeInstruction(trimmed)) {
      mode = "instructions";
      instructionLines.push(cleaned);
    } else {
      // Ambiguous line - add to current mode
      if (mode === "ingredients") {
        ingredientLines.push(cleaned);
      } else if (mode === "instructions") {
        instructionLines.push(cleaned);
      } else {
        // Still unknown - guess based on line characteristics
        // Short lines with quantities are likely ingredients
        if (cleaned.length < 50 && /\d/.test(cleaned)) {
          mode = "ingredients";
          ingredientLines.push(cleaned);
        } else if (cleaned.length > 30) {
          // Longer lines are likely instructions
          mode = "instructions";
          instructionLines.push(cleaned);
        }
      }
    }
  }

  return { title, ingredientLines, instructionLines };
}

/**
 * Main entry point: parse raw recipe text.
 */
export function parseRecipeText(text: string): ParsedTextResult {
  // Split into lines
  const lines = text.split(/\r?\n/);

  // Try parsing with explicit headings first
  const headingResult = parseWithHeadings(lines);
  if (
    headingResult &&
    (headingResult.ingredientLines.length > 0 ||
      headingResult.instructionLines.length > 0)
  ) {
    return headingResult;
  }

  // Fall back to heuristics
  return parseWithHeuristics(lines);
}

/**
 * Validate that we have usable content.
 */
export function validateParsedText(result: ParsedTextResult): {
  valid: boolean;
  error?: string;
} {
  if (
    result.ingredientLines.length === 0 &&
    result.instructionLines.length === 0
  ) {
    return {
      valid: false,
      error:
        'Could not identify ingredients or instructions. Try adding "Ingredients:" and "Instructions:" headings to your text.',
    };
  }

  if (result.ingredientLines.length === 0) {
    return {
      valid: false,
      error:
        'Could not identify ingredients. Try adding an "Ingredients:" heading followed by a list of ingredients.',
    };
  }

  if (result.instructionLines.length === 0) {
    return {
      valid: false,
      error:
        'Could not identify instructions. Try adding an "Instructions:" or "Directions:" heading followed by the steps.',
    };
  }

  return { valid: true };
}
