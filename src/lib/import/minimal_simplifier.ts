/**
 * Minimal simplifier to remove obvious fluff from instruction text.
 * Conservative approach - only removes clearly promotional content.
 */

// Patterns for promotional/irrelevant content
const PROMO_PATTERNS = [
  /\bclick\s+here\b/gi,
  /\bsubscribe\b/gi,
  /\bfollow\s+(?:me|us)\b/gi,
  /\bsee\s+(?:the\s+)?notes?\s+(?:below|above)?\b/gi,
  /\bcheck\s+out\s+(?:my|our)\b/gi,
  /\bsign\s+up\b/gi,
  /\bjoin\s+(?:my|our)\b/gi,
  /\bshare\s+this\b/gi,
  /\bpin\s+(?:it|this)\b/gi,
  /\bcomment\s+below\b/gi,
  /\bleave\s+a\s+(?:comment|review)\b/gi,
  /\brate\s+this\s+recipe\b/gi,
  /\bdon't\s+forget\s+to\b/gi,
  /\bmake\s+sure\s+to\s+(?:follow|subscribe)\b/gi,
  /\baffiliate\s+link/gi,
  /\bsponsored\b/gi,
  /\b(?:my|our)\s+newsletter\b/gi,
  /\b(?:my|our)\s+(?:instagram|facebook|twitter|pinterest|youtube|tiktok)\b/gi,
];

// URL pattern
const URL_PATTERN = /https?:\/\/[^\s<>"']+/gi;

// Pattern for pure promotional lines (entire line is promo)
const PURE_PROMO_PATTERNS = [
  /^\s*(?:enjoy|bon\s+app[eé]tit|happy\s+cooking)!?\s*$/i,
  /^\s*(?:if\s+you\s+(?:like|love|enjoy)\s+this|did\s+you\s+(?:make|try)\s+this)/i,
  /^\s*let\s+me\s+know\s+(?:in\s+the\s+comments?|how\s+it\s+(?:goes|turns?\s+out))/i,
  /^\s*(?:tag\s+(?:me|us)|mention\s+(?:me|us))/i,
  /^\s*(?:follow|subscribe|sign\s+up|join)/i,
  /^\s*\*+\s*$/,  // Just asterisks
  /^\s*-+\s*$/,   // Just dashes
];

/**
 * Remove URLs from text.
 */
function removeUrls(text: string): string {
  return text.replace(URL_PATTERN, "").trim();
}

/**
 * Remove promotional phrases from text.
 */
function removePromoPatterns(text: string): string {
  let result = text;
  for (const pattern of PROMO_PATTERNS) {
    result = result.replace(pattern, "");
  }
  // Clean up extra whitespace
  return result.replace(/\s{2,}/g, " ").trim();
}

/**
 * Check if a line is purely promotional (should be dropped entirely).
 */
function isPurePromoLine(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;

  for (const pattern of PURE_PROMO_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }

  return false;
}

/**
 * Clean HTML entities and special characters.
 */
function cleanHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\u00a0/g, " "); // Non-breaking space
}

/**
 * Simplify a single instruction line.
 * Returns null if the line should be dropped.
 */
export function simplifyInstructionLine(text: string): string | null {
  if (!text || typeof text !== "string") return null;

  // Clean HTML entities
  let result = cleanHtmlEntities(text);

  // Remove URLs
  result = removeUrls(result);

  // Check if this is a pure promo line (after URL removal)
  if (isPurePromoLine(result)) return null;

  // Remove promotional phrases
  result = removePromoPatterns(result);

  // Final cleanup
  result = result.trim();

  // Skip if too short after cleanup (likely was mostly promo)
  if (result.length < 5) return null;

  return result;
}

/**
 * Simplify an array of instruction lines.
 */
export function simplifyInstructions(lines: string[]): string[] {
  return lines
    .map(simplifyInstructionLine)
    .filter((line): line is string => line !== null);
}
