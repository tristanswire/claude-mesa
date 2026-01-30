import Link from "next/link";
import { getEntitlementsForUser, getRecipeCount, getPlanDisplayInfo } from "@/lib/db/entitlements";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Everything you need to get started",
    features: [
      "Up to 25 recipes",
      "Import from URLs",
      "Paste text import",
      "Unit conversion",
      "Organize with stacks",
      "Share recipes",
    ],
    cta: "Current plan",
    disabled: true,
  },
  {
    id: "plus",
    name: "Plus",
    price: "$5",
    period: "per month",
    description: "For the dedicated home cook",
    features: [
      "Unlimited recipes",
      "Everything in Free",
      "Priority support",
      "Early access to features",
    ],
    cta: "Coming soon",
    disabled: true,
    highlighted: true,
  },
  {
    id: "ai",
    name: "AI",
    price: "$15",
    period: "per month",
    description: "Your personal cooking assistant",
    features: [
      "Everything in Plus",
      "AI recipe suggestions",
      "Smart ingredient substitutions",
      "Meal planning assistant",
      "Nutritional analysis",
    ],
    cta: "Coming soon",
    disabled: true,
  },
];

export default async function UpgradePage() {
  const [entitlementsResult, recipeCount] = await Promise.all([
    getEntitlementsForUser(),
    getRecipeCount(),
  ]);

  const currentPlan = entitlementsResult.success
    ? entitlementsResult.data.plan
    : "free";
  const recipeLimit = entitlementsResult.success
    ? entitlementsResult.data.recipeLimit
    : 25;

  const planInfo = getPlanDisplayInfo(currentPlan);
  const usagePercent = recipeLimit !== null ? Math.round((recipeCount / recipeLimit) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Your Plan"
        description="Manage your subscription and unlock more features"
        backLink={{ href: "/recipes", label: "Back to recipes" }}
      />

      {/* Current usage card */}
      <div className="bg-surface rounded-xl p-6 mb-8">
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

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const isPremium = plan.highlighted;

          return (
            <div
              key={plan.id}
              className={`relative bg-surface rounded-xl p-6 ${
                isPremium
                  ? "ring-2 ring-accent"
                  : isCurrent
                  ? "ring-2 ring-primary"
                  : ""
              }`}
            >
              {/* Badges */}
              <div className="absolute -top-3 left-4 right-4 flex justify-between items-center">
                {isPremium && (
                  <Badge variant="accent">Recommended</Badge>
                )}
                {isCurrent && !isPremium && (
                  <Badge variant="primary">Current</Badge>
                )}
                {isCurrent && isPremium && (
                  <Badge variant="primary">Current</Badge>
                )}
                {!isCurrent && !isPremium && <span />}
              </div>

              <div className="pt-2">
                <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                <div className="mt-2 flex items-baseline">
                  <span className="text-3xl font-bold text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-muted ml-1">/{plan.period}</span>
                </div>
                <p className="mt-2 text-sm text-muted">{plan.description}</p>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <svg
                        className={`h-5 w-5 flex-shrink-0 ${
                          isPremium ? "text-accent" : "text-success"
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  disabled={plan.disabled}
                  className={`mt-6 w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                    plan.disabled
                      ? "bg-surface-2 text-muted cursor-not-allowed"
                      : isPremium
                      ? "bg-accent text-accent-foreground hover:bg-accent/90"
                      : "bg-primary text-primary-foreground hover:bg-primary-hover"
                  }`}
                >
                  {isCurrent ? "Current plan" : plan.cta}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Coming soon notice */}
      <div className="bg-accent-subtle border border-accent/20 rounded-xl p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Paid plans coming soon
        </h3>
        <p className="text-sm text-muted max-w-md mx-auto">
          We&apos;re working on bringing you premium features. For now, enjoy the
          free tier with up to 25 recipes.
        </p>
      </div>
    </div>
  );
}
