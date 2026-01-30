import { LoadingState } from "@/components/ui/LoadingState";

export default function RecipesLoading() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 w-32 bg-surface-2 rounded animate-pulse" />
        <div className="flex space-x-3">
          <div className="h-10 w-32 bg-surface-2 rounded animate-pulse" />
          <div className="h-10 w-28 bg-surface-2 rounded animate-pulse" />
        </div>
      </div>
      <LoadingState message="Loading recipes..." />
    </div>
  );
}
