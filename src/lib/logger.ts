/**
 * Structured server-side logging utility.
 * Emits JSON logs optimized for Vercel Logs queryability.
 *
 * Usage:
 *   log.info("recipe", "Recipe saved", { recipeId: "123" })
 *   log.error("stripe", "Checkout failed", { errorId, userId: anonymizeId(userId) })
 */

type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  tag: string;
  message: string;
  errorId?: string;
  userId?: string;
  route?: string;
  action?: string;
  meta?: Record<string, unknown>;
}

const isDev = process.env.NODE_ENV === "development";

/**
 * Generate a short error ID for correlation (ERR-xxxxx).
 */
export function generateErrorId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 5; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return `ERR-${id}`;
}

/**
 * Anonymize user ID for logging (first 8 chars + ...).
 * Never log full user IDs.
 */
export function anonymizeId(id: string | undefined | null): string | undefined {
  if (!id) return undefined;
  if (id.length <= 8) return id;
  return `${id.substring(0, 8)}...`;
}

/**
 * Extract domain from URL for logging (without full URL for privacy).
 */
export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return "invalid-url";
  }
}

/**
 * Sanitize meta object to remove sensitive keys.
 */
function sanitizeMeta(meta?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!meta) return undefined;

  const sensitiveKeys = [
    "password",
    "token",
    "secret",
    "key",
    "authorization",
    "cookie",
    "session",
    "credit_card",
    "card_number",
    "cvv",
    "ssn",
  ];

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((s) => lowerKey.includes(s))) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "string" && value.length > 500 && !isDev) {
      // Truncate large strings in production
      sanitized[key] = value.substring(0, 500) + "...[truncated]";
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function formatLog(entry: LogEntry): string {
  const sanitizedEntry: LogEntry = {
    ...entry,
    meta: sanitizeMeta(entry.meta),
  };

  // In development, include more verbose output
  if (isDev) {
    return JSON.stringify(sanitizedEntry, null, 2);
  }

  // In production, compact JSON for Vercel Logs
  return JSON.stringify(sanitizedEntry);
}

interface LogOptions {
  errorId?: string;
  userId?: string;
  route?: string;
  action?: string;
  meta?: Record<string, unknown>;
}

/**
 * Main logger object with tagged logging methods.
 */
export const log = {
  info(tag: string, message: string, options?: LogOptions) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      tag,
      message,
      ...options,
    };
    console.log(formatLog(entry));
  },

  warn(tag: string, message: string, options?: LogOptions) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "warn",
      tag,
      message,
      ...options,
    };
    console.warn(formatLog(entry));
  },

  error(tag: string, message: string, options?: LogOptions) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "error",
      tag,
      message,
      ...options,
    };
    console.error(formatLog(entry));
  },
};

// Keep backward compatibility with existing logger usage
export const logger = {
  info(message: string, context?: Record<string, unknown>) {
    log.info("app", message, { meta: context });
  },
  warn(message: string, context?: Record<string, unknown>) {
    log.warn("app", message, { meta: context });
  },
  error(message: string, context?: Record<string, unknown>) {
    log.error("app", message, { meta: context });
  },
};

/**
 * Log an import failure with structured context.
 * Kept for backward compatibility with existing import code.
 */
export function logImportFailure(params: {
  source: "url" | "text";
  domain?: string;
  errorType: string;
  errorMessage: string;
  userId?: string;
  errorId?: string;
}) {
  log.error("import", "Import failed", {
    errorId: params.errorId,
    userId: anonymizeId(params.userId),
    action: "import_recipe",
    meta: {
      source: params.source,
      domain: params.domain,
      errorType: params.errorType,
      errorMessage: params.errorMessage,
    },
  });
}

// ============================================
// Pre-defined logging helpers for critical flows
// ============================================

/**
 * Log recipe operations (save, update, delete).
 */
export function logRecipeAction(
  action: "save" | "update" | "delete",
  success: boolean,
  params: {
    recipeId?: string;
    userId?: string;
    errorId?: string;
    error?: string;
  }
) {
  const level = success ? "info" : "error";
  const message = success ? `Recipe ${action} succeeded` : `Recipe ${action} failed`;

  log[level]("recipe", message, {
    action: `recipe_${action}`,
    errorId: params.errorId,
    userId: anonymizeId(params.userId),
    meta: {
      recipeId: params.recipeId,
      error: params.error,
    },
  });
}

/**
 * Log image upload operations.
 */
export function logImageAction(
  action: "upload" | "delete",
  success: boolean,
  params: {
    recipeId?: string;
    userId?: string;
    errorId?: string;
    error?: string;
    fileSize?: number;
  }
) {
  const level = success ? "info" : "error";
  const message = success ? `Image ${action} succeeded` : `Image ${action} failed`;

  log[level]("image", message, {
    action: `image_${action}`,
    errorId: params.errorId,
    userId: anonymizeId(params.userId),
    meta: {
      recipeId: params.recipeId,
      error: params.error,
      fileSize: params.fileSize,
    },
  });
}

/**
 * Log stack operations (add, remove, create, delete).
 */
export function logStackAction(
  action: "add_recipe" | "remove_recipe" | "create" | "update" | "delete",
  success: boolean,
  params: {
    stackId?: string;
    recipeId?: string;
    userId?: string;
    errorId?: string;
    error?: string;
  }
) {
  const level = success ? "info" : "error";
  const message = success ? `Stack ${action} succeeded` : `Stack ${action} failed`;

  log[level]("stack", message, {
    action: `stack_${action}`,
    errorId: params.errorId,
    userId: anonymizeId(params.userId),
    meta: {
      stackId: params.stackId,
      recipeId: params.recipeId,
      error: params.error,
    },
  });
}

/**
 * Log Stripe/billing operations.
 */
export function logStripeAction(
  action: "checkout_create" | "portal_create" | "webhook_received" | "webhook_processed" | "subscription_update",
  success: boolean,
  params: {
    userId?: string;
    customerId?: string;
    eventId?: string;
    eventType?: string;
    errorId?: string;
    error?: string;
    meta?: Record<string, unknown>;
  }
) {
  const level = success ? "info" : "error";
  const message = success ? `Stripe ${action} succeeded` : `Stripe ${action} failed`;

  log[level]("stripe", message, {
    action: `stripe_${action}`,
    errorId: params.errorId,
    userId: anonymizeId(params.userId),
    meta: {
      customerId: params.customerId,
      eventId: params.eventId,
      eventType: params.eventType,
      error: params.error,
      ...params.meta,
    },
  });
}

/**
 * Log onboarding operations.
 */
export function logOnboardingAction(
  success: boolean,
  params: {
    userId?: string;
    errorId?: string;
    error?: string;
  }
) {
  const level = success ? "info" : "error";
  const message = success ? "Onboarding completed" : "Onboarding failed";

  log[level]("onboarding", message, {
    action: "onboarding_save",
    errorId: params.errorId,
    userId: anonymizeId(params.userId),
    meta: {
      error: params.error,
    },
  });
}
