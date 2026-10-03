import Link from "next/link";
import { CheckCircle2, Clock, Users } from "lucide-react";
import type { CourseCardData } from "@/server/queries/catalog";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { LEVEL_LABELS } from "@/lib/course-meta";
import { formatCompact, formatDuration } from "@/lib/format";
import { cn, pluralize } from "@/lib/utils";
import { CourseCover } from "./course-cover";
import { RatingStars } from "./rating";

export function CourseCard({ course, className, preload }: { course: CourseCardData; className?: string; preload?: boolean }) {
  const enrolled = course.enrollment;
  return (
    <article className={cn("group relative flex flex-col", className)}>
      <div className="overflow-hidden rounded-xl border border-border/70 shadow-xs transition-shadow duration-200 group-hover:shadow-md">
        <CourseCover
          src={course.thumbnailUrl}
          title={course.title}
          seed={course.id}
          preload={preload}
          className="transition-transform duration-500 ease-out-soft group-hover:scale-[1.02]"
        />
      </div>
      <div className="flex flex-1 flex-col pt-3.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {course.category && <span className="font-medium text-primary">{course.category.name}</span>}
          {course.category && <span aria-hidden>·</span>}
          <span>{LEVEL_LABELS[course.level]}</span>
        </div>
        <h3 className="mt-1.5 text-[1.05rem] font-semibold leading-snug tracking-tight">
          <Link href={`/courses/${course.slug}`} className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none">
            {course.title}
          </Link>
        </h3>
        {course.instructors.length > 0 && (
          <p className="mt-1 truncate text-sm text-muted-foreground">{course.instructors.join(", ")}</p>
        )}
        {course.subtitle && !enrolled && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{course.subtitle}</p>
        )}
        <div className="mt-auto pt-3">
          {enrolled ? (
            enrolled.status === "COMPLETED" ? (
              <p className="flex items-center gap-1.5 text-sm font-medium text-success">
                <CheckCircle2 className="size-4" aria-hidden /> Completed
              </p>
            ) : (
              <div className="space-y-1.5">
                <ProgressBar value={enrolled.progressPercent} size="sm" label={`${course.title} progress`} />
                <p className="text-xs text-muted-foreground">{enrolled.progressPercent}% complete</p>
              </div>
            )
          ) : (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {course.ratingCount > 0 && (
                <span className="flex items-center gap-1">
                  <span className="font-semibold text-foreground">{course.ratingAverage.toFixed(1)}</span>
                  <RatingStars value={course.ratingAverage} />
                  <span>({course.ratingCount})</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" aria-hidden />
                {pluralize(course.lessonCount, "lesson")} · {formatDuration(course.durationSeconds)}
              </span>
              {course.enrollmentCount > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="size-3.5" aria-hidden />
                  {formatCompact(course.enrollmentCount)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      {course.featured && !enrolled && (
        <Badge variant="accent" className="absolute left-3 top-3 shadow-sm">
          Featured
        </Badge>
      )}
    </article>
  );
}

export function CourseGrid({ courses, className, preloadFirst }: { courses: CourseCardData[]; className?: string; preloadFirst?: number }) {
  return (
    <div className={cn("grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", className)}>
      {courses.map((c, i) => (
        <CourseCard key={c.id} course={c} preload={i < (preloadFirst ?? 0)} />
      ))}
    </div>
  );
}

export function CourseCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-video w-full rounded-xl" />
      <Skeleton className="mt-4 h-3 w-1/3" />
      <Skeleton className="mt-2.5 h-4 w-5/6" />
      <Skeleton className="mt-2 h-3.5 w-1/2" />
      <Skeleton className="mt-4 h-3 w-2/3" />
    </div>
  );
}

export function CourseGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy aria-label="Loading courses">
      {Array.from({ length: count }, (_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </div>
  );
}
