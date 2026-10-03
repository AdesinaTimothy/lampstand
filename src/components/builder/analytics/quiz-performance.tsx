import type { CourseAnalytics } from "@/server/queries/instructor";
import { ProgressBar } from "@/components/ui/progress";
import { formatNumber } from "@/lib/format";

/** Per-quiz average score and pass rate. A table reads better than a chart for 2+ measures per quiz. */
export function QuizPerformance({ quizzes }: { quizzes: CourseAnalytics["quizzes"] }) {
  return (
    <ul className="divide-y divide-border">
      {quizzes.map((q) => (
        <li key={q.lessonId} className="grid gap-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_9rem_9rem_5rem] sm:items-center sm:gap-4">
          <p className="truncate text-sm font-medium">{q.title}</p>
          <div className="flex items-center gap-2" title="Average score">
            <span className="w-16 text-xs text-muted-foreground sm:hidden">Average</span>
            <ProgressBar value={q.averageScore ?? 0} size="sm" label={`${q.title} average score`} className="flex-1" />
            <span className="w-10 text-right text-xs tabular-nums">{q.averageScore === null ? "—" : `${q.averageScore}%`}</span>
          </div>
          <div className="flex items-center gap-2" title="Pass rate">
            <span className="w-16 text-xs text-muted-foreground sm:hidden">Pass rate</span>
            <ProgressBar value={q.passRate ?? 0} size="sm" tone="success" label={`${q.title} pass rate`} className="flex-1" />
            <span className="w-10 text-right text-xs tabular-nums">{q.passRate === null ? "—" : `${q.passRate}%`}</span>
          </div>
          <p className="text-xs tabular-nums text-muted-foreground sm:text-right">{formatNumber(q.attempts)} attempts</p>
        </li>
      ))}
    </ul>
  );
}

export function QuizPerformanceHeader() {
  return (
    <div className="mb-2 hidden grid-cols-[minmax(0,1fr)_9rem_9rem_5rem] gap-4 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid" aria-hidden>
      <span>Quiz</span>
      <span>Average score</span>
      <span>Pass rate</span>
      <span className="text-right">Attempts</span>
    </div>
  );
}
