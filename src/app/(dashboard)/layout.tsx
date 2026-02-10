import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Providers } from "@/components/providers/Providers";
import { getCachedUser, getCachedPreferences, getCachedProfile } from "@/lib/db/cached";
import type { ThemePreference } from "@/lib/db/user-preferences";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use cached functions to deduplicate with child page fetches
  const { data: { user } } = await getCachedUser();

  if (!user) {
    redirect("/login");
  }

  // Get user preferences for theme and onboarding status (cached)
  const preferencesResult = await getCachedPreferences();
  const themePreference: ThemePreference = preferencesResult.success
    ? preferencesResult.data.themePreference
    : "system";

  // Redirect to onboarding if not completed
  // (onboarding page is in separate route group, so no redirect loop)
  const onboardingCompleted = preferencesResult.success
    ? preferencesResult.data.onboardingCompleted
    : false;

  if (!onboardingCompleted) {
    redirect("/onboarding");
  }

  // Get profile for name display (cached)
  const profileResult = await getCachedProfile();
  const firstName = profileResult.success
    ? profileResult.data.firstName
    : null;

  return (
    <Providers defaultTheme={themePreference}>
      <div className="min-h-screen bg-background">
        <Header userEmail={user.email || "Unknown"} firstName={firstName} />
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </Providers>
  );
}
