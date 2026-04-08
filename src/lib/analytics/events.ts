/**
 * Lightweight analytics event tracking.
 * Non-blocking: failures never break user flows.
 */

import { createClient, createAdminClient } from "@/lib/supabase/server";

// Event names - typed for consistency
export type EventName =
  | "sign_up"
  | "onboarding_completed"
  | "onboarding_skipped"
  | "recipe_import_started"
  | "recipe_created"
  | "recipe_saved"
  | "recipe_deleted"
  | "added_to_stack"
  | "removed_from_stack"
  | "stack_created"
  | "upgrade_clicked"
  | "checkout_started"
  | "subscription_activated"
  | "sample_recipe_created";

export interface EventMetadata {
  // Recipe events
  recipeId?: string;
  recipeTitle?: string;
  sourceUrl?: string;
  importMethod?: "url" | "text" | "manual";

  // Collection events
  collectionId?: string;
  collectionName?: string;

  // Onboarding events
  unitSystem?: string;

  // Billing events
  plan?: string;

  // Generic
  [key: string]: unknown;
}

/**
 * Track a product event.
 * This is non-blocking and will never throw or break the calling flow.
 *
 * @param eventName - The event identifier
 * @param metadata - Optional metadata for the event
 */
export async function trackEvent(
  eventName: EventName,
  metadata?: EventMetadata
): Promise<void> {
  try {
    const supabase = await createClient();

    // Get current user - if not authenticated, skip tracking
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Not authenticated, silently skip
      return;
    }

    // Insert event - fire and forget pattern
    const { error } = await supabase.from("events").insert({
      user_id: user.id,
      event_name: eventName,
      metadata: metadata || {},
    });

    if (error) {
      // Log but don't throw - analytics should never break user flows
      console.warn(`[Analytics] Failed to track event "${eventName}":`, error.message);
    }
  } catch (err) {
    // Catch any unexpected errors - log and continue
    console.warn(`[Analytics] Error tracking event "${eventName}":`, err);
  }
}

/**
 * Track event without awaiting - truly fire-and-forget.
 * Use this when you don't want to add any latency to the calling flow.
 */
export function trackEventAsync(
  eventName: EventName,
  metadata?: EventMetadata
): void {
  // Fire and forget - don't await
  trackEvent(eventName, metadata).catch(() => {
    // Silently ignore - already logged in trackEvent
  });
}

/**
 * Track event for a specific user (used in webhook contexts).
 * Uses admin client to bypass RLS.
 */
export async function trackEventForUser(
  userId: string,
  eventName: EventName,
  metadata?: EventMetadata
): Promise<void> {
  try {
    const adminClient = createAdminClient();

    const { error } = await adminClient.from("events").insert({
      user_id: userId,
      event_name: eventName,
      metadata: metadata || {},
    });

    if (error) {
      console.warn(`[Analytics] Failed to track event "${eventName}" for user ${userId}:`, error.message);
    }
  } catch (err) {
    console.warn(`[Analytics] Error tracking event "${eventName}" for user ${userId}:`, err);
  }
}
