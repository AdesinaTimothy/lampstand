import { Skeleton } from "@/components/ui/skeleton";

export default function LessonEditorLoading() {
  return (
    <div className="space-y-6" aria-busy aria-label="Loading lesson">
      <div className="flex justify-between">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-8 w-40" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-5 w-64" />
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
