import { formatPercent } from "@/lib/format";
import { cn, pluralize } from "@/lib/utils";
import type { QuizPerformance } from "@/server/queries/analytics";

function QuizRow({ quiz }: { quiz: QuizPerformance }) {
  const struggling = quiz.passRate < 60;
  return (
    <li className="flex items-center gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{quiz.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {quiz.courseTitle} · {pluralize(quiz.attempts, "attempt")} by {pluralize(quiz.learners, "learner")}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className={cn("text-sm font-semibold tabular-nums", struggling ? "text-danger" : "text-foreground")}>
          {formatPercent(quiz.passRate)}
          <span className="sr-only"> pass rate</span>
        </p>
        <p className="text-xs tabular-nums text-muted-foreground">avg {formatPercent(quiz.averageScore)}</p>
      </div>
    </li>
  );
}

/** Lowest and highest pass rates side by side, so problem quizzes stand out. */
export function QuizPerformanceList({ quizzes, size = 4 }: { quizzes: QuizPerformance[]; size?: number }) {
  // Ordered ascending by pass rate by the query.
  const lowest = quizzes.slice(0, size);
  const highest = quizzes.length > size ? [...quizzes].reverse().slice(0, Math.min(size, quizzes.length - size)) : [];
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <div className="min-w-0">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{highest.length ? "Needs attention" : "All quizzes"}</h3>
        <ul className="mt-1 divide-y divide-border">
          {lowest.map((q) => (
            <QuizRow key={q.quizId} quiz={q} />
          ))}
        </ul>
      </div>
      {highest.length > 0 && (
        <div className="min-w-0">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Strongest results</h3>
          <ul className="mt-1 divide-y divide-border">
            {highest.map((q) => (
              <QuizRow key={q.quizId} quiz={q} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function quizTakeaway(quizzes: QuizPerformance[]): string | null {
  if (quizzes.length === 0) return null;
  const attempts = quizzes.reduce((n, q) => n + q.attempts, 0);
  const struggling = quizzes.filter((q) => q.passRate < 60);
  if (struggling.length === 0) return `Every quiz has a pass rate of 60% or more across ${pluralize(attempts, "attempt")}.`;
  return `${pluralize(struggling.length, "quiz", "quizzes")} below a 60% pass rate — “${struggling[0].title}” is lowest at ${formatPercent(struggling[0].passRate)}.`;
}
