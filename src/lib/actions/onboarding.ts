"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { updateUserPreferences } from "@/lib/db/user-preferences";
import { trackEventAsync } from "@/lib/analytics/events";
import { createClient } from "@/lib/supabase/server";
import { logOnboardingAction, generateErrorId } from "@/lib/logger";
import { mapErrorToFriendlyMessage } from "@/lib/errors";
import type { UnitSystem } from "@/lib/units";

export interface OnboardingFormState {
  success: boolean;
  error?: string;
  errorId?: string;
}

/**
 * Complete onboarding with the selected preferences.
 */
export async function completeOnboardingAction(
  _prevState: OnboardingFormState,
  formData: FormData
): Promise<OnboardingFormState> {
  // Get user for logging
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const unitSystem = formData.get("unitSystem") as UnitSystem | null;

  // Update preferences with onboarding completed
  const result = await updateUserPreferences({
    preferredUnitSystem: unitSystem || "original",
    onboardingCompleted: true,
  });

  if (!result.success) {
    const errorId = generateErrorId();
    const { message } = mapErrorToFriendlyMessage(result.error);
    logOnboardingAction(false, {
      userId: user?.id,
      errorId,
      error: result.error,
    });
    return {
      success: false,
      error: message,
      errorId,
    };
  }

  logOnboardingAction(true, {
    userId: user?.id,
  });

  // Track event (non-blocking, wrapped in try-catch)
  try {
    trackEventAsync("onboarding_completed", {
      unitSystem: unitSystem || "original",
    });
  } catch {
    // Analytics should never break the flow
  }

  // Revalidate paths that depend on preferences
  revalidatePath("/recipes");
  revalidatePath("/settings");

  redirect("/recipes");
}

/**
 * Skip onboarding and mark as completed.
 */
export async function skipOnboardingAction(): Promise<OnboardingFormState> {
  // Get user for logging
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const result = await updateUserPreferences({
    onboardingCompleted: true,
  });

  if (!result.success) {
    // Log the error but don't block the user
    logOnboardingAction(false, {
      userId: user?.id,
      error: `Skip failed: ${result.error}`,
    });
  } else {
    logOnboardingAction(true, {
      userId: user?.id,
    });
  }

  // Track event (non-blocking, wrapped in try-catch)
  try {
    trackEventAsync("onboarding_skipped");
  } catch {
    // Analytics should never break the flow
  }

  // Revalidate paths that depend on preferences
  revalidatePath("/recipes");
  revalidatePath("/settings");

  redirect("/recipes");
}
