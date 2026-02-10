# Launch Checklist

Pre-deploy verification for Mesa. Run before each production deploy.

---

## A) Environment Sanity

### Vercel Environment Variables

| Variable | Prod | Preview | Notes |
|----------|------|---------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Required | Required | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Required | Required | Supabase anon key |
| `NEXT_PUBLIC_APP_URL` | `https://yourdomain.com` | `https://*.vercel.app` | Used for share links |
| `SUPABASE_SERVICE_ROLE_KEY` | Required | Required | For webhook billing updates |
| `STRIPE_SECRET_KEY` | Live key | Test key | Server-only |
| `STRIPE_WEBHOOK_SECRET` | Prod webhook | Test webhook | Server-only |
| `STRIPE_PRICE_ID_PLUS` | Live price | Test price | Plus plan price ID |

**Quick check:**
```bash
# In Vercel Dashboard → Project → Settings → Environment Variables
# Verify all vars are set for Production AND Preview
```

---

## B) Supabase Configuration

### Auth URL Configuration

Dashboard → Authentication → URL Configuration

- [ ] **Site URL** = production domain (e.g., `https://yourdomain.com`)
- [ ] **Redirect URLs** includes:
  - `https://yourdomain.com/**`
  - `https://*.vercel.app/**` (preview)
  - `http://localhost:3000/**` (local)

### Storage

Dashboard → Storage

- [ ] `recipe-images` bucket exists
- [ ] Bucket is **public** (for direct image URLs)
- [ ] Storage policies applied (migration `0019_storage_policies.sql`)

**Quick verify:**
```sql
-- Check bucket exists
SELECT * FROM storage.buckets WHERE id = 'recipe-images';
```

---

## C) RLS Security Checklist

Run migration `0018_rls_security_audit.sql` to apply standardized policies.

### Policy Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `recipes` | own OR shared | own | own | own |
| `stacks` | own | own | own | own |
| `stack_recipes` | own both | own both | - | own both |
| `profiles` | own | own | own | - |
| `user_preferences` | own | own | own* | - |
| `recipe_shares` | own OR public | own recipe | own | own |
| `store_items` | public (active) | - | - | - |
| `recipe_store_items` | own/shared | - | - | - |
| `events` | own | own | - | - |
| `feedback` | own | own | - | - |

`*` = app code must only update safe columns (theme, units, onboarding)

**Quick verify:**
```sql
-- Verify RLS enabled on all tables
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('recipes','stacks','stack_recipes','profiles','user_preferences','recipe_shares','store_items','recipe_store_items','events','feedback');
-- All should show rowsecurity = true
```

---

## D) Billing Checklist

Skip if billing is disabled.

### Stripe Dashboard

- [ ] Webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
- [ ] Events enabled:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
  - `invoice.payment_succeeded`
- [ ] Webhook secret copied to Vercel env vars

### Functional Test

1. [ ] `/upgrade` page loads with plan comparison
2. [ ] Click upgrade → redirects to Stripe Checkout
3. [ ] Complete test payment → webhook fires
4. [ ] `/settings` shows "Plus" plan
5. [ ] "Manage billing" → opens Stripe Customer Portal
6. [ ] Portal returns to `/settings`

---

## E) Smoke Test

See **[`/docs/smoke-test.md`](./smoke-test.md)** for full checklist.

**Quick pass (5 min):**

1. [ ] Sign up / login works
2. [ ] Create recipe → appears in list
3. [ ] Import recipe from URL → parses correctly
4. [ ] Add recipe to stack → appears in stack
5. [ ] Share recipe → link works in incognito
6. [ ] Settings → theme/units persist
7. [ ] Feedback form submits

---

## F) Mobile Quick Pass

Test on phone or browser dev tools (responsive mode):

- [ ] Header: logo visible, menu works, no overflow
- [ ] Recipe cards: single column on mobile, images scale
- [ ] Recipe detail: readable, action buttons accessible
- [ ] Modals: fit screen, scrollable, dismissible
- [ ] Forms: inputs sized correctly, keyboard doesn't block submit

---

## G) Rollback / Kill-Switch

### Disable Billing UI

If billing breaks in prod, hide upgrade prompts:

```bash
# Option 1: Set env var (requires redeploy)
# In Vercel, set:
NEXT_PUBLIC_BILLING_ENABLED=false

# Then check in code:
# {process.env.NEXT_PUBLIC_BILLING_ENABLED !== 'false' && <UpgradeButton />}
```

