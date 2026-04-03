import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { revalidatePath } from "next/cache";
import { trackEventForUser } from "@/lib/analytics/events";
import { logStripeAction, generateErrorId, log } from "@/lib/logger";

// Disable body parsing - we need raw body for signature verification
export const runtime = "nodejs";

// Lazy-initialize Stripe client to avoid build-time errors
let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeClient) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

// ============================================================
// Type definitions for Stripe webhook payloads
// These match the actual API response, which may differ from SDK types
// ============================================================

interface StripeSubscriptionPayload {
  id: string;
  status: Stripe.Subscription.Status;
  customer: string;
  metadata: { user_id?: string };
  cancel_at_period_end: boolean;
  current_period_end: number;
  items: {
    data: Array<{
      current_period_end: number;
    }>;
  };
}

interface StripeInvoicePayload {
  id: string;
  subscription: string | null;
}

/**
 * Stripe Webhook Handler
 *
 * This is the ONLY source of truth for plan/billing updates.
 * All billing state changes flow through this endpoint.
 *
 * Events handled:
 * - checkout.session.completed: New subscription created
 * - customer.subscription.updated: Plan changes, renewals, cancellations scheduled
 * - customer.subscription.deleted: Subscription ended
 * - invoice.payment_failed: Payment issue, set past_due
 * - invoice.payment_succeeded: Payment successful, clear past_due
 *
 * Response codes:
 * - 200: Event processed or intentionally skipped (unknown events)
 * - 400: Signature verification failed (unrecoverable)
 * - 500: Transient processing error (Stripe should retry)
 */
export async function POST(request: NextRequest) {
  let eventId: string | undefined;
  let eventType: string | undefined;

  try {
    // 1. Verify webhook secret is configured
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      const errorId = generateErrorId();
      logStripeAction("webhook_received", false, {
        errorId,
        error: "STRIPE_WEBHOOK_SECRET is not configured",
      });
      return NextResponse.json(
        { error: "Webhook not configured" },
        { status: 500 }
      );
    }

    // 2. Get raw body and signature
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      const errorId = generateErrorId();
      logStripeAction("webhook_received", false, {
        errorId,
        error: "Missing stripe-signature header",
      });
      // Return 400 for signature issues - unrecoverable, no retry needed
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    // 3. Verify signature and construct event
    let event: Stripe.Event;
    try {
      event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const errorId = generateErrorId();
      const message = err instanceof Error ? err.message : "Unknown error";
      logStripeAction("webhook_received", false, {
        errorId,
        error: `Signature verification failed: ${message}`,
      });
      // Return 400 for signature failures - unrecoverable, no retry needed
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }

    eventId = event.id;
    eventType = event.type;

    // Log webhook received
    logStripeAction("webhook_received", true, {
      eventId: event.id,
      eventType: event.type,
    });

    // 4. Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as unknown as StripeSubscriptionPayload);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as unknown as StripeSubscriptionPayload);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as unknown as StripeInvoicePayload);
        break;

      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object as unknown as StripeInvoicePayload);
        break;

      default:
        // Unknown event types: log and return 200 to prevent retries
        log.info("stripe", "Unhandled webhook event type", {
          action: "webhook_skipped",
          meta: { eventId: event.id, eventType: event.type },
        });
    }

    // Log successful processing
    logStripeAction("webhook_processed", true, {
      eventId: event.id,
      eventType: event.type,
    });

    // 5. Return success
    return NextResponse.json({ received: true });
  } catch (error) {
    const errorId = generateErrorId();
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    logStripeAction("webhook_processed", false, {
      eventId,
      eventType,
      errorId,
      error: errorMessage,
    });

    // Return 500 for processing errors - Stripe should retry
    return NextResponse.json(
      { error: "Processing failed" },
      { status: 500 }
    );
  }
}

// ============================================================
// Event Handlers
// ============================================================

