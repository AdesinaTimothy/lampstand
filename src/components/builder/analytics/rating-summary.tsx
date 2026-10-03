import type { CourseAnalytics } from "@/server/queries/instructor";
import { RatingStars } from "@/components/course/rating";

export function RatingSummary({ rating }: { rating: CourseAnalytics["rating"] }) {
  const max = Math.max(1, ...rating.distribution.map((d) => d.count));
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
      <div className="shrink-0 text-center sm:w-32">
        <p className="text-display text-5xl font-medium tabular-nums">{rating.count ? rating.average.toFixed(1) : "—"}</p>
        <RatingStars value={rating.average} size="md" className="mt-2" />
        <p className="mt-1 text-xs text-muted-foreground">{rating.count} reviews</p>
      </div>
      <dl className="flex-1 space-y-2">
        {rating.distribution.map((d) => (
          <div key={d.rating} className="flex items-center gap-3 text-sm">
            <dt className="w-12 shrink-0 text-muted-foreground">{d.rating} star</dt>
            <dd className="flex flex-1 items-center gap-3">
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken" aria-hidden>
                <span className="block h-full rounded-full bg-accent" style={{ width: `${(d.count / max) * 100}%` }} />
              </span>
              <span className="w-8 text-right tabular-nums">{d.count}</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
