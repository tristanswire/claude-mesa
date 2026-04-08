/**
 * Reusable empty state component with icon and CTA.
 */

import type React from "react";
import Link from "next/link";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: "recipe" | "collection" | "import" | "store";
  action?: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
}

const icons: Record<string, React.ReactNode> = {
  recipe: (
    <svg
      className="h-12 w-12 text-muted"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  ),
  collection: (
    <svg
      className="h-12 w-12 text-muted"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
      />
    </svg>
  ),
  import: (
    <svg
      className="h-12 w-12 text-muted"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
      />
    </svg>
  ),
  store: (
    <svg
      className="h-12 w-12 text-muted"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
      />
    </svg>
  ),
};

export function EmptyState({
  title,
  description,
  icon = "recipe",
  action,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <div className="bg-surface rounded-xl p-8 text-center">
      <div className="flex justify-center mb-4">{icons[icon]}</div>
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted mb-6 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="flex justify-center gap-3">
          {action && (
            <Link
              href={action.href}
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
            >
              {action.label}
            </Link>
          )}
          {secondaryAction && (
            <Link
              href={secondaryAction.href}
              className="px-4 py-2 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-2 transition-colors"
            >
              {secondaryAction.label}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
