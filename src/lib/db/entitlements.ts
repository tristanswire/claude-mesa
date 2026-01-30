/**
 * User entitlements and plan gating.
 */

import { createClient } from "@/lib/supabase/server";

export type Plan = "free" | "plus" | "ai";

export interface UserEntitlements {
  userId: string;
  plan: Plan;
  recipeLimit: number | null;
  aiActionsLimit: number | null;
  aiActionsUsed: number;
  createdAt: Date;
  updatedAt: Date;
}

export type EntitlementsResult =
  | { success: true; data: UserEntitlements }
  | { success: false; error: string };

export interface CanCreateRecipeResult {
  allowed: boolean;
  reason?: string;
  code?: "RECIPE_LIMIT_REACHED" | "NOT_AUTHENTICATED" | "ENTITLEMENTS_ERROR";
  currentCount?: number;
  limit?: number | null;
}

/**
 * Get entitlements for the current authenticated user.
 * Note: Entitlement columns are stored in user_preferences table.
 */
export async function getEntitlementsForUser(): Promise<EntitlementsResult> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Query user_preferences which contains entitlement columns
  const { data, error } = await supabase
    .from("user_preferences")
    .select("plan, recipe_limit, ai_actions_limit, ai_actions_used")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching entitlements from user_preferences:", error);
    return { success: false, error: error.message };
  }

  // If no data found, upsert defaults and return them
  if (!data) {
    const { data: upsertedData, error: upsertError } = await supabase
      .from("user_preferences")
      .upsert({
        user_id: user.id,
        plan: "free",
        recipe_limit: 25,
        ai_actions_limit: 0,
        ai_actions_used: 0,
      }, { onConflict: "user_id" })
      .select("plan, recipe_limit, ai_actions_limit, ai_actions_used")
      .single();

    if (upsertError) {
      console.error("Error upserting default entitlements:", upsertError);
      // Still return defaults even if upsert fails
      return {
        success: true,
        data: {
          userId: user.id,
          plan: "free",
          recipeLimit: 25,
          aiActionsLimit: 0,
          aiActionsUsed: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };
    }

    return {
      success: true,
      data: {
        userId: user.id,
        plan: (upsertedData.plan as Plan) || "free",
        recipeLimit: upsertedData.recipe_limit ?? 25,
        aiActionsLimit: upsertedData.ai_actions_limit ?? 0,
        aiActionsUsed: upsertedData.ai_actions_used ?? 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
  }

  return {
    success: true,
    data: {
      userId: user.id,
      plan: (data.plan as Plan) || "free",
      recipeLimit: data.recipe_limit ?? 25,
      aiActionsLimit: data.ai_actions_limit ?? 0,
      aiActionsUsed: data.ai_actions_used ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };
}

/**
 * Get the current recipe count for the authenticated user.
 */
export async function getRecipeCount(): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("recipes")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Error counting recipes:", error);
    return 0;
  }

  return count || 0;
}

/**
 * Check if the current user can create a new recipe.
 * Returns detailed result with reason if not allowed.
 */
export async function canCreateRecipe(): Promise<CanCreateRecipeResult> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      allowed: false,
      reason: "You must be logged in to create recipes",
      code: "NOT_AUTHENTICATED",
    };
  }

  // Get entitlements
  const entitlementsResult = await getEntitlementsForUser();
  if (!entitlementsResult.success) {
    return {
      allowed: false,
      reason: "Unable to verify your plan. Please try again.",
      code: "ENTITLEMENTS_ERROR",
    };
  }

  const { recipeLimit, plan } = entitlementsResult.data;

  // Unlimited plans (null limit) can always create
  if (recipeLimit === null) {
    return { allowed: true };
  }

  // Check current count against limit
  const currentCount = await getRecipeCount();

  if (currentCount >= recipeLimit) {
    return {
      allowed: false,
      reason: `You've reached your ${plan} plan limit of ${recipeLimit} recipes. Upgrade to create more.`,
      code: "RECIPE_LIMIT_REACHED",
      currentCount,
      limit: recipeLimit,
    };
  }

  return {
    allowed: true,
    currentCount,
    limit: recipeLimit,
  };
}

/**
 * Pure function to check if a recipe limit is reached.
 * Used for testing without database access.
 */
export function isRecipeLimitReached(
  currentCount: number,
  limit: number | null
): boolean {
  if (limit === null) return false;
  return currentCount >= limit;
}

/**
 * Get plan display info.
 */
export function getPlanDisplayInfo(plan: Plan): {
  name: string;
  description: string;
} {
  switch (plan) {
    case "free":
      return {
        name: "Free",
        description: "Up to 25 recipes",
      };
    case "plus":
      return {
        name: "Plus",
        description: "Unlimited recipes",
      };
    case "ai":
      return {
        name: "AI",
        description: "Unlimited recipes + AI features",
      };
  }
}
