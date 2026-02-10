import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { logStripeAction, generateErrorId } from "@/lib/logger";

export async function POST() {
  let userId: string | undefined;

  try {
    // 1. Verify Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      const errorId = generateErrorId();
      logStripeAction("portal_create", false, {
        errorId,
        error: "STRIPE_SECRET_KEY is not configured",
      });
      return NextResponse.json(
        { error: "Billing is not configured" },
        { status: 500 }
      );
    }

    // 2. Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Please sign in to continue" }, { status: 401 });
    }

    userId = user.id;

    // 3. Get stripe_customer_id from user_preferences
    const { data, error } = await supabase
      .from("user_preferences")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (error) {
      const errorId = generateErrorId();
      logStripeAction("portal_create", false, {
        userId: user.id,
        errorId,
        error: `Failed to fetch preferences: ${error.message}`,
      });
      return NextResponse.json(
        { error: "Failed to fetch billing information" },
        { status: 500 }
      );
    }

    if (!data?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No billing account found. Please upgrade first." },
        { status: 400 }
      );
    }

    // 4. Create Stripe portal session
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const returnUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.billingPortal.sessions.create({
      customer: data.stripe_customer_id,
      return_url: `${returnUrl}/settings`,
    });

    logStripeAction("portal_create", true, {
      userId: user.id,
      customerId: data.stripe_customer_id,
    });

    // 5. Return portal URL
    return NextResponse.json({ url: session.url });
  } catch (error) {
    const errorId = generateErrorId();
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    logStripeAction("portal_create", false, {
      userId,
      errorId,
      error: errorMessage,
    });

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: "Failed to access billing portal. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