/**
 * Handle checkout.session.completed
 * Called when a customer completes checkout and subscription is created.
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  log.info("stripe", "Handling checkout.session.completed", {
    action: "checkout_completed",
    meta: { sessionId: session.id },
  });

  try {
    // Get user_id from metadata
    const userId = session.metadata?.user_id;
    if (!userId) {
      log.warn("stripe", "No user_id in checkout session metadata", {
        action: "checkout_completed",
        meta: { sessionId: session.id },
      });
      return;
    }

    // Get subscription details
    if (session.mode !== "subscription" || !session.subscription) {
      log.info("stripe", "Not a subscription checkout, skipping", {
        action: "checkout_completed",
        userId,
      });
      return;
    }

    // Fetch full subscription object
    const subscriptionResponse = await getStripe().subscriptions.retrieve(
      session.subscription as string
    );

    // Extract billing interval before casting to our simpler type
    const rawInterval = subscriptionResponse.items?.data?.[0]?.price?.recurring?.interval;
    const planInterval: "month" | "year" | null =
      rawInterval === "year" ? "year" : rawInterval === "month" ? "month" : null;

    // Cast to our payload type which matches actual API response
    const subscription = subscriptionResponse as unknown as StripeSubscriptionPayload;

    // Get period end from subscription items (v20 SDK change)
    const periodEnd = subscription.current_period_end ||
      subscription.items?.data?.[0]?.current_period_end ||
      Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // Fallback: 30 days

    log.info("stripe", "checkout.session.completed: updating billing", {
      action: "checkout_completed",
      userId,
      meta: {
        customerId: typeof session.customer === "string" ? session.customer : null,
        subscriptionId: subscription.id,
        status: subscription.status,
        planInterval,
        periodEnd: new Date(periodEnd * 1000).toISOString(),
      },
    });

    await updateUserBilling(userId, {
      plan: "plus",
      planStatus: mapStripeStatus(subscription.status),
      planInterval,
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: subscription.id,
      currentPeriodEnd: new Date(periodEnd * 1000),
      pastDueSince: null, // Clear any past_due state
    });

    // Track subscription activation (non-blocking)
    try {
      trackEventForUser(userId, "subscription_activated", {
        plan: "plus",
      });
    } catch {
      // Analytics should never break webhook
    }

    logStripeAction("subscription_update", true, {
      userId,
      customerId: session.customer as string,
    });
  } catch (err) {
    const errorId = generateErrorId();
    const message = err instanceof Error ? err.message : String(err);
    log.error("stripe", "checkout.session.completed handler threw", {
      errorId,
      action: "checkout_completed",
      meta: {
        sessionId: session.id,
        customerId: typeof session.customer === "string" ? session.customer : null,
        subscriptionId: typeof session.subscription === "string" ? session.subscription : null,
        error: message,
      },
    });
    throw err;
  }
}

/**
 * Handle customer.subscription.updated
 * Called on renewals, plan changes, cancellation scheduled, etc.
 */
