"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { updateRecipeImage, getRecipeById } from "@/lib/db/recipes";

const BUCKET_NAME = "recipe-images";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export interface ImageUploadResult {
  success: true;
  imagePath: string;
  imageUrl: string;
}

export interface ImageUploadError {
  success: false;
  error: string;
}

export type ImageUploadResponse = ImageUploadResult | ImageUploadError;

/**
 * Get file extension from MIME type.
 */
function getExtensionFromMimeType(mimeType: string): string {
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
 * Server action to upload a recipe image.
 */
export async function uploadRecipeImageAction(
  recipeId: string,
  formData: FormData
): Promise<ImageUploadResponse> {
  const file = formData.get("image") as File | null;

  if (!file || file.size === 0) {
    return { success: false, error: "No file provided" };
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      success: false,
      error: `Invalid file type. Allowed: ${ALLOWED_TYPES.map((t) => t.split("/")[1]).join(", ")}`,
    };
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify user owns this recipe
  const recipeResult = await getRecipeById(recipeId);
  if (!recipeResult.success) {
    return { success: false, error: "Recipe not found" };
  }
  if (recipeResult.data.userId !== user.id) {
    return { success: false, error: "Not authorized" };
  }

  // Build path and upload
  const extension = getExtensionFromMimeType(file.type);
  const imagePath = `${user.id}/${recipeId}.${extension}`;

  // Convert File to ArrayBuffer for server-side upload
  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(imagePath, buffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    console.error("Error uploading recipe image:", uploadError);
    return { success: false, error: uploadError.message };
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(imagePath);
  const imageUrl = urlData.publicUrl;

  // Update recipe with image info
  const updateResult = await updateRecipeImage(recipeId, imagePath, imageUrl);
  if (!updateResult.success) {
    return { success: false, error: updateResult.error };
  }

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${recipeId}`);

  return {
    success: true,
    imagePath,
    imageUrl,
  };
}

/**
 * Server action to remove a recipe image.
 */
export async function removeRecipeImageAction(
  recipeId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get recipe to find image path
  const recipeResult = await getRecipeById(recipeId);
  if (!recipeResult.success) {
    return { success: false, error: "Recipe not found" };
  }
  if (recipeResult.data.userId !== user.id) {
    return { success: false, error: "Not authorized" };
  }

  const { imagePath } = recipeResult.data;

  // Delete from storage if path exists
  if (imagePath) {
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([imagePath]);

    if (deleteError) {
      console.error("Error deleting recipe image:", deleteError);
      // Continue anyway - we still want to clear the DB reference
    }
  }

  // Clear image fields in recipe
  const updateResult = await updateRecipeImage(recipeId, null, null);
  if (!updateResult.success) {
    return { success: false, error: updateResult.error };
  }

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${recipeId}`);

  return { success: true };
}
