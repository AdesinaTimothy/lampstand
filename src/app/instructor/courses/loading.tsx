import { Skeleton } from "@/components/ui/skeleton";

export default function CoursesLoading() {
  return (
    <div className="space-y-6" aria-busy aria-label="Loading courses">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Skeleton className="h-10 w-80 max-w-full rounded-xl" />
        <Skeleton className="h-10 w-full sm:w-72" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
