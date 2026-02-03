import { LoadingState } from "@/components/ui/LoadingState";

export default function StoreLoading() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 w-20 bg-surface-2 rounded animate-pulse" />
      </div>
      <LoadingState message="Loading store..." />
    </div>
  );
}
