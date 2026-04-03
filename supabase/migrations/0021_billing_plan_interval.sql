-- ============================================================
-- Add plan_interval for monthly / yearly billing support
-- ============================================================
-- What's new: plan_interval TEXT ('month' | 'year', NULL for free)
-- Everything else (plan, plan_status, stripe_*, past_due_since,
-- current_period_end) was added in 0010 / 0013.
--
-- Idempotent: safe to re-run.
-- ============================================================


-- ============================================================
-- 1. ADD COLUMN
-- ============================================================

ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS plan_interval TEXT;

COMMENT ON COLUMN public.user_preferences.plan_interval IS
  'Billing interval for paid subscriptions: ''month'' or ''year''. '
  'NULL for free users. Server-controlled — Stripe webhook only.';


-- ============================================================
-- 2. CHECK CONSTRAINT
-- ============================================================

ALTER TABLE public.user_preferences
  DROP CONSTRAINT IF EXISTS user_preferences_plan_interval_check;

ALTER TABLE public.user_preferences
  ADD CONSTRAINT user_preferences_plan_interval_check
  CHECK (plan_interval IS NULL OR plan_interval IN ('month', 'year'));


-- ============================================================
-- 3. INDEXES
-- ============================================================
-- Canonical names going forward use the _id suffix.
-- 0013 created variants without it; both are harmless to keep.

CREATE INDEX IF NOT EXISTS idx_user_preferences_stripe_customer_id
  ON public.user_preferences(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_preferences_stripe_subscription_id
  ON public.user_preferences(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;


-- ============================================================
-- 4. RELOAD SCHEMA CACHE
-- ============================================================

SELECT pg_notify('pgrst', 'reload schema');


-- ============================================================
-- RLS NOTE
-- ============================================================
--
-- No RLS changes in this migration.
--
-- Current policy state (from 0018_rls_security_audit.sql):
--   SELECT  — users can read their own row            ✓
--   INSERT  — users can insert their own row (upsert)  ✓
--   UPDATE  — users can update their own row           ✓ (see note)
--   DELETE  — no policy (cascade on user delete)       ✓
--
-- plan_interval is a billing column, NOT a safe user-editable column.
-- Protection is enforced at the application layer:
--   • Stripe webhook handler uses createAdminClient() (service role),
--     which bypasses RLS entirely — so it can write plan_interval freely.
--   • App server actions (recipes.ts, etc.) never touch billing columns.
--   • No client-facing API writes plan_interval.
--
-- Column-level RLS for individual protected columns is not added here
-- per task scope ("do NOT implement heavy RLS changes unless needed").
-- If stronger guarantees are required in Step 3, consider:
--   a) A SECURITY DEFINER function like update_user_preferences() that
--      explicitly lists only the safe columns it will set, OR
--   b) A BEFORE UPDATE trigger that raises an exception if a client
--      tries to change any billing column.
-- ============================================================