async function handleSubscriptionUpdated(subscription: StripeSubscriptionPayload) {
  log.info("stripe", "Handling subscription updated", {
    action: "subscription_updated",
    meta: { subscriptionId: subscription.id, status: subscription.status },
  });

  try {
    // "incomplete" subscriptions are payment-pending — checkout.session.completed
    // handles the upgrade. Processing here would incorrectly set plan = "free".
    if (subscription.status === "incomplete" || subscription.status === "incomplete_expired") {
      log.info("stripe", "Skipping incomplete subscription — checkout.session.completed will handle upgrade", {
        action: "subscription_updated",
        meta: { subscriptionId: subscription.id, status: subscription.status },
      });
      return;
    }

    // Get user_id from subscription metadata or look up by customer
    const userId = await resolveUserId(subscription);
    if (!userId) {
      log.warn("stripe", "Could not resolve user for subscription", {
        action: "subscription_updated",
        meta: { subscriptionId: subscription.id },
      });
      return;
    }

    const status = mapStripeStatus(subscription.status);

    // Determine plan based on status
    // If canceled but not yet ended, keep plus until period end
    const isActiveSubscription = ["active", "trialing", "past_due"].includes(subscription.status);
    const plan = isActiveSubscription ? "plus" : "free";

    // Check if cancellation is scheduled (cancel_at_period_end)
    const effectiveStatus = subscription.cancel_at_period_end ? "canceled" : status;

    // Get period end from subscription
    const periodEnd = subscription.current_period_end ||
      subscription.items?.data?.[0]?.current_period_end ||
      Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

    log.info("stripe", "customer.subscription event: updating billing", {
      action: "subscription_updated",
      userId,
      meta: {
        subscriptionId: subscription.id,
        plan,
        status: effectiveStatus,
        periodEnd: new Date(periodEnd * 1000).toISOString(),
      },
    });

    await updateUserBilling(userId, {
      plan,
      planStatus: effectiveStatus,
      stripeSubscriptionId: subscription.id,
      currentPeriodEnd: new Date(periodEnd * 1000),
    });

    logStripeAction("subscription_update", true, {
      userId,
      meta: { plan, status: effectiveStatus },
    });
  } catch (err) {
    const errorId = generateErrorId();
    const message = err instanceof Error ? err.message : String(err);
    log.error("stripe", "customer.subscription handler threw", {
      errorId,
      action: "subscription_updated",
      meta: {
        subscriptionId: subscription.id,
        status: subscription.status,
        error: message,
      },
    });
    throw err;
  }
}

/**
 * Handle customer.subscription.deleted
 * Called when subscription actually ends (after grace period or immediate cancel).
 */
async function handleSubscriptionDeleted(subscription: StripeSubscriptionPayload) {
  log.info("stripe", "Handling subscription deleted", {
    action: "subscription_deleted",
    meta: { subscriptionId: subscription.id },
  });

  const userId = await resolveUserId(subscription);
  if (!userId) {
    log.warn("stripe", "Could not resolve user for subscription", {
      action: "subscription_deleted",
      meta: { subscriptionId: subscription.id },
    });
    return;
  }

  // Get period end from subscription
  const periodEndTimestamp = subscription.current_period_end ||
    subscription.items?.data?.[0]?.current_period_end ||
    Math.floor(Date.now() / 1000);

  const periodEnd = new Date(periodEndTimestamp * 1000);
  const now = new Date();

  if (now >= periodEnd) {
    // Period has ended, revert to free
    await updateUserBilling(userId, {
      plan: "free",
      planStatus: "inactive",
      // Keep stripe IDs for reference
      currentPeriodEnd: periodEnd,
      pastDueSince: null,
    });
    logStripeAction("subscription_update", true, {
      userId,
      meta: { plan: "free", status: "inactive" },
    });
  } else {
    // Still within paid period (shouldn't happen with deleted, but handle gracefully)
    await updateUserBilling(userId, {
      plan: "plus",
      planStatus: "canceled",
      currentPeriodEnd: periodEnd,
    });
    logStripeAction("subscription_update", true, {
      userId,
      meta: { plan: "plus", status: "canceled", periodEnd: periodEnd.toISOString() },
    });
  }
}

/**
 * Handle invoice.payment_failed
 * Set past_due status and record when it started.
 */
async function handlePaymentFailed(invoice: StripeInvoicePayload) {
  log.info("stripe", "Handling payment failed", {
    action: "payment_failed",
    meta: { invoiceId: invoice.id },
  });

  if (!invoice.subscription) {
    log.info("stripe", "Invoice not associated with subscription, skipping", {
      action: "payment_failed",
      meta: { invoiceId: invoice.id },
    });
    return;
  }

  // Get subscription to find user
  const subscriptionResponse = await getStripe().subscriptions.retrieve(invoice.subscription);
  const subscription = subscriptionResponse as unknown as StripeSubscriptionPayload;

  const userId = await resolveUserId(subscription);
  if (!userId) {
    log.warn("stripe", "Could not resolve user for invoice", {
      action: "payment_failed",
      meta: { invoiceId: invoice.id },
    });
    return;
  }

  // Only set past_due_since if not already set
  const adminClient = createAdminClient();
  const { data: prefs } = await adminClient
    .from("user_preferences")
    .select("past_due_since")
    .eq("user_id", userId)
    .single();

  await updateUserBilling(userId, {
    planStatus: "past_due",
    // Only set past_due_since if not already set (preserve original date)
    pastDueSince: prefs?.past_due_since ? undefined : new Date(),
  });

  logStripeAction("subscription_update", true, {
    userId,
    meta: { status: "past_due" },
  });
}

