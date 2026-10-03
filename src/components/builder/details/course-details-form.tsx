"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import type { CourseLevel } from "@prisma/client";
import { updateCourseDetailsAction } from "@/actions/instructor";
import { COURSE_LEVELS, courseDetailsSchema, type CourseDetailsInput } from "@/lib/validation/course";
import { LEVEL_LABELS } from "@/lib/course-meta";
import { RichTextField } from "@/components/editor";
import { Field, FormError, describedBy } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormSection } from "../form-section";
import { SaveBar } from "../save-bar";
import { toastResult } from "../toast-result";
import { useUnsavedChanges } from "../use-unsaved-changes";
import { EditableList } from "./editable-list";
import { TagInput } from "./tag-input";
import { ThumbnailField } from "./thumbnail-field";

export type CourseDetailsData = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  categoryId: string | null;
  level: CourseLevel;
  objectives: string[];
  requirements: string[];
  audience: string[];
  estimatedMinutes: number | null;
  thumbnailId: string | null;
  thumbnailUrl: string | null;
  tags: string[];
};

type Values = CourseDetailsInput;
const NO_CATEGORY = "__none";

function toValues(c: CourseDetailsData): Values {
  return {
    title: c.title,
    subtitle: c.subtitle ?? "",
    description: c.description ?? "",
    categoryId: c.categoryId,
    level: c.level,
    tags: c.tags,
    objectives: c.objectives,
    requirements: c.requirements,
    audience: c.audience,
    estimatedMinutes: c.estimatedMinutes,
    thumbnailId: c.thumbnailId,
  };
}

const LIST_FIELDS = [
  {
    name: "objectives",
    label: "What learners will learn",
    itemLabel: "Objective",
    placeholder: "e.g. Pray the Psalms with confidence",
    max: 12,
    help: "Shown as a checklist on the course page. Start each with a verb.",
  },
  { name: "requirements", label: "Requirements", itemLabel: "Requirement", placeholder: "e.g. A Bible in any translation", max: 10, help: "Anything learners should have or know first." },
  { name: "audience", label: "Who this course is for", itemLabel: "Audience", placeholder: "e.g. New believers", max: 8, help: "Helps people decide whether it fits them." },
] as const;

