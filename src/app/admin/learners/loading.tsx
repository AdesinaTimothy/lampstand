import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6" aria-busy aria-label="Loading people">
      <div className="space-y-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="flex flex-col gap-3 md:flex-row">
        <Skeleton className="h-10 w-full md:max-w-sm" />
        <div className="grid grid-cols-2 gap-2 sm:flex">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-10 sm:w-36" />
          ))}
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-border px-5 py-4 last:border-0">
            <Skeleton className="size-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56 max-w-full" />
            </div>
            <Skeleton className="hidden h-5 w-20 rounded-full md:block" />
            <Skeleton className="hidden h-2 w-32 md:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
