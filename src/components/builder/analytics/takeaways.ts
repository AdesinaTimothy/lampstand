import type { CourseAnalytics } from "@/server/queries/instructor";
import { pluralize } from "@/lib/utils";

/* One-line, data-derived summaries shown above each analytics chart. */

export function weeklyTakeaway(weekly: CourseAnalytics["weekly"]): string {
  const enrolled = weekly.reduce((n, w) => n + w.enrolments, 0);
  const completed = weekly.reduce((n, w) => n + w.completions, 0);
  if (enrolled === 0 && completed === 0) return "No enrolments or completions in the last 12 weeks.";
  const best = weekly.reduce((a, b) => (b.enrolments > a.enrolments ? b : a));
  return `${pluralize(enrolled, "enrolment")} and ${pluralize(completed, "completion")} in 12 weeks${best.enrolments > 0 ? ` — busiest week starting ${best.week} (${best.enrolments})` : ""}.`;
}

export function funnelTakeaway(funnel: CourseAnalytics["funnel"], learners: number): string {
  if (funnel.length === 0) return "Add lessons to see how learners progress through them.";
  if (learners === 0) return "No learners yet — this will show where people stop.";
  const last = funnel[funnel.length - 1]!;
  let worst: { from: string; to: string; drop: number } | null = null;
  for (let i = 1; i < funnel.length; i++) {
    const drop = funnel[i - 1]!.completed - funnel[i]!.completed;
    if (drop > 0 && (!worst || drop > worst.drop)) worst = { from: funnel[i - 1]!.title, to: funnel[i]!.title, drop };
  }
  const reach = Math.round((last.completed / learners) * 100);
  const reachText = `${reach}% of learners have completed the final lesson`;
  return worst ? `${reachText}. Biggest drop: ${pluralize(worst.drop, "fewer learner")} finish “${worst.to}” than “${worst.from}”.` : `${reachText}.`;
}

export function quizTakeaway(quizzes: CourseAnalytics["quizzes"]): string {
  const attempted = quizzes.filter((q) => q.attempts > 0);
  if (quizzes.length === 0) return "This course has no quizzes.";
  if (attempted.length === 0) return "No quiz attempts yet.";
  const hardest = attempted.reduce((a, b) => ((b.passRate ?? 100) < (a.passRate ?? 100) ? b : a));
  if (attempted.length === 1) return `“${hardest.title}”: ${hardest.passRate}% of attempts pass, averaging ${hardest.averageScore}%.`;
  return `Hardest quiz: “${hardest.title}” — ${hardest.passRate}% of attempts pass. Consider reviewing its questions or the lesson before it.`;
}

export function ratingTakeaway(rating: CourseAnalytics["rating"]): string {
  if (rating.count === 0) return "No reviews yet. Learners can rate the course once they've started.";
  const positive = rating.distribution.filter((d) => d.rating >= 4).reduce((n, d) => n + d.count, 0);
  return `${rating.average.toFixed(1)} out of 5 from ${pluralize(rating.count, "review")} — ${Math.round((positive / rating.count) * 100)}% rate it 4 stars or higher.`;
}
