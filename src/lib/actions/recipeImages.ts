"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { updateRecipeImage, getRecipeById } from "@/lib/db/recipes";
import { logImageAction, generateErrorId } from "@/lib/logger";
import { mapErrorToFriendlyMessage } from "@/lib/errors";

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
  errorId?: string;
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
    return { success: false, error: "Please sign in to upload images" };
  }

  // Verify user owns this recipe
  const recipeResult = await getRecipeById(recipeId);
  if (!recipeResult.success) {
    return { success: false, error: "Recipe not found" };
  }
  if (recipeResult.data.userId !== user.id) {
    return { success: false, error: "You don't have permission to edit this recipe" };
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
    const errorId = generateErrorId();
    const { message } = mapErrorToFriendlyMessage(uploadError.message);
    logImageAction("upload", false, {
      recipeId,
      userId: user.id,
      errorId,
      error: uploadError.message,
      fileSize: file.size,
    });
    return { success: false, error: message, errorId };
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(imagePath);
  const imageUrl = urlData.publicUrl;

  // Update recipe with image info
  const updateResult = await updateRecipeImage(recipeId, imagePath, imageUrl);
  if (!updateResult.success) {
    const errorId = generateErrorId();
    const { message } = mapErrorToFriendlyMessage(updateResult.error);
    logImageAction("upload", false, {
      recipeId,
      userId: user.id,
      errorId,
      error: updateResult.error,
    });
    return { success: false, error: message, errorId };
  }

  logImageAction("upload", true, {
    recipeId,
    userId: user.id,
    fileSize: file.size,
  });

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
): Promise<{ success: boolean; error?: string; errorId?: string }> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Please sign in to remove images" };
  }

  // Get recipe to find image path
  const recipeResult = await getRecipeById(recipeId);
  if (!recipeResult.success) {
    return { success: false, error: "Recipe not found" };
  }
  if (recipeResult.data.userId !== user.id) {
    return { success: false, error: "You don't have permission to edit this recipe" };
  }

  const { imagePath } = recipeResult.data;

  // Delete from storage if path exists
  if (imagePath) {
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([imagePath]);

    if (deleteError) {
      // Log but continue - we still want to clear the DB reference
      logImageAction("delete", false, {
        recipeId,
        userId: user.id,
        error: `Storage delete failed: ${deleteError.message}`,
      });
    }
  }

  // Clear image fields in recipe
  const updateResult = await updateRecipeImage(recipeId, null, null);
  if (!updateResult.success) {
    const errorId = generateErrorId();
    const { message } = mapErrorToFriendlyMessage(updateResult.error);
    logImageAction("delete", false, {
      recipeId,
      userId: user.id,
      errorId,
      error: updateResult.error,
    });
    return { success: false, error: message, errorId };
  }

  logImageAction("delete", true, {
    recipeId,
    userId: user.id,
  });

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${recipeId}`);

  return { success: true };
}
