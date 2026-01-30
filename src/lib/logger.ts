/**
 * Simple server-side logging utility.
 * Structured logging for import failures and other server events.
 *
 * In production, consider integrating with:
 * - Vercel Logs
 * - Sentry
 * - LogFlare
 * - DataDog
 */

type LogLevel = "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

function formatLog(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    level,
    message,
    ...context,
  };
  return JSON.stringify(logData);
}

export const logger = {
  info(message: string, context?: LogContext) {
    console.log(formatLog("info", message, context));
  },

  warn(message: string, context?: LogContext) {
    console.warn(formatLog("warn", message, context));
  },

  error(message: string, context?: LogContext) {
    console.error(formatLog("error", message, context));
  },
};

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
 * Log an import failure with structured context.
 */
export function logImportFailure(params: {
  source: "url" | "text";
  domain?: string;
  errorType: string;
  errorMessage: string;
  userId?: string;
}) {
  logger.error("Import failed", {
    source: params.source,
    domain: params.domain,
    errorType: params.errorType,
    errorMessage: params.errorMessage,
    userId: params.userId ? params.userId.substring(0, 8) + "..." : undefined,
  });
}
