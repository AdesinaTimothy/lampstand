import { TimeSeriesChart } from "@/components/charts/charts";
import type { WeeklyPoint } from "@/server/queries/instructor";
import { pluralize } from "@/lib/utils";

/** Takeaway sentence derived from the weekly series. */
export function enrolmentTakeaway(weekly: WeeklyPoint[]): string {
  const total = weekly.reduce((n, w) => n + w.enrolments, 0);
  if (total === 0) return "No new enrolments in the last 12 weeks.";
  const recent = weekly.slice(-4).reduce((n, w) => n + w.enrolments, 0);
  const before = weekly.slice(-8, -4).reduce((n, w) => n + w.enrolments, 0);
  const trend =
    before === 0
      ? recent > 0
        ? "up from none the month before"
        : "none in the last 4 weeks"
      : recent === before
        ? "steady against the month before"
        : `${recent > before ? "up" : "down"} ${Math.round((Math.abs(recent - before) / before) * 100)}% on the month before`;
  return `${pluralize(total, "new enrolment")} in 12 weeks — ${recent} in the last 4 weeks, ${trend}.`;
}

export function EnrolmentTrend({ weekly, showCompletions = true }: { weekly: WeeklyPoint[]; showCompletions?: boolean }) {
  // `relative overflow-hidden` contains the chart's visually hidden data table, which
  // otherwise widens the page on phones.
  return (
    <div className="relative overflow-hidden">
      <TimeSeriesChart
        data={weekly}
        xKey="week"
        series={[
          { key: "enrolments", label: "Enrolments", color: 1 },
          ...(showCompletions ? [{ key: "completions", label: "Completions", color: 2 as const }] : []),
        ]}
        ariaLabel="Weekly enrolments and completions over the last 12 weeks"
      />
    </div>
  );
}
