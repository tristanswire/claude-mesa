import { createClient } from "@/lib/supabase/server";
import type { UnitSystem } from "@/lib/units";

export type ThemePreference = "light" | "dark" | "system";

export interface UserPreferences {
  userId: string;
  preferredUnitSystem: UnitSystem;
  themePreference: ThemePreference;
  onboardingCompleted: boolean;
}

export type PreferencesResult =
  | { success: true; data: UserPreferences }
  | { success: false; error: string };

/**
 * Get user preferences for the current user.
 */
export async function getUserPreferences(): Promise<PreferencesResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) {
    // If no preferences exist, return defaults
    if (error.code === "PGRST116") {
      return {
        success: true,
        data: {
          userId: user.id,
          preferredUnitSystem: "original",
          themePreference: "system",
          onboardingCompleted: false,
        },
      };
    }
    console.error("Error getting user preferences:", error);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: {
      userId: data.user_id,
      preferredUnitSystem: data.preferred_unit_system as UnitSystem,
      themePreference: (data.theme_preference as ThemePreference) || "system",
      onboardingCompleted: data.onboarding_completed ?? false,
    },
  };
}

/**
 * Update user preferences using direct table upsert.
 * Only updates safe columns (preferredUnitSystem, themePreference, onboardingCompleted).
 * Billing columns (plan, stripe_*, limits) can only be updated via service role.
 */
export async function updateUserPreferences(
  preferences: Partial<Pick<UserPreferences, "preferredUnitSystem" | "themePreference" | "onboardingCompleted">>
): Promise<PreferencesResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Build update object with only safe columns (snake_case for DB)
  const updateData: Record<string, unknown> = {
    user_id: user.id,
  };

  if (preferences.preferredUnitSystem !== undefined) {
    updateData.preferred_unit_system = preferences.preferredUnitSystem;
  }

  if (preferences.themePreference !== undefined) {
    updateData.theme_preference = preferences.themePreference;
  }

  if (preferences.onboardingCompleted !== undefined) {
    updateData.onboarding_completed = preferences.onboardingCompleted;
  }

  // Upsert to handle both new and existing rows
  const { data, error } = await supabase
    .from("user_preferences")
    .upsert(updateData, { onConflict: "user_id" })
    .select("user_id, preferred_unit_system, theme_preference, onboarding_completed")
    .single();

  if (error) {
    console.error("Error updating user preferences:", error);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: {
      userId: data.user_id,
      preferredUnitSystem: (data.preferred_unit_system as UnitSystem) || "original",
      themePreference: (data.theme_preference as ThemePreference) || "system",
      onboardingCompleted: data.onboarding_completed ?? false,
    },
  };
}
