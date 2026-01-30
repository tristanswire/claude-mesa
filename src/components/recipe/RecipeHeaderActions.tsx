"use client";

import { useState, useTransition } from "react";
import type { Recipe } from "@/lib/schemas";
import type { UnitSystem } from "@/lib/units";
import { formatRecipeAsText } from "./RecipePrintView";
import {
  createShareAction,
  revokeShareAction,
} from "@/lib/actions/shares";
import { Button } from "@/components/ui/Button";

interface RecipeHeaderActionsProps {
  recipe: Recipe;
  unitSystem: UnitSystem;
  initialShareToken?: string;
  initialShareId?: string;
}

export function RecipeHeaderActions({
  recipe,
  unitSystem,
  initialShareToken,
  initialShareId,
}: RecipeHeaderActionsProps) {
  const [shareToken, setShareToken] = useState<string | undefined>(initialShareToken);
  const [shareId, setShareId] = useState<string | undefined>(initialShareId);
  const [copySuccess, setCopySuccess] = useState<"export" | "share" | null>(null);
  const [isCreating, startCreate] = useTransition();
  const [isRevoking, startRevoke] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const shareUrl = shareToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/${shareToken}`
    : null;

  const handleExport = async () => {
    const text = formatRecipeAsText(recipe, unitSystem);
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess("export");
      setTimeout(() => setCopySuccess(null), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopySuccess("export");
      setTimeout(() => setCopySuccess(null), 2000);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess("share");
      setTimeout(() => setCopySuccess(null), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopySuccess("share");
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
        // Automatically copy the new link
        const newUrl = `${window.location.origin}/share/${result.token}`;
        try {
          await navigator.clipboard.writeText(newUrl);
          setCopySuccess("share");
          setTimeout(() => setCopySuccess(null), 2000);
        } catch {
          // Silent fail - link is still created
        }
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
        setShowShareMenu(false);
      } else {
        setError(result.error || "Failed to revoke share link");
      }
    });
  };

  return (
    <>
      {/* Export Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        aria-label={copySuccess === "export" ? "Copied to clipboard" : "Copy recipe text"}
      >
        {copySuccess === "export" ? (
          <svg
            className="w-4 h-4 sm:mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg
            className="w-4 h-4 sm:mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
            />
          </svg>
        )}
        <span className="hidden sm:inline">{copySuccess === "export" ? "Copied!" : "Export"}</span>
      </Button>

      {/* Share Button with dropdown for existing share */}
      <div className="relative">
        {shareToken ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShareMenu(!showShareMenu)}
              aria-label="Share options"
              aria-expanded={showShareMenu}
            >
              <svg
                className="w-4 h-4 sm:mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              <span className="hidden sm:inline">{copySuccess === "share" ? "Copied!" : "Share"}</span>
              <svg
                className="w-3 h-3 ml-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </Button>
            {showShareMenu && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowShareMenu(false)}
                />
                {/* Menu */}
                <div className="absolute right-0 top-full mt-1 z-20 bg-surface border border-border rounded-lg shadow-lg py-1 min-w-[160px]">
                  <button
                    className="w-full px-4 py-2 text-sm text-left text-foreground hover:bg-surface-2 flex items-center gap-2 cursor-pointer"
                    onClick={() => {
                      handleCopyLink();
                      setShowShareMenu(false);
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copy link
                  </button>
                  <button
                    className="w-full px-4 py-2 text-sm text-left text-error hover:bg-error-subtle flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                    onClick={handleRevokeShare}
                    disabled={isRevoking}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {isRevoking ? "Revoking..." : "Revoke link"}
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateShare}
            disabled={isCreating}
            aria-label={isCreating ? "Creating share link" : "Create share link"}
          >
            <svg
              className="w-4 h-4 sm:mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            <span className="hidden sm:inline">{isCreating ? "Creating..." : "Share"}</span>
          </Button>
        )}
      </div>

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-error text-error-foreground px-4 py-2 rounded-lg shadow-lg text-sm z-50">
          {error}
          <button
            className="ml-2 hover:opacity-80 cursor-pointer"
            onClick={() => setError(null)}
            aria-label="Dismiss error"
          >
            &times;
          </button>
        </div>
      )}
    </>
  );
}
