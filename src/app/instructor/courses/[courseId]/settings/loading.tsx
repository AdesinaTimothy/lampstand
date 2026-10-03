import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="max-w-5xl space-y-10" aria-busy aria-label="Loading settings">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="grid gap-5 lg:grid-cols-[16rem_1fr] lg:gap-10">
          <div className="space-y-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-2/3" />
          </div>
        </div>
      ))}
      <Skeleton className="h-40 rounded-xl" />
    </div>
  );
}
