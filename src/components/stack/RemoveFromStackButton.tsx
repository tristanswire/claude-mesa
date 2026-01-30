"use client";

import { useTransition } from "react";
import { removeRecipeFromStackAction } from "@/lib/actions/stacks";

interface RemoveFromStackButtonProps {
  recipeId: string;
  stackId: string;
}

export function RemoveFromStackButton({
  recipeId,
  stackId,
}: RemoveFromStackButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      await removeRecipeFromStackAction(recipeId, stackId);
    });
  };

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={isPending}
      className="px-3 py-1.5 text-xs font-medium text-error bg-surface rounded-lg border border-error/30 hover:bg-error hover:text-error-foreground shadow-sm transition-colors disabled:opacity-50"
    >
      {isPending ? "..." : "Remove"}
    </button>
  );
}
