-- ============================================================
-- Storage Policies for Recipe Images
-- ============================================================
-- Bucket: recipe-images (PUBLIC)
-- Path format: <userId>/<recipeId>.<ext>
--
-- Strategy: PUBLIC BUCKET
-- - Anyone can read images (no signed URLs needed)
-- - Only authenticated users can upload to their own folder
-- - Path-based access control prevents users from modifying others' images
--
-- Why public bucket?
-- - Simpler: No need to generate signed URLs
-- - Faster: Direct URL access without auth
-- - Shareable: Share links work without auth
-- - Safe: Path-based RLS still protects write operations
-- ============================================================

-- NOTE: This migration creates storage policies.
-- The bucket must be created manually in Supabase Dashboard > Storage:
--   1. Click "New bucket"
--   2. Name: "recipe-images"
--   3. Public bucket: YES
--   4. File size limit: 5MB
--   5. Allowed MIME types: image/jpeg, image/png, image/webp

-- ============================================================
-- 1. DROP EXISTING POLICIES (idempotent)
-- ============================================================

DROP POLICY IF EXISTS "Users can upload own recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view recipe images" ON storage.objects;

-- ============================================================
-- 2. CREATE POLICIES
-- ============================================================

-- INSERT: Authenticated users can upload to their own folder
-- Path must start with their user ID
CREATE POLICY "Users can upload own recipe images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'recipe-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- UPDATE: Authenticated users can replace their own images
CREATE POLICY "Users can update own recipe images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'recipe-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'recipe-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE: Authenticated users can delete their own images
CREATE POLICY "Users can delete own recipe images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'recipe-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- SELECT: Anyone can view images (public bucket)
-- This enables:
-- - Direct URL access without authentication
-- - Share links to work for anonymous users
-- - Image loading in SSR without session
CREATE POLICY "Public can view recipe images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'recipe-images');

-- ============================================================
-- 3. RELOAD SCHEMA CACHE
-- ============================================================

SELECT pg_notify('pgrst', 'reload schema');

-- ============================================================
-- BUCKET SETUP REMINDER
-- ============================================================
-- If the bucket doesn't exist, create it in Supabase Dashboard:
--
-- Dashboard > Storage > New bucket
-- - Name: recipe-images
-- - Public: Yes (checked)
-- - File size limit: 5242880 (5MB)
-- - Allowed MIME types: image/jpeg,image/png,image/webp
--
-- ============================================================

-- ============================================================
-- POLICY SUMMARY
-- ============================================================
--
-- Operation | Who | Condition
-- ----------|-----|----------
-- INSERT    | authenticated | folder = user's ID
-- UPDATE    | authenticated | folder = user's ID
-- DELETE    | authenticated | folder = user's ID
-- SELECT    | public | bucket = recipe-images
--
-- Path examples:
-- - Valid: "abc123/recipe456.jpg" (abc123 is user ID)
-- - Invalid: "other-user/recipe.jpg" (can't write to other's folder)
-- - Valid read: any path in bucket (public)
--
-- ============================================================
