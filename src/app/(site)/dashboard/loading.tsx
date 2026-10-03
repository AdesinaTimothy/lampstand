import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container-page py-8 sm:py-12" aria-busy="true" aria-label="Loading dashboard">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="mt-3 h-5 w-96 max-w-full" />
      <Skeleton className="mt-8 h-56 w-full rounded-2xl" />
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div className="grid gap-3 xl:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}
