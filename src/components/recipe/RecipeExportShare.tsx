"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Recipe } from "@/lib/schemas";
import type { UnitSystem } from "@/lib/units";
import { formatRecipeAsText } from "./RecipePrintView";
import {
  createShareAction,
  revokeShareAction,
} from "@/lib/actions/shares";
import { Button } from "@/components/ui/Button";

interface RecipeExportShareProps {
  recipe: Recipe;
  unitSystem: UnitSystem;
  initialShareToken?: string;
  initialShareId?: string;
}

// Reusable icon components
const PrintIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
    />
  </svg>
);

const CopyIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
    />
  </svg>
);

const ShareIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
    />
  </svg>
);

const LinkIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
    />
  </svg>
);

const CheckIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const TrashIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

export function RecipeExportShare({
  recipe,
  unitSystem,
  initialShareToken,
  initialShareId,
}: RecipeExportShareProps) {
  const [shareToken, setShareToken] = useState<string | undefined>(initialShareToken);
  const [shareId, setShareId] = useState<string | undefined>(initialShareId);
  const [copySuccess, setCopySuccess] = useState<"text" | "link" | null>(null);
  const [isCreating, startCreate] = useTransition();
  const [isRevoking, startRevoke] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const shareUrl = shareToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/${shareToken}`
    : null;

  const handleCopyText = async () => {
    const text = formatRecipeAsText(recipe, unitSystem);
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess("text");
      setTimeout(() => setCopySuccess(null), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopySuccess("text");
      setTimeout(() => setCopySuccess(null), 2000);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess("link");
      setTimeout(() => setCopySuccess(null), 2000);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopySuccess("link");
      setTimeout(() => setCopySuccess(null), 2000);
    }
  };

  const handleCreateShare = () => {
    setError(null);
    startCreate(async () => {
      const result = await createShareAction(recipe.id);
      if (result.success && result.token) {
        setShareToken(result.token);
        setShareId(result.shareId);
      } else {
        setError(result.error || "Failed to create share link");
      }
    });
  };

  const handleRevokeShare = () => {
    if (!shareId) return;
    setError(null);
    startRevoke(async () => {
      const result = await revokeShareAction(shareId, recipe.id);
      if (result.success) {
        setShareToken(undefined);
        setShareId(undefined);
      } else {
        setError(result.error || "Failed to revoke share link");
      }
    });
  };

  return (
    <div className="bg-surface rounded-xl p-6 mt-8">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        Export &amp; Share
      </h2>

      {error && (
        <div className="mb-4 bg-error-subtle border border-error/20 text-error px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Single action bar - all buttons in one row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Print View */}
        <Button variant="outline" size="sm" asChild>
          <Link
            href={`/recipes/${recipe.id}/print`}
            aria-label="Print View"
          >
            <PrintIcon className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Print View</span>
          </Link>
        </Button>

        {/* Copy Recipe */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyText}
          aria-label={copySuccess === "text" ? "Copied!" : "Copy Recipe"}
        >
          {copySuccess === "text" ? (
            <CheckIcon className="w-4 h-4 sm:mr-2" />
          ) : (
            <CopyIcon className="w-4 h-4 sm:mr-2" />
          )}
          <span className="hidden sm:inline">
            {copySuccess === "text" ? "Copied!" : "Copy Recipe"}
          </span>
        </Button>

        {/* Share actions - conditional based on share state */}
        {shareToken ? (
          <>
            {/* Copy Link */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              aria-label={copySuccess === "link" ? "Link Copied!" : "Copy Share Link"}
            >
              {copySuccess === "link" ? (
                <CheckIcon className="w-4 h-4 sm:mr-2" />
              ) : (
                <LinkIcon className="w-4 h-4 sm:mr-2" />
              )}
              <span className="hidden sm:inline">
                {copySuccess === "link" ? "Copied!" : "Copy Link"}
              </span>
            </Button>

            {/* Revoke */}
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRevokeShare}
              disabled={isRevoking}
              aria-label={isRevoking ? "Revoking link..." : "Revoke Share Link"}
            >
              <TrashIcon className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">
                {isRevoking ? "Revoking..." : "Revoke"}
              </span>
            </Button>
          </>
        ) : (
          /* Create Share Link */
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateShare}
            disabled={isCreating}
            aria-label={isCreating ? "Creating share link..." : "Create Share Link"}
          >
            <ShareIcon className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">
              {isCreating ? "Creating..." : "Share Link"}
            </span>
          </Button>
        )}
      </div>

      {/* Share link info - subtle display when share exists */}
      {shareToken && shareUrl && (
        <p className="mt-3 text-xs text-muted">
          Share link active — anyone with the link can view this recipe
        </p>
      )}
    </div>
  );
}
