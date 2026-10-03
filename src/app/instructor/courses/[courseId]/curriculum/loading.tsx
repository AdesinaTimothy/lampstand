import { Skeleton } from "@/components/ui/skeleton";

export default function CurriculumLoading() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]" aria-busy aria-label="Loading curriculum">
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border">
            <Skeleton className="h-14 rounded-none" />
            <div className="space-y-3 p-3">
              {Array.from({ length: 3 }, (_, j) => (
                <div key={j} className="flex items-center gap-3">
                  <Skeleton className="size-9 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
