"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { deleteRecipeAction } from "@/lib/actions/recipes";
import { Button } from "@/components/ui/Button";

interface DeleteRecipeSectionProps {
  recipeId: string;
  recipeTitle: string;
}

export function DeleteRecipeSection({
  recipeId,
  recipeTitle,
}: DeleteRecipeSectionProps) {
  const [showModal, setShowModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isConfirmed = confirmText.toLowerCase() === "delete";

  // Focus input when modal opens
  useEffect(() => {
    if (showModal && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showModal]);

  // Handle escape key and click outside
  useEffect(() => {
    if (!showModal) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) {
        setShowModal(false);
        setConfirmText("");
        setError(null);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(e.target as Node) &&
        !isDeleting
      ) {
        setShowModal(false);
        setConfirmText("");
        setError(null);
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showModal, isDeleting]);

  const handleDelete = async () => {
    if (!isConfirmed) return;

    setIsDeleting(true);
    setError(null);

    const result = await deleteRecipeAction(recipeId);

    if (!result.success) {
      setError(result.error || "Failed to delete recipe");
      setIsDeleting(false);
      return;
    }

    // Redirect happens in the action, but just in case
    router.push("/recipes");
    router.refresh();
  };

  return (
    <>
      {/* Danger Zone Section */}
      <div className="bg-surface rounded-xl p-6 border border-error/20">
        <h2 className="text-lg font-semibold text-error mb-2">Danger Zone</h2>
        <p className="text-sm text-muted mb-4">
          Permanently delete this recipe. This action cannot be undone.
        </p>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowModal(true)}
          aria-label="Delete this recipe"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Delete Recipe
        </Button>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" />

          {/* Modal */}
          <div
            ref={modalRef}
            className="relative bg-surface rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-border">
              <h2
                id="delete-modal-title"
                className="text-lg font-semibold text-foreground"
              >
                Delete Recipe
              </h2>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              {error && (
                <div className="mb-4 p-3 bg-error-subtle text-error text-sm rounded-lg">
                  {error}
                </div>
              )}

              <p className="text-foreground mb-2">
                Are you sure you want to delete{" "}
                <span className="font-semibold">&quot;{recipeTitle}&quot;</span>?
              </p>
              <p className="text-sm text-muted mb-4">
                This action is permanent and cannot be undone. All associated
                data including images will be deleted.
              </p>

              <label
                htmlFor="delete-confirm-input"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Type <span className="font-mono text-error">DELETE</span> to
                confirm:
              </label>
              <input
                ref={inputRef}
                id="delete-confirm-input"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                disabled={isDeleting}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-error focus:border-transparent disabled:opacity-50"
                placeholder="DELETE"
                autoComplete="off"
              />
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowModal(false);
                  setConfirmText("");
                  setError(null);
                }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={!isConfirmed || isDeleting}
                aria-label={isDeleting ? "Deleting recipe" : "Confirm delete"}
              >
                {isDeleting ? "Deleting..." : "Delete Forever"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
