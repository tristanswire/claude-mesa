/**
 * Normalize instruction lines into InstructionStep objects.
 */

import type { InstructionStep } from "@/lib/schemas";
import { simplifyInstructionLines } from "./simplifier";

/**
 * Generate a UUID.
 */
function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Clean up a single instruction step text.
 */
function cleanStepText(text: string): string {
  return text
    .replace(/^Step\s*\d+[:.)\s]*/i, "") // Remove "Step 1:", "Step 2.", etc.
    .replace(/^\d+[:.)\s]+/, "") // Remove leading numbers like "1.", "2)", etc.
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
}

/**
 * Convert instruction lines to InstructionStep objects.
 */
export function normalizeInstructions(lines: string[]): InstructionStep[] {
  // First, simplify to remove fluff and split long steps
  const simplified = simplifyInstructionLines(lines);

  // Then convert to InstructionStep objects
  const steps = simplified
    .map((line, index): InstructionStep | null => {
      const text = cleanStepText(line);

      // Skip empty or very short steps
      if (!text || text.length < 3) return null;

      return {
        id: generateUUID(),
        stepNumber: index + 1,
        text,
        refs: [], // No automatic linking in MVP
      };
    })
    .filter((step): step is InstructionStep => step !== null);

  // Re-number after filtering
  return steps.map((step, index): InstructionStep => ({
    id: step.id,
    stepNumber: index + 1,
    text: step.text,
    refs: step.refs,
  }));
}
