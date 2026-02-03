import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Providers } from "@/components/providers/Providers";
import { getUserPreferences, type ThemePreference } from "@/lib/db/user-preferences";

/**
 * Onboarding layout - authenticated but no header for a clean experience.
 */
export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get theme preference for consistent styling
  const preferencesResult = await getUserPreferences();
  const themePreference: ThemePreference = preferencesResult.success
    ? preferencesResult.data.themePreference
    : "system";

  return (
    <Providers defaultTheme={themePreference}>
      <div className="min-h-screen bg-background">
        {children}
      </div>
    </Providers>
  );
}
