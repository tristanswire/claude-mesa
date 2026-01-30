"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteRecipeAction } from "@/lib/actions/recipes";
import { Button } from "@/components/ui/Button";

interface DeleteRecipeButtonProps {
  recipeId: string;
}

export function DeleteRecipeButton({ recipeId }: DeleteRecipeButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteRecipeAction(recipeId);

    if (!result.success) {
      alert(result.error || "Failed to delete recipe");
      setIsDeleting(false);
      setShowConfirm(false);
      return;
    }

    // Redirect happens in the action, but just in case
    router.push("/recipes");
    router.refresh();
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? "Deleting..." : "Confirm"}
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={() => setShowConfirm(true)}
    >
      Delete
    </Button>
  );
}
