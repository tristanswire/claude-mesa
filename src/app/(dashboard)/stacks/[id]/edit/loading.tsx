import { LoadingState } from "@/components/ui/LoadingState";

export default function EditStackLoading() {
  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <div className="h-5 w-24 bg-surface-2 rounded animate-pulse mb-2" />
        <div className="h-8 w-32 bg-surface-2 rounded animate-pulse" />
      </div>

      <LoadingState message="Loading stack..." />
    </div>
  );
}
