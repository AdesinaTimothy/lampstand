"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info, ListPlus } from "lucide-react";
import { saveQuizAction } from "@/actions/instructor";
import { quizSchema } from "@/lib/validation/course";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SwitchField } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, FormError, describedBy } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { pluralize } from "@/lib/utils";
import { SaveBar } from "../save-bar";
import { toastResult } from "../toast-result";
import { useUnsavedChanges } from "../use-unsaved-changes";
import { QuestionCard } from "./question-card";
import { newQuestion, quizToValues, type QuizData, type QuizOutput, type QuizValues } from "./quiz-types";

/** Quiz settings + question editor. Saved explicitly as one unit. */
export function QuizBuilder({ lessonId, quiz }: { lessonId: string; quiz: QuizData | null }) {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);
  const form = useForm<QuizValues, unknown, QuizOutput>({
    resolver: zodResolver(quizSchema),
    defaultValues: quizToValues(quiz),
  });
  const { control, register, setValue, formState } = form;
  const { errors, isDirty, isSubmitting } = formState;
  const questions = useFieldArray({ control, name: "questions", keyName: "fieldKey" });
  useUnsavedChanges(isDirty);

  // Pick up server ids for newly created questions after a save.
  React.useEffect(() => {
    if (!form.formState.isDirty) form.reset(quizToValues(quiz));
  }, [quiz, form]);

  const onSubmit = form.handleSubmit(
    async (values) => {
      setFormError(null);
      const result = await saveQuizAction(lessonId, values);
      if (!toastResult(result)) return setFormError(result.error);
      form.reset(form.getValues());
      router.refresh();
    },
    () => setFormError("Some questions need attention — see the highlighted fields."),
  );

  const attempts = quiz?._count.attempts ?? 0;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Quiz settings</CardTitle>
          <CardDescription>Learners complete the lesson when they reach the passing score. Answers are graded on the server.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Passing score (%)" htmlFor="quiz-passing" error={errors.passingScore?.message}>
              <Input
                id="quiz-passing"
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                aria-invalid={Boolean(errors.passingScore)}
                aria-describedby={describedBy("quiz-passing", errors.passingScore?.message)}
                {...register("passingScore", { valueAsNumber: true })}
              />
            </Field>
            <Field label="Attempts allowed" htmlFor="quiz-attempts" optional error={errors.maxAttempts?.message} description="Leave empty for unlimited attempts.">
              <Input
                id="quiz-attempts"
                type="number"
                inputMode="numeric"
                min={1}
                max={50}
                placeholder="Unlimited"
                aria-invalid={Boolean(errors.maxAttempts)}
                aria-describedby={describedBy("quiz-attempts", errors.maxAttempts?.message, true)}
                {...register("maxAttempts", { setValueAs: (v: unknown) => (v === "" || v === null || v === undefined ? null : Number(v)) })}
              />
            </Field>
          </div>
          <div className="grid gap-4 rounded-lg bg-surface-muted/60 p-4 sm:grid-cols-2 sm:gap-6">
            <Controller
              control={control}
              name="shuffleQuestions"
              render={({ field }) => (
                <SwitchField id="quiz-shuffle" label="Shuffle questions" description="Each attempt shows questions in a new order." checked={Boolean(field.value)} onCheckedChange={field.onChange} />
              )}
            />
            <Controller
              control={control}
              name="showCorrectAnswers"
              render={({ field }) => (
                <SwitchField
                  id="quiz-show-answers"
                  label="Reveal answers after submitting"
                  description="Learners see the correct answers and explanations."
                  checked={Boolean(field.value)}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
          {attempts > 0 && (
            <p className="flex items-start gap-2 rounded-lg bg-info-soft px-3.5 py-3 text-sm text-info">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              {pluralize(attempts, "attempt")} recorded. Editing questions won&rsquo;t change scores learners already earned.
            </p>
          )}
        </CardContent>
      </Card>

      <section aria-labelledby="quiz-questions-heading" className="space-y-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="quiz-questions-heading" className="text-base font-semibold tracking-tight">
            Questions
          </h2>
          <span className="text-sm text-muted-foreground">{pluralize(questions.fields.length, "question")}</span>
        </div>
        <FormError message={formError} />
        {questions.fields.length === 0 ? (
          <EmptyState
            compact
            icon={<ListPlus />}
            title="No questions yet"
            description="Add a few questions that check the key ideas of this section."
            action={
              <Button type="button" onClick={() => questions.append(newQuestion())}>
                Add the first question
              </Button>
            }
          />
        ) : (
          <>
            <ol className="space-y-4">
              {questions.fields.map((field, i) => (
                <QuestionCard
                  key={field.fieldKey}
                  index={i}
                  total={questions.fields.length}
                  control={control}
                  register={register}
                  setValue={setValue}
                  errors={errors}
                  onMove={(delta) => questions.move(i, i + delta)}
                  onRemove={() => questions.remove(i)}
                />
              ))}
            </ol>
            <Button type="button" variant="outline" onClick={() => questions.append(newQuestion())} disabled={questions.fields.length >= 100}>
              <ListPlus /> Add question
            </Button>
          </>
        )}
      </section>

      <SaveBar dirty={isDirty} saving={isSubmitting} onDiscard={() => form.reset()} label="Save quiz" />
    </form>
  );
}
