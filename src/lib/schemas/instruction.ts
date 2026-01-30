import { z } from "zod";

// Character range for inline placement - identifies where ingredient is mentioned in text
export const CharRangeSchema = z.object({
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
});

export const IngredientRefSchema = z.object({
  ingredientIds: z.array(z.string().uuid()).min(1),
  placement: z.enum(["end", "inline"]),
  // For inline placement: character range of the matched ingredient text
  charRange: CharRangeSchema.optional(),
});

export const InstructionStepSchema = z.object({
  id: z.string().uuid(),
  stepNumber: z.number().int().positive(),
  text: z.string().min(1),
  refs: z.array(IngredientRefSchema),
});

export const InstructionsArraySchema = z.array(InstructionStepSchema);

export type CharRange = z.infer<typeof CharRangeSchema>;
export type IngredientRef = z.infer<typeof IngredientRefSchema>;
export type InstructionStep = z.infer<typeof InstructionStepSchema>;
