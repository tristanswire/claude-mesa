# Launch Checklist

Pre-launch verification checklist for Mesa.

## RLS Security Checklist

Row Level Security (RLS) ensures users can only access their own data. Run migration `0018_rls_security_audit.sql` to apply standardized policies.

### Policy Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `user_preferences` | own | own | own* | - |
| `recipes` | own OR shared | own | own | own |
| `stacks` | own | own | own | own |
| `recipe_stacks` | own both | own both | - | own both |
| `recipe_shares` | own OR public | own recipe | own | own |
| `profiles` | own | own | own | - |
| `store_items` | public | - | - | - |
| `recipe_store_items` | own/shared | - | - | - |
| `events` | own | own | - | - |
| `feedback` | own | own | - | - |

**Legend:**
- `own` = `auth.uid() = user_id` (or `id` for profiles)
- `own both` = must own both the recipe AND the stack
- `own recipe` = must own the recipe being shared
- `public` = no auth required (for active items only)
- `own/shared` = own the recipe or it has an active share link
- `-` = no policy (service role only)
- `*` = app code must only update safe columns

### Verification Steps

Run these queries in Supabase SQL Editor to verify RLS is working:

```sql
-- 1. Verify RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'user_preferences', 'recipes', 'stacks', 'recipe_stacks',
  'recipe_shares', 'profiles', 'store_items', 'recipe_store_items',
  'events', 'feedback'
)
ORDER BY tablename;
-- All should show rowsecurity = true

-- 2. List all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- 3. Test as anonymous user (should only see public data)
-- In Supabase, use the "anon" role in SQL Editor
SET ROLE anon;
SELECT count(*) FROM store_items WHERE is_active = true; -- Should work
SELECT count(*) FROM recipes; -- Should return 0 (only shared recipes visible)
RESET ROLE;
```

### Protected Columns (user_preferences)

The following columns should **only** be updated via service role (webhooks):

- `plan` - Subscription tier
- `plan_status` - Subscription status
- `recipe_limit` - Recipe quota
- `ai_actions_limit` - AI action quota
- `ai_actions_used` - AI actions consumed
- `stripe_customer_id` - Stripe customer ID
- `stripe_subscription_id` - Stripe subscription ID
- `current_period_end` - Billing period end
- `past_due_since` - Past due timestamp

**Safe columns** (can be updated by users):
- `preferred_unit_system`
- `theme_preference`
- `onboarding_completed`

---

## Environment Variables Checklist

Verify all required environment variables are set:

### Required (All Environments)

- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- [ ] `NEXT_PUBLIC_APP_URL` - App URL (e.g., `https://your-app.vercel.app`)

### Required (If Billing Enabled)

- [ ] `SUPABASE_SERVICE_ROLE_KEY` - For webhook billing updates
- [ ] `STRIPE_SECRET_KEY` - Stripe API key
- [ ] `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- [ ] `STRIPE_PRICE_ID_PLUS` - Stripe Price ID for Plus plan

---

## Supabase Auth Checklist

### URL Configuration

1. Go to **Authentication** > **URL Configuration**
2. Verify:
   - [ ] **Site URL** = production domain (e.g., `https://your-app.vercel.app`)
   - [ ] **Redirect URLs** includes:
     - [ ] `https://your-app.vercel.app/**`
     - [ ] `https://*.vercel.app/**` (for preview deployments)
     - [ ] `http://localhost:3000/**` (for local dev)

### Email Provider

1. Go to **Authentication** > **Providers**
2. Verify:
   - [ ] Email provider is enabled
   - [ ] Email confirmation settings match your preference

---

## Stripe Webhook Checklist

If billing is enabled:

1. Go to Stripe Dashboard > **Developers** > **Webhooks**
2. Verify endpoint URL: `https://your-app.vercel.app/api/stripe/webhook`
3. Verify events are enabled:
   - [ ] `checkout.session.completed`
   - [ ] `customer.subscription.created`
   - [ ] `customer.subscription.updated`
   - [ ] `customer.subscription.deleted`
   - [ ] `invoice.payment_failed`
   - [ ] `invoice.payment_succeeded`
4. Verify webhook secret is set in Vercel env vars

---

## Database Migration Checklist

Run all migrations in order:

```bash
# List migrations
ls -la supabase/migrations/

# Apply in Supabase SQL Editor in order:
# 0001_init.sql
# 0002_entitlements.sql
# ...
# 0018_rls_security_audit.sql
```

After running migrations:
- [ ] Run `NOTIFY pgrst, 'reload schema';` to refresh PostgREST cache
- [ ] Verify tables exist with correct columns
- [ ] Verify RLS is enabled on all tables
- [ ] Test auth flow (sign up, login, logout)

---

## Production Readiness

### Performance

- [ ] Database indexes are created (check migrations)
- [ ] Image optimization is configured (Next.js Image component)
- [ ] API routes have appropriate timeouts

### Security

- [ ] RLS audit migration applied (`0018_rls_security_audit.sql`)
- [ ] No `USING (true)` policies on user-owned tables
- [ ] Service role key is not exposed to client
- [ ] Stripe webhook validates signatures

### Monitoring

- [ ] Health endpoint returns 200: `GET /api/health`
- [ ] Error logging is configured
- [ ] Analytics events are tracking (check `events` table)

---

## Quick Smoke Test

After deployment, verify core flows:

1. **Auth**: Sign up → receive email → login → access /recipes
2. **Recipes**: Create recipe → edit → add to stack → delete
3. **Import**: Import from URL → verify parsing
4. **Billing** (if enabled): Click upgrade → complete checkout → verify Plus features
5. **Share**: Create share link → open in incognito → verify recipe visible
