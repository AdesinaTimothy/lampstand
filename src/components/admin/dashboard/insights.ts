import type { CertificatePoint, EnrollmentPoint, GrowthPoint, WeeklyActivePoint } from "@/server/queries/analytics";
import { pluralize } from "@/lib/utils";

/*
 * One-line, data-derived takeaways for each dashboard chart. Pure functions so
 * they are trivially testable and never drift from the plotted numbers.
 */

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export function growthTakeaway(points: GrowthPoint[]): string | null {
  if (points.length === 0) return null;
  const first = points[0].members;
  const last = points[points.length - 1].members;
  if (last === 0) return null;
  const added = last - first;
  if (added <= 0) return `Membership has held steady at ${pluralize(last, "person", "people")} over the last six months.`;
  const recent = last - (points[Math.max(0, points.length - 5)]?.members ?? last);
  return `${pluralize(added, "new member")} in six months (${pluralize(last, "person", "people")} now)${
    recent > 0 ? `, ${recent} of them in the last four weeks` : ""
  }.`;
}

export function activeTakeaway(points: WeeklyActivePoint[]): string | null {
  const values = points.map((p) => p.active);
  if (sum(values) === 0) return null;
  const current = values[values.length - 1] ?? 0;
  const lastFull = values[values.length - 2] ?? 0;
  const prior = values.slice(-10, -2);
  const avg = prior.length ? sum(prior) / prior.length : 0;
  const peakIndex = values.indexOf(Math.max(...values));
  const peak = points[peakIndex];
  const comparison =
    avg === 0
      ? ""
      : lastFull >= avg * 1.1
        ? `, above the recent average of ${Math.round(avg)}`
        : lastFull <= avg * 0.9
          ? `, below the recent average of ${Math.round(avg)}`
          : `, in line with the recent average`;
  return `${pluralize(lastFull, "learner")} active last week${comparison}; ${current} so far this week. Busiest week: ${peak.label} (${peak.active}).`;
}

export function flowTakeaway(points: EnrollmentPoint[]): string | null {
  const enrolments = sum(points.map((p) => p.enrolments));
  const completions = sum(points.map((p) => p.completions));
  if (enrolments + completions === 0) return null;
  if (enrolments === 0) return `${pluralize(completions, "course completion")} but no new enrolments in the last 12 weeks.`;
  const ratio = completions / enrolments;
  return `${pluralize(enrolments, "enrolment")} and ${pluralize(completions, "completion")} in 12 weeks — roughly ${
    Math.round(ratio * 10 * 10) / 10
  } completions for every 10 new enrolments.`;
}

export function certificatesTakeaway(points: CertificatePoint[]): string | null {
  const total = sum(points.map((p) => p.certificates));
  if (total === 0) return null;
  const best = points.reduce((a, b) => (b.certificates > a.certificates ? b : a));
  return `${pluralize(total, "certificate")} issued in the last 12 months; most in ${best.label} (${best.certificates}).`;
}
