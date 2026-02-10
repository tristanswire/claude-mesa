/**
 * Error message mapping utility.
 * Maps raw database/API errors to user-friendly messages.
 */

import { generateErrorId } from "./logger";

export interface UserFriendlyError {
  message: string;
  errorId: string;
  isRetryable: boolean;
}

/**
 * Common error patterns and their user-friendly messages.
 */
const errorPatterns: Array<{
  pattern: RegExp | string;
  message: string;
  isRetryable: boolean;
}> = [
  // RLS / Permission errors
  {
    pattern: /permission denied|row-level security|rls|policy/i,
    message: "You don't have access to that resource.",
    isRetryable: false,
  },
  {
    pattern: /not authorized|unauthorized|403/i,
    message: "You don't have permission to do that.",
    isRetryable: false,
  },
  {
    pattern: /not authenticated|unauthenticated|401/i,
    message: "Please sign in to continue.",
    isRetryable: false,
  },

  // Schema / Database structure errors
  {
    pattern: /column.*does not exist|relation.*does not exist|undefined column/i,
    message: "We're updating things. Please refresh and try again.",
    isRetryable: true,
  },
  {
    pattern: /schema cache|pgrst|postgrest/i,
    message: "We're updating things. Please refresh and try again.",
    isRetryable: true,
  },

  // Constraint violations
  {
    pattern: /duplicate key|unique constraint|already exists/i,
    message: "This item already exists.",
    isRetryable: false,
  },
  {
    pattern: /foreign key|violates foreign key constraint/i,
    message: "This item is linked to other data and can't be modified.",
    isRetryable: false,
  },
  {
    pattern: /not null|null value|required/i,
    message: "Please fill in all required fields.",
    isRetryable: false,
  },

  // Network errors
  {
    pattern: /network|fetch|timeout|ECONNREFUSED|ETIMEDOUT|connection/i,
    message: "Connection issue. Please check your internet and try again.",
    isRetryable: true,
  },
  {
    pattern: /too many requests|rate limit|429/i,
    message: "Too many requests. Please wait a moment and try again.",
    isRetryable: true,
  },

  // Storage errors
  {
    pattern: /storage|bucket|upload|file size|too large/i,
    message: "There was a problem with the file. Please try a different one.",
    isRetryable: false,
  },

  // Stripe errors
  {
    pattern: /stripe|payment|card|billing/i,
    message: "There was a billing issue. Please try again or contact support.",
    isRetryable: true,
  },

  // Server errors
  {
    pattern: /500|internal server error|server error/i,
    message: "Something went wrong on our end. Please try again.",
    isRetryable: true,
  },
];

/**
 * Map a raw error to a user-friendly message.
 * Returns the friendly message, an error ID for correlation, and whether it's retryable.
 */
export function mapErrorToFriendlyMessage(
  error: unknown,
  fallbackMessage = "Something went wrong. Please try again."
): UserFriendlyError {
  const errorId = generateErrorId();
  const errorString = extractErrorString(error);

  // Try to match against known patterns
  for (const { pattern, message, isRetryable } of errorPatterns) {
    const matches =
      typeof pattern === "string"
        ? errorString.toLowerCase().includes(pattern.toLowerCase())
        : pattern.test(errorString);

    if (matches) {
      return { message, errorId, isRetryable };
    }
  }

  // Default fallback
  return {
    message: fallbackMessage,
    errorId,
    isRetryable: true,
  };
}

/**
 * Extract a string representation from any error type.
 */
export function extractErrorString(error: unknown): string {
  if (error === null || error === undefined) {
    return "";
  }

  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  // Handle Supabase/PostgREST error objects
  if (typeof error === "object") {
    const obj = error as Record<string, unknown>;

    // Supabase error format
    if (obj.message && typeof obj.message === "string") {
      return obj.message;
    }

    // PostgREST error format
    if (obj.details && typeof obj.details === "string") {
      return obj.details;
    }

    if (obj.error && typeof obj.error === "string") {
      return obj.error;
    }

    // Try to stringify, but don't expose raw objects to users
    try {
      return JSON.stringify(obj);
    } catch {
      return String(error);
    }
  }

  return String(error);
}

/**
 * Check if an error is a network/connectivity error.
 */
export function isNetworkError(error: unknown): boolean {
  const errorString = extractErrorString(error);
  return /network|fetch|timeout|ECONNREFUSED|ETIMEDOUT|connection|offline/i.test(
    errorString
  );
}

/**
 * Check if an error is retryable.
 */
export function isRetryableError(error: unknown): boolean {
  const { isRetryable } = mapErrorToFriendlyMessage(error);
  return isRetryable;
}

/**
 * Format an error for server action return.
 * Use this in server actions to return friendly errors to the client.
 */
export function formatActionError(
  error: unknown,
  fallbackMessage?: string
): { success: false; error: string; errorId: string } {
  const { message, errorId } = mapErrorToFriendlyMessage(error, fallbackMessage);
  return {
    success: false,
    error: message,
    errorId,
  };
}
