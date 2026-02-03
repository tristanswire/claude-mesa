-- ============================================================
-- Add billing columns to user_preferences
-- For Stripe subscription management
-- ============================================================

-- Add billing-related columns
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS plan_status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- Add check constraint for plan_status (drop first if exists for idempotency)
ALTER TABLE user_preferences
  DROP CONSTRAINT IF EXISTS user_preferences_plan_status_check;

ALTER TABLE user_preferences
  ADD CONSTRAINT user_preferences_plan_status_check
  CHECK (plan_status IS NULL OR plan_status IN ('active', 'trialing', 'past_due', 'canceled', 'inactive'));

-- Add indexes for Stripe lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_stripe_customer
  ON user_preferences(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_preferences_stripe_subscription
  ON user_preferences(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- Comments
COMMENT ON COLUMN user_preferences.plan_status IS 'Subscription status: active, trialing, past_due, canceled, inactive';
COMMENT ON COLUMN user_preferences.stripe_customer_id IS 'Stripe Customer ID (cus_xxx)';
COMMENT ON COLUMN user_preferences.stripe_subscription_id IS 'Stripe Subscription ID (sub_xxx)';
COMMENT ON COLUMN user_preferences.current_period_end IS 'End of current billing period';

-- ============================================================
-- Reload PostgREST schema cache
-- ============================================================
NOTIFY pgrst, 'reload schema';
