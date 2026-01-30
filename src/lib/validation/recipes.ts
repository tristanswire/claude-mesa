import {
  RecipePayloadSchema,
  RecipeSchema,
  type RecipePayload,
  type Recipe,
} from "@/lib/schemas";

export type ValidationError = {
  success: false;
  error: string;
  details: Record<string, string[]>;
};

export type ValidationSuccess<T> = {
  success: true;
  data: T;
};

export type ValidationResult<T> = ValidationSuccess<T> | ValidationError;

/**
 * Parse and validate a recipe payload (for create/update operations).
 * Returns either the validated data or a structured error.
 */
export function parseRecipePayload(
  input: unknown
): ValidationResult<RecipePayload> {
  const result = RecipePayloadSchema.safeParse(input);

  if (!result.success) {
    const flattened = result.error.flatten();
    return {
      success: false,
      error: "Invalid recipe payload",
      details: {
        ...flattened.fieldErrors,
        _form: flattened.formErrors,
      },
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

/**
 * Parse and validate a recipe from DB (including JSONB fields).
 * Transforms DB row format (snake_case) to app format (camelCase).
 * Returns either the validated data or a structured error.
 */
export function parseRecipeFromDb(row: unknown): ValidationResult<Recipe> {
  // Transform snake_case DB columns to camelCase
  const transformed = transformDbRow(row);
  const result = RecipeSchema.safeParse(transformed);

  if (!result.success) {
    const flattened = result.error.flatten();
    return {
      success: false,
      error: "Invalid recipe data in database",
      details: {
        ...flattened.fieldErrors,
        _form: flattened.formErrors,
      },
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

/**
 * Transform a DB row from snake_case to camelCase.
 * Converts null to undefined for optional fields (Zod optional() doesn't accept null).
 */
function transformDbRow(row: unknown): unknown {
  if (row === null || row === undefined) {
    return row;
  }

  if (typeof row !== "object") {
    return row;
  }

  const dbRow = row as Record<string, unknown>;

  // Convert null to undefined for optional fields
  const nullToUndefined = (val: unknown) => (val === null ? undefined : val);

  return {
    id: dbRow.id,
    userId: dbRow.user_id,
    title: dbRow.title,
    description: nullToUndefined(dbRow.description),
    servings: nullToUndefined(dbRow.servings),
    prepTimeMinutes: nullToUndefined(dbRow.prep_time_minutes),
    cookTimeMinutes: nullToUndefined(dbRow.cook_time_minutes),
    sourceUrl: nullToUndefined(dbRow.source_url),
    imagePath: nullToUndefined(dbRow.image_path),
    imageUrl: nullToUndefined(dbRow.image_url),
    ingredients: dbRow.ingredients,
    instructions: dbRow.instructions,
    createdAt: dbRow.created_at,
    updatedAt: dbRow.updated_at,
  };
}

/**
 * Throws an error if validation fails. Use when you want exceptions.
 */
export function parseRecipePayloadOrThrow(input: unknown): RecipePayload {
  const result = parseRecipePayload(input);
  if (!result.success) {
    throw new Error(`${result.error}: ${JSON.stringify(result.details)}`);
  }
  return result.data;
}

/**
 * Throws an error if validation fails. Use when you want exceptions.
 */
export function parseRecipeFromDbOrThrow(row: unknown): Recipe {
  const result = parseRecipeFromDb(row);
  if (!result.success) {
    throw new Error(`${result.error}: ${JSON.stringify(result.details)}`);
  }
  return result.data;
}
