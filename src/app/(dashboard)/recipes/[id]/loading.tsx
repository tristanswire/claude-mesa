import { LoadingState } from "@/components/ui/LoadingState";

export default function RecipeDetailLoading() {
  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="h-4 w-24 bg-surface-2 rounded animate-pulse mb-2" />
          <div className="h-8 w-64 bg-surface-2 rounded animate-pulse" />
        </div>
        <div className="flex items-center space-x-4">
          <div className="h-10 w-24 bg-surface-2 rounded animate-pulse" />
          <div className="h-10 w-16 bg-surface-2 rounded animate-pulse" />
        </div>
      </div>
      <LoadingState message="Loading recipe..." />
    </div>
  );
}
