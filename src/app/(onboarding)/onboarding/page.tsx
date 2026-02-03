import { redirect } from "next/navigation";
import { getUserPreferences } from "@/lib/db/user-preferences";
import { OnboardingForm } from "./OnboardingForm";

export default async function OnboardingPage() {
  // Check if user has already completed onboarding
  const prefsResult = await getUserPreferences();

  if (prefsResult.success && prefsResult.data.onboardingCompleted) {
    redirect("/recipes");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <OnboardingForm />
      </div>
    </div>
  );
}
