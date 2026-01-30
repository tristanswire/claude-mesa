/**
 * Parse ingredient lines into structured Ingredient objects.
 * Best-effort parsing with canonical unit conversion.
 */

import type { Ingredient, IngredientType } from "@/lib/schemas";

// Volume units -> ml
const VOLUME_UNITS: Record<string, number> = {
  // Teaspoons
  tsp: 4.92892,
  teaspoon: 4.92892,
  teaspoons: 4.92892,
  t: 4.92892,
  // Tablespoons
  tbsp: 14.7868,
  tablespoon: 14.7868,
  tablespoons: 14.7868,
  tbs: 14.7868,
  tb: 14.7868,
  T: 14.7868,
  // Cups
  cup: 236.588,
  cups: 236.588,
  c: 236.588,
  // Fluid ounces
  "fl oz": 29.5735,
  "fl. oz": 29.5735,
  "fluid oz": 29.5735,
  "fluid ounce": 29.5735,
  "fluid ounces": 29.5735,
  floz: 29.5735,
  // Pints
  pint: 473.176,
  pints: 473.176,
  pt: 473.176,
  // Quarts
  quart: 946.353,
  quarts: 946.353,
  qt: 946.353,
  // Gallons
  gallon: 3785.41,
  gallons: 3785.41,
  gal: 3785.41,
  // Metric volume
  ml: 1,
  milliliter: 1,
  milliliters: 1,
  millilitre: 1,
  millilitres: 1,
  l: 1000,
  liter: 1000,
  liters: 1000,
  litre: 1000,
  litres: 1000,
};

// Weight units -> g
const WEIGHT_UNITS: Record<string, number> = {
  // Ounces
  oz: 28.3495,
  ounce: 28.3495,
  ounces: 28.3495,
  // Pounds
  lb: 453.592,
  lbs: 453.592,
  pound: 453.592,
  pounds: 453.592,
  "#": 453.592,
  // Metric weight
  g: 1,
  gram: 1,
  grams: 1,
  gramme: 1,
  grammes: 1,
  kg: 1000,
  kilogram: 1000,
  kilograms: 1000,
  kilo: 1000,
  kilos: 1000,
};

// Fraction mappings
const FRACTIONS: Record<string, number> = {
  "½": 0.5,
  "⅓": 0.333,
  "⅔": 0.667,
  "¼": 0.25,
  "¾": 0.75,
  "⅕": 0.2,
  "⅖": 0.4,
  "⅗": 0.6,
  "⅘": 0.8,
  "⅙": 0.167,
  "⅚": 0.833,
  "⅛": 0.125,
  "⅜": 0.375,
  "⅝": 0.625,
  "⅞": 0.875,
};

// Text fractions (e.g., "1/2")
const TEXT_FRACTION_PATTERN = /(\d+)\/(\d+)/;

/**
 * Parse a quantity string, handling fractions.
 */
function parseQuantity(qtyStr: string): number | null {
  if (!qtyStr) return null;

  let result = 0;
  let remaining = qtyStr.trim();

  // Handle unicode fractions
  for (const [frac, value] of Object.entries(FRACTIONS)) {
    if (remaining.includes(frac)) {
      result += value;
      remaining = remaining.replace(frac, "").trim();
    }
  }

  // Handle text fractions like "1/2"
  const fracMatch = remaining.match(TEXT_FRACTION_PATTERN);
  if (fracMatch) {
    const num = parseFloat(fracMatch[1]);
    const denom = parseFloat(fracMatch[2]);
    if (denom !== 0) {
      result += num / denom;
    }
    remaining = remaining.replace(TEXT_FRACTION_PATTERN, "").trim();
  }

  // Handle whole numbers and decimals
  const numMatch = remaining.match(/^[\d.]+/);
  if (numMatch) {
    const num = parseFloat(numMatch[0]);
    if (!isNaN(num)) {
      result += num;
    }
  }

  return result > 0 ? result : null;
}

/**
 * Normalize a unit string for lookup.
 */
function normalizeUnit(unit: string): string {
  return unit.toLowerCase().replace(/[.,]/g, "").trim();
}

/**
 * Determine unit type and canonical conversion.
 */