/**
 * Handle invoice.payment_succeeded
 * Clear past_due status on successful payment.
 */
async function handlePaymentSucceeded(invoice: StripeInvoicePayload) {
  log.info("stripe", "Handling payment succeeded", {
    action: "payment_succeeded",
    meta: { invoiceId: invoice.id },
  });

  try {
    if (!invoice.subscription) {
      log.info("stripe", "Invoice not associated with subscription, skipping", {
        action: "payment_succeeded",
        meta: { invoiceId: invoice.id },
      });
      return;
    }

    // Get subscription to find user
    const subscriptionResponse = await getStripe().subscriptions.retrieve(invoice.subscription);

    // Extract billing interval before casting to our simpler type
    const rawInterval = subscriptionResponse.items?.data?.[0]?.price?.recurring?.interval;
    const planInterval: "month" | "year" | null =
      rawInterval === "year" ? "year" : rawInterval === "month" ? "month" : null;

    const subscription = subscriptionResponse as unknown as StripeSubscriptionPayload;

    const userId = await resolveUserId(subscription);
    if (!userId) {
      log.warn("stripe", "Could not resolve user for invoice", {
        action: "payment_succeeded",
        meta: { invoiceId: invoice.id, subscriptionId: subscription.id },
      });
      return;
    }

    // Get period end from subscription
    const periodEnd = subscription.current_period_end ||
      subscription.items?.data?.[0]?.current_period_end ||
      Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

    log.info("stripe", "invoice.payment_succeeded: updating billing", {
      action: "payment_succeeded",
      userId,
      meta: {
        invoiceId: invoice.id,
        subscriptionId: subscription.id,
        planInterval,
        periodEnd: new Date(periodEnd * 1000).toISOString(),
      },
    });

    await updateUserBilling(userId, {
      plan: "plus",
      planStatus: "active",
      planInterval,
      pastDueSince: null, // Clear past_due state
      currentPeriodEnd: new Date(periodEnd * 1000),
    });

    logStripeAction("subscription_update", true, {
      userId,
      meta: { plan: "plus", status: "active" },
    });
  } catch (err) {
    const errorId = generateErrorId();
    const message = err instanceof Error ? err.message : String(err);
    log.error("stripe", "invoice.payment_succeeded handler threw", {
      errorId,
      action: "payment_succeeded",
      meta: {
        invoiceId: invoice.id,
        subscriptionId: invoice.subscription,
        error: message,
      },
    });
    throw err;
  }
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Resolve Supabase user_id from subscription metadata or customer lookup.
 */
async function resolveUserId(subscription: StripeSubscriptionPayload): Promise<string | null> {
  // 1. Try subscription metadata
  if (subscription.metadata?.user_id) {
    return subscription.metadata.user_id;
  }

  // 2. Look up by stripe_customer_id
  const customerId = subscription.customer;
  if (customerId) {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from("user_preferences")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .single();

    if (data?.user_id) {
      return data.user_id;
    }
  }

  return null;
}

/**
 * Map Stripe subscription status to our plan_status.
 */
function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): string {
  switch (stripeStatus) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
      return "canceled";
    case "incomplete":
    case "incomplete_expired":
    case "paused":
    default:
      return "inactive";
  }
}

/**
 * Update user billing fields in Supabase.
 * Uses service role to bypass RLS.
 * Idempotent - safe to call multiple times with same data.
 */
