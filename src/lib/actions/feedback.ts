"use server";

import { createClient } from "@/lib/supabase/server";

interface FeedbackResult {
  success: boolean;
  error?: string;
}

export async function submitFeedbackAction(
  message: string,
  pageUrl?: string
): Promise<FeedbackResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "You must be logged in to submit feedback" };
    }

    if (!message.trim()) {
      return { success: false, error: "Please enter a message" };
    }

    const { error } = await supabase.from("feedback").insert({
      user_id: user.id,
      message: message.trim(),
      page_url: pageUrl || null,
    });

    if (error) {
      console.error("Failed to submit feedback:", error);
      return { success: false, error: "Failed to submit feedback. Please try again." };
    }

    return { success: true };
  } catch (err) {
    console.error("Unexpected error submitting feedback:", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}
