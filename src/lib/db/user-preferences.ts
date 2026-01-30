import { createClient } from "@/lib/supabase/server";
import type { UnitSystem } from "@/lib/units";

export type ThemePreference = "light" | "dark" | "system";

export interface UserPreferences {
  userId: string;
  preferredUnitSystem: UnitSystem;
  themePreference: ThemePreference;
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
    },
  };
}

/**
 * Update user preferences using upsert to handle missing rows.
 */
export async function updateUserPreferences(
  preferences: Partial<Pick<UserPreferences, "preferredUnitSystem" | "themePreference">>
): Promise<PreferencesResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const updateData: Record<string, unknown> = {
    user_id: user.id,
  };

  if (preferences.preferredUnitSystem !== undefined) {
    updateData.preferred_unit_system = preferences.preferredUnitSystem;
  }

  if (preferences.themePreference !== undefined) {
    updateData.theme_preference = preferences.themePreference;
  }

  // Use upsert to handle case where row doesn't exist
  const { data, error } = await supabase
    .from("user_preferences")
    .upsert(updateData, { onConflict: "user_id" })
    .select()
    .single();

  if (error) {
    console.error("Error updating user preferences:", error);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: {
      userId: data.user_id,
      preferredUnitSystem: data.preferred_unit_system as UnitSystem,
      themePreference: (data.theme_preference as ThemePreference) || "system",
    },
  };
}
