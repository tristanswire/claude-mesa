import { z } from "zod";

export const IngredientRefSchema = z.object({
  ingredientIds: z.array(z.string().uuid()).min(1),
  placement: z.literal("end"), // MVP: always 'end'
});

export const InstructionStepSchema = z.object({
  id: z.string().uuid(),
  stepNumber: z.number().int().positive(),
  text: z.string().min(1),
  refs: z.array(IngredientRefSchema),
});

export const InstructionsArraySchema = z.array(InstructionStepSchema);

export type IngredientRef = z.infer<typeof IngredientRefSchema>;
export type InstructionStep = z.infer<typeof InstructionStepSchema>;
