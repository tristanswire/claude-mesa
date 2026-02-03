import { LoadingState } from "@/components/ui/LoadingState";

export default function UpgradeLoading() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="h-8 w-28 bg-surface-2 rounded animate-pulse" />
        <div className="h-4 w-64 bg-surface-2 rounded animate-pulse mt-2" />
      </div>
      <LoadingState message="Loading plans..." />
    </div>
  );
}
