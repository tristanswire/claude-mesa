"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { UpgradeButton } from "@/components/billing/UpgradeButton";
import { ManageBillingButton } from "@/components/billing/ManageBillingButton";
import type { Plan } from "@/lib/db/entitlements";

interface PricingSectionProps {
  currentPlan: Plan;
  hasSubscription: boolean;
  monthlyPriceId: string;
  yearlyPriceId: string;
}

export function PricingSection({
  currentPlan,
  hasSubscription,
  monthlyPriceId,
  yearlyPriceId,
}: PricingSectionProps) {
  const [interval, setInterval] = useState<"month" | "year">("month");

  const priceId = interval === "month" ? monthlyPriceId : yearlyPriceId;

  const plans = [
    {
      id: "free",
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Everything you need to get started",
      features: [
        "Up to 25 recipes",
        "Basic URL and text import",
        "Collections",
        "Recipe sharing",
        "Light and dark mode",
      ],
      cta: "Current plan",
      upgradeable: false,
    },
    {
      id: "plus",
      name: "Plus",
      price: interval === "month" ? "$4.99" : "$39.99",
      period: interval === "month" ? "per month" : "per year",
      description: "For the dedicated home cook",
      features: [
        "Unlimited recipes",
        "All import types",
        "Unlimited collections",
        "Recipe sharing",
        "Priority support",
        "Early access to new features",
      ],
      cta: "Upgrade to Plus",
      upgradeable: true,
      highlighted: true,
    },
  ];

  return (
    <>
      {/* Billing interval toggle */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex items-center bg-surface-2 rounded-lg p-1">
          <button
            onClick={() => setInterval("month")}
            className={`px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${
              interval === "month"
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval("year")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${
              interval === "year"
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            Yearly
            <span className="text-xs font-semibold text-accent bg-accent/10 px-1.5 py-0.5 rounded">
              2 months free
            </span>
          </button>
        </div>
      </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const isPremium = plan.highlighted;

          return (
            <div
              key={plan.id}
              className={`relative bg-surface rounded-xl border border-border shadow-sm p-6 ${
                isPremium
                  ? "ring-2 ring-accent"
                  : isCurrent
                  ? "ring-2 ring-primary"
                  : ""
              }`}
            >
              {/* Badges */}
              <div className="absolute -top-3 left-4 right-4 flex justify-between items-center">
                {isPremium && !isCurrent && (
                  <Badge variant="accent">Recommended</Badge>
                )}
                {isCurrent && (
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

                {plan.upgradeable && !isCurrent ? (
                  <UpgradeButton
                    priceId={priceId}
                    className={`mt-6 w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                      isPremium
                        ? "bg-accent text-accent-foreground hover:bg-accent/90"
                        : "bg-primary text-primary-foreground hover:bg-primary-hover"
                    }`}
                  >
                    {plan.cta}
                  </UpgradeButton>
                ) : isCurrent && hasSubscription ? (
                  <ManageBillingButton className="mt-6 w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-colors bg-surface-2 text-foreground hover:bg-surface-3">
                    Manage billing
                  </ManageBillingButton>
                ) : (
                  <button
                    disabled
                    className="mt-6 w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-colors bg-surface-2 text-muted cursor-not-allowed"
                  >
                    {isCurrent ? "Current plan" : plan.cta}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
