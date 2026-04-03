"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { Plan, PlanStatus } from "@/lib/db/entitlements";

interface BillingSectionProps {
  plan: Plan;
  planStatus: PlanStatus | null;
  currentPeriodEnd: Date | null;
  stripeCustomerId: string | null;
}

export function BillingSection({
  plan,
  planStatus,
  currentPeriodEnd,
  stripeCustomerId,
}: BillingSectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if billing fields are available (migration applied)
  // If planStatus is null, billing columns likely don't exist yet
  const billingFieldsAvailable = planStatus !== null || stripeCustomerId !== null;

  const isPastDue = planStatus === "past_due";
  const isCanceled = planStatus === "canceled";
  const hasSubscription = plan !== "free";

  const handleManageBilling = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to open billing portal");
      }

      // Redirect to Stripe portal
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  return (
    <div className="space-y-4">
      {/* Plan display */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted">Current plan</span>
        <Badge variant={plan === "free" ? "default" : "accent"}>
          {plan === "free" ? "Free" : plan === "plus" ? "Plus" : "AI"}
        </Badge>
        {billingFieldsAvailable && planStatus && planStatus !== "active" && (
          <Badge
            variant={isPastDue ? "warning" : isCanceled ? "error" : "default"}
          >
            {planStatus === "past_due"
              ? "Past due"
              : planStatus === "canceled"
                ? "Canceled"
                : planStatus === "trialing"
                  ? "Trial"
                  : planStatus}
          </Badge>
        )}
      </div>

      {/* Renewal date (only for Plus with active subscription and billing fields available) */}
      {billingFieldsAvailable && currentPeriodEnd && plan !== "free" && !isCanceled && (
        <p className="text-sm text-muted">
          {isPastDue ? "Payment was due" : "Renews"} on{" "}
          {formatDate(currentPeriodEnd)}
        </p>
      )}

      {/* Canceled notice */}
      {billingFieldsAvailable && isCanceled && currentPeriodEnd && (
        <p className="text-sm text-muted">
          Access until {formatDate(currentPeriodEnd)}
        </p>
      )}

      {/* Past due warning */}
      {billingFieldsAvailable && isPastDue && (
        <div className="flex items-start gap-2 p-3 bg-warning-subtle rounded-lg border border-warning/20">
          <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-warning">Payment issue</p>
            <p className="text-muted mt-0.5">
              Update your payment method to keep Plus active.
            </p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-3 bg-error-subtle rounded-lg border border-error/20">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 pt-2">
        <div className="flex items-center gap-3">
          {plan === "free" ? (
            <Button asChild>
              <Link href="/upgrade">
                <Sparkles className="h-4 w-4 mr-2" />
                Upgrade to Plus
              </Link>
            </Button>
          ) : hasSubscription ? (
            <Button
              variant="outline"
              onClick={handleManageBilling}
              disabled={isLoading}
              isLoading={isLoading}
            >
              {!isLoading && <ExternalLink className="h-4 w-4 mr-2" />}
              {isPastDue ? "Fix payment" : "Manage subscription"}
            </Button>
          ) : (
            // Plus user without Stripe customer (e.g., manually set)
            <Button asChild variant="outline">
              <Link href="/upgrade">View plans</Link>
            </Button>
          )}
        </div>

        {/* Cancellation note for active Plus subscribers */}
        {hasSubscription && !isCanceled && !isPastDue && (
          <p className="text-xs text-muted">
            You can cancel or change your plan anytime. If you cancel, you&apos;ll keep Plus access until the end of your billing period.
          </p>
        )}
      </div>
    </div>
  );
}
