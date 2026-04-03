import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { trackEventAsync } from "@/lib/analytics/events";
import { logStripeAction, generateErrorId } from "@/lib/logger";

export async function POST(req: Request) {
  let userId: string | undefined;

  try {
    // 1. Verify Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      const errorId = generateErrorId();
      logStripeAction("checkout_create", false, {
        errorId,
        error: "STRIPE_SECRET_KEY is not configured",
      });
      return NextResponse.json(
        { error: "Billing is not configured" },
        { status: 500 }
      );
    }

    const monthlyPriceId = process.env.STRIPE_PRICE_ID_PLUS_MONTHLY;
    const yearlyPriceId = process.env.STRIPE_PRICE_ID_PLUS_YEARLY;

    if (!monthlyPriceId || !yearlyPriceId) {
      const errorId = generateErrorId();
      logStripeAction("checkout_create", false, {
        errorId,
        error: "STRIPE_PRICE_ID_PLUS_MONTHLY or STRIPE_PRICE_ID_PLUS_YEARLY is not configured",
      });
      return NextResponse.json(
        { error: "Pricing is not configured" },
        { status: 500 }
      );
    }

    // 2. Validate priceId from request body
    const body = await req.json().catch(() => ({}));
    const { priceId } = body as { priceId?: string };

    if (!priceId || (priceId !== monthlyPriceId && priceId !== yearlyPriceId)) {
      return NextResponse.json(
        { error: "Invalid price selection" },
        { status: 400 }
      );
    }

    // 3. Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Please sign in to continue" }, { status: 401 });
    }

    userId = user.id;

    // 3. Get existing stripe_customer_id from user_preferences
    const { data: prefs, error: prefsError } = await supabase
      .from("user_preferences")
      .select("stripe_customer_id, plan")
      .eq("user_id", user.id)
      .single();

    if (prefsError && prefsError.code !== "PGRST116") {
      const errorId = generateErrorId();
      logStripeAction("checkout_create", false, {
        userId: user.id,
        errorId,
        error: `Failed to fetch preferences: ${prefsError.message}`,
      });
      return NextResponse.json(
        { error: "Failed to fetch account information" },
        { status: 500 }
      );
    }

    // Check if user already has plus plan
    if (prefs?.plan === "plus") {
      return NextResponse.json(
        { error: "You already have a Plus subscription" },
        { status: 400 }
      );
    }

    // 4. Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    let stripeCustomerId = prefs?.stripe_customer_id;

    // 5. Create Stripe customer if needed
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });

      stripeCustomerId = customer.id;

      // Persist stripe_customer_id using admin client (bypasses RLS)
      const adminClient = createAdminClient();
      const { error: updateError } = await adminClient
        .from("user_preferences")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("user_id", user.id);

      if (updateError) {
        // Log but continue - customer is created in Stripe, webhook will reconcile
        logStripeAction("checkout_create", false, {
          userId: user.id,
          customerId: stripeCustomerId,
          error: `Failed to persist customer ID: ${updateError.message}`,
        });
      }
    }

    // 6. Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
        },
      },
      success_url: `${appUrl}/recipes?upgraded=true`,
      cancel_url: `${appUrl}/upgrade`,
      // Allow promotion codes
      allow_promotion_codes: true,
      // Collect billing address for tax compliance
      billing_address_collection: "auto",
    });

    logStripeAction("checkout_create", true, {
      userId: user.id,
      customerId: stripeCustomerId,
    });

    // 7. Track checkout started (non-blocking)
    try {
      trackEventAsync("checkout_started", {
        plan: "plus",
      });
    } catch {
      // Analytics should never break checkout
    }

    // 8. Return checkout URL
    return NextResponse.json({ url: session.url });
  } catch (error) {
    const errorId = generateErrorId();
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    logStripeAction("checkout_create", false, {
      userId,
      errorId,
      error: errorMessage,
    });

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: "Failed to create checkout session. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
