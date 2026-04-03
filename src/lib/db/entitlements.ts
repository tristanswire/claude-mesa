/**
 * User entitlements and plan gating.
 */

import { createClient, createAdminClient } from "@/lib/supabase/server";

export type Plan = "free" | "plus" | "ai";

export type PlanStatus = "active" | "trialing" | "past_due" | "canceled" | "inactive";

export type PlanInterval = "month" | "year";

export interface UserEntitlements {
  userId: string;
  plan: Plan;
  planInterval: PlanInterval | null;
  planStatus: PlanStatus | null;
  recipeLimit: number | null;
  aiActionsLimit: number | null;
  aiActionsUsed: number;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: Date | null;
  pastDueSince: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Plan defaults
export const PLAN_LIMITS = {
  free: {
    recipeLimit: 25,
    aiActionsLimit: 20,
  },
  plus: {
    recipeLimit: null, // Unlimited
    aiActionsLimit: 200,
  },
  ai: {
    recipeLimit: null, // Unlimited
    aiActionsLimit: null, // Unlimited
  },
} as const;

// Grace period for past_due status (in milliseconds)
export const PAST_DUE_GRACE_PERIOD_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

export type EntitlementsResult =
  | { success: true; data: UserEntitlements }
  | { success: false; error: string };

export interface CanCreateRecipeResult {
  allowed: boolean;
  reason?: string;
  code?: "RECIPE_LIMIT_REACHED" | "NOT_AUTHENTICATED" | "ENTITLEMENTS_ERROR";
  currentCount?: number;
  limit?: number | null;
  /** True when a former Plus subscriber is now on the free plan and over the free cap. */
  isLapsedPlus?: boolean;
}

/**
 * Returns true if the user previously had Plus but their subscription has ended.
 * These users should see "Renew Plus" prompts rather than "Upgrade" prompts.
 */
export function isLapsedPlusUser(entitlements: UserEntitlements): boolean {
  return entitlements.plan === "free" && entitlements.stripeCustomerId !== null;
}

/**
 * Get entitlements for the current authenticated user.
 * Note: Entitlement columns are stored in user_preferences table.
 * Handles missing billing columns gracefully (migration not yet applied).
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

  // Try full query with billing columns first
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: Record<string, any> | null = null;
  let error: { message: string } | null = null;
  let billingColumnsExist = true;

  const fullResult = await supabase
    .from("user_preferences")
    .select("plan, plan_interval, plan_status, recipe_limit, ai_actions_limit, ai_actions_used, stripe_customer_id, stripe_subscription_id, current_period_end, past_due_since")
    .eq("user_id", user.id)
    .maybeSingle();

  if (fullResult.error?.message?.includes("does not exist")) {
    // Billing columns don't exist, fall back to core columns only
    billingColumnsExist = false;
    const fallbackResult = await supabase
      .from("user_preferences")
      .select("plan, recipe_limit, ai_actions_limit, ai_actions_used")
      .eq("user_id", user.id)
      .maybeSingle();

    data = fallbackResult.data;
    error = fallbackResult.error;
  } else {
    data = fullResult.data;
    error = fullResult.error;
  }

  if (error) {
    console.error("Error fetching entitlements from user_preferences:", error);
    return { success: false, error: error.message };
  }

  // Helper to safely extract billing fields
  const extractBillingFields = (row: Record<string, unknown> | null, hasBillingColumns: boolean) => {
    if (!row || !hasBillingColumns) {
      return {
        planStatus: null as PlanStatus | null,
        stripeCustomerId: null as string | null,
        stripeSubscriptionId: null as string | null,
        currentPeriodEnd: null as Date | null,
        pastDueSince: null as Date | null,
      };
    }
    return {
      planStatus: (row.plan_status as PlanStatus) || null,
      stripeCustomerId: (row.stripe_customer_id as string) || null,
      stripeSubscriptionId: (row.stripe_subscription_id as string) || null,
      currentPeriodEnd: row.current_period_end ? new Date(row.current_period_end as string) : null,
      pastDueSince: row.past_due_since ? new Date(row.past_due_since as string) : null,
    };
  };

  // If no data found, return defaults
  // Note: user_preferences row should be created by handle_new_user trigger on signup.
  // If row is missing, we return defaults instead of trying to upsert (which would
  // fail due to RLS - billing columns are protected from client-side writes).
  if (!data) {
    console.warn(`No user_preferences row for user ${user.id}, returning defaults`);
    return {
      success: true,
      data: {
        userId: user.id,
        plan: "free",
        planInterval: null,
        planStatus: null,
        recipeLimit: 25,
        aiActionsLimit: 0,
        aiActionsUsed: 0,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        currentPeriodEnd: null,
        pastDueSince: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
  }

  const billingFields = extractBillingFields(data, billingColumnsExist);

  const planFromDb = (data.plan as Plan) || "free";
  const storedRecipeLimit = data.recipe_limit ?? 25;

  // Correct stale recipe_limit for free plan users.
  // Old beta trigger set recipe_limit = 10; the canonical free limit is now 25.
  // Return 25 immediately and silently fix the DB value in the background.
  const correctedRecipeLimit =
    planFromDb === "free" && storedRecipeLimit < 25 ? 25 : storedRecipeLimit;

  if (planFromDb === "free" && storedRecipeLimit < 25) {
    createAdminClient()
      .from("user_preferences")
      .update({ recipe_limit: 25 })
      .eq("user_id", user.id)
      .then(({ error }: { error: { message: string } | null }) => {
        if (error) {
          console.warn(
            `[Entitlements] Failed to correct recipe_limit for user ${user.id}:`,
            error.message
          );
        }
      });
  }

  return {
    success: true,
    data: {
      userId: user.id,
      plan: planFromDb,
      planInterval: (data.plan_interval as PlanInterval) || null,
      planStatus: billingFields.planStatus,
      recipeLimit: correctedRecipeLimit,
      aiActionsLimit: data.ai_actions_limit ?? 0,
      aiActionsUsed: data.ai_actions_used ?? 0,
      stripeCustomerId: billingFields.stripeCustomerId,
      stripeSubscriptionId: billingFields.stripeSubscriptionId,
      currentPeriodEnd: billingFields.currentPeriodEnd,
      pastDueSince: billingFields.pastDueSince,
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
 *
 * Grace period logic:
 * - Users with past_due status get PAST_DUE_GRACE_PERIOD_MS to fix payment
 * - After grace period expires, they're treated as free users
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

  const { recipeLimit, plan, planStatus, pastDueSince } = entitlementsResult.data;

  // Check if past_due user has exceeded grace period
  let effectiveLimit = recipeLimit;
  let effectivePlan = plan;

  if (planStatus === "past_due" && pastDueSince) {
    const gracePeriodExpired = Date.now() - pastDueSince.getTime() > PAST_DUE_GRACE_PERIOD_MS;
    if (gracePeriodExpired) {
      // Treat as free user after grace period
      effectiveLimit = PLAN_LIMITS.free.recipeLimit;
      effectivePlan = "free";
    }
  }

  // Unlimited plans (null limit) can always create
  if (effectiveLimit === null) {
    return { allowed: true };
  }

  // Check current count against limit
  const currentCount = await getRecipeCount();

  if (currentCount >= effectiveLimit) {
    const isLapsed = isLapsedPlusUser(entitlementsResult.data);
    const reason = planStatus === "past_due"
      ? "Your payment is past due. Please update your payment method to continue creating recipes."
      : isLapsed
        ? "Your Plus membership has ended. All your existing recipes are safe — renew to keep saving new ones."
        : `You've reached your ${effectivePlan} plan limit of ${effectiveLimit} recipes. Upgrade to create more.`;

    return {
      allowed: false,
      reason,
      code: "RECIPE_LIMIT_REACHED",
      currentCount,
      limit: effectiveLimit,
      isLapsedPlus: isLapsed,
    };
  }

  return {
    allowed: true,
    currentCount,
    limit: effectiveLimit,
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

// ============================================================
// AI Actions Limit Functions
// ============================================================

export interface CanUseAiActionResult {
  allowed: boolean;
  reason?: string;
  code?: "AI_LIMIT_REACHED" | "NOT_AUTHENTICATED" | "ENTITLEMENTS_ERROR";
  currentUsed?: number;
  limit?: number | null;
}

/**
 * Check if the current user can use an AI action.
 * Returns detailed result with reason if not allowed.
 */
export async function canUseAiAction(): Promise<CanUseAiActionResult> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      allowed: false,
      reason: "You must be logged in to use AI features",
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

