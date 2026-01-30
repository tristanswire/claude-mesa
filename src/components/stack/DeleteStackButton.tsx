"use client";

import { useState, useTransition } from "react";
import { deleteStackAction } from "@/lib/actions/stacks";
import { Button } from "@/components/ui/Button";

interface DeleteStackButtonProps {
  stackId: string;
}

export function DeleteStackButton({ stackId }: DeleteStackButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = () => {
    startTransition(async () => {
      await deleteStackAction(stackId);
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
