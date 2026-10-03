import { CourseGridSkeleton } from "@/components/course/course-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container-page py-10 sm:py-14">
      <Skeleton className="h-11 w-64" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      <div className="mt-8 flex gap-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>
      <Skeleton className="mt-6 h-16 w-full" />
      <div className="mt-8">
        <CourseGridSkeleton />
      </div>
    </div>
  );
}
