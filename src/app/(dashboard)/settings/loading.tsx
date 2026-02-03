import { LoadingState } from "@/components/ui/LoadingState";

export default function SettingsLoading() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="h-8 w-24 bg-surface-2 rounded animate-pulse" />
        <div className="h-4 w-48 bg-surface-2 rounded animate-pulse mt-2" />
      </div>
      <LoadingState message="Loading settings..." />
    </div>
  );
}
