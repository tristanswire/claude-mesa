/**
 * Reusable loading state component with spinner.
 */

interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingState({
  message = "Loading...",
  size = "md",
}: LoadingStateProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-border border-t-primary`}
        role="status"
        aria-label="Loading"
      />
      {message && (
        <p className="mt-3 text-sm text-muted">{message}</p>
      )}
    </div>
  );
}
