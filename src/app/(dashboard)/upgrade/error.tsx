"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

function generateErrorId(digest?: string): string {
  if (digest) {
    return `ERR-${digest.substring(0, 5).toLowerCase()}`;
  }
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 5; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return `ERR-${id}`;
}

export default function UpgradeError({ error, reset }: ErrorProps) {
  const [copied, setCopied] = useState(false);
  const errorId = useMemo(() => generateErrorId(error.digest), [error.digest]);

  useEffect(() => {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "error",
        tag: "ui",
        message: "Upgrade error boundary triggered",
        errorId,
        meta: {
          errorMessage: error.message,
          digest: error.digest,
          stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
        },
      })
    );
  }, [error, errorId]);

  const handleCopyErrorId = async () => {
    try {
      await navigator.clipboard.writeText(errorId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = errorId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center mb-6">
        <svg
          className="w-8 h-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-2">
        Problem loading upgrade page
      </h1>
      <p className="text-muted text-center max-w-md mb-4">
        We couldn&apos;t load the upgrade options. Please try again or contact support if this continues.
      </p>

      <button
        onClick={handleCopyErrorId}
        className="mb-6 px-3 py-1.5 bg-surface-2 rounded-md text-xs font-mono text-muted hover:text-foreground hover:bg-surface-3 transition-colors cursor-pointer flex items-center gap-2"
        title="Click to copy error ID"
      >
        <span>{errorId}</span>
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          {copied ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          )}
        </svg>
        {copied && <span className="text-success">Copied</span>}
      </button>

      <div className="flex items-center gap-4">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" asChild>
          <Link href="/recipes">Back to recipes</Link>
        </Button>
      </div>

      {isDev && error.message && (
        <div className="mt-8 p-4 bg-surface-2 rounded-lg max-w-xl w-full">
          <p className="text-xs font-mono text-error break-all font-medium mb-2">
            {error.message}
          </p>
          {error.stack && (
            <pre className="text-xs font-mono text-muted break-all whitespace-pre-wrap overflow-auto max-h-48">
              {error.stack}
            </pre>
          )}
          {error.digest && (
            <p className="text-xs font-mono text-muted mt-2">
              Digest: {error.digest}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
