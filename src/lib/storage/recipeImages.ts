/**
 * Recipe image upload and management utilities.
 *
 * Uses Supabase Storage with a public bucket "recipe-images".
 * Images are stored at: <userId>/<recipeId>.<ext>
 *
 * Storage RLS ensures users can only upload/modify their own images.
 */

import { createClient } from "@/lib/supabase/client";

const BUCKET_NAME = "recipe-images";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export interface UploadResult {
  success: true;
  imagePath: string;
  imageUrl: string;
}

export interface UploadError {
  success: false;
  error: string;
}

export type UploadResponse = UploadResult | UploadError;

/**
 * Validate a file before upload.
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${ALLOWED_TYPES.map((t) => t.split("/")[1]).join(", ")}`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  return { valid: true };
}

/**
 * Get file extension from MIME type.
 */
export function getExtensionFromMimeType(mimeType: string): string {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

/**
 * Build the storage path for a recipe image.
 */
export function buildImagePath(userId: string, recipeId: string, extension: string): string {
  return `${userId}/${recipeId}.${extension}`;
}

/**
 * Get the public URL for a storage path.
 */
export function getPublicUrl(imagePath: string): string {
  const supabase = createClient();
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(imagePath);
  return data.publicUrl;
}

/**
 * Upload a recipe image to Supabase Storage.
 *
 * @param userId - The user's ID (for path-based access control)
 * @param recipeId - The recipe's ID
 * @param file - The image file to upload
 * @returns Upload result with path and URL, or error
 */
export async function uploadRecipeImage(
  userId: string,
  recipeId: string,
  file: File
): Promise<UploadResponse> {
  // Validate file
  const validation = validateImageFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error! };
  }

  const supabase = createClient();
  const extension = getExtensionFromMimeType(file.type);
  const imagePath = buildImagePath(userId, recipeId, extension);

  // Upload file (upsert to replace existing)
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(imagePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    console.error("Error uploading recipe image:", error);
    return { success: false, error: error.message };
  }

  // Get public URL
  const imageUrl = getPublicUrl(imagePath);

  return {
    success: true,
    imagePath,
    imageUrl,
  };
}

/**
 * Delete a recipe image from Supabase Storage.
 *
 * @param imagePath - The storage path to delete
 * @returns Success or error
 */
export async function deleteRecipeImage(
  imagePath: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase.storage.from(BUCKET_NAME).remove([imagePath]);

  if (error) {
    console.error("Error deleting recipe image:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
