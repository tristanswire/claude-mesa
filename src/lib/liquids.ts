/**
 * Liquid classification for ingredient display.
 * Used to determine whether to show ml or g in metric mode.
 */

// Keywords that indicate an ingredient is a liquid
const LIQUID_KEYWORDS = [
  // Water and broths
  "water",
  "broth",
  "stock",
  "bouillon",
  // Dairy liquids
  "milk",
  "cream",
  "half-and-half",
  "half and half",
  "buttermilk",
  "evaporated milk",
  "condensed milk",
  // Oils
  "oil",
  "olive oil",
  "vegetable oil",
  "canola oil",
  "coconut oil",
  "sesame oil",
  // Vinegars
  "vinegar",
  "balsamic",
  "rice vinegar",
  "wine vinegar",
  "apple cider vinegar",
  // Sauces and condiments (liquid)
  "soy sauce",
  "fish sauce",
  "worcestershire",
  "hot sauce",
  "sriracha",
  "tabasco",
  "teriyaki",
  "oyster sauce",
  "hoisin",
  // Juices
  "juice",
  "lemon juice",
  "lime juice",
  "orange juice",
  // Wines and alcohol
  "wine",
  "sherry",
  "sake",
  "mirin",
  "beer",
  "rum",
  "vodka",
  "whiskey",
  "bourbon",
  "brandy",
  // Other liquids
  "maple syrup",
  "honey",
  "molasses",
  "corn syrup",
  "agave",
  "extract",
  "vanilla extract",
  "almond extract",
  "coffee",
  "espresso",
  "tea",
];

// Normalize string for comparison
function normalize(str: string): string {
  return str.toLowerCase().trim();
}

/**
 * Determine if an ingredient name represents a liquid.
 * Used to decide whether to display ml (liquid) or g (solid) in metric mode.
 */
export function isLikelyLiquid(name: string): boolean {
  const normalizedName = normalize(name);

  // Check if any liquid keyword is contained in the name
  for (const keyword of LIQUID_KEYWORDS) {
    if (normalizedName.includes(keyword)) {
      return true;
    }
  }

  return false;
}
