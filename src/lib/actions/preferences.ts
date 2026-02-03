"use server";

import { revalidatePath } from "next/cache";
import { updateUserPreferences, type ThemePreference } from "@/lib/db/user-preferences";
import { updateProfile } from "@/lib/db/profiles";
import type { UnitSystem } from "@/lib/units";

export interface PreferencesActionResult {
  success: boolean;
  error?: string;
}

export async function updateUnitSystemAction(
  unitSystem: UnitSystem
): Promise<PreferencesActionResult> {
  const result = await updateUserPreferences({
    preferredUnitSystem: unitSystem,
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Revalidate pages that use unit preferences
  revalidatePath("/recipes");
  revalidatePath("/settings");

  return { success: true };
}

export async function updateThemePreferenceAction(
  theme: ThemePreference
): Promise<PreferencesActionResult> {
  const result = await updateUserPreferences({ themePreference: theme });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function updateProfileNameAction(
  firstName: string,
  lastName: string
): Promise<PreferencesActionResult> {
  if (!firstName.trim()) {
    return { success: false, error: "First name is required" };
  }

  const result = await updateProfile({
    firstName: firstName.trim(),
    lastName: lastName.trim(),
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Revalidate layout (for header) and settings page
  revalidatePath("/", "layout");
  revalidatePath("/settings");

  return { success: true };
}
