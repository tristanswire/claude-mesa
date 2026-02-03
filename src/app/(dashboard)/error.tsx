"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error for debugging (in production, send to error tracking service)
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center mb-6">
        <svg
          className="w-8 h-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-2">
        Something went wrong
      </h1>
      <p className="text-muted text-center max-w-md mb-6">
        We encountered an unexpected error. This has been logged and we&apos;ll
        look into it.
      </p>

      <div className="flex items-center gap-4">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" asChild>
          <Link href="/recipes">Go to recipes</Link>
        </Button>
      </div>

      {process.env.NODE_ENV === "development" && error.message && (
        <div className="mt-8 p-4 bg-surface-2 rounded-lg max-w-xl w-full">
          <p className="text-xs font-mono text-muted break-all">
            {error.message}
          </p>
          {error.digest && (
            <p className="text-xs font-mono text-muted mt-2">
              Digest: {error.digest}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
