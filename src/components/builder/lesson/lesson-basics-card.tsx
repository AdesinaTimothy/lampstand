"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { updateLessonBasicsAction } from "@/actions/instructor";
import { lessonBasicsSchema, type LessonBasicsInput } from "@/lib/validation/instructor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { SwitchField } from "@/components/ui/checkbox";
import { Field, describedBy } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toastResult } from "../toast-result";
import { useUnsavedChanges } from "../use-unsaved-changes";

type Basics = { title: string; summary: string | null; isPreview: boolean; isRequired: boolean };

const toValues = (b: Basics): LessonBasicsInput => ({ title: b.title, summary: b.summary ?? "", isPreview: b.isPreview, isRequired: b.isRequired });

/** Title, summary and access flags shared by every lesson type. */
export function LessonBasicsCard({ lessonId, basics }: { lessonId: string; basics: Basics }) {
  const router = useRouter();
  const form = useForm<LessonBasicsInput, unknown, z.output<typeof lessonBasicsSchema>>({
    resolver: zodResolver(lessonBasicsSchema),
    defaultValues: toValues(basics),
  });
  const { errors, isDirty, isSubmitting } = form.formState;
  useUnsavedChanges(isDirty);

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await updateLessonBasicsAction(lessonId, values);
    if (!toastResult(result)) {
      if (result.fieldErrors?.title) form.setError("title", { message: result.fieldErrors.title[0] });
      return;
    }
    form.reset(values);
    router.refresh();
  });

  return (
    <Card>
      <form onSubmit={onSubmit} noValidate>
        <CardContent className="space-y-5">
          <Field label="Lesson title" htmlFor="lesson-title" error={errors.title?.message} required>
            <Input
              id="lesson-title"
              className="h-11 text-base font-medium sm:text-base"
              aria-invalid={Boolean(errors.title)}
              aria-describedby={describedBy("lesson-title", errors.title?.message)}
              {...form.register("title")}
            />
          </Field>
          <Field
            label="Summary"
            htmlFor="lesson-summary"
            optional
            error={errors.summary?.message}
            description="A sentence or two shown above the lesson and in the curriculum."
          >
            <Textarea
              id="lesson-summary"
              rows={2}
              className="min-h-16"
              aria-invalid={Boolean(errors.summary)}
              aria-describedby={describedBy("lesson-summary", errors.summary?.message, true)}
              {...form.register("summary")}
            />
          </Field>
          <div className="grid gap-4 rounded-lg bg-surface-muted/60 p-4 sm:grid-cols-2 sm:gap-6">
            <Controller
              control={form.control}
              name="isPreview"
              render={({ field }) => (
                <SwitchField
                  id="lesson-preview"
                  label="Free preview"
                  description="Anyone can view this lesson from the course page, without enrolling."
                  checked={Boolean(field.value)}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Controller
              control={form.control}
              name="isRequired"
              render={({ field }) => (
                <SwitchField
                  id="lesson-required"
                  label="Required for completion"
                  description="Optional lessons don't count toward finishing the course."
                  checked={Boolean(field.value)}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <p className="flex items-center gap-2 text-sm" aria-live="polite">
            <span className={cn("size-2 rounded-full", isDirty ? "bg-warning" : "bg-success")} aria-hidden />
            <span className={isDirty ? "font-medium" : "text-muted-foreground"}>{isDirty ? "Unsaved changes" : "Saved"}</span>
          </p>
          <div className="flex gap-2">
            {isDirty && (
              <Button type="button" variant="ghost" size="sm" onClick={() => form.reset()}>
                Discard
              </Button>
            )}
            <Button type="submit" size="sm" loading={isSubmitting} disabled={!isDirty}>
              Save lesson
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
