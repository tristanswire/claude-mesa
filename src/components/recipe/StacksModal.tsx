"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import type { Stack } from "@/lib/db/stacks";
import { syncRecipeStacksAction } from "@/lib/actions/stacks";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";

interface StacksModalProps {
  recipeId: string;
  currentStacks: Stack[];
  allStacks: Stack[];
  isOpen: boolean;
  onClose: () => void;
}

export function StacksModal({
  recipeId,
  currentStacks,
  allStacks,
  isOpen,
  onClose,
}: StacksModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const modalRef = useRef<HTMLDivElement>(null);

  // Initialize selected stacks when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set(currentStacks.map((s) => s.id)));
      setError(null);
    }
  }, [isOpen, currentStacks]);

  // Handle escape key and click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleToggle = (stackId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(stackId)) {
        next.delete(stackId);
      } else {
        next.add(stackId);
      }
      return next;
    });
  };

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const result = await syncRecipeStacksAction(
        recipeId,
        Array.from(selectedIds)
      );
      if (!result.success) {
        setError(result.error || "Failed to update stacks");
      } else {
        onClose();
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative bg-surface rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Add to stacks
          </h2>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-80 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-error-subtle text-error text-sm rounded-lg">
              {error}
            </div>
          )}

          {allStacks.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted mb-4">No stacks yet.</p>
              <Button variant="outline" size="sm" asChild>
                <a href="/stacks/new">Create your first stack</a>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {allStacks.map((stack) => (
                <label
                  key={stack.id}
                  className={`flex items-center gap-3 p-3 rounded-lg hover:bg-surface-2 transition-colors ${
                    isPending ? "cursor-not-allowed" : "cursor-pointer"
                  }`}
                >
                  <Checkbox
                    checked={selectedIds.has(stack.id)}
                    onChange={() => handleToggle(stack.id)}
                    disabled={isPending}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">
                      {stack.name}
                    </div>
                    {stack.description && (
                      <div className="text-sm text-muted truncate">
                        {stack.description}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} isLoading={isPending}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