export function CourseDetailsForm({ course, categories }: { course: CourseDetailsData; categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [thumbnailUrl, setThumbnailUrl] = React.useState(course.thumbnailUrl);
  const [formError, setFormError] = React.useState<string | null>(null);
  const form = useForm<Values, unknown, z.output<typeof courseDetailsSchema>>({
    resolver: zodResolver(courseDetailsSchema),
    defaultValues: toValues(course),
  });
  const { errors, isDirty, isSubmitting } = form.formState;
  useUnsavedChanges(isDirty);

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    const result = await updateCourseDetailsAction(course.id, values);
    if (!toastResult(result)) {
      setFormError(result.error);
      for (const [key, messages] of Object.entries(result.fieldErrors ?? {})) {
        if (key in values) form.setError(key as keyof Values, { message: messages[0] });
      }
      return;
    }
    form.reset(form.getValues());
    router.refresh();
  });

  const err = (name: keyof Values) => {
    const e = errors[name];
    if (!e) return undefined;
    if (typeof e.message === "string") return e.message;
    // Array fields: surface the first item error.
    const first = Array.isArray(e) ? e.find((x) => x?.message) : undefined;
    return first?.message as string | undefined;
  };

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-5xl">
      <FormError message={formError} />
      <FormSection title="Basics" description="The title and subtitle appear everywhere your course is listed.">
        <Field label="Title" htmlFor="course-title" error={err("title")} required>
          <Input id="course-title" aria-invalid={Boolean(errors.title)} aria-describedby={describedBy("course-title", err("title"))} {...form.register("title")} />
        </Field>
        <Field label="Subtitle" htmlFor="course-subtitle" error={err("subtitle")} optional description="One sentence that tells people why it matters.">
          <Input
            id="course-subtitle"
            aria-invalid={Boolean(errors.subtitle)}
            aria-describedby={describedBy("course-subtitle", err("subtitle"), true)}
            {...form.register("subtitle")}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Category" htmlFor="course-category" error={err("categoryId")}>
            <Controller
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <Select
                  id="course-category"
                  value={field.value ?? NO_CATEGORY}
                  onValueChange={(v) => field.onChange(v === NO_CATEGORY ? null : v)}
                  options={[{ value: NO_CATEGORY, label: "No category" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
                  aria-invalid={Boolean(errors.categoryId)}
                  aria-describedby={describedBy("course-category", err("categoryId"))}
                />
              )}
            />
          </Field>
          <Field label="Level" htmlFor="course-level" error={err("level")}>
            <Controller
              control={form.control}
              name="level"
              render={({ field }) => (
                <Select
                  id="course-level"
                  value={field.value}
                  onValueChange={field.onChange}
                  options={COURSE_LEVELS.map((l) => ({ value: l, label: LEVEL_LABELS[l] }))}
                  aria-invalid={Boolean(errors.level)}
                />
              )}
            />
          </Field>
        </div>
        <Field label="Estimated time to complete" htmlFor="course-minutes" optional error={err("estimatedMinutes")} description="In minutes. Leave empty to calculate it from your lessons.">
          <Input
            id="course-minutes"
            type="number"
            inputMode="numeric"
            min={0}
            className="sm:max-w-[12rem]"
            aria-invalid={Boolean(errors.estimatedMinutes)}
            aria-describedby={describedBy("course-minutes", err("estimatedMinutes"), true)}
            {...form.register("estimatedMinutes", { setValueAs: (v: unknown) => (v === "" || v === null || v === undefined ? null : Number(v)) })}
          />
        </Field>
      </FormSection>

      <FormSection title="Description" description="What the course covers and how it's structured. At least 80 characters before publishing.">
        <Field label="Course description" htmlFor="course-description" error={err("description")}>
          <Controller
            control={form.control}
            name="description"
            render={({ field }) => (
              <RichTextField
                id="course-description"
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="Describe the journey learners will take…"
                invalid={Boolean(errors.description)}
                describedBy={describedBy("course-description", err("description"))}
              />
            )}
          />
        </Field>
      </FormSection>

      <FormSection title="Thumbnail" description="Shown on course cards and the course page.">
        <Controller
          control={form.control}
          name="thumbnailId"
          render={({ field }) => (
            <ThumbnailField
              url={thumbnailUrl}
              onChange={(asset) => {
                setThumbnailUrl(asset?.url ?? null);
                field.onChange(asset?.id ?? null);
              }}
            />
          )}
        />
      </FormSection>

      <FormSection title="Outcomes" description="Clear expectations help the right people enrol.">
        {LIST_FIELDS.map((f) => (
          <Field key={f.name} label={f.label} htmlFor={`course-${f.name}`} error={err(f.name)} description={f.help}>
            <Controller
              control={form.control}
              name={f.name}
              render={({ field }) => (
                <EditableList
                  id={`course-${f.name}`}
                  value={field.value ?? []}
                  onChange={field.onChange}
                  itemLabel={f.itemLabel}
                  placeholder={f.placeholder}
                  max={f.max}
                  invalid={Boolean(errors[f.name])}
                  describedBy={describedBy(`course-${f.name}`, err(f.name), true)}
                />
              )}
            />
          </Field>
        ))}
      </FormSection>

      <FormSection title="Tags" description="Up to 12 keywords that improve search.">
        <Field label="Tags" htmlFor="course-tags" error={err("tags")} description="Press Enter or comma to add a tag.">
          <Controller
            control={form.control}
            name="tags"
            render={({ field }) => (
              <TagInput
                id="course-tags"
                value={field.value ?? []}
                onChange={field.onChange}
                invalid={Boolean(errors.tags)}
                describedBy={describedBy("course-tags", err("tags"), true)}
              />
            )}
          />
        </Field>
      </FormSection>

      <SaveBar
        dirty={isDirty}
        saving={isSubmitting}
        onDiscard={() => {
          form.reset();
          setThumbnailUrl(course.thumbnailUrl);
        }}
      />
    </form>
  );
}