interface BillingUpdate {
  plan?: "free" | "plus" | "ai";
  planStatus?: string;
  planInterval?: "month" | "year" | null;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: Date;
  pastDueSince?: Date | null;
  meta?: Record<string, unknown>;
}

async function updateUserBilling(userId: string, updates: BillingUpdate): Promise<void> {
  const adminClient = createAdminClient();

  // Build update object with snake_case keys
  const updateData: Record<string, unknown> = {};

  if (updates.plan !== undefined) {
    updateData.plan = updates.plan;
  }
  if (updates.planStatus !== undefined) {
    updateData.plan_status = updates.planStatus;
  }
  if (updates.planInterval !== undefined) {
    updateData.plan_interval = updates.planInterval ?? null;
  }
  if (updates.stripeCustomerId !== undefined) {
    updateData.stripe_customer_id = updates.stripeCustomerId;
  }
  if (updates.stripeSubscriptionId !== undefined) {
    updateData.stripe_subscription_id = updates.stripeSubscriptionId;
  }
  if (updates.currentPeriodEnd !== undefined) {
    updateData.current_period_end = updates.currentPeriodEnd.toISOString();
  }
  if (updates.pastDueSince !== undefined) {
    updateData.past_due_since = updates.pastDueSince?.toISOString() ?? null;
  }

  // Also update recipe_limit based on plan
  if (updates.plan === "plus" || updates.plan === "ai") {
    updateData.recipe_limit = null; // Unlimited
  } else if (updates.plan === "free") {
    updateData.recipe_limit = 25; // Free tier limit
  }

  log.info("stripe", "Applying billing update to user_preferences", {
    action: "billing_update",
    userId,
    meta: { columns: Object.keys(updateData) },
  });

  const { error } = await adminClient
    .from("user_preferences")
    .update(updateData)
    .eq("user_id", userId);

  if (error) {
    const errorId = generateErrorId();
    log.error("stripe", "Failed to update user billing", {
      errorId,
      userId,
      action: "billing_update",
      meta: {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        columns: Object.keys(updateData),
      },
    });

    // If the error is a missing column (migration not yet applied), strip that
    // column and retry so the critical plan/status fields still land.
    // Handles both PostgREST format:   "Could not find the 'col' column of 'table' in the schema cache"
    // and PostgreSQL format:           "column "col" of relation "table" does not exist"
    const extractMissingColumn = (msg: string): string | null => {
      const postgrestMatch = msg.match(/Could not find the '(\w+)' column/i);
      if (postgrestMatch) return postgrestMatch[1];
      const postgresMatch = msg.match(/column ["']?(\w+)["']? (?:of relation .+? )?does not exist/i);
      if (postgresMatch) return postgresMatch[1];
      return null;
    };

    const retryData = { ...updateData };
    let currentError = error;

    for (let attempt = 0; attempt < 5; attempt++) {
      const missingCol = extractMissingColumn(currentError.message ?? "");
      if (!missingCol) break;

      log.warn("stripe", `Column '${missingCol}' not found — retrying without it. Apply outstanding migrations.`, {
        action: "billing_update",
        userId,
      });

      delete retryData[missingCol];
      if (Object.keys(retryData).length === 0) break;

      const retryResult = await adminClient
        .from("user_preferences")
        .update(retryData)
        .eq("user_id", userId);

      if (!retryResult.error) {
        // Retry succeeded — still revalidate
        revalidatePath("/settings");
        revalidatePath("/upgrade");
        revalidatePath("/recipes", "layout");
        return;
      }

      currentError = retryResult.error;
      log.error("stripe", "Retry after missing column also failed", {
        action: "billing_update",
        userId,
        meta: { error: currentError.message, remainingColumns: Object.keys(retryData) },
      });
    }

    throw currentError;
  }

  // Revalidate paths that depend on billing/plan status
  // This ensures users see updated UI after plan changes
  revalidatePath("/settings");
  revalidatePath("/upgrade");
  revalidatePath("/recipes", "layout");
}
