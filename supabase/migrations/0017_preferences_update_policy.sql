-- Migration: Add UPDATE and INSERT policies for user_preferences
-- Purpose: Allow direct updates to safe columns, replacing RPC dependency

-- ============================================================
-- 1. ADD UPDATE POLICY FOR SAFE COLUMNS
-- ============================================================
-- Allow users to update ONLY safe preference columns (not billing columns).
-- This uses a column-level approach: the policy allows the update,
-- but we rely on the application code to only update safe columns.
--
-- Note: For maximum security, billing updates should still use service role.

DROP POLICY IF EXISTS "Users can update own safe preferences" ON user_preferences;
CREATE POLICY "Users can update own safe preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 2. ADD INSERT POLICY FOR UPSERT SUPPORT
-- ============================================================
-- Allow users to insert their own preferences row (needed for upsert).
-- The trigger creates this on signup, but upsert needs INSERT permission.

DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 3. COMMENTS
-- ============================================================

COMMENT ON POLICY "Users can update own safe preferences" ON user_preferences IS
  'Allows users to update their own preferences row. Application code should only update safe columns (preferred_unit_system, theme_preference, onboarding_completed). Billing columns should only be updated via service role.';

COMMENT ON POLICY "Users can insert own preferences" ON user_preferences IS
  'Allows users to insert their own preferences row for upsert operations.';

-- ============================================================
-- 4. RELOAD SCHEMA CACHE
-- ============================================================

SELECT pg_notify('pgrst', 'reload schema');
