import { describe, it, expect } from "vitest";
import {
  IngredientSchema,
  InstructionStepSchema,
  RecipePayloadSchema,
} from "../index";
import {
  parseRecipePayload,
  parseRecipeFromDb,
} from "@/lib/validation/recipes";

describe("IngredientSchema", () => {
  it("accepts valid ingredient with quantity", () => {
    const valid = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      name: "cumin",
      notes: "ground",
      originalQuantity: 1,
      originalUnit: "tsp",
      originalText: "1 tsp cumin, ground",
      canonicalQuantity: 4.93,
      canonicalUnit: "ml",
      ingredientType: "volume",
      orderIndex: 0,
    };
    expect(IngredientSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts ingredient with null quantity (salt to taste)", () => {
    const valid = {
      id: "123e4567-e89b-12d3-a456-426614174001",
      name: "salt",
      originalQuantity: null,
      originalUnit: null,
      originalText: "salt to taste",
      canonicalQuantity: null,
      canonicalUnit: null,
      ingredientType: "count",
      orderIndex: 1,
    };
    expect(IngredientSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts ingredient without notes (optional field)", () => {
    const valid = {
      id: "123e4567-e89b-12d3-a456-426614174002",
      name: "olive oil",
      originalQuantity: 2,
      originalUnit: "tbsp",
      originalText: "2 tbsp olive oil",
      canonicalQuantity: 29.57,
      canonicalUnit: "ml",
      ingredientType: "volume",
      orderIndex: 0,
    };
    expect(IngredientSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects ingredient missing required name", () => {
    const invalid = {
      id: "123e4567-e89b-12d3-a456-426614174003",
      // name missing
      originalQuantity: 1,
      originalUnit: "cup",
      originalText: "1 cup",
      canonicalQuantity: 236.59,
      canonicalUnit: "ml",
      ingredientType: "volume",
      orderIndex: 0,
    };
    expect(IngredientSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects ingredient with empty name", () => {
    const invalid = {
      id: "123e4567-e89b-12d3-a456-426614174004",
      name: "",
      originalQuantity: 1,
      originalUnit: "cup",
      originalText: "1 cup flour",
      canonicalQuantity: 236.59,
      canonicalUnit: "ml",
      ingredientType: "volume",
      orderIndex: 0,
    };
    expect(IngredientSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects invalid ingredientType enum", () => {
    const invalid = {
      id: "123e4567-e89b-12d3-a456-426614174005",
      name: "flour",
      originalQuantity: 2,
      originalUnit: "cups",
      originalText: "2 cups flour",
      canonicalQuantity: 240,
      canonicalUnit: "g",
      ingredientType: "liquid", // invalid enum value
      orderIndex: 0,
    };
    expect(IngredientSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects invalid canonicalUnit enum", () => {
    const invalid = {
      id: "123e4567-e89b-12d3-a456-426614174006",
      name: "flour",
      originalQuantity: 2,
      originalUnit: "cups",
      originalText: "2 cups flour",
      canonicalQuantity: 240,
      canonicalUnit: "oz", // invalid - only ml or g allowed
      ingredientType: "weight",
      orderIndex: 0,
    };
    expect(IngredientSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects invalid UUID format for id", () => {
    const invalid = {
      id: "not-a-uuid",
      name: "sugar",
      originalQuantity: 1,
      originalUnit: "cup",
      originalText: "1 cup sugar",
      canonicalQuantity: 200,
      canonicalUnit: "g",
      ingredientType: "weight",
      orderIndex: 0,
    };
    expect(IngredientSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects negative orderIndex", () => {
    const invalid = {
      id: "123e4567-e89b-12d3-a456-426614174007",
      name: "sugar",
      originalQuantity: 1,
      originalUnit: "cup",
      originalText: "1 cup sugar",
      canonicalQuantity: 200,
      canonicalUnit: "g",
      ingredientType: "weight",
      orderIndex: -1,
    };
    expect(IngredientSchema.safeParse(invalid).success).toBe(false);
  });
});

describe("InstructionStepSchema", () => {
  it("accepts valid step with refs", () => {
    const valid = {
      id: "123e4567-e89b-12d3-a456-426614174010",
      stepNumber: 1,
      text: "Mix the dry ingredients",
      refs: [
        {
          ingredientIds: ["123e4567-e89b-12d3-a456-426614174000"],
          placement: "end",
        },
      ],
    };
    expect(InstructionStepSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts valid step with multiple ingredient refs", () => {
    const valid = {
      id: "123e4567-e89b-12d3-a456-426614174011",
      stepNumber: 1,
      text: "Combine the spices",
      refs: [
        {
          ingredientIds: [
            "123e4567-e89b-12d3-a456-426614174000",
            "123e4567-e89b-12d3-a456-426614174001",
            "123e4567-e89b-12d3-a456-426614174002",
          ],
          placement: "end",
        },
      ],
    };
    expect(InstructionStepSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts step with empty refs array", () => {
    const valid = {
      id: "123e4567-e89b-12d3-a456-426614174012",
      stepNumber: 2,
      text: "Let rest for 10 minutes",
      refs: [],
    };
    expect(InstructionStepSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects invalid placement value", () => {
    const invalid = {
      id: "123e4567-e89b-12d3-a456-426614174013",
      stepNumber: 1,
      text: "Mix ingredients",
      refs: [
        {
          ingredientIds: ["123e4567-e89b-12d3-a456-426614174000"],
          placement: "before", // invalid - only "end" and "inline" are valid
        },
      ],
    };
    expect(InstructionStepSchema.safeParse(invalid).success).toBe(false);
  });

  it("accepts inline placement with charRange", () => {
    const valid = {
      id: "123e4567-e89b-12d3-a456-426614174020",
      stepNumber: 1,
      text: "Add the flour",
      refs: [
        {
          ingredientIds: ["123e4567-e89b-12d3-a456-426614174000"],
          placement: "inline",
          charRange: { start: 8, end: 13 },
        },
      ],
    };
    expect(InstructionStepSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects refs with empty ingredientIds array", () => {
    const invalid = {
      id: "123e4567-e89b-12d3-a456-426614174014",
      stepNumber: 1,
      text: "Mix ingredients",
      refs: [{ ingredientIds: [], placement: "end" }],
    };
    expect(InstructionStepSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects step with zero stepNumber", () => {
    const invalid = {
      id: "123e4567-e89b-12d3-a456-426614174015",
      stepNumber: 0,
      text: "Mix ingredients",
      refs: [],
    };
    expect(InstructionStepSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects step with negative stepNumber", () => {
    const invalid = {
      id: "123e4567-e89b-12d3-a456-426614174016",
      stepNumber: -1,
      text: "Mix ingredients",
      refs: [],
    };
    expect(InstructionStepSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects step with empty text", () => {
    const invalid = {
      id: "123e4567-e89b-12d3-a456-426614174017",
      stepNumber: 1,
      text: "",
      refs: [],
    };
    expect(InstructionStepSchema.safeParse(invalid).success).toBe(false);
  });
});

describe("RecipePayloadSchema", () => {
  const validIngredient = {
    id: "123e4567-e89b-12d3-a456-426614174100",
    name: "ground beef",
    originalQuantity: 1,
    originalUnit: "lb",
    originalText: "1 lb ground beef",
    canonicalQuantity: 453.59,
    canonicalUnit: "g" as const,
    ingredientType: "weight" as const,
    orderIndex: 0,
  };

  const validInstruction = {
    id: "123e4567-e89b-12d3-a456-426614174200",
    stepNumber: 1,
    text: "Brown the meat",
    refs: [
      {
        ingredientIds: ["123e4567-e89b-12d3-a456-426614174100"],
        placement: "end" as const,
      },
    ],
  };

  it("accepts full valid recipe payload", () => {
    const valid = {
      title: "Chili",
      description: "A hearty chili recipe",
      servings: 4,
      prepTimeMinutes: 15,
      cookTimeMinutes: 45,
      ingredients: [validIngredient],
      instructions: [validInstruction],
    };
    expect(RecipePayloadSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts minimal valid recipe payload", () => {
    const valid = {
      title: "Simple Recipe",
      ingredients: [],
      instructions: [],
    };
    expect(RecipePayloadSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts recipe with sourceUrl", () => {
    const valid = {
      title: "Imported Recipe",
      sourceUrl: "https://example.com/recipe",
      ingredients: [],
      instructions: [],
    };
    expect(RecipePayloadSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects recipe with empty title", () => {
    const invalid = {
      title: "",
      ingredients: [],
      instructions: [],
    };
    expect(RecipePayloadSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects recipe with title too long", () => {
    const invalid = {
      title: "a".repeat(201),
      ingredients: [],
      instructions: [],
    };
    expect(RecipePayloadSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects recipe with invalid sourceUrl", () => {
    const invalid = {
      title: "Recipe",
      sourceUrl: "not-a-url",
      ingredients: [],
      instructions: [],
    };
    expect(RecipePayloadSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects recipe with negative servings", () => {
    const invalid = {
      title: "Recipe",
      servings: -1,
      ingredients: [],
      instructions: [],
    };
    expect(RecipePayloadSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects recipe with zero servings", () => {
    const invalid = {
      title: "Recipe",
      servings: 0,
      ingredients: [],
      instructions: [],
    };
    expect(RecipePayloadSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects recipe with negative prepTimeMinutes", () => {
    const invalid = {
      title: "Recipe",
      prepTimeMinutes: -10,
      ingredients: [],
      instructions: [],
    };
    expect(RecipePayloadSchema.safeParse(invalid).success).toBe(false);
  });
});

describe("parseRecipePayload", () => {
  it("returns success with valid data", () => {
    const input = {
      title: "Test Recipe",
      ingredients: [],
      instructions: [],
    };
    const result = parseRecipePayload(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Test Recipe");
    }
  });

  it("returns error with invalid data", () => {
    const input = {
      title: "",
      ingredients: [],
      instructions: [],
    };
    const result = parseRecipePayload(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Invalid recipe payload");
      expect(result.details).toBeDefined();
    }
  });
});

describe("parseRecipeFromDb", () => {
  it("transforms snake_case to camelCase and validates", () => {
    const dbRow = {
      id: "123e4567-e89b-12d3-a456-426614174300",
      user_id: "123e4567-e89b-12d3-a456-426614174400",
      title: "DB Recipe",
      description: null,
      servings: 4,
      prep_time_minutes: 10,
      cook_time_minutes: 30,
      source_url: null,
      ingredients: [],
      instructions: [],
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };
    const result = parseRecipeFromDb(dbRow);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.userId).toBe("123e4567-e89b-12d3-a456-426614174400");
      expect(result.data.prepTimeMinutes).toBe(10);
      expect(result.data.cookTimeMinutes).toBe(30);
    }
  });

  it("returns error for invalid DB data", () => {
    const dbRow = {
      id: "not-a-uuid",
      user_id: "123e4567-e89b-12d3-a456-426614174400",
      title: "Bad Recipe",
      ingredients: [],
      instructions: [],
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };
    const result = parseRecipeFromDb(dbRow);
    expect(result.success).toBe(false);
  });
});
