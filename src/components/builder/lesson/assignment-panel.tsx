"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { saveAssignmentAction } from "@/actions/instructor";
import { assignmentSchema } from "@/lib/validation/course";
import { RichTextField } from "@/components/editor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SwitchField } from "@/components/ui/checkbox";
import { Field, FormError, describedBy } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SaveBar } from "../save-bar";
import { toastResult } from "../toast-result";
import { useUnsavedChanges } from "../use-unsaved-changes";

type Values = z.input<typeof assignmentSchema>;
export type AssignmentData = { instructions: string; allowText: boolean; allowFile: boolean; dueDaysAfterEnrollment: number | null };

export function AssignmentPanel({ lessonId, assignment, requiresApproval }: { lessonId: string; assignment: AssignmentData | null; requiresApproval?: boolean }) {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);
  const form = useForm<Values, unknown, z.output<typeof assignmentSchema>>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      instructions: assignment?.instructions ?? "",
      allowText: assignment?.allowText ?? true,
      allowFile: assignment?.allowFile ?? true,
      dueDaysAfterEnrollment: assignment?.dueDaysAfterEnrollment ?? null,
    },
  });
  const { errors, isDirty, isSubmitting } = form.formState;
  useUnsavedChanges(isDirty);

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    const result = await saveAssignmentAction(lessonId, values);
    if (!toastResult(result)) return setFormError(result.error);
    form.reset(form.getValues());
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle id="assignment-instructions-label">Instructions</CardTitle>
          <CardDescription>
            Explain the task and what a good submission looks like.
            {requiresApproval === undefined ? null : requiresApproval ? " You approve each submission before the lesson counts as complete." : " The lesson completes as soon as the learner submits."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormError message={formError} />
          <Controller
            control={form.control}
            name="instructions"
            render={({ field }) => (
              <RichTextField
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                labelledBy="assignment-instructions-label"
                invalid={Boolean(errors.instructions)}
                placeholder="e.g. Write a one-page reflection on a psalm that speaks to your season of life…"
              />
            )}
          />
          {errors.instructions?.message && (
            <p role="alert" className="text-[13px] text-danger">
              {errors.instructions.message}
            </p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Submission</CardTitle>
          <CardDescription>How learners hand in their work.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 rounded-lg bg-surface-muted/60 p-4 sm:grid-cols-2 sm:gap-6">
            <Controller
              control={form.control}
              name="allowText"
              render={({ field }) => (
                <SwitchField id="assignment-text" label="Written response" description="Learners type their answer." checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
            <Controller
              control={form.control}
              name="allowFile"
              render={({ field }) => (
                <SwitchField id="assignment-file" label="File upload" description="PDF, Word, text or images up to 25 MB." checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>
          {errors.allowText?.message && (
            <p role="alert" className="text-[13px] text-danger">
              {errors.allowText.message}
            </p>
          )}
          <Field
            label="Due"
            htmlFor="assignment-due"
            optional
            error={errors.dueDaysAfterEnrollment?.message}
            description="Days after a learner enrols. Leave empty for no due date."
          >
            <div className="flex items-center gap-2">
              <Input
                id="assignment-due"
                type="number"
                inputMode="numeric"
                min={1}
                max={365}
                className="w-28"
                aria-invalid={Boolean(errors.dueDaysAfterEnrollment)}
                aria-describedby={describedBy("assignment-due", errors.dueDaysAfterEnrollment?.message, true)}
                {...form.register("dueDaysAfterEnrollment", { setValueAs: (v: unknown) => (v === "" || v === null || v === undefined ? null : Number(v)) })}
              />
              <span className="text-sm text-muted-foreground">days after enrolling</span>
            </div>
          </Field>
        </CardContent>
      </Card>
      <SaveBar dirty={isDirty} saving={isSubmitting} onDiscard={() => form.reset()} label="Save assignment" />
    </form>
  );
}
