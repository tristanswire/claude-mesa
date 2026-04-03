import { getCachedEntitlements } from "@/lib/db/cached";
import { getRecipeCount, getPlanDisplayInfo } from "@/lib/db/entitlements";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { PricingSection } from "@/components/billing/PricingSection";

export default async function UpgradePage() {
  const [entitlementsResult, recipeCount] = await Promise.all([
    getCachedEntitlements(), // Cached - deduplicates with settings page fetch
    getRecipeCount(),
  ]);

  const currentPlan = entitlementsResult.success
    ? entitlementsResult.data.plan
    : "free";
  const recipeLimit = entitlementsResult.success
    ? entitlementsResult.data.recipeLimit
    : 25;
  const stripeCustomerId = entitlementsResult.success
    ? entitlementsResult.data.stripeCustomerId
    : null;

  const planInfo = getPlanDisplayInfo(currentPlan);
  const hasSubscription = currentPlan !== "free" && stripeCustomerId !== null;
  const usagePercent = recipeLimit !== null ? Math.round((recipeCount / recipeLimit) * 100) : 0;

  const monthlyPriceId = process.env.STRIPE_PRICE_ID_PLUS_MONTHLY ?? "";
  const yearlyPriceId = process.env.STRIPE_PRICE_ID_PLUS_YEARLY ?? "";

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Your Plan"
        description="Manage your subscription and unlock more features"
        backLink={{ href: "/recipes", label: "Back to recipes" }}
      />

      {/* Current usage card */}
      <div className="bg-surface rounded-xl border border-border shadow-sm p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-lg font-semibold text-foreground">
                {planInfo.name} Plan
              </h2>
              {currentPlan === "free" && (
                <Badge variant="default">Free</Badge>
              )}
            </div>
            <p className="text-muted">
              {recipeCount} of {recipeLimit !== null ? recipeLimit : "unlimited"} recipes used
            </p>
          </div>

          {recipeLimit !== null && (
            <div className="w-full sm:w-48">
              <div className="bg-surface-2 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    usagePercent >= 100 ? "bg-error" : usagePercent >= 80 ? "bg-warning" : "bg-primary"
                  }`}
                  style={{ width: `${Math.min(100, usagePercent)}%` }}
                />
              </div>
              <p className="text-xs text-muted mt-1.5 text-right">
                {usagePercent}% used
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pricing toggle + cards */}
      <PricingSection
        currentPlan={currentPlan}
        hasSubscription={hasSubscription}
        monthlyPriceId={monthlyPriceId}
        yearlyPriceId={yearlyPriceId}
      />
    </div>
  );
}
