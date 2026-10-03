"use client";

import * as React from "react";
import { Award, CheckCircle2, ClipboardCheck, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox, RadioGroup, RadioGroupItem } from "@/components/ui/checkbox";
import { ProgressBar } from "@/components/ui/progress";
import { submitQuizAction } from "@/actions/learning";
import { formatDate } from "@/lib/format";
import { pluralize } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { PlayerQuiz } from "@/server/queries/player";
import { usePlayer } from "./player-context";

type Result = Awaited<ReturnType<typeof submitQuizAction>> extends infer R ? (R extends { ok: true; data: infer D } ? D : never) : never;

export function QuizPlayer({ quiz }: { quiz: PlayerQuiz }) {
  const { data, tracking, onCompleted, completed } = usePlayer();
  const best = quiz.attempts.reduce<number | null>((m, a) => (m === null || a.score > m ? a.score : m), null);
  const passedBefore = quiz.attempts.some((a) => a.passed);
  const used = quiz.attempts.length;
  const remaining = quiz.maxAttempts === null ? null : Math.max(0, quiz.maxAttempts - used);
  const canTake = data.previewMode || (tracking && (remaining === null || remaining > 0));

  const [mode, setMode] = React.useState<"intro" | "taking" | "result">(used === 0 && canTake ? "taking" : "intro");
  const [answers, setAnswers] = React.useState<Record<string, string[]>>({});
  const [result, setResult] = React.useState<Result | null>(null);
  const [pending, start] = React.useTransition();
  const [showErrors, setShowErrors] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  const answeredCount = quiz.questions.filter((q) => (answers[q.id]?.length ?? 0) > 0).length;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (answeredCount < quiz.questions.length) {
      setShowErrors(true);
      const first = quiz.questions.find((q) => !(answers[q.id]?.length));
      document.getElementById(`q-${first?.id}`)?.focus();
      toast.error(`Answer all questions before submitting (${quiz.questions.length - answeredCount} left).`);
      return;
    }
    start(async () => {
      const res = await submitQuizAction({ lessonId: data.lesson.id, answers });
      if (!res.ok) return void toast.error(res.error);
      setResult(res.data);
      setMode("result");
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (res.data.passed && !res.data.isPreview && !completed) {
        // The server completed the lesson in the same transaction; reflect it.
        onCompleted({ courseCompleted: false, certificateId: null });
      }
    });
  }

  if (mode === "result" && result) {
    const reviewById = new Map(result.review?.map((r) => [r.questionId, r]) ?? []);
    return (
      <div className="space-y-6">
        <div
          className={cn(
            "rounded-2xl border p-6 text-center sm:p-8",
            result.passed ? "border-success/30 bg-success-soft" : "border-warning/30 bg-warning-soft",
          )}
          role="status"
        >
          {result.passed ? <Award className="mx-auto size-10 text-success" aria-hidden /> : <RefreshCw className="mx-auto size-9 text-warning" aria-hidden />}
          <p className="text-display mt-3 text-4xl font-medium">{result.score}%</p>
          <p className="mt-1 font-semibold">{result.passed ? "You passed — well done." : "Not quite there yet."}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {result.pointsEarned} of {result.pointsTotal} points · {result.passingScore}% needed to pass
            {result.isPreview && " · Preview attempt (not saved)"}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {!result.passed && (result.attemptsRemaining === null || result.attemptsRemaining > 0) && (
              <Button
                onClick={() => {
                  setAnswers({});
                  setShowErrors(false);
                  setMode("taking");
                }}
              >
                <RefreshCw aria-hidden /> Try again
              </Button>
            )}
            {result.attemptsRemaining !== null && !result.passed && (
              <p className="w-full text-sm text-muted-foreground">
                {result.attemptsRemaining === 0 ? "No attempts remaining. Your instructor can help." : `${pluralize(result.attemptsRemaining, "attempt")} remaining`}
              </p>
            )}
          </div>
        </div>

        {result.review && (
          <section aria-labelledby="review-heading" className="space-y-4">
            <h2 id="review-heading" className="text-lg font-semibold">
              Review your answers
            </h2>
            {quiz.questions.map((q, i) => {
              const r = reviewById.get(q.id);
              if (!r) return null;
              return (
                <div key={q.id} className="rounded-xl border border-border bg-surface p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    {r.correct ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-label="Correct" /> : <XCircle className="mt-0.5 size-5 shrink-0 text-danger" aria-label="Incorrect" />}
                    <p className="font-medium">
                      {i + 1}. {q.prompt}
                    </p>
                  </div>
                  <ul className="mt-3 space-y-1.5 pl-8">
                    {q.options.map((o) => {
                      const isCorrect = r.correctOptionIds.includes(o.id);
                      const chosen = r.selected.includes(o.id);
                      return (
                        <li
                          key={o.id}
                          className={cn(
                            "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm",
                            isCorrect ? "border-success/40 bg-success-soft" : chosen ? "border-danger/40 bg-danger-soft" : "border-border",
                          )}
                        >
                          <span>{o.text}</span>
                          <span className="shrink-0 text-xs font-medium text-muted-foreground">
                            {isCorrect && chosen ? "Your answer · Correct" : isCorrect ? "Correct answer" : chosen ? "Your answer" : ""}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  {r.explanation && <p className="mt-3 pl-8 text-sm text-muted-foreground">{r.explanation}</p>}
                </div>
              );
            })}
          </section>
        )}
      </div>
    );
  }

  if (mode === "intro") {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
            <ClipboardCheck className="size-6" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">{pluralize(quiz.questions.length, "question")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Score {quiz.passingScore}% or more to pass.{" "}
              {quiz.maxAttempts === null ? "Unlimited attempts." : `${pluralize(quiz.maxAttempts, "attempt")} allowed.`}
            </p>
          </div>
        </div>
        {quiz.attempts.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Best score</span>
              <span className="tabular-nums">{best}%</span>
            </div>
            <ProgressBar value={best ?? 0} tone={passedBefore ? "success" : "accent"} className="mt-2" label="Best score" />
            <ol className="mt-4 space-y-2 text-sm">
              {quiz.attempts.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface-muted px-3 py-2">
                  <span>
                    Attempt {a.attemptNumber} <span className="text-muted-foreground">· {formatDate(a.submittedAt)}</span>
                  </span>
                  <span className="flex items-center gap-2 tabular-nums">
                    {a.score}% <Badge variant={a.passed ? "success" : "warning"}>{a.passed ? "Passed" : "Not passed"}</Badge>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
        <div className="mt-6">
          {canTake ? (
            <Button onClick={() => setMode("taking")}>{quiz.attempts.length ? (passedBefore ? "Retake quiz" : "Try again") : "Start quiz"}</Button>
          ) : tracking ? (
            <p className="text-sm text-muted-foreground">You&apos;ve used all your attempts.</p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={submit} className="space-y-5" noValidate>
      {data.previewMode && <p className="rounded-lg bg-info-soft px-3 py-2 text-sm text-info">Preview: your answers are graded but not saved.</p>}
      {quiz.questions.map((q, i) => {
        const selected = answers[q.id] ?? [];
        const invalid = showErrors && selected.length === 0;
        const legendId = `q-${q.id}-legend`;
        return (
          <fieldset
            key={q.id}
            id={`q-${q.id}`}
            tabIndex={-1}
            className={cn("rounded-xl border bg-surface p-4 outline-none sm:p-5", invalid ? "border-danger" : "border-border")}
            aria-describedby={invalid ? `q-${q.id}-err` : undefined}
          >
            <legend id={legendId} className="sr-only">
              Question {i + 1}
            </legend>
            <p className="font-medium">
              <span className="text-muted-foreground">{i + 1}.</span> {q.prompt}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {q.type === "MULTIPLE_CHOICE" ? "Select all that apply" : "Select one"} · {pluralize(q.points, "point")}
            </p>
            <div className="mt-3 space-y-2">
              {q.type === "MULTIPLE_CHOICE" ? (
                q.options.map((o) => {
                  const id = `${q.id}-${o.id}`;
                  const checked = selected.includes(o.id);
                  return (
                    <label
                      key={o.id}
                      htmlFor={id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors hover:bg-surface-muted",
                        checked ? "border-primary bg-primary-soft/50" : "border-border",
                      )}
                    >
                      <Checkbox
                        id={id}
                        checked={checked}
                        onCheckedChange={(v) =>
                          setAnswers((prev) => ({
                            ...prev,
                            [q.id]: v ? [...(prev[q.id] ?? []), o.id] : (prev[q.id] ?? []).filter((x) => x !== o.id),
                          }))
                        }
                      />
                      {o.text}
                    </label>
                  );
                })
              ) : (
                <RadioGroup value={selected[0] ?? ""} onValueChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: [v] }))} aria-labelledby={legendId} className="space-y-2">
                  {q.options.map((o) => {
                    const id = `${q.id}-${o.id}`;
                    const checked = selected[0] === o.id;
                    return (
                      <label
                        key={o.id}
                        htmlFor={id}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors hover:bg-surface-muted",
                          checked ? "border-primary bg-primary-soft/50" : "border-border",
                        )}
                      >
                        <RadioGroupItem id={id} value={o.id} />
                        {o.text}
                      </label>
                    );
                  })}
                </RadioGroup>
              )}
            </div>
            {invalid && (
              <p id={`q-${q.id}-err`} className="mt-2 text-sm text-danger">
                Choose an answer
              </p>
            )}
          </fieldset>
        );
      })}
      <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-10 flex items-center justify-between gap-3 rounded-xl border border-border bg-surface/95 p-3 shadow-md backdrop-blur lg:bottom-4">
        <span className="text-sm text-muted-foreground tabular-nums">
          {answeredCount}/{quiz.questions.length} answered
        </span>
        <div className="flex gap-2">
          {quiz.attempts.length > 0 && (
            <Button type="button" variant="ghost" onClick={() => setMode("intro")}>
              Cancel
            </Button>
          )}
          <Button type="submit" loading={pending}>
            Submit answers
          </Button>
        </div>
      </div>
    </form>
  );
}
