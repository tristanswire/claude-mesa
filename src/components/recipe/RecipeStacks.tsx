"use client";

import { useState, useTransition } from "react";
import type { Stack } from "@/lib/db/stacks";
import {
  addRecipeToStackAction,
  removeRecipeFromStackAction,
} from "@/lib/actions/stacks";

interface RecipeStacksProps {
  recipeId: string;
  currentStacks: Stack[];
  allStacks: Stack[];
}

export function RecipeStacks({
  recipeId,
  currentStacks,
  allStacks,
}: RecipeStacksProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedStackId, setSelectedStackId] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Stacks not yet assigned to this recipe
  const availableStacks = allStacks.filter(
    (s) => !currentStacks.some((cs) => cs.id === s.id)
  );

  const handleAdd = () => {
    if (!selectedStackId) return;

    setError(null);
    startTransition(async () => {
      const result = await addRecipeToStackAction(recipeId, selectedStackId);
      if (!result.success) {
        setError(result.error || "Failed to add to stack");
      } else {
        setSelectedStackId("");
      }
    });
  };

  const handleRemove = (stackId: string) => {
    setError(null);
    startTransition(async () => {
      const result = await removeRecipeFromStackAction(recipeId, stackId);
      if (!result.success) {
        setError(result.error || "Failed to remove from stack");
      }
    });
  };

  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Stacks</h3>

      {error && (
        <div className="mb-3 text-sm text-red-600">{error}</div>
      )}

      {/* Current stacks */}
      {currentStacks.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {currentStacks.map((stack) => (
            <span
              key={stack.id}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
            >
              {stack.name}
              <button
                type="button"
                onClick={() => handleRemove(stack.id)}
                disabled={isPending}
                className="ml-2 text-blue-600 hover:text-blue-800 disabled:opacity-50"
                aria-label={`Remove from ${stack.name}`}
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add to stack */}
      {availableStacks.length > 0 ? (
        <div className="flex items-center space-x-2">
          <select
            value={selectedStackId}
            onChange={(e) => setSelectedStackId(e.target.value)}
            disabled={isPending}
            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Add to stack...</option>
            {availableStacks.map((stack) => (
              <option key={stack.id} value={stack.id}>
                {stack.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAdd}
            disabled={isPending || !selectedStackId}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "..." : "Add"}
          </button>
        </div>
      ) : currentStacks.length === 0 ? (
        <p className="text-sm text-gray-500">
          No stacks available.{" "}
          <a href="/stacks/new" className="text-blue-600 hover:underline">
            Create one
          </a>
        </p>
      ) : (
        <p className="text-sm text-gray-500">
          This recipe is in all your stacks.
        </p>
      )}
    </div>
  );
}
