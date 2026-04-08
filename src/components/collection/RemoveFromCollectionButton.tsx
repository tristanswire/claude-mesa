"use client";

import { useTransition } from "react";
import { removeRecipeFromCollectionAction } from "@/lib/actions/collections";

interface RemoveFromCollectionButtonProps {
  recipeId: string;
  collectionId: string;
}

export function RemoveFromCollectionButton({
  recipeId,
  collectionId,
}: RemoveFromCollectionButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      await removeRecipeFromCollectionAction(recipeId, collectionId);
    });
  };

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={isPending}
      className="px-3 py-1.5 text-xs font-medium text-error bg-surface rounded-lg border border-error/30 hover:bg-error hover:text-error-foreground shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending ? "..." : "Remove"}
    </button>
  );
}
