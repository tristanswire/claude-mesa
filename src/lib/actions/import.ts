"use server";

import {
  importRecipeFromUrl,
  importRecipeFromText,
  type ImportResponse,
} from "@/lib/import";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, IMPORT_RATE_LIMIT } from "@/lib/rate-limit";
import { logImportFailure, extractDomain } from "@/lib/logger";

export type ImportActionResult = ImportResponse;

const MAX_TEXT_LENGTH = 20000;

/**
 * Server action to import a recipe from a URL.
 * Requires authentication.
 * Rate limited to prevent abuse.
 */
export async function importRecipeAction(url: string): Promise<ImportActionResult> {
  // Verify user is authenticated
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in to import recipes" };
  }

  // Check rate limit
  const rateLimitResult = checkRateLimit(`import:${user.id}`, IMPORT_RATE_LIMIT);
  if (!rateLimitResult.success) {
    const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
    return {
      success: false,
      error: `Too many import attempts. Please wait ${retryAfter} seconds before trying again.`,
    };
  }

  // Validate URL
  if (!url || typeof url !== "string") {
    return { success: false, error: "Please provide a valid URL" };
  }

  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    return { success: false, error: "Please provide a valid URL" };
  }

  // Import the recipe
  const result = await importRecipeFromUrl(trimmedUrl);

  // Log failures for debugging
  if (!result.success) {
    logImportFailure({
      source: "url",
      domain: extractDomain(trimmedUrl),
      errorType: categorizeError(result.error),
      errorMessage: result.error,
      userId: user.id,
    });
  }

  return result;
}

/**
 * Server action to import a recipe from pasted text.
 * Requires authentication.
 * Rate limited to prevent abuse.
 */
export async function importRecipeFromTextAction(payload: {
  text: string;
  sourceUrl?: string;
  title?: string;
}): Promise<ImportActionResult> {
  // Verify user is authenticated
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in to import recipes" };
  }

  // Check rate limit
  const rateLimitResult = checkRateLimit(`import:${user.id}`, IMPORT_RATE_LIMIT);
  if (!rateLimitResult.success) {
    const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
    return {
      success: false,
      error: `Too many import attempts. Please wait ${retryAfter} seconds before trying again.`,
    };
  }

  // Validate text
  if (!payload.text || typeof payload.text !== "string") {
    return { success: false, error: "Please provide recipe text" };
  }

  const trimmedText = payload.text.trim();
  if (!trimmedText) {
    return { success: false, error: "Please provide recipe text" };
  }

  if (trimmedText.length > MAX_TEXT_LENGTH) {
    return {
      success: false,
      error: `Text is too long. Maximum length is ${MAX_TEXT_LENGTH} characters.`,
    };
  }

  // Validate optional sourceUrl
  if (payload.sourceUrl && typeof payload.sourceUrl === "string") {
    const trimmedUrl = payload.sourceUrl.trim();
    if (trimmedUrl) {
      try {
        new URL(trimmedUrl);
      } catch {
        return { success: false, error: "Source URL is not valid" };
      }
    }
  }

  // Import the recipe from text
  const result = await importRecipeFromText({
    text: trimmedText,
    sourceUrl: payload.sourceUrl?.trim() || undefined,
    title: payload.title?.trim() || undefined,
  });

  // Log failures for debugging
  if (!result.success) {
    logImportFailure({
      source: "text",
      domain: payload.sourceUrl ? extractDomain(payload.sourceUrl) : undefined,
      errorType: categorizeError(result.error),
      errorMessage: result.error,
      userId: user.id,
    });
  }

  return result;
}

/**
 * Categorize error messages for logging/analytics.
 */
function categorizeError(error: string): string {
  if (error.includes("timed out") || error.includes("timeout")) {
    return "timeout";
  }
  if (error.includes("too large") || error.includes("Maximum size")) {
    return "size_limit";
  }
  if (error.includes("No JSON-LD") || error.includes("No valid Recipe")) {
    return "no_jsonld";
  }
  if (error.includes("fetch") || error.includes("Failed to fetch")) {
    return "fetch_failed";
  }
  if (error.includes("content type") || error.includes("Expected HTML")) {
    return "invalid_content";
  }
  if (error.includes("ingredients") || error.includes("instructions")) {
    return "parse_failed";
  }
  if (error.includes("rate") || error.includes("Too many")) {
    return "rate_limited";
  }
  return "unknown";
}
