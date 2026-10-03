import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex h-14 items-center gap-3 border-b border-border px-4">
        <Skeleton className="size-8 rounded-lg" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid flex-1 lg:grid-cols-[1fr_360px]">
        <div className="p-0 lg:p-6">
          <Skeleton className="aspect-video w-full rounded-none lg:rounded-xl" />
          <div className="space-y-3 p-4 lg:px-0">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
        <div className="hidden space-y-3 border-l border-border p-4 lg:block">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
