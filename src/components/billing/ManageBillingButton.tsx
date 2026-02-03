"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";

interface ManageBillingButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function ManageBillingButton({
  className,
  children,
}: ManageBillingButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (isLoading) return;

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
      console.error("Portal error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={className}
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
          <span className="flex items-center justify-center gap-2">
            <ExternalLink className="h-4 w-4" />
            {children || "Manage billing"}
          </span>
        )}
      </button>
      {error && (
        <p className="text-xs text-error mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
