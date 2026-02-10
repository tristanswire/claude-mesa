import { getCachedUser, getCachedPreferences, getCachedProfile, getCachedEntitlements } from "@/lib/db/cached";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { ThemeSelector } from "@/components/settings/ThemeSelector";
import { UnitSelector } from "@/components/settings/UnitSelector";
import { ProfileEditor } from "@/components/settings/ProfileEditor";
import { BillingSection } from "@/components/settings/BillingSection";
import { FeedbackForm } from "@/components/settings/FeedbackForm";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function SettingsPage() {
  // Use cached functions - these deduplicate with layout fetches
  const { data: { user } } = await getCachedUser();

  const preferencesResult = await getCachedPreferences();
  const preferences = preferencesResult.success
    ? preferencesResult.data
    : { preferredUnitSystem: "original" as const, themePreference: "system" as const };

  const profileResult = await getCachedProfile();
  const profile = profileResult.success
    ? profileResult.data
    : { firstName: null, lastName: null };

  const entitlementsResult = await getCachedEntitlements();
  const entitlements = entitlementsResult.success
    ? entitlementsResult.data
    : {
        plan: "free" as const,
        planStatus: null,
        currentPeriodEnd: null,
        stripeCustomerId: null,
      };

  const displayName = profile.firstName
    ? `${profile.firstName}${profile.lastName ? ` ${profile.lastName}` : ""}`
    : null;

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Settings"
        description="Manage your account and preferences"
      />

      <div className="space-y-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your name and personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileEditor
              initialFirstName={profile.firstName || ""}
              initialLastName={profile.lastName || ""}
            />
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-semibold">
                {profile.firstName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                {displayName && (
                  <p className="font-medium text-foreground">{displayName}</p>
                )}
                <p className={displayName ? "text-sm text-muted" : "font-medium text-foreground"}>
                  {user?.email}
                </p>
                {!displayName && <p className="text-sm text-muted">Signed in</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing */}
        <Card>
          <CardHeader>
            <CardTitle>Billing</CardTitle>
            <CardDescription>Manage your subscription and billing</CardDescription>
          </CardHeader>
          <CardContent>
            <BillingSection
              plan={entitlements.plan}
              planStatus={entitlements.planStatus}
              currentPeriodEnd={entitlements.currentPeriodEnd}
              stripeCustomerId={entitlements.stripeCustomerId}
            />
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

        {/* Feedback */}
        <Card>
          <CardHeader>
            <CardTitle>Feedback</CardTitle>
            <CardDescription>Help us improve Mesa with your feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <FeedbackForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
