# Environment Variables — Mesa

All variables required to run Mesa locally and in production.

---

## Supabase (required)

| Variable | Purpose | Where to find | Expected format | Required for local dev? |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project API URL | Supabase Dashboard → Project Settings → API → Project URL | `https://<ref>.supabase.co` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public client key for browser-side queries | Supabase Dashboard → Project Settings → API → `anon` `public` key | JWT starting with `eyJ` | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side admin key (bypasses RLS) | Supabase Dashboard → Project Settings → API → `service_role` key | JWT starting with `eyJ` | Yes (for server actions) |

> **Note:** The anon key and service role key must belong to the same project as the URL. Mismatched keys (e.g. from a different project) will silently fail or return auth errors.

---

## Stripe (required for billing)

| Variable | Purpose | Where to find | Expected format | Required for local dev? |
|---|---|---|---|---|
| `STRIPE_SECRET_KEY` | Server-side Stripe API calls | Stripe Dashboard → Developers → API keys → Secret key | `sk_test_...` (test) or `sk_live_...` (prod) | Yes (use test key) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client-side Stripe.js | Stripe Dashboard → Developers → API keys → Publishable key | `pk_test_...` (test) or `pk_live_...` (prod) | Yes (use test key) |
| `STRIPE_WEBHOOK_SECRET` | Validates incoming Stripe webhook events | Stripe Dashboard → Developers → Webhooks → signing secret | `whsec_...` | Optional locally (use Stripe CLI for local testing) |
| `STRIPE_PRICE_ID_PLUS_MONTHLY` | Stripe Price ID for Plus monthly billing ($4.99/mo) | Stripe Dashboard → Product catalog → Plus product → Monthly price → Price ID | `price_...` | Yes (needed to create checkout sessions) |
| `STRIPE_PRICE_ID_PLUS_YEARLY` | Stripe Price ID for Plus yearly billing ($39.99/yr) | Stripe Dashboard → Product catalog → Plus product → Yearly price → Price ID | `price_...` | Yes (needed to create checkout sessions) |

---

## App config (required for production)

| Variable | Purpose | Where to find | Expected format | Required for local dev? |
|---|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Canonical app URL used for OAuth redirects and absolute links | Set manually | `https://yourdomain.com` (no trailing slash) | Optional (defaults to localhost) |

---

## Anthropic (required for AI Parse feature)

| Variable | Purpose | Where to find | Expected format | Required for local dev? |
|---|---|---|---|---|
| `ANTHROPIC_API_KEY` | Claude API for AI recipe parsing (Plus plan feature) | console.anthropic.com → API Keys | `sk-ant-...` | Yes — needed for `/api/recipes/parse-ai` |

---

## Admin (required for /admin/store)

| Variable | Purpose | Where to find | Expected format | Required for local dev? |
|---|---|---|---|---|
| `ADMIN_USER_ID` | UUID of the admin user allowed to access `/admin/store` | Supabase Dashboard → Authentication → Users → find your account → copy User UID | UUID (e.g. `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`) | Yes — without it, `/admin/store` redirects to `/recipes` |

---

## Local dev `.env.local` template

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PLUS_MONTHLY=price_...
STRIPE_PRICE_ID_PLUS_YEARLY=price_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Admin
ADMIN_USER_ID=your-user-uuid-here
```
