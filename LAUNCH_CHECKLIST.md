# Mesa — Launch Checklist

---

## Environment Variables (local)

- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set and matches your active Supabase project
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set and is a valid JWT (`eyJ...`) from the same project as the URL
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set and is a valid JWT from the same project
- [ ] `STRIPE_SECRET_KEY` is set (test key for local dev)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set (test key for local dev)
- [ ] `STRIPE_WEBHOOK_SECRET` is set (use `stripe listen --forward-to localhost:3000/api/webhooks/stripe` for local testing)
- [ ] `STRIPE_PRICE_ID_PLUS_MONTHLY` is set (Stripe Price ID for $4.99/mo)
- [ ] `STRIPE_PRICE_ID_PLUS_YEARLY` is set (Stripe Price ID for $39.99/yr)
- [ ] `NEXT_PUBLIC_APP_URL` is set to `http://localhost:3000` for local dev
- [ ] `/api/health` returns `{ ok: true, supabase: { connected: true } }`

---

## Environment Variables (Vercel production)

- [ ] `NEXT_PUBLIC_SUPABASE_URL` added to Vercel environment
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` added to Vercel environment
- [ ] `SUPABASE_SERVICE_ROLE_KEY` added to Vercel environment (mark as sensitive/secret)
- [ ] `STRIPE_SECRET_KEY` added to Vercel environment (live key for production)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` added to Vercel environment (live key for production)
- [ ] `STRIPE_WEBHOOK_SECRET` added to Vercel environment (from production webhook endpoint)
- [ ] `NEXT_PUBLIC_APP_URL` set to production domain (e.g. `https://trymesa.app`)

---

## Supabase Configuration

- [ ] Supabase project is active (not paused)
- [ ] OAuth redirect URLs updated for production in Supabase Dashboard → Authentication → URL Configuration:
  - [ ] Site URL set to production domain
  - [ ] Redirect URLs include `https://yourdomain.com/auth/callback`
- [ ] OAuth providers configured (Google, etc.) with production credentials if applicable
- [ ] RLS policies reviewed and enabled on all user-data tables
- [ ] All 21 migrations applied to database (`supabase db push` or via SQL Editor)
- [ ] `handle_new_user()` trigger confirmed active on `auth.users`
- [ ] Schema cache reloaded after migrations (Dashboard → Settings → API → Reload schema cache)

---

## Stripe Configuration

- [ ] Stripe account is activated (not in test-only mode) for live payments
- [ ] Production webhook endpoint created in Stripe Dashboard pointing to `https://yourdomain.com/api/webhooks/stripe`
- [ ] Webhook is subscribed to required events:
  - [ ] `checkout.session.completed`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
  - [ ] `invoice.payment_failed`
- [ ] Stripe products and prices created in production: Plus Monthly ($4.99/mo) and Plus Yearly ($39.99/yr)
- [ ] Production price IDs match `STRIPE_PRICE_ID_PLUS_MONTHLY` and `STRIPE_PRICE_ID_PLUS_YEARLY` in Vercel
- [x] Pricing UI updated: AI tier removed from upgrade page (pending feature development)
- [x] Monthly/yearly billing toggle added to upgrade page
- [ ] `ANTHROPIC_API_KEY` added to Vercel environment
- [ ] `ADMIN_USER_ID` added to Vercel environment (UUID of the admin Supabase user)

---

## Pre-launch Checks

- [ ] `npm run build` completes with no errors
- [ ] `npm run lint` passes with no errors
- [x] Recipe search is live on /recipes page (fulltext search on title, debounced 300ms)
- [x] AI ingredient parsing live on /recipes/import text tab (Plus plan, claude-haiku-4-5-20251001, fallback to standard parser)
- [ ] Auth flow works end-to-end: sign up → email confirmation → login → dashboard
- [ ] Recipe creation flow works (new recipe, import recipe)
- [ ] Upgrade/billing flow works end-to-end with Stripe test cards
- [x] Webhook handlers audited — all events handled with inner try/catch and detailed error logging
- [x] checkout.session.completed confirmed returning 200 and writing plan = 'plus' to user_preferences
- [x] customer.subscription.created and invoice.payment_succeeded: PostgREST missing-column retry fixed, incomplete subscription early-return added
- [ ] `/api/health` returns `ok: true` and `supabase.connected: true` in production
- [ ] Error pages (404, 500) are in place
- [ ] No hardcoded localhost URLs in production code
- [ ] Secrets are not committed to git (check `.gitignore` includes `.env.local`)
- [x] Analytics event audit complete — sign_up, recipe_import_started (url/text/ai), recipe_deleted, upgrade_clicked added; events table confirmed receiving data
- [x] PWA manifest added at /public/manifest.json (name: Mesa, start_url: /recipes, standalone display)
- [x] Mobile meta tags added to root layout (theme-color, apple-mobile-web-app-capable, apple-touch-icon)
- [x] Mobile audit complete — touch targets fixed on search input, import page buttons, billing interval toggle
- [x] AI parse model swapped to claude-haiku-4-5-20251001 (cost-efficient; was claude-opus-4-6)
- [x] PWA icons generated with sharp — terracotta background + white M mark (192px, 512px, apple-splash 2048x2732)
- [x] apple-touch-startup-image link added to root layout
- [x] UI polish pass complete — upgrade page recipeLimit fallback corrected (10→25), touch targets fixed on import/search/billing toggle
- [x] Recipe limit auto-correction added — free plan users with stale recipe_limit < 25 are silently corrected on next load
- [ ] **Replace /public/icons/ files with real Mesa branded icons before public launch**
- [ ] **Add ADMIN_USER_ID to Vercel environment variables before launch**
