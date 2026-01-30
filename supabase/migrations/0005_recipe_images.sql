-- ============================================================
-- MIGRATION 0005: Add recipe images support
-- ============================================================
-- This migration adds columns for recipe images (uploads + external URLs)
--
-- IMPORTANT: After running this migration, you may need to refresh the
-- PostgREST schema cache. Run this command in Supabase SQL Editor:
--
--   NOTIFY pgrst, 'reload schema';
--
-- If you still get "Could not find column in schema cache" errors,
-- try restarting the Supabase project from the Dashboard.
-- ============================================================

-- Add image columns to recipes table
ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS image_path TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN recipes.image_path IS 'Supabase Storage path for uploaded images, e.g., "<userId>/<recipeId>.jpg"';
COMMENT ON COLUMN recipes.image_url IS 'Public URL for the image - either Storage URL or external URL from import';

-- ============================================================
-- SUPABASE STORAGE SETUP (run in Supabase Dashboard > SQL Editor)
-- ============================================================
--
-- For MVP, we use a PUBLIC bucket with path-based access control.
-- This is simpler than signed URLs while still being secure.
--
-- 1. Create the bucket (run once in Supabase Dashboard > Storage):
--    - Click "New bucket"
--    - Name: "recipe-images"
--    - Public bucket: YES (for simple URL access)
--    - File size limit: 5MB
--    - Allowed MIME types: image/jpeg, image/png, image/webp
--
-- 2. Storage RLS Policies (run in SQL Editor after creating bucket):
--
-- -- Allow authenticated users to upload to their own folder
-- CREATE POLICY "Users can upload own recipe images"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (
--   bucket_id = 'recipe-images'
--   AND (storage.foldername(name))[1] = auth.uid()::text
-- );
--
-- -- Allow authenticated users to update/replace their own images
-- CREATE POLICY "Users can update own recipe images"
-- ON storage.objects FOR UPDATE
-- TO authenticated
-- USING (
--   bucket_id = 'recipe-images'
--   AND (storage.foldername(name))[1] = auth.uid()::text
-- )
-- WITH CHECK (
--   bucket_id = 'recipe-images'
--   AND (storage.foldername(name))[1] = auth.uid()::text
-- );
--
-- -- Allow authenticated users to delete their own images
-- CREATE POLICY "Users can delete own recipe images"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (
--   bucket_id = 'recipe-images'
--   AND (storage.foldername(name))[1] = auth.uid()::text
-- );
--
-- -- Allow anyone to read images (public bucket for easy URL access)
-- CREATE POLICY "Anyone can view recipe images"
-- ON storage.objects FOR SELECT
-- TO public
-- USING (bucket_id = 'recipe-images');
--
-- ============================================================
