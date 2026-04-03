# Stripe Production Setup — Mesa

---

## 1. Switch to Live Mode

In Stripe Dashboard, toggle the **Test mode** switch (top right) to **Live mode**.

> All steps below must be completed in **Live mode**.

---

## 2. Create Mesa Plus Product

**Dashboard → Product catalog → + Add product**

| Field | Value |
|---|---|
| Name | Mesa Plus |
| Description | Unlimited recipes, all import types, priority support |

Add two prices to this product:

### Monthly price
| Field | Value |
|---|---|
| Pricing model | Standard pricing |
| Price | $4.99 |
| Billing period | Monthly |
| Currency | USD |

### Annual price
| Field | Value |
|---|---|
| Pricing model | Standard pricing |
| Price | $39.99 |
| Billing period | Yearly |
| Currency | USD |

After saving, copy both **Price IDs** (format: `price_...`).

- Monthly Price ID → `STRIPE_PRICE_ID_PLUS_MONTHLY` in Vercel
- Yearly Price ID → `STRIPE_PRICE_ID_PLUS_YEARLY` in Vercel

---

## 3. Copy Live API Keys

**Dashboard → Developers → API keys**

| Key | Vercel Variable |
|---|---|
| Publishable key (`pk_live_...`) | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| Secret key (`sk_live_...`) | `STRIPE_SECRET_KEY` (mark Sensitive) |

---

## 4. Create Production Webhook Endpoint

**Dashboard → Developers → Webhooks → + Add endpoint**

| Field | Value |
|---|---|
| Endpoint URL | `https://your-production-domain.com/api/stripe/webhook` |
| API version | Latest (or match your existing test endpoint version) |

Subscribe to these events:

- [x] `checkout.session.completed`
- [x] `customer.subscription.created`
- [x] `customer.subscription.updated`
- [x] `customer.subscription.deleted`
- [x] `invoice.payment_succeeded`
- [x] `invoice.payment_failed`

After creating the endpoint:

1. Click the endpoint to open it
2. Under **Signing secret**, click **Reveal** and copy the value (`whsec_...`)
3. Add to Vercel as `STRIPE_WEBHOOK_SECRET` (mark Sensitive)

> The signing secret is different for each endpoint. The test mode signing secret will not work for live events.

---

## 5. Configure Customer Portal

**Dashboard → Settings → Billing → Customer portal**

Enable the portal so users can manage their subscription via `/settings`.

Recommended settings:
- [ ] Allow customers to cancel subscriptions
- [ ] Allow customers to update payment methods
- [ ] Allow customers to view invoice history
- [ ] Cancellation: cancel at end of billing period (not immediately)

---

## 6. Test the Live Checkout Flow

After deploying with live keys:

1. Open `https://your-production-domain.com/upgrade`
2. Click **Upgrade to Plus**
3. Use a real card (you will be charged — refund immediately after testing)
4. Confirm redirect to `/recipes?upgraded=true`
5. Confirm `user_preferences.plan = 'plus'` in Supabase for your user

Alternatively, use [Stripe's test clock feature](https://stripe.com/docs/billing/testing/test-clocks) for subscription lifecycle testing without live charges.

---

## 7. Monitor Webhook Delivery

**Dashboard → Developers → Webhooks → your endpoint → Recent deliveries**

After a test purchase, verify:
- `checkout.session.completed` → 200 OK
- `customer.subscription.created` → 200 OK
- `invoice.payment_succeeded` → 200 OK

If any return non-200, check Vercel logs for the `/api/stripe/webhook` function.