  const { aiActionsLimit, aiActionsUsed, plan, planStatus, pastDueSince } = entitlementsResult.data;

  // Check if past_due user has exceeded grace period
  let effectiveLimit = aiActionsLimit;
  let effectivePlan = plan;

  if (planStatus === "past_due" && pastDueSince) {
    const gracePeriodExpired = Date.now() - pastDueSince.getTime() > PAST_DUE_GRACE_PERIOD_MS;
    if (gracePeriodExpired) {
      // Treat as free user after grace period
      effectiveLimit = PLAN_LIMITS.free.aiActionsLimit;
      effectivePlan = "free";
    }
  }

  // Unlimited AI actions (null limit) can always use
  if (effectiveLimit === null) {
    return { allowed: true };
  }

  if (aiActionsUsed >= effectiveLimit) {
    const reason = planStatus === "past_due"
      ? "Your payment is past due. Please update your payment method to continue using AI features."
      : `You've used all ${effectiveLimit} AI actions for this month on the ${effectivePlan} plan. Upgrade for more.`;

    return {
      allowed: false,
      reason,
      code: "AI_LIMIT_REACHED",
      currentUsed: aiActionsUsed,
      limit: effectiveLimit,
    };
  }

  return {
    allowed: true,
    currentUsed: aiActionsUsed,
    limit: effectiveLimit,
  };
}

/**
 * Increment the AI actions used counter for the current user.
 * Called after successfully completing an AI action.
 * Returns true if successful, false otherwise.
 */
export async function incrementAiActionsUsed(): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  // Use raw SQL to increment atomically
  const { error } = await supabase.rpc("increment_ai_actions_used", {
    p_user_id: user.id,
  });

  if (error) {
    console.error("Failed to increment AI actions used:", error);
    return false;
  }

  return true;
}
