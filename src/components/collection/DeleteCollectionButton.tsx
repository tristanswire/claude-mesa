"use client";

import { useState, useTransition } from "react";
import { deleteCollectionAction } from "@/lib/actions/collections";
import { Button } from "@/components/ui/Button";

interface DeleteCollectionButtonProps {
  collectionId: string;
}

export function DeleteCollectionButton({ collectionId }: DeleteCollectionButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = () => {
    startTransition(async () => {
      await deleteCollectionAction(collectionId);
    });
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowConfirm(false)}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={isPending}
        >
          {isPending ? "..." : "Confirm"}
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