Or quick fix without redeploy - update Stripe webhook to return 200 immediately:
```typescript
// Temporarily in webhook/route.ts:
return NextResponse.json({ received: true }); // Skip processing
```

### Disable Store

Hide store without code change:

```sql
-- Mark all store items inactive
UPDATE store_items SET is_active = false;
-- Reload schema
NOTIFY pgrst, 'reload schema';
```

To restore:
```sql
UPDATE store_items SET is_active = true WHERE is_active = false;
NOTIFY pgrst, 'reload schema';
```

### Rollback Deployment

```bash
# In Vercel Dashboard → Deployments
# Find last working deployment → ... menu → Promote to Production
```

### Database Rollback

If a migration broke something:
1. Identify the problematic migration
2. Write a reverse migration
3. Apply via Supabase SQL Editor
4. `NOTIFY pgrst, 'reload schema';`

---

## H) Pre-Deploy Commands

```bash
# Build check (catches compile errors)
npm run build

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

---

# Soft Launch Plan

## Overview

Invite 10-25 users to test the app before public launch. Goal: validate core flows work in real-world usage and collect early feedback.

## User Selection

- Friends/family who cook
- Beta testers from waitlist
- Mix of technical and non-technical users
- Mix of iOS/Android and desktop

## Invite Message Template

```
Hey! I'm soft-launching Mesa, a recipe app I've been building.
Would love your help testing it before the public launch.

Sign up here: [URL]

Try this flow:
1. Import a recipe from a cooking site (paste URL)
2. Add it to a Stack (collection)
3. Try Cook Mode on a recipe
4. Share a recipe with me

Any bugs or feedback? Use the feedback form in Settings,
or just reply to this message.

Thanks!
```

## Core User Journey to Validate

| Step | Action | Success Criteria |
|------|--------|------------------|
| 1 | Sign up | Account created, lands on /recipes |
| 2 | Import recipe | URL import works, recipe saved |
| 3 | Add to stack | Stack created, recipe added |
| 4 | View recipe | Detail page loads, ingredients/steps visible |
| 5 | Share recipe | Share link created, opens in browser |
| 6 | Submit feedback | Feedback row in database |

## Metrics to Watch

Track in Supabase `events` table or Vercel Analytics:

| Metric | Query | Target |
|--------|-------|--------|
| **Activation** | Users with >= 1 saved recipe | 80% of signups |
| **Engagement** | Users who added recipe to stack | 50% of activated |
| **Retention** | Users who return within 7 days | 30% |
| **Feedback** | Feedback submissions | 5+ per 10 users |

```sql
-- Activation: users with recipes
SELECT COUNT(DISTINCT user_id) FROM recipes;

-- Engagement: users with stacks
SELECT COUNT(DISTINCT user_id) FROM stacks;

-- Recent activity
SELECT DATE(created_at), COUNT(*)
FROM events
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY 1;

-- Feedback count
SELECT COUNT(*) FROM feedback WHERE created_at > NOW() - INTERVAL '7 days';
```

## Feedback Collection

- **Primary:** In-app feedback form (Settings → Feedback)
- **Secondary:** Direct replies to invite message
- **Review:** Check `feedback` table daily during soft launch

```sql
-- View recent feedback
SELECT created_at, message, page_url
FROM feedback
ORDER BY created_at DESC
LIMIT 20;
```

## Known Issues to Communicate

List any known issues for soft launch users:

- [ ] _None currently_

## Go/No-Go Criteria for Public Launch

Before public launch, confirm:

- [ ] No critical bugs reported in soft launch
- [ ] Core flow (import → stack → share) works reliably
- [ ] Activation rate >= 70%
- [ ] No security issues discovered
- [ ] Billing flow tested end-to-end (if enabled)

---

## Quick Reference

| Task | Command/Location |
|------|------------------|
| Check env vars | Vercel Dashboard → Settings → Environment Variables |
| Check RLS | Supabase SQL Editor (queries above) |
| Check webhooks | Stripe Dashboard → Developers → Webhooks |
| View feedback | Supabase Table Editor → `feedback` |
| View events | Supabase Table Editor → `events` |
| Rollback deploy | Vercel Dashboard → Deployments → Promote |
| Disable store | `UPDATE store_items SET is_active = false;` |
