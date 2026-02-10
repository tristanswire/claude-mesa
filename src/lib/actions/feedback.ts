"use server";

import { createClient } from "@/lib/supabase/server";
import { log, generateErrorId, anonymizeId } from "@/lib/logger";
import { mapErrorToFriendlyMessage } from "@/lib/errors";

interface FeedbackResult {
  success: boolean;
  error?: string;
  errorId?: string;
}

export async function submitFeedbackAction(
  message: string,
  pageUrl?: string
): Promise<FeedbackResult> {
  let userId: string | undefined;

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "You must be logged in to submit feedback" };
    }

    userId = user.id;

    if (!message.trim()) {
      return { success: false, error: "Please enter a message" };
    }

    const { error } = await supabase.from("feedback").insert({
      user_id: user.id,
      message: message.trim(),
      page_url: pageUrl || null,
    });

    if (error) {
      const errorId = generateErrorId();
      log.error("feedback", "Failed to submit feedback", {
        errorId,
        userId: anonymizeId(user.id),
        action: "submit",
        meta: { error: error.message, pageUrl },
      });
      const { message: friendlyMessage } = mapErrorToFriendlyMessage(error);
      return { success: false, error: friendlyMessage, errorId };
    }

    log.info("feedback", "Feedback submitted", {
      userId: anonymizeId(user.id),
      action: "submit",
      meta: { pageUrl },
    });

    return { success: true };
  } catch (err) {
    const errorId = generateErrorId();
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    log.error("feedback", "Unexpected error submitting feedback", {
      errorId,
      userId: userId ? anonymizeId(userId) : undefined,
      action: "submit",
      meta: { error: errorMessage },
    });
    return { success: false, error: "An unexpected error occurred. Please try again.", errorId };
  }
}
