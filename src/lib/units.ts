import type { Ingredient } from "@/lib/schemas";
import { isLikelyLiquid } from "@/lib/liquids";
import { mlToGrams } from "@/lib/density";

export type UnitSystem = "original" | "metric" | "imperial";

// Volume conversion constants (ml base)
const ML_PER_TSP = 4.92892;
const ML_PER_TBSP = 14.7868;
const ML_PER_CUP = 236.588;
const ML_PER_LITER = 1000;

// Weight conversion constants (g base)
const G_PER_OZ = 28.3495;
const G_PER_LB = 453.592;
const G_PER_KG = 1000;

interface ConversionResult {
  qty: number;
  unit: string;
}

/**
 * Round a number to a reasonable precision for display (imperial/original).
 * Uses fractions for common cooking amounts.
 */
function roundForDisplay(value: number): string {
  if (value === 0) return "0";

  // Handle very small values
  if (value < 0.1) return value.toPrecision(2);

  // Common fractions
  const fractions: [number, string][] = [
    [0.125, "1/8"],
    [0.25, "1/4"],
    [0.333, "1/3"],
    [0.375, "3/8"],
    [0.5, "1/2"],
    [0.625, "5/8"],
    [0.666, "2/3"],
    [0.75, "3/4"],
    [0.875, "7/8"],
  ];

  const whole = Math.floor(value);
  const frac = value - whole;

  // Check if fractional part is close to a common fraction
  for (const [fracValue, fracStr] of fractions) {
    if (Math.abs(frac - fracValue) < 0.05) {
      if (whole === 0) return fracStr;
      return `${whole} ${fracStr}`;
    }
  }

  // Round to 1 decimal place for non-fraction values
  const rounded = Math.round(value * 10) / 10;
  if (rounded === Math.floor(rounded)) {
    return String(Math.floor(rounded));
  }
  return rounded.toFixed(1);
}

/**
 * Round to whole number for metric display.
 */
function roundMetric(value: number): number {
  return Math.round(value);
}

/**
 * Convert ml to the best imperial volume unit (tsp, tbsp, cup).
 */
export function convertVolumeMlToBestImperial(ml: number): ConversionResult {
  // Choose the unit that gives the most readable number
  const cups = ml / ML_PER_CUP;
  const tbsp = ml / ML_PER_TBSP;
  const tsp = ml / ML_PER_TSP;

  // Prefer cups for larger amounts
  if (cups >= 0.25) {
    return { qty: cups, unit: cups === 1 ? "cup" : "cups" };
  }

  // Prefer tbsp for medium amounts
  if (tbsp >= 1) {
    return { qty: tbsp, unit: "tbsp" };
  }

  // Use tsp for small amounts
  return { qty: tsp, unit: "tsp" };
}

/**
 * Convert grams to the best imperial weight unit (oz, lb).
 */
export function convertWeightGToBestImperial(g: number): ConversionResult {
  const lb = g / G_PER_LB;
  const oz = g / G_PER_OZ;

  // Prefer lb for larger amounts (>= 0.5 lb)
  if (lb >= 0.5) {
    return { qty: lb, unit: lb === 1 ? "lb" : "lbs" };
  }

  // Use oz for smaller amounts
  return { qty: oz, unit: "oz" };
}

/**
 * Format a metric quantity with appropriate unit.
 * - For liquids: use ml (or L for large amounts)
 * - For non-liquids: convert to grams using density
 * - Always outputs whole numbers
 */
function formatMetricQuantity(
  canonicalQty: number,
  canonicalUnit: "ml" | "g" | null,
  ingredientName: string
): string {
  // If already in grams, just display
  if (canonicalUnit === "g") {
    const qty = roundMetric(canonicalQty);
    if (qty >= G_PER_KG) {
      const kg = roundMetric(canonicalQty / G_PER_KG);
      return `${kg} kg`;
    }
    return `${qty} g`;
  }

  // If in ml, decide whether to show ml or convert to grams
  if (canonicalUnit === "ml") {
    if (isLikelyLiquid(ingredientName)) {
      // Show as ml (or L for large amounts)
      if (canonicalQty >= ML_PER_LITER) {
        const liters = roundMetric(canonicalQty / ML_PER_LITER);
        return `${liters} L`;
      }
      const ml = roundMetric(canonicalQty);
      return `${ml} ml`;
    } else {
      // Convert to grams for non-liquids
      const grams = mlToGrams(canonicalQty, ingredientName);
      const qty = roundMetric(grams);
      if (qty >= G_PER_KG) {
        const kg = roundMetric(grams / G_PER_KG);
        return `${kg} kg`;
      }
      return `${qty} g`;
    }
  }

  // Fallback for null or unknown unit
  return `${roundMetric(canonicalQty)}`;
}

/**
 * Format an ingredient for display based on the unit system.
 */
export function formatIngredient(
  ingredient: Ingredient,
  unitSystem: UnitSystem
): string {
  const { name, notes } = ingredient;
  const notesStr = notes ? `, ${notes}` : "";

  // Original: use originalText if available
  if (unitSystem === "original") {
    if (ingredient.originalText) {
      return ingredient.originalText;
    }
    // Fallback to constructing from parts
    if (ingredient.originalQuantity !== null) {
      const unit = ingredient.originalUnit || "";
      return `${ingredient.originalQuantity} ${unit} ${name}${notesStr}`.trim();
    }
    return `${name}${notesStr}`;
  }

  // Handle null quantities (e.g., "salt to taste")
  if (
    ingredient.canonicalQuantity === null ||
    ingredient.ingredientType === "count"
  ) {
    // For count items or null quantities, use original if available
    if (ingredient.originalQuantity !== null) {
      return `${ingredient.originalQuantity} ${name}${notesStr}`;
    }
    if (ingredient.originalText) {
      return ingredient.originalText;
    }
    return `${name}${notesStr}`;
  }

  const qty = ingredient.canonicalQuantity;

  // Metric: use grams by default, ml for liquids only, whole numbers
  if (unitSystem === "metric") {
    const formatted = formatMetricQuantity(qty, ingredient.canonicalUnit, name);
    return `${formatted} ${name}${notesStr}`;
  }

  // Imperial: convert from canonical metric to imperial
  if (unitSystem === "imperial") {
    if (ingredient.ingredientType === "volume") {
      const { qty: impQty, unit } = convertVolumeMlToBestImperial(qty);
      return `${roundForDisplay(impQty)} ${unit} ${name}${notesStr}`;
    }
    if (ingredient.ingredientType === "weight") {
      const { qty: impQty, unit } = convertWeightGToBestImperial(qty);
      return `${roundForDisplay(impQty)} ${unit} ${name}${notesStr}`;
    }
    return `${roundForDisplay(qty)} ${name}${notesStr}`;
  }

  // Fallback
  return ingredient.originalText || `${name}${notesStr}`;
}
