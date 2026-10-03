"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { updateCourseSettingsAction } from "@/actions/instructor";
import { courseSettingsSchema } from "@/lib/validation/course";
import { slugify } from "@/lib/utils";
import { SwitchField } from "@/components/ui/checkbox";
import { Field, FormError, describedBy } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormSection } from "../form-section";
import { SaveBar } from "../save-bar";
import { toastResult } from "../toast-result";
import { useUnsavedChanges } from "../use-unsaved-changes";

type Values = z.input<typeof courseSettingsSchema>;
const NO_PREVIEW = "__none";

export type CourseSettingsData = {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  certificateEnabled: boolean;
  requireAssignmentApproval: boolean;
  previewLessonId: string | null;
  videoLessons: { id: string; title: string }[];
};

export function CourseSettingsForm({ course, origin }: { course: CourseSettingsData; origin: string }) {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);
  const form = useForm<Values, unknown, z.output<typeof courseSettingsSchema>>({
    resolver: zodResolver(courseSettingsSchema),
    defaultValues: {
      slug: course.slug,
      certificateEnabled: course.certificateEnabled,
      requireAssignmentApproval: course.requireAssignmentApproval,
      previewLessonId: course.previewLessonId,
    },
  });
  const { errors, isDirty, isSubmitting } = form.formState;
  const slug = useWatch({ control: form.control, name: "slug" });
  useUnsavedChanges(isDirty);
  const host = origin.replace(/^https?:\/\//, "");

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    const result = await updateCourseSettingsAction(course.id, values);
    if (!toastResult(result)) {
      setFormError(result.error);
      if (result.fieldErrors?.slug) form.setError("slug", { message: result.fieldErrors.slug[0] });
      return;
    }
    form.reset(values);
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-5xl">
      <FormError message={formError} />
      <FormSection title="Course URL" description="The web address of the public course page. Changing it breaks links you've already shared.">
        <Field label="URL slug" htmlFor="course-slug" error={errors.slug?.message} description="Lowercase letters, numbers and dashes.">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              id="course-slug"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-invalid={Boolean(errors.slug)}
              aria-describedby={[describedBy("course-slug", errors.slug?.message, true), "course-slug-preview"].filter(Boolean).join(" ")}
              {...form.register("slug", { onBlur: (e) => form.setValue("slug", slugify(e.target.value) || e.target.value, { shouldDirty: true }) })}
            />
            <button
              type="button"
              className="shrink-0 text-sm font-medium text-primary hover:underline"
              onClick={() => form.setValue("slug", slugify(course.title), { shouldDirty: true, shouldValidate: true })}
            >
              Generate from title
            </button>
          </div>
        </Field>
        <p id="course-slug-preview" className="break-all rounded-lg bg-surface-muted px-3 py-2 font-mono text-[13px] text-muted-foreground">
          {host}/courses/<span className="font-semibold text-foreground">{slug || "…"}</span>
        </p>
      </FormSection>

      <FormSection title="Completion" description="What learners receive and how assignments count.">
        <Controller
          control={form.control}
          name="certificateEnabled"
          render={({ field }) => (
            <SwitchField
              id="settings-certificate"
              label="Issue a certificate on completion"
              description="Learners get a verifiable certificate when they finish every required lesson."
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <Controller
          control={form.control}
          name="requireAssignmentApproval"
          render={({ field }) => (
            <SwitchField
              id="settings-approval"
              label="Assignments need your approval"
              description="When on, an assignment lesson only completes after you approve the submission."
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </FormSection>

      <FormSection title="Course trailer" description="A video lesson shown on the course page to help people decide.">
        <Field
          label="Preview video"
          htmlFor="settings-preview"
          error={errors.previewLessonId?.message}
          description={course.videoLessons.length === 0 ? "Add a video lesson to use it as the trailer." : "Learners can watch it without enrolling."}
        >
          <Controller
            control={form.control}
            name="previewLessonId"
            render={({ field }) => (
              <Select
                id="settings-preview"
                disabled={course.videoLessons.length === 0}
                value={field.value ?? NO_PREVIEW}
                onValueChange={(v) => field.onChange(v === NO_PREVIEW ? null : v)}
                options={[{ value: NO_PREVIEW, label: "No trailer" }, ...course.videoLessons.map((l) => ({ value: l.id, label: l.title }))]}
                aria-describedby={describedBy("settings-preview", errors.previewLessonId?.message, true)}
              />
            )}
          />
        </Field>
      </FormSection>

      <SaveBar dirty={isDirty} saving={isSubmitting} onDiscard={() => form.reset()} />
    </form>
  );
}
