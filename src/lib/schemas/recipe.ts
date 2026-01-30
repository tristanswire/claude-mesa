import { z } from "zod";
import { IngredientsArraySchema } from "./ingredient";
import { InstructionsArraySchema } from "./instruction";

// For create/update API payloads
export const RecipePayloadSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  servings: z.number().int().positive().optional(),
  prepTimeMinutes: z.number().int().nonnegative().optional(),
  cookTimeMinutes: z.number().int().nonnegative().optional(),
  sourceUrl: z.string().url().optional(),
  imagePath: z.string().optional(),
  imageUrl: z.string().url().optional(),
  ingredients: IngredientsArraySchema,
  instructions: InstructionsArraySchema,
});

// Full recipe (from DB, includes id, userId, timestamps)
export const RecipeSchema = RecipePayloadSchema.extend({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type RecipePayload = z.infer<typeof RecipePayloadSchema>;
export type Recipe = z.infer<typeof RecipeSchema>;
