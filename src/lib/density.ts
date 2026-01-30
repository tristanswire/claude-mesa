/**
 * Density mappings for converting volume (ml) to weight (g).
 * Used when displaying metric quantities for non-liquid ingredients.
 *
 * Values are approximate grams per ml.
 * Source: Various cooking references and USDA data.
 */

// Density map: ingredient keyword -> grams per ml
const DENSITY_MAP: Record<string, number> = {
  // Flours (loose, not packed)
  flour: 0.53,
  "all-purpose flour": 0.53,
  "bread flour": 0.55,
  "cake flour": 0.45,
  "whole wheat flour": 0.52,
  "almond flour": 0.4,
  "coconut flour": 0.5,

  // Sugars
  sugar: 0.85,
  "granulated sugar": 0.85,
  "white sugar": 0.85,
  "brown sugar": 0.83,
  "powdered sugar": 0.56,
  "confectioners sugar": 0.56,
  "icing sugar": 0.56,

  // Salts and baking
  salt: 1.2,
  "kosher salt": 0.6,
  "sea salt": 1.0,
  "baking powder": 0.9,
  "baking soda": 0.95,
  yeast: 0.7,

  // Dairy (solids)
  butter: 0.91,
  "cream cheese": 1.0,
  "sour cream": 1.0,
  yogurt: 1.03,
  "greek yogurt": 1.1,

  // Grains and starches
  rice: 0.85,
  oats: 0.35,
  "rolled oats": 0.35,
  cornstarch: 0.54,
  "corn starch": 0.54,
  breadcrumbs: 0.45,
  "panko": 0.25,

  // Nuts and seeds
  almonds: 0.65,
  walnuts: 0.5,
  pecans: 0.45,
  peanuts: 0.6,
  "peanut butter": 1.1,
  "almond butter": 1.05,
  "sesame seeds": 0.6,
  "chia seeds": 0.7,
  "flax seeds": 0.55,

  // Cocoa and chocolate
  cocoa: 0.45,
  "cocoa powder": 0.45,
  "chocolate chips": 0.6,

  // Spices (approximate, varies widely)
  cinnamon: 0.56,
  cumin: 0.5,
  paprika: 0.45,
  "chili powder": 0.5,
  oregano: 0.2,
  basil: 0.2,
  thyme: 0.25,
  "garlic powder": 0.65,
  "onion powder": 0.55,
  ginger: 0.5,
  nutmeg: 0.5,
  pepper: 0.5,
  "black pepper": 0.5,

  // Other common ingredients
  "parmesan": 0.9,
  cheese: 0.7,
  "shredded cheese": 0.45,
  coconut: 0.35,
  "shredded coconut": 0.35,
  raisins: 0.7,
  "dried cranberries": 0.55,
};

// Normalize string for lookup
function normalize(str: string): string {
  return str.toLowerCase().trim();
}

/**
 * Get the density (grams per ml) for an ingredient.
 * Returns undefined if no density mapping is found.
 */
export function getDensity(ingredientName: string): number | undefined {
  const normalizedName = normalize(ingredientName);

  // Try exact match first
  if (DENSITY_MAP[normalizedName] !== undefined) {
    return DENSITY_MAP[normalizedName];
  }

  // Try partial match (ingredient name contains keyword)
  for (const [keyword, density] of Object.entries(DENSITY_MAP)) {
    if (normalizedName.includes(keyword)) {
      return density;
    }
  }

  return undefined;
}

/**
 * Convert ml to grams using density.
 * Falls back to 1:1 ratio (1 ml = 1 g) if density unknown.
 */
export function mlToGrams(ml: number, ingredientName: string): number {
  const density = getDensity(ingredientName);
  if (density !== undefined) {
    return ml * density;
  }
  // Fallback: assume 1 ml ≈ 1 g (water density)
  return ml;
}
