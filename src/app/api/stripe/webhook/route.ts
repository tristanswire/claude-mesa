import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { trackEventForUser } from "@/lib/analytics/events";

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
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify webhook secret is configured
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET is not configured");
      return NextResponse.json(
        { error: "Webhook not configured" },
        { status: 500 }
      );
    }

    // 2. Get raw body and signature
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      console.error("Missing stripe-signature header");
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
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Webhook signature verification failed:", message);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${message}` },
        { status: 400 }
      );
    }

    // 4. Handle the event
    console.log(`Processing webhook event: ${event.type} (${event.id})`);

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
        console.log(`Unhandled event type: ${event.type}`);
    }

    // 5. Return success
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    // Return 200 to prevent Stripe retries for unrecoverable errors
    // Log the error for investigation
    return NextResponse.json({ received: true, error: "Internal error logged" });
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
  console.log("Handling checkout.session.completed:", session.id);

  // Get user_id from metadata
  const userId = session.metadata?.user_id;
  if (!userId) {
    console.error("No user_id in checkout session metadata:", session.id);
    return;
  }

  // Get subscription details
  if (session.mode !== "subscription" || !session.subscription) {
    console.log("Not a subscription checkout, skipping");
    return;
  }

  // Fetch full subscription object
  const subscriptionResponse = await getStripe().subscriptions.retrieve(
    session.subscription as string
  );
  // Cast to our payload type which matches actual API response
  const subscription = subscriptionResponse as unknown as StripeSubscriptionPayload;

  // Get period end from subscription items (v20 SDK change)
  const periodEnd = subscription.current_period_end ||
    subscription.items?.data?.[0]?.current_period_end ||
    Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // Fallback: 30 days

  await updateUserBilling(userId, {
    plan: "plus",
    planStatus: mapStripeStatus(subscription.status),
    stripeCustomerId: session.customer as string,
    stripeSubscriptionId: subscription.id,
    currentPeriodEnd: new Date(periodEnd * 1000),
    pastDueSince: null, // Clear any past_due state
  });

  // Track subscription activation (non-blocking)
  trackEventForUser(userId, "subscription_activated", {
    plan: "plus",
  }).catch(() => {
    // Silently ignore - analytics should never break webhook
  });

  console.log(`Checkout completed for user ${userId}, plan set to plus`);
}

/**
 * Handle customer.subscription.updated
 * Called on renewals, plan changes, cancellation scheduled, etc.
 */
async function handleSubscriptionUpdated(subscription: StripeSubscriptionPayload) {
  console.log("Handling subscription updated:", subscription.id, subscription.status);

  // Get user_id from subscription metadata or look up by customer
  const userId = await resolveUserId(subscription);
  if (!userId) {
    console.error("Could not resolve user for subscription:", subscription.id);
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

  await updateUserBilling(userId, {
    plan,
    planStatus: effectiveStatus,
    stripeSubscriptionId: subscription.id,
    currentPeriodEnd: new Date(periodEnd * 1000),
  });

  console.log(`Subscription updated for user ${userId}: plan=${plan}, status=${effectiveStatus}`);
}

/**
 * Handle customer.subscription.deleted
 * Called when subscription actually ends (after grace period or immediate cancel).
 */
async function handleSubscriptionDeleted(subscription: StripeSubscriptionPayload) {
  console.log("Handling subscription deleted:", subscription.id);

  const userId = await resolveUserId(subscription);
  if (!userId) {
    console.error("Could not resolve user for subscription:", subscription.id);
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
    console.log(`Subscription ended for user ${userId}, reverted to free`);
  } else {
    // Still within paid period (shouldn't happen with deleted, but handle gracefully)
    await updateUserBilling(userId, {
      plan: "plus",
      planStatus: "canceled",
      currentPeriodEnd: periodEnd,
    });
    console.log(`Subscription canceled for user ${userId}, plus until ${periodEnd}`);
  }
}

/**
 * Handle invoice.payment_failed
 * Set past_due status and record when it started.
 */
async function handlePaymentFailed(invoice: StripeInvoicePayload) {
  console.log("Handling payment failed:", invoice.id);

  if (!invoice.subscription) {
    console.log("Invoice not associated with subscription, skipping");
    return;
  }

  // Get subscription to find user
  const subscriptionResponse = await getStripe().subscriptions.retrieve(invoice.subscription);
  const subscription = subscriptionResponse as unknown as StripeSubscriptionPayload;

  const userId = await resolveUserId(subscription);
  if (!userId) {
    console.error("Could not resolve user for invoice:", invoice.id);
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

  console.log(`Payment failed for user ${userId}, status set to past_due`);
}

/**
 * Handle invoice.payment_succeeded
 * Clear past_due status on successful payment.
 */
async function handlePaymentSucceeded(invoice: StripeInvoicePayload) {
  console.log("Handling payment succeeded:", invoice.id);

  if (!invoice.subscription) {
    console.log("Invoice not associated with subscription, skipping");
    return;
  }

  // Get subscription to find user
  const subscriptionResponse = await getStripe().subscriptions.retrieve(invoice.subscription);
  const subscription = subscriptionResponse as unknown as StripeSubscriptionPayload;

  const userId = await resolveUserId(subscription);
  if (!userId) {
    console.error("Could not resolve user for invoice:", invoice.id);
    return;
  }

  // Get period end from subscription
  const periodEnd = subscription.current_period_end ||
    subscription.items?.data?.[0]?.current_period_end ||
    Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

  await updateUserBilling(userId, {
    plan: "plus",
    planStatus: "active",
    pastDueSince: null, // Clear past_due state
    currentPeriodEnd: new Date(periodEnd * 1000),
  });

  console.log(`Payment succeeded for user ${userId}, status set to active`);
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
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: Date;
  pastDueSince?: Date | null;
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
    updateData.recipe_limit = 25;
  }

  const { error } = await adminClient
    .from("user_preferences")
    .update(updateData)
    .eq("user_id", userId);

  if (error) {
    console.error(`Failed to update billing for user ${userId}:`, error);
    throw error;
  }
}
