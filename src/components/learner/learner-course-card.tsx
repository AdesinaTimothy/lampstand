import Link from "next/link";
import { Award, PlayCircle } from "lucide-react";
import type { LearnerCourse } from "@/server/queries/learner";
import { CourseCover } from "@/components/course/course-cover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";
import { formatDate, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Compact horizontal card for a course the learner is enrolled in. */
export function LearnerCourseCard({ item, className }: { item: LearnerCourse; className?: string }) {
  const done = item.status === "COMPLETED";
  return (
    <article className={cn("group relative flex gap-4 rounded-xl border border-border bg-surface p-3 shadow-xs transition-shadow hover:shadow-md sm:p-4", className)}>
      <CourseCover src={item.course.thumbnailUrl} title={item.course.title} seed={item.course.slug} className="w-28 shrink-0 rounded-lg sm:w-40" sizes="160px" />
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate text-xs font-medium text-muted-foreground">{item.course.category ?? item.course.instructors.join(", ")}</p>
        <h3 className="mt-0.5 line-clamp-2 font-semibold leading-snug">
          <Link href={done ? `/courses/${item.course.slug}` : `/learn/${item.course.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {item.course.title}
          </Link>
        </h3>
        <div className="mt-auto pt-3">
          {done ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">Completed {item.completedAt && formatDate(item.completedAt)}</Badge>
              {item.certificateId && (
                <Link href={`/certificates/${item.certificateId}`} className="relative z-10 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                  <Award className="size-3.5" aria-hidden /> Certificate
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>{item.progressPercent}% complete</span>
                {item.lastAccessedAt && <span className="hidden sm:inline">{formatRelative(item.lastAccessedAt)}</span>}
              </div>
              <ProgressBar value={item.progressPercent} size="sm" className="mt-1.5" label={`${item.course.title} progress`} />
            </>
          )}
        </div>
      </div>
    </article>
  );
}

/** The large "pick up where you left off" card at the top of the dashboard. */
export function ContinueLearningCard({ item }: { item: LearnerCourse }) {
  return (
    <section aria-labelledby="continue-heading" className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className="grid md:grid-cols-[minmax(0,22rem)_1fr]">
        <Link href={`/learn/${item.course.slug}`} className="group relative block" tabIndex={-1} aria-hidden>
          <CourseCover src={item.course.thumbnailUrl} title={item.course.title} seed={item.course.slug} className="md:aspect-auto md:h-full md:min-h-56" sizes="(min-width: 768px) 352px, 100vw" preload />
          <span className="absolute inset-0 grid place-items-center bg-black/10 transition-colors group-hover:bg-black/25">
            <span className="grid size-14 place-items-center rounded-full bg-white/95 text-primary shadow-lg transition-transform group-hover:scale-105">
              <PlayCircle className="size-7" aria-hidden />
            </span>
          </span>
        </Link>
        <div className="flex flex-col p-5 sm:p-6">
          <p id="continue-heading" className="text-xs font-semibold uppercase tracking-wider text-accent">
            Continue learning
          </p>
          <h2 className="text-display mt-1.5 text-2xl font-medium leading-tight">{item.course.title}</h2>
          {item.lastLesson && (
            <p className="mt-2 text-sm text-muted-foreground">
              Up next from where you left off: <span className="font-medium text-foreground">{item.lastLesson.title}</span>
            </p>
          )}
          <div className="mt-5">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{item.progressPercent}% complete</span>
              <span className="text-muted-foreground">{item.course.lessonCount} lessons</span>
            </div>
            <ProgressBar value={item.progressPercent} className="mt-2" label="Course progress" />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild size="lg">
              <Link href={`/learn/${item.course.slug}`}>
                <PlayCircle aria-hidden /> Resume
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href={`/courses/${item.course.slug}`}>Course overview</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
