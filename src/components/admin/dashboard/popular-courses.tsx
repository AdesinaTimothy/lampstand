import Link from "next/link";
import { Star } from "lucide-react";
import { ProgressBar } from "@/components/ui/progress";
import { formatNumber, formatPercent } from "@/lib/format";
import type { PopularCourse } from "@/server/queries/analytics";

export function PopularCourses({ courses }: { courses: PopularCourse[] }) {
  return (
    <ol className="divide-y divide-border">
      {courses.map((c, i) => (
        <li key={c.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
          <span className="mt-0.5 w-5 shrink-0 text-right text-sm font-medium tabular-nums text-subtle-foreground" aria-hidden>
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <Link href={`/instructor/courses/${c.id}`} className="min-w-0 truncate text-sm font-medium hover:underline">
                {c.title}
              </Link>
              <span className="shrink-0 text-sm tabular-nums">
                {formatNumber(c.enrolled)}
                <span className="sr-only"> enrolled</span>
                <span className="text-xs text-muted-foreground" aria-hidden> learners</span>
              </span>
            </div>
            <ProgressBar
              value={c.completionRate}
              size="sm"
              tone="success"
              className="mt-2"
              label={`${c.title}: ${formatPercent(c.completionRate)} completion`}
            />
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>
                {formatPercent(c.completionRate)} completed ({c.completed})
              </span>
              <span>Avg. progress {formatPercent(c.averageProgress)}</span>
              {c.ratingCount > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <Star className="size-3 fill-accent text-accent" aria-hidden />
                  {c.ratingAverage.toFixed(1)} ({c.ratingCount})
                </span>
              ) : (
                <span>No ratings yet</span>
              )}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
