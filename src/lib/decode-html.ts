/**
 * Decode HTML entities in text.
 * Works in both server and client environments (no DOM dependency).
 * Safe - does not use dangerouslySetInnerHTML.
 */

// Common named HTML entities
const HTML_ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&#x27;": "'",
  "&#x2F;": "/",
  "&mdash;": "—",
  "&ndash;": "–",
  "&hellip;": "...",
  "&deg;": "°",
  "&frac12;": "½",
  "&frac14;": "¼",
  "&frac34;": "¾",
  "&copy;": "©",
  "&reg;": "®",
  "&trade;": "™",
  "&lsquo;": "\u2018",
  "&rsquo;": "\u2019",
  "&ldquo;": "\u201c",
  "&rdquo;": "\u201d",
  "&bull;": "•",
  "&middot;": "·",
  "&times;": "×",
  "&divide;": "÷",
  "&cent;": "¢",
  "&pound;": "£",
  "&euro;": "€",
  "&yen;": "¥",
};

/**
 * Decode HTML entities in a string.
 * Handles named entities, decimal numeric entities, and hex numeric entities.
 * Idempotent - safe to call multiple times.
 *
 * @example
 * decodeHtmlEntities("Mom&#39;s Favorite") // "Mom's Favorite"
 * decodeHtmlEntities("Fish &amp; Chips")   // "Fish & Chips"
 * decodeHtmlEntities("Already clean")      // "Already clean"
 */
export function decodeHtmlEntities(text: string): string {
  if (!text || typeof text !== "string") return text;

  let result = text;

  // Replace named entities (case-insensitive for common ones)
  for (const [entity, char] of Object.entries(HTML_ENTITIES)) {
    result = result.replace(new RegExp(entity, "gi"), char);
  }

  // Handle decimal numeric entities: &#123;
  result = result.replace(/&#(\d+);/g, (_, code) => {
    const num = parseInt(code, 10);
    // Only convert valid Unicode code points
    if (num > 0 && num <= 0x10ffff) {
      return String.fromCodePoint(num);
    }
    return _;
  });

  // Handle hex numeric entities: &#x1F4A9; or &#X1F4A9;
  result = result.replace(/&#x([0-9a-f]+);/gi, (_, code) => {
    const num = parseInt(code, 16);
    // Only convert valid Unicode code points
    if (num > 0 && num <= 0x10ffff) {
      return String.fromCodePoint(num);
    }
    return _;
  });

  // Replace non-breaking spaces (Unicode)
  result = result.replace(/\u00a0/g, " ");

  return result;
}

/**
 * Decode HTML entities in an array of strings.
 */
export function decodeHtmlEntitiesArray(lines: string[]): string[] {
  return lines.map(decodeHtmlEntities);
}
