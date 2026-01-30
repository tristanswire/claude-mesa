import { createClient } from "@/lib/supabase/server";
import { getUserPreferences } from "@/lib/db/user-preferences";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { ThemeSelector } from "@/components/settings/ThemeSelector";
import { UnitSelector } from "@/components/settings/UnitSelector";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const preferencesResult = await getUserPreferences();
  const preferences = preferencesResult.success
    ? preferencesResult.data
    : { preferredUnitSystem: "original" as const, themePreference: "system" as const };

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Settings"
        description="Manage your account and preferences"
      />

      <div className="space-y-6">
        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-semibold">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-foreground">{user?.email}</p>
                <p className="text-sm text-muted">Signed in</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize how Mesa looks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Theme
                </label>
                <ThemeSelector initialValue={preferences.themePreference} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Units */}
        <Card>
          <CardHeader>
            <CardTitle>Units</CardTitle>
            <CardDescription>Choose your preferred measurement system</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Default Unit System
              </label>
              <UnitSelector initialValue={preferences.preferredUnitSystem} />
              <p className="text-sm text-muted mt-3">
                This will be the default when viewing recipes. You can always toggle units on individual recipes.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
