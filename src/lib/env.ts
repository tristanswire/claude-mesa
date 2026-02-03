import { z } from "zod";

/**
 * Environment variable validation using Zod.
 *
 * This module validates required environment variables at startup
 * and provides type-safe access to them.
 *
 * Public vars (NEXT_PUBLIC_*) are available on client and server.
 * Server vars are only available on the server.
 */

// ============================================================
// SCHEMAS
// ============================================================

/**
 * Public environment variables (exposed to client).
 * These are embedded in the client bundle at build time.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL must be a valid URL")
    .optional()
    .default("http://localhost:3000"),
});

/**
 * Server-only environment variables.
 * These are never exposed to the client bundle.
 */
const serverEnvSchema = z.object({
  // Supabase service role (for admin operations like webhooks)
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY is required for server operations")
    .optional(),

  // Stripe (optional - only required if billing is enabled)
  STRIPE_SECRET_KEY: z
    .string()
    .startsWith("sk_", "STRIPE_SECRET_KEY must start with 'sk_'")
    .optional(),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .startsWith("whsec_", "STRIPE_WEBHOOK_SECRET must start with 'whsec_'")
    .optional(),
  STRIPE_PRICE_ID_PLUS: z
    .string()
    .startsWith("price_", "STRIPE_PRICE_ID_PLUS must start with 'price_'")
    .optional(),
});

// ============================================================
// VALIDATION
// ============================================================

/**
 * Validate public environment variables.
 * Safe to call from client or server.
 */
function validatePublicEnv() {
  const result = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const errorMessages = Object.entries(errors)
      .map(([key, msgs]) => `  ${key}: ${msgs?.join(", ")}`)
      .join("\n");

    throw new Error(
      `Missing or invalid public environment variables:\n${errorMessages}\n\n` +
        "See README.md for required environment variables."
    );
  }

  return result.data;
}

/**
 * Validate server environment variables.
 * Only call from server-side code.
 */
function validateServerEnv() {
  // Skip validation on client
  if (typeof window !== "undefined") {
    throw new Error("Server environment variables cannot be accessed on client");
  }

  const result = serverEnvSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_ID_PLUS: process.env.STRIPE_PRICE_ID_PLUS,
  });

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const errorMessages = Object.entries(errors)
      .map(([key, msgs]) => `  ${key}: ${msgs?.join(", ")}`)
      .join("\n");

    throw new Error(
      `Invalid server environment variables:\n${errorMessages}\n\n` +
        "See README.md for required environment variables."
    );
  }

  return result.data;
}

// ============================================================
// EXPORTS
// ============================================================

/**
 * Validated public environment variables.
 * Safe to use on client and server.
 */
export const publicEnv = validatePublicEnv();

/**
 * Get validated server environment variables.
 * Only use in server-side code (API routes, server components, server actions).
 *
 * @throws Error if called on client or if validation fails
 */
export function getServerEnv() {
  return {
    ...publicEnv,
    ...validateServerEnv(),
  };
}

/**
 * Check if Stripe billing is configured.
 * Use this to conditionally enable billing features.
 */
export function isStripeConfigured(): boolean {
  if (typeof window !== "undefined") {
    // Can't check server vars on client, assume configured
    return true;
  }

  return !!(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_WEBHOOK_SECRET &&
    process.env.STRIPE_PRICE_ID_PLUS
  );
}

/**
 * Validate all required environment variables.
 * Call this at application startup to fail fast.
 */
export function validateEnv(): void {
  // Always validate public vars
  validatePublicEnv();

  // Validate server vars on server only
  if (typeof window === "undefined") {
    validateServerEnv();
  }
}

// ============================================================
// TYPE EXPORTS
// ============================================================

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;
