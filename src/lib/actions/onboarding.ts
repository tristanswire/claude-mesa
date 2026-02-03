"use server";

import { redirect } from "next/navigation";
import { updateUserPreferences } from "@/lib/db/user-preferences";
import { trackEventAsync } from "@/lib/analytics/events";
import type { UnitSystem } from "@/lib/units";

export interface OnboardingFormState {
  success: boolean;
  error?: string;
}

/**
 * Complete onboarding with the selected preferences.
 */
export async function completeOnboardingAction(
  _prevState: OnboardingFormState,
  formData: FormData
): Promise<OnboardingFormState> {
  const unitSystem = formData.get("unitSystem") as UnitSystem | null;

  // Update preferences with onboarding completed
  const result = await updateUserPreferences({
    preferredUnitSystem: unitSystem || "original",
    onboardingCompleted: true,
  });

  if (!result.success) {
    return {
      success: false,
      error: result.error,
    };
  }

  // Track event (non-blocking)
  trackEventAsync("onboarding_completed", {
    unitSystem: unitSystem || "original",
  });

  redirect("/recipes");
}

/**
 * Skip onboarding and mark as completed.
 */
export async function skipOnboardingAction(): Promise<OnboardingFormState> {
  const result = await updateUserPreferences({
    onboardingCompleted: true,
  });

  if (!result.success) {
    // Even if update fails, redirect to recipes (don't block the user)
    console.error("Failed to mark onboarding as skipped:", result.error);
  }

  // Track event (non-blocking)
  trackEventAsync("onboarding_skipped");

  redirect("/recipes");
}
