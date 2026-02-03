/**
 * Recipe image URL helpers.
 *
 * Strategy: PUBLIC BUCKET
 * - Bucket: "recipe-images" (public)
 * - Path format: <userId>/<recipeId>.<ext>
 * - URLs are stable public URLs (no expiration)
 *
 * DB stores:
 * - image_path: Storage path (e.g., "abc123/def456.jpg")
 * - image_url: Full public URL (for quick access, can be regenerated from path)
 *
 * This helper provides a single source of truth for generating URLs from paths.
 */

const BUCKET_NAME = "recipe-images";

/**
 * Get the public URL for a recipe image from its storage path.
 *
 * @param imagePath - The storage path (e.g., "userId/recipeId.jpg")
 * @returns The full public URL, or null if path is empty
 */
export function getRecipeImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) {
    return null;
  }

  // Get Supabase URL from environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    console.warn("[Storage] NEXT_PUBLIC_SUPABASE_URL not configured");
    return null;
  }

  // Build the public URL
  // Format: <supabaseUrl>/storage/v1/object/public/<bucket>/<path>
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${imagePath}`;
}

/**
 * Determine the best image URL to use for a recipe.
 *
 * Priority:
 * 1. If imageUrl is set and looks valid, use it (could be external URL from import)
 * 2. If imagePath is set, generate URL from it
 * 3. Return null (use placeholder)
 *
 * @param imagePath - The storage path
 * @param imageUrl - The stored URL (may be external or generated)
 * @returns The best URL to use, or null for placeholder
 */
export function getRecipeImageUrlWithFallback(
  imagePath: string | null | undefined,
  imageUrl: string | null | undefined
): string | null {
  // If we have an imageUrl that looks valid, use it
  // This handles external URLs from imports
  if (imageUrl && (imageUrl.startsWith("http://") || imageUrl.startsWith("https://"))) {
    return imageUrl;
  }

  // Fall back to generating URL from path
  return getRecipeImageUrl(imagePath);
}

/**
 * Check if an image URL is from our Supabase storage.
 * Useful for determining if we can delete/modify the image.
 */
export function isSupabaseStorageUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return false;

  return url.startsWith(`${supabaseUrl}/storage/`);
}