function getUnitInfo(
  unit: string
): { type: IngredientType; mlOrG: number } | null {
  const normalized = normalizeUnit(unit);

  if (VOLUME_UNITS[normalized]) {
    return { type: "volume", mlOrG: VOLUME_UNITS[normalized] };
  }

  if (WEIGHT_UNITS[normalized]) {
    return { type: "weight", mlOrG: WEIGHT_UNITS[normalized] };
  }

  return null;
}

/**
 * Extract quantity, unit, and name from an ingredient line.
 */
function parseIngredientLine(line: string): {
  quantity: number | null;
  unit: string | null;
  name: string;
  notes: string | undefined;
} {
  let text = line.trim();

  // Try to extract quantity at the start
  // Pattern: optional number/fraction, optional unit, then name
  // Examples: "1 cup flour", "2 eggs", "½ tsp salt", "salt to taste"

  // Match leading quantity (number + optional fraction)
  const qtyPattern = /^([\d\s½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞/.-]+)/;
  const qtyMatch = text.match(qtyPattern);

  let quantity: number | null = null;
  if (qtyMatch) {
    quantity = parseQuantity(qtyMatch[1]);
    if (quantity !== null) {
      text = text.slice(qtyMatch[0].length).trim();
    }
  }

  // Try to match a unit after the quantity
  let unit: string | null = null;

  // Build a pattern from known units (sorted by length, longest first)
  const allUnits = [
    ...Object.keys(VOLUME_UNITS),
    ...Object.keys(WEIGHT_UNITS),
  ].sort((a, b) => b.length - a.length);

  for (const u of allUnits) {
    // Match unit at start of remaining text, followed by space or end
    const unitPattern = new RegExp(`^(${u})(?:\\s|$|\\.)`, "i");
    const unitMatch = text.match(unitPattern);
    if (unitMatch) {
      unit = unitMatch[1];
      text = text.slice(unitMatch[0].length).trim();
      break;
    }
  }

  // The rest is the ingredient name, possibly with notes in parentheses
  let name = text;
  let notes: string | undefined;

  // Extract notes from parentheses or after comma
  const parenMatch = name.match(/\(([^)]+)\)/);
  if (parenMatch) {
    notes = parenMatch[1].trim();
    name = name.replace(/\s*\([^)]+\)\s*/, " ").trim();
  }

  const commaMatch = name.match(/,\s*(.+)$/);
  if (commaMatch && !notes) {
    notes = commaMatch[1].trim();
    name = name.replace(/,\s*.+$/, "").trim();
  }

  // Clean up name
  name = name
    .replace(/^(of\s+)/i, "") // Remove leading "of"
    .replace(/\s+/g, " ")
    .trim();

  return { quantity, unit, name: name || line.trim(), notes };
}

/**
 * Generate a UUID.
 */
function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Convert an ingredient line to a structured Ingredient object.
 */
export function parseIngredient(
  line: string,
  orderIndex: number
): Ingredient | null {
  if (!line || typeof line !== "string") return null;

  const trimmed = line.trim();
  if (!trimmed) return null;

  const { quantity, unit, name, notes } = parseIngredientLine(trimmed);

  // Determine ingredient type and canonical values
  let ingredientType: IngredientType = "count";
  let canonicalQuantity: number | null = null;
  let canonicalUnit: "ml" | "g" | null = null;

  if (unit) {
    const unitInfo = getUnitInfo(unit);
    if (unitInfo && quantity !== null) {
      ingredientType = unitInfo.type;
      canonicalQuantity = quantity * unitInfo.mlOrG;
      canonicalUnit = unitInfo.type === "volume" ? "ml" : "g";
    }
  }

  return {
    id: generateUUID(),
    name,
    notes,
    originalQuantity: quantity,
    originalUnit: unit,
    originalText: trimmed,
    canonicalQuantity,
    canonicalUnit,
    ingredientType,
    orderIndex,
  };
}

/**
 * Parse an array of ingredient lines into Ingredient objects.
 */
export function parseIngredients(lines: string[]): Ingredient[] {
  return lines
    .map((line, index) => parseIngredient(line, index))
    .filter((ing): ing is Ingredient => ing !== null);
}
