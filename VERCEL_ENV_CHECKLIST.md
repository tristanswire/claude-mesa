# Vercel Environment Variables — Mesa

Set these in Vercel Dashboard → Project → Settings → Environment Variables.
Mark sensitive values as **Sensitive** (encrypted at rest, hidden in logs).

---

## Supabase

| Variable | Where to get it | Required | Environments |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL | **Required** | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API → `anon public` key | **Required** | Production, Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API → `service_role` key — **mark Sensitive** | **Required** | Production, Preview |

> Both keys must belong to the same Supabase project as the URL. Mismatched keys silently fail.

---

## Stripe

| Variable | Where to get it | Required | Environments |
|---|---|---|---|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys → **Live** Secret key (`sk_live_...`) — **mark Sensitive** | **Required** | Production only |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API keys → **Live** Publishable key (`pk_live_...`) | **Required** | Production only |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Webhooks → your endpoint → Signing secret (`whsec_...`) — **mark Sensitive** | **Required** | Production only |
| `STRIPE_PRICE_ID_PLUS_MONTHLY` | Stripe Dashboard → Product catalog → Mesa Plus → Monthly price → Price ID (`price_...`) | **Required** | Production only |
| `STRIPE_PRICE_ID_PLUS_YEARLY` | Stripe Dashboard → Product catalog → Mesa Plus → Yearly price → Price ID (`price_...`) | **Required** | Production only |

> For Preview environments, use Stripe **test mode** keys (`sk_test_...`, `pk_test_...`) and test mode price IDs.

---

## Anthropic

| Variable | Where to get it | Required | Environments |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys (`sk-ant-...`) — **mark Sensitive** | **Required** | Production, Preview |

---

## App Config

| Variable | Value | Required | Environments |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://your-production-domain.com` (no trailing slash) | **Required** | Production |
| `NEXT_PUBLIC_APP_URL` | `https://your-preview-url.vercel.app` or leave unset | Optional | Preview |

> `NEXT_PUBLIC_APP_URL` is used for OAuth redirect URLs and Stripe checkout success/cancel redirects.
> If unset, defaults to `http://localhost:3000` — which will break OAuth and Stripe on Preview/Production.

---

## Admin

| Variable | Where to get it | Required | Environments |
|---|---|---|---|
| `ADMIN_USER_ID` | Supabase Dashboard → Authentication → Users → find your account → User UID (UUID format) | Optional | Production, Preview |

> Without this, `/admin/store` redirects to `/recipes` for all users.

---

## Production Checklist

- [ ] `NEXT_PUBLIC_SUPABASE_URL` — Production + Preview
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Production + Preview
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — Production + Preview (Sensitive)
- [ ] `STRIPE_SECRET_KEY` — Production (live), Preview (test) (Sensitive)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Production (live), Preview (test)
- [ ] `STRIPE_WEBHOOK_SECRET` — Production (from live webhook), Preview (from test webhook) (Sensitive)
- [ ] `STRIPE_PRICE_ID_PLUS_MONTHLY` — Production (live price), Preview (test price)
- [ ] `STRIPE_PRICE_ID_PLUS_YEARLY` — Production (live price), Preview (test price)
- [ ] `ANTHROPIC_API_KEY` — Production + Preview (Sensitive)
- [ ] `NEXT_PUBLIC_APP_URL` — Production only (set to production domain)
- [ ] `ADMIN_USER_ID` — Production (your Supabase user UUID)
