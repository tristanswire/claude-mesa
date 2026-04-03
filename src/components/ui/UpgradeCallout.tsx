"use client";

import Link from "next/link";
import { ManageBillingButton } from "@/components/billing/ManageBillingButton";

interface UpgradeCalloutProps {
  title?: string;
  message: string;
  limit?: number;
  /**
   * "upgrade" (default) — new free user hitting the cap, shows "View upgrade options" → /upgrade
   * "renew" — former Plus user whose plan expired, shows "Renew Plus" → Stripe billing portal
   */
  variant?: "upgrade" | "renew";
}

export function UpgradeCallout({
  title,
  message,
  limit,
  variant = "upgrade",
}: UpgradeCalloutProps) {
  const defaultTitle = variant === "renew" ? "Your Plus plan has ended" : "Recipe limit reached";

  return (
    <div className="bg-warning/10 border border-warning/30 rounded-xl p-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-6 w-6 text-warning"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-lg font-medium text-warning">{title ?? defaultTitle}</h3>
          <p className="mt-1 text-sm text-warning/80">{message}</p>
          {variant === "upgrade" && limit && (
            <p className="mt-2 text-xs text-warning/70">
              Free plan includes {limit} recipes
            </p>
          )}
          <div className="mt-4">
            {variant === "renew" ? (
              <ManageBillingButton className="inline-flex items-center px-4 py-2 text-sm font-medium text-warning-foreground bg-warning rounded-lg hover:bg-warning/90 transition-colors">
                Renew Plus
              </ManageBillingButton>
            ) : (
              <Link
                href="/upgrade"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-warning-foreground bg-warning rounded-lg hover:bg-warning/90 transition-colors"
              >
                View upgrade options
                <svg
                  className="ml-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
