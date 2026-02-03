import type { ReactNode } from "react";

/**
 * Shared container wrapper for all recipe pages to ensure consistent
 * max-width and spacing across:
 * - /recipes/new (create)
 * - /recipes/[id] (detail)
 * - /recipes/[id]/edit
 */

export const RECIPE_PAGE_MAX_WIDTH = "max-w-5xl mx-auto";

interface RecipePageContainerProps {
  children: ReactNode;
  className?: string;
}

export function RecipePageContainer({
  children,
  className = "",
}: RecipePageContainerProps) {
  return (
    <div className={`${RECIPE_PAGE_MAX_WIDTH} ${className}`.trim()}>
      {children}
    </div>
  );
}
