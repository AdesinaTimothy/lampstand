"use client";

import * as React from "react";
import { Controller, useFieldArray, useWatch, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue } from "react-hook-form";
import type { QuestionType } from "@prisma/client";
import { RadioGroup as R } from "radix-ui";
import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";
import { QUESTION_TYPES } from "@/lib/validation/course";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, describedBy } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { QUESTION_TYPE_LABELS, trueFalseOptions, type QuizValues } from "./quiz-types";

type Props = {
  index: number;
  total: number;
  control: Control<QuizValues, unknown, unknown>;
  register: UseFormRegister<QuizValues>;
  setValue: UseFormSetValue<QuizValues>;
  errors: FieldErrors<QuizValues>;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
};

/** One question: prompt, type, answer options with correct-answer controls, explanation. */
export function QuestionCard({ index, total, control, register, setValue, errors, onMove, onRemove }: Props) {
  const base = `questions.${index}` as const;
  const { fields, append, remove, replace } = useFieldArray({ control, name: `${base}.options`, keyName: "fieldKey" });
  const type = useWatch({ control, name: `${base}.type` }) as QuestionType;
  const options = useWatch({ control, name: `${base}.options` }) ?? [];
  const qErrors = errors.questions?.[index];
  const optionsError = qErrors?.options?.message ?? qErrors?.options?.root?.message;
  const prefix = `q${index}`;
  const singleAnswer = type !== "MULTIPLE_CHOICE";
  const correctIndex = options.findIndex((o) => o?.isCorrect);

  function changeType(next: QuestionType) {
    setValue(`${base}.type`, next, { shouldDirty: true });
    if (next === "TRUE_FALSE") {
      replace(trueFalseOptions());
    } else if (next === "SINGLE_CHOICE" && options.filter((o) => o?.isCorrect).length > 1) {
      // Keep only the first correct answer.
      const first = options.findIndex((o) => o?.isCorrect);
      options.forEach((_, j) => setValue(`${base}.options.${j}.isCorrect`, j === first, { shouldDirty: true }));
    }
  }

  function markOnlyCorrect(j: number) {
    options.forEach((_, k) => setValue(`${base}.options.${k}.isCorrect`, k === j, { shouldDirty: true, shouldValidate: Boolean(optionsError) }));
  }

  const rows = (
    <>
      {fields.map((field, j) => {
        const optionError = qErrors?.options?.[j]?.text?.message;
        const optionId = `${prefix}-option-${j}`;
        return (
          <div key={field.fieldKey} className={cn("flex items-start gap-3 rounded-lg border border-border px-3 py-2", options[j]?.isCorrect && "border-success/50 bg-success-soft/50")}>
            <span className="mt-2.5 shrink-0">
              {singleAnswer ? (
                <R.Item
                  value={String(j)}
                  aria-label={`Mark answer ${j + 1} as correct`}
                  className="grid size-[18px] place-items-center rounded-full border border-border-strong bg-surface data-[state=checked]:border-success focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <R.Indicator className="size-2.5 rounded-full bg-success" />
                </R.Item>
              ) : (
                <Controller
                  control={control}
                  name={`${base}.options.${j}.isCorrect`}
                  render={({ field: f }) => (
                    <Checkbox
                      checked={Boolean(f.value)}
                      onCheckedChange={(v) => f.onChange(v === true)}
                      aria-label={`Answer ${j + 1} is correct`}
                      className="data-[state=checked]:border-success data-[state=checked]:bg-success"
                    />
                  )}
                />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <label htmlFor={optionId} className="sr-only">
                Answer {j + 1}
              </label>
              <Input
                id={optionId}
                readOnly={type === "TRUE_FALSE"}
                placeholder={`Answer ${j + 1}`}
                className={cn("h-9", type === "TRUE_FALSE" && "border-transparent bg-transparent shadow-none")}
                aria-invalid={Boolean(optionError)}
                aria-describedby={optionError ? `${optionId}-error` : undefined}
                {...register(`${base}.options.${j}.text`)}
              />
              {optionError && (
                <p id={`${optionId}-error`} role="alert" className="mt-1 text-[13px] text-danger">
                  {optionError}
                </p>
              )}
            </div>
            {type !== "TRUE_FALSE" && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="mt-0.5"
                disabled={fields.length <= 2}
                onClick={() => remove(j)}
                aria-label={`Remove answer ${j + 1}`}
              >
                <X />
              </Button>
            )}
          </div>
        );
      })}
    </>
  );

  return (
    <li className="rounded-xl border border-border bg-surface shadow-xs">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <h3 className="flex-1 text-sm font-semibold">Question {index + 1}</h3>
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => onMove(-1)} disabled={index === 0} aria-label={`Move question ${index + 1} up`}>
          <ArrowUp />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => onMove(1)} disabled={index === total - 1} aria-label={`Move question ${index + 1} down`}>
          <ArrowDown />
        </Button>
        <Button type="button" variant="danger-ghost" size="icon-sm" onClick={onRemove} aria-label={`Delete question ${index + 1}`}>
          <Trash2 />
        </Button>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
          <Field label="Question" htmlFor={`${prefix}-prompt`} error={qErrors?.prompt?.message} required>
            <Textarea
              id={`${prefix}-prompt`}
              rows={2}
              className="min-h-16"
              placeholder="e.g. Which psalm begins “The Lord is my shepherd”?"
              aria-invalid={Boolean(qErrors?.prompt)}
              aria-describedby={describedBy(`${prefix}-prompt`, qErrors?.prompt?.message)}
              {...register(`${base}.prompt`)}
            />
          </Field>
          <div className="grid content-start gap-4">
            <Field label="Answer type" htmlFor={`${prefix}-type`}>
              <Select
                id={`${prefix}-type`}
                value={type}
                onValueChange={(v) => changeType(v as QuestionType)}
                options={QUESTION_TYPES.map((t) => ({ value: t, label: QUESTION_TYPE_LABELS[t] }))}
              />
            </Field>
            <Field label="Points" htmlFor={`${prefix}-points`} error={qErrors?.points?.message}>
              <Input
                id={`${prefix}-points`}
                type="number"
                inputMode="numeric"
                min={1}
                max={100}
                className="w-24"
                aria-invalid={Boolean(qErrors?.points)}
                {...register(`${base}.points`, { valueAsNumber: true })}
              />
            </Field>
          </div>
        </div>

        <fieldset aria-describedby={optionsError ? `${prefix}-options-error` : `${prefix}-options-help`}>
          <legend className="text-sm font-medium">Answers</legend>
          <p id={`${prefix}-options-help`} className="mt-1 text-[13px] text-muted-foreground">
            {singleAnswer ? "Select the one correct answer." : "Tick every correct answer."}
          </p>
          {singleAnswer ? (
            <R.Root
              value={correctIndex >= 0 ? String(correctIndex) : ""}
              onValueChange={(v) => markOnlyCorrect(Number(v))}
              aria-label={`Correct answer for question ${index + 1}`}
              className="mt-3 space-y-2"
            >
              {rows}
            </R.Root>
          ) : (
            <div role="group" aria-label={`Answers for question ${index + 1}`} className="mt-3 space-y-2">
              {rows}
            </div>
          )}
          {optionsError && (
            <p id={`${prefix}-options-error`} role="alert" className="mt-2 text-[13px] text-danger">
              {optionsError}
            </p>
          )}
          {type !== "TRUE_FALSE" && fields.length < 8 && (
            <Button type="button" variant="ghost" size="sm" className="mt-2 text-primary" onClick={() => append({ text: "", isCorrect: false })}>
              <Plus /> Add answer
            </Button>
          )}
        </fieldset>

        <Field label="Explanation" htmlFor={`${prefix}-explanation`} optional description="Shown after answering, when answers are revealed.">
          <Textarea id={`${prefix}-explanation`} rows={2} className="min-h-16" aria-describedby={`${prefix}-explanation-description`} {...register(`${base}.explanation`)} />
        </Field>
      </div>
    </li>
  );
}
