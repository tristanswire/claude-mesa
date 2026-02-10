/**
 * Instruction simplifier - cleans up imported recipe instructions.
 * Removes blog junk, splits long multi-action steps, and normalizes formatting.
 * Deterministic, no LLM usage.
 */

import { decodeHtmlEntities } from "@/lib/decode-html";

// ============================================================
// JUNK PHRASE PATTERNS (case-insensitive removal)
// ============================================================

const JUNK_PHRASES = [
  // Navigation/UI
  "jump to recipe",
  "skip to recipe",
  "print recipe",
  "print this recipe",
  "save recipe",
  "save this recipe",
  "rate this recipe",
  "rate recipe",
  "see recipe card",
  "see the recipe card",
  "full recipe below",
  "recipe below",
  "scroll down for recipe",
  "read more",
  "continue reading",
  "click here",
  "tap here",

  // Social/engagement
  "subscribe",
  "follow me",
  "follow us",
  "tag me",
  "tag us",
  "mention me",
  "mention us",
  "share this",
  "pin it",
  "pin this",
  "tweet this",
  "leave a comment",
  "leave a review",
  "comment below",
  "let me know",
  "let us know",
  "sign up",
  "join my",
  "join our",
  "my newsletter",
  "our newsletter",

  // Marketing/affiliate
  "affiliate",
  "sponsored",
  "ad ",
  "advertisement",
  "partner link",
  "disclosure",
  "this post contains",

  // Notes/meta
  "see notes",
  "see the notes",
  "check the notes",
  "recipe notes",
  "nutrition info",
  "nutritional information",
  "nutrition facts",
  "as an amazon associate",
];

// Build regex patterns from junk phrases
const JUNK_PHRASE_PATTERNS = JUNK_PHRASES.map(
  (phrase) => new RegExp(`\\b${phrase.replace(/\s+/g, "\\s+")}\\b`, "gi")
);

