import { Skeleton } from "@/components/ui/skeleton";

export default function SubmissionsLoading() {
  return (
    <div className="space-y-6" aria-busy aria-label="Loading submissions">
      <div className="space-y-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Skeleton className="h-10 w-96 max-w-full rounded-xl" />
        <Skeleton className="h-10 w-full sm:w-64" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
