-- ============================================================
-- THEME PREFERENCE - User theme setting
-- ============================================================

-- Add theme_preference column to user_preferences
ALTER TABLE user_preferences
ADD COLUMN theme_preference TEXT NOT NULL DEFAULT 'system'
CHECK (theme_preference IN ('light', 'dark', 'system'));

-- Comment for documentation
COMMENT ON COLUMN user_preferences.theme_preference IS 'User theme preference: light, dark, or system (follows OS preference)';
