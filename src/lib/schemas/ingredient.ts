import { z } from "zod";

export const IngredientTypeSchema = z.enum(["volume", "weight", "count"]);

export const IngredientSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  notes: z.string().optional(),

  // Original (as entered) - nullable for items like "salt to taste"
  originalQuantity: z.number().nullable(),
  originalUnit: z.string().nullable(),
  originalText: z.string().min(1),

  // Canonical (normalized for conversion)
  canonicalQuantity: z.number().nullable(),
  canonicalUnit: z.enum(["ml", "g"]).nullable(),
  ingredientType: IngredientTypeSchema,

  orderIndex: z.number().int().nonnegative(),
});

export const IngredientsArraySchema = z.array(IngredientSchema);

export type Ingredient = z.infer<typeof IngredientSchema>;
export type IngredientType = z.infer<typeof IngredientTypeSchema>;
