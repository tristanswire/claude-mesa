"use client";

import { useState } from "react";
import { trackClientEvent } from "@/lib/actions/analytics";

interface UpgradeButtonProps {
  priceId: string;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export function UpgradeButton({
  priceId,
  className,
  children,
  disabled,
}: UpgradeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    setError(null);

    // Track upgrade button click (non-blocking)
    trackClientEvent("upgrade_clicked", { plan: "plus" }).catch(() => {});

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start checkout");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={disabled || isLoading}
        className={`cursor-pointer disabled:cursor-not-allowed ${className}`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Loading...
          </span>
        ) : (
          children
        )}
      </button>
      {error && (
        <p className="text-xs text-error mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