// Lines that are entirely promotional/irrelevant (drop completely)
const DROP_LINE_PATTERNS = [
  /^\s*(?:enjoy|bon\s+app[eé]tit|happy\s+cooking|that's\s+it)!?\s*$/i,
  /^\s*(?:and\s+)?(?:enjoy|serve|done)!?\s*$/i,
  /^\s*(?:if\s+you\s+(?:like|love|enjoy|make|try)\s+this)/i,
  /^\s*(?:did\s+you\s+(?:make|try)\s+this)/i,
  /^\s*(?:let\s+me\s+know|tell\s+me)\s+(?:in\s+the\s+comments?|how|what|if)/i,
  /^\s*(?:tag\s+(?:me|us)|mention\s+(?:me|us))\s+(?:on|in|at)/i,
  /^\s*(?:follow|subscribe|sign\s+up|join)\b/i,
  /^\s*(?:check\s+out|visit)\s+(?:my|our)\b/i,
  /^\s*(?:print|save|share|pin)\s*$/i,
  /^\s*(?:nutrition|calories|macros|per\s+serving)\s*:?/i,
  /^\s*(?:prep\s+time|cook\s+time|total\s+time|servings?|yield)\s*:/i,
  /^\s*(?:course|cuisine|category|keyword)\s*:/i,
  /^\s*\*+\s*$/,
  /^\s*-+\s*$/,
  /^\s*=+\s*$/,
  /^\s*\.+\s*$/,
  /^\s*#\s*$/,
  /^\s*\d+\s*$/,
  /^\s*(?:step\s*)?\d+\s*$/i,
  // Social media lines
  /\b(?:instagram|facebook|twitter|pinterest|youtube|tiktok)\b.*@/i,
  /^\s*@\w+\s*$/i, // Just a social handle
];

// URL pattern
const URL_PATTERN = /https?:\/\/[^\s<>"')\]]+/gi;

// Emoji pattern (covers most common emoji ranges)
const EMOJI_PATTERN =
  /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu;

// Repeated punctuation (3+ of the same)
const REPEATED_PUNCT_PATTERN = /([!?.,:;])\1{2,}/g;

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Remove URLs from text.
 */
function removeUrls(text: string): string {
  return text.replace(URL_PATTERN, "").trim();
}

/**
 * Remove junk phrases from text.
 */
function removeJunkPhrases(text: string): string {
  let result = text;
  for (const pattern of JUNK_PHRASE_PATTERNS) {
    result = result.replace(pattern, "");
  }
  return result;
}

/**
 * Remove emojis from text.
 */
function removeEmojis(text: string): string {
  return text.replace(EMOJI_PATTERN, "");
}

/**
 * Normalize punctuation (reduce repeated punctuation, fix spacing).
 */
function normalizePunctuation(text: string): string {
  return (
    text
      // Reduce repeated punctuation to max 2
      .replace(REPEATED_PUNCT_PATTERN, "$1$1")
      // Fix double spaces
      .replace(/\s{2,}/g, " ")
      // Fix space before punctuation
      .replace(/\s+([.,;:!?])/g, "$1")
      // Ensure space after punctuation (except at end)
      .replace(/([.,;:!?])([A-Za-z])/g, "$1 $2")
      .trim()
  );
}

/**
 * Check if a line should be dropped entirely.
 */
function shouldDropLine(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (trimmed.length < 3) return true;

  for (const pattern of DROP_LINE_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }

  // Drop lines that are mostly URL (after URL removal, very short)
  const withoutUrls = removeUrls(trimmed);
  if (withoutUrls.length < 5 && trimmed.length > 10) return true;

  return false;
}

/**
 * Find positions of parentheses for protected splitting.
 */
function getParenthesesRanges(text: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  let depth = 0;
  let start = -1;

  for (let i = 0; i < text.length; i++) {
    if (text[i] === "(") {
      if (depth === 0) start = i;
      depth++;
    } else if (text[i] === ")") {
      depth--;
      if (depth === 0 && start !== -1) {
        ranges.push([start, i]);
        start = -1;
      }
    }
  }

  return ranges;
}

/**
 * Check if a position is inside parentheses.
 */
function isInsideParentheses(
  pos: number,
  ranges: Array<[number, number]>
): boolean {
  return ranges.some(([start, end]) => pos > start && pos < end);
}

/**
 * Split a long instruction line into multiple steps.
 * Splits on ". " / "; " / " then " but avoids splitting inside parentheses.
 */
function splitLongLine(text: string, maxLength: number = 180): string[] {
  const parenRanges = getParenthesesRanges(text);

  // Always try split patterns that indicate separate actions
  // These should split regardless of length
  const alwaysSplitPatterns = [
    /;\s+/g, // Semicolon almost always indicates separate actions
    /,\s+then\s+/gi, // ", then" connector
    /,\s+and\s+then\s+/gi, // ", and then" connector
    /\s+then\s+/gi, // "then" connector (indicates new action)
  ];

  // Only try these for long lines
  const lengthBasedPatterns = [
    /\.\s+(?=[A-Z])/g, // Period followed by capital letter (new sentence)
  ];

  // Determine which patterns to use
  const patternsToTry =
    text.length > maxLength
      ? [...alwaysSplitPatterns, ...lengthBasedPatterns]
      : alwaysSplitPatterns;

  for (const pattern of patternsToTry) {
    const parts: string[] = [];
    let lastIndex = 0;
    let match;

    // Reset pattern
    pattern.lastIndex = 0;

    while ((match = pattern.exec(text)) !== null) {
      const splitPos = match.index;

      // Don't split inside parentheses
      if (isInsideParentheses(splitPos, parenRanges)) {
        continue;
      }

      const part = text.slice(lastIndex, splitPos + 1).trim();
      if (part && part.length >= 10) {
        parts.push(part);
      }
      lastIndex = splitPos + match[0].length;
    }

    // Add remaining
    const remaining = text.slice(lastIndex).trim();
    if (remaining && remaining.length >= 10) {
      parts.push(remaining);
    }

    if (parts.length > 1) {
      // Successfully split - clean up and return
      return parts.map((part) => {
        let cleaned = part.trim();
        // Remove trailing comma or semicolon
        cleaned = cleaned.replace(/[,;]\s*$/, "");
        // Capitalize first letter if needed
        if (cleaned.length > 0 && /[a-z]/.test(cleaned[0])) {
          cleaned = cleaned[0].toUpperCase() + cleaned.slice(1);
        }
        // Ensure ends with punctuation
        if (cleaned && !/[.!?]$/.test(cleaned)) {
          cleaned += ".";
        }
        return cleaned;
      });
    }
  }

  // No split found, return original
  return [text];
}

/**
 * Clean a single instruction line.
 */
function cleanLine(text: string): string {
  let result = text;

  // Decode HTML entities
  result = decodeHtmlEntities(result);

  // Remove URLs
  result = removeUrls(result);

  // Remove junk phrases
  result = removeJunkPhrases(result);

  // Remove emojis
  result = removeEmojis(result);

  // Normalize punctuation and whitespace
  result = normalizePunctuation(result);

  return result.trim();
}

// ============================================================
// MAIN EXPORT
// ============================================================

/**
 * Simplify an array of instruction lines.
 * Removes blog junk, splits long lines, deduplicates, and normalizes.
 */
export function simplifyInstructionLines(lines: string[]): string[] {
  const results: string[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    // Skip empty or invalid
    if (!line || typeof line !== "string") continue;

    // Clean the line
    const cleaned = cleanLine(line);

    // Check if should drop
    if (shouldDropLine(cleaned)) continue;

    // Split if needed
    const parts = splitLongLine(cleaned);

    for (const part of parts) {
      // Skip very short parts
      if (part.length < 5) continue;

      // Normalize for dedup check (lowercase, no punctuation)
      const normalized = part.toLowerCase().replace(/[^\w\s]/g, "").trim();

      // Skip duplicates
      if (seen.has(normalized)) continue;
      seen.add(normalized);

      results.push(part);
    }
  }

  return results;
}

// Re-export for compatibility with existing code
export { simplifyInstructionLines as simplifyInstructions };
