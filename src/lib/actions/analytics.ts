"use server";

import { trackEvent } from "@/lib/analytics/events";
import type { EventName, EventMetadata } from "@/lib/analytics/events";

/**
 * Server action wrapper for tracking events from client components.
 * Client components cannot call server-only analytics functions directly,
 * so they call this server action instead.
 */
export async function trackClientEvent(
  eventName: EventName,
  metadata?: EventMetadata
): Promise<void> {
  await trackEvent(eventName, metadata);
}
