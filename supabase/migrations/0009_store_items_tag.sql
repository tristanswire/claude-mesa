-- ============================================================
-- Add tag column to store_items (idempotent)
-- For lightweight merchandising badges like "Recommended", "Best value"
-- ============================================================

-- Add the tag column if it doesn't already exist
ALTER TABLE store_items ADD COLUMN IF NOT EXISTS tag TEXT;

-- Add comment for documentation
COMMENT ON COLUMN store_items.tag IS 'Optional badge like "Recommended", "Best value", or "Used often"';

-- ============================================================
-- Reload PostgREST schema cache
-- ============================================================
NOTIFY pgrst, 'reload schema';
