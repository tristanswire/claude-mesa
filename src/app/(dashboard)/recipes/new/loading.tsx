import { LoadingState } from "@/components/ui/LoadingState";
import { RECIPE_PAGE_MAX_WIDTH } from "@/components/recipe/RecipePageContainer";

export default function NewRecipeLoading() {
  return (
    <div className={RECIPE_PAGE_MAX_WIDTH}>
      {/* Top action bar skeleton */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="h-5 w-28 bg-surface-2 rounded animate-pulse" />
        <div className="h-10 w-28 bg-surface-2 rounded animate-pulse" />
      </div>

      {/* Title skeleton */}
      <div className="h-8 w-32 bg-surface-2 rounded animate-pulse mb-6" />

      <LoadingState message="Loading..." />
    </div>
  );
}
