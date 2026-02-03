import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST() {
  try {
    // 1. Verify Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY is not configured");
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. Get stripe_customer_id from user_preferences
    const { data, error } = await supabase
      .from("user_preferences")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Error fetching user preferences:", error);
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

    // 5. Return portal URL
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating portal session:", error);

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: "Failed to access billing portal. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
