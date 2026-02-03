"use client";

import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { submitFeedbackAction } from "@/lib/actions/feedback";
import { Button } from "@/components/ui/Button";

export function FeedbackForm() {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("idle");
    setError(null);

    startTransition(async () => {
      const result = await submitFeedbackAction(message, pathname);

      if (result.success) {
        setStatus("success");
        setMessage("");
        // Reset success message after a few seconds
        setTimeout(() => setStatus("idle"), 5000);
      } else {
        setStatus("error");
        setError(result.error || "Failed to submit feedback");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="feedback-message"
          className="block text-sm font-medium text-foreground mb-1"
        >
          Your feedback
        </label>
        <textarea
          id="feedback-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What's on your mind? Bug reports, feature requests, or general feedback welcome..."
          rows={4}
          className="block w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
          disabled={isPending}
        />
      </div>

      {status === "success" && (
        <div className="flex items-center gap-2 text-sm text-success">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
          Thanks for your feedback! We&apos;ll review it soon.
        </div>
      )}

      {status === "error" && error && (
        <div className="flex items-center gap-2 text-sm text-error">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isPending || !message.trim()}
          isLoading={isPending}
        >
          {isPending ? "Sending..." : "Send Feedback"}
        </Button>
      </div>
    </form>
  );
}
