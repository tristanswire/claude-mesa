/**
 * Extract and parse Recipe JSON-LD from HTML.
 */

export interface RawRecipeData {
  title: string;
  description?: string;
  ingredientLines: string[];
  instructionLines: string[];
  sourceUrl: string;
  servings?: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  imageUrl?: string;
}

export interface ParseResult {
  success: true;
  data: RawRecipeData;
}

export interface ParseError {
  success: false;
  error: string;
}

export type ParseResponse = ParseResult | ParseError;

/**
 * Parse ISO 8601 duration (e.g., "PT30M", "PT1H30M") to minutes.
 */
function parseDuration(duration: string | undefined): number | undefined {
  if (!duration || typeof duration !== "string") return undefined;

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/i);
  if (!match) return undefined;

  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);

  return hours * 60 + minutes || undefined;
}

/**
 * Extract instruction text from various JSON-LD instruction formats.
 */
function extractInstructions(recipeInstructions: unknown): string[] {
  if (!recipeInstructions) return [];

  // Handle string (single instruction or newline-separated)
  if (typeof recipeInstructions === "string") {
    return recipeInstructions
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  // Handle array
  if (Array.isArray(recipeInstructions)) {
    const lines: string[] = [];

    for (const item of recipeInstructions) {
      if (typeof item === "string") {
        lines.push(item.trim());
      } else if (item && typeof item === "object") {
        // HowToStep or HowToSection
        const obj = item as Record<string, unknown>;

        if (obj.text && typeof obj.text === "string") {
          lines.push(obj.text.trim());
        } else if (obj.itemListElement && Array.isArray(obj.itemListElement)) {
          // HowToSection with nested steps
          for (const subItem of obj.itemListElement) {
            if (typeof subItem === "string") {
              lines.push(subItem.trim());
            } else if (
              subItem &&
              typeof subItem === "object" &&
              (subItem as Record<string, unknown>).text
            ) {
              lines.push(
                String((subItem as Record<string, unknown>).text).trim()
              );
            }
          }
        }
      }
    }

    return lines.filter(Boolean);
  }

  return [];
}

/**
 * Extract recipe image URL from JSON-LD.
 */
function extractImageUrl(image: unknown): string | undefined {
  if (!image) return undefined;

  // Handle string (direct URL)
  if (typeof image === "string") {
    return image.trim();
  }

  // Handle array (first image)
  if (Array.isArray(image)) {
    for (const item of image) {
      const url = extractImageUrl(item);
      if (url) return url;
    }
    return undefined;
  }

  // Handle ImageObject
  if (typeof image === "object") {
    const obj = image as Record<string, unknown>;
    if (obj.url && typeof obj.url === "string") {
      return obj.url.trim();
    }
    if (obj.contentUrl && typeof obj.contentUrl === "string") {
      return obj.contentUrl.trim();
    }
  }

  return undefined;
}

/**
 * Extract ingredient lines from JSON-LD.
 */
function extractIngredients(recipeIngredient: unknown): string[] {
  if (!recipeIngredient) return [];

  if (typeof recipeIngredient === "string") {
    return recipeIngredient
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (Array.isArray(recipeIngredient)) {
    return recipeIngredient
      .filter((item) => typeof item === "string")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return [];
}

/**
 * Check if an object is a Recipe type.
 */
function isRecipeType(obj: Record<string, unknown>): boolean {
  const type = obj["@type"];
  if (typeof type === "string") {
    return type === "Recipe" || type.endsWith("/Recipe");
  }
  if (Array.isArray(type)) {
    return type.some(
      (t) => typeof t === "string" && (t === "Recipe" || t.endsWith("/Recipe"))
    );
  }
  return false;
}

/**
 * Recursively search for Recipe objects in JSON-LD data.
 */
function findRecipeObject(
  data: unknown
): Record<string, unknown> | null {
  if (!data || typeof data !== "object") return null;

  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findRecipeObject(item);
      if (found) return found;
    }
    return null;
  }

  const obj = data as Record<string, unknown>;

  // Check if this is a Recipe
  if (isRecipeType(obj)) {
    return obj;
  }

  // Check @graph for Recipe
  if (obj["@graph"] && Array.isArray(obj["@graph"])) {
    for (const item of obj["@graph"]) {
      const found = findRecipeObject(item);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Extract all JSON-LD script blocks from HTML and find Recipe data.
 */
export function parseJsonLd(html: string, sourceUrl: string): ParseResponse {
  // Match all JSON-LD script tags
  const scriptRegex =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const matches: string[] = [];

  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    matches.push(match[1]);
  }

  if (matches.length === 0) {
    return {
      success: false,
      error: "No JSON-LD data found on this page",
    };
  }

  // Try to find a Recipe in any of the JSON-LD blocks
  for (const jsonStr of matches) {
    try {
      // Clean up common issues in JSON-LD
      const cleanedJson = jsonStr
        .replace(/[\x00-\x1F\x7F]/g, " ") // Remove control characters
        .trim();

      const data = JSON.parse(cleanedJson);
      const recipe = findRecipeObject(data);

      if (recipe) {
        const title = recipe.name;
        if (typeof title !== "string" || !title.trim()) {
          continue; // Skip recipes without titles
        }

        const ingredientLines = extractIngredients(recipe.recipeIngredient);
        const instructionLines = extractInstructions(recipe.recipeInstructions);

        if (ingredientLines.length === 0 && instructionLines.length === 0) {
          continue; // Skip recipes with no content
        }

        // Parse yield/servings
        let servings: number | undefined;
        if (typeof recipe.recipeYield === "number") {
          servings = recipe.recipeYield;
        } else if (typeof recipe.recipeYield === "string") {
          const yieldMatch = recipe.recipeYield.match(/(\d+)/);
          if (yieldMatch) {
            servings = parseInt(yieldMatch[1], 10);
          }
        } else if (Array.isArray(recipe.recipeYield) && recipe.recipeYield[0]) {
          const first = recipe.recipeYield[0];
          if (typeof first === "number") {
            servings = first;
          } else if (typeof first === "string") {
            const yieldMatch = first.match(/(\d+)/);
            if (yieldMatch) {
              servings = parseInt(yieldMatch[1], 10);
            }
          }
        }

        return {
          success: true,
          data: {
            title: title.trim(),
            description:
              typeof recipe.description === "string"
                ? recipe.description.trim()
                : undefined,
            ingredientLines,
            instructionLines,
            sourceUrl,
            servings,
            prepTimeMinutes: parseDuration(recipe.prepTime as string),
            cookTimeMinutes: parseDuration(recipe.cookTime as string),
            imageUrl: extractImageUrl(recipe.image),
          },
        };
      }
    } catch {
      // Invalid JSON, try next block
      continue;
    }
  }

  return {
    success: false,
    error: "No valid Recipe found in JSON-LD data",
  };
}
