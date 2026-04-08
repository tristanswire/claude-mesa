import { LoadingState } from "@/components/ui/LoadingState";

export default function CollectionsLoading() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 w-24 bg-surface-2 rounded animate-pulse" />
        <div className="h-10 w-28 bg-surface-2 rounded animate-pulse" />
      </div>
      <LoadingState message="Loading collections..." />
    </div>
  );
}
