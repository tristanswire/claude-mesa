/**
 * Reusable error state component.
 */

import Link from "next/link";

interface ErrorStateProps {
  title?: string;
  message: string;
  retry?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
}

export function ErrorState({
  title = "Something went wrong",
  message,
  retry,
}: ErrorStateProps) {
  return (
    <div className="bg-error/10 border border-error/30 rounded-xl p-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-error"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-error">{title}</h3>
          <p className="mt-1 text-sm text-error/80">{message}</p>
          {retry && (
            <div className="mt-4">
              {retry.href ? (
                <Link
                  href={retry.href}
                  className="text-sm font-medium text-error hover:text-error/80 underline"
                >
                  {retry.label}
                </Link>
              ) : retry.onClick ? (
                <button
                  onClick={retry.onClick}
                  className="text-sm font-medium text-error hover:text-error/80 underline cursor-pointer"
                >
                  {retry.label}
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
