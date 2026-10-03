"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Plus } from "lucide-react";
import { createCourseAction } from "@/actions/instructor";
import { createCourseSchema } from "@/lib/validation/course";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FormError, describedBy } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { toastResult } from "../toast-result";

type CreateCourseValues = z.input<typeof createCourseSchema>;
type CategoryOption = { id: string; name: string };
const NO_CATEGORY = "__none";

export function NewCourseDialog({
  categories,
  label = "New course",
  variant = "primary",
  size = "md",
}: {
  categories: CategoryOption[];
  label?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <Plus /> {label}
        </Button>
      </DialogTrigger>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Start a new course</DialogTitle>
          <DialogDescription>Give it a working title — you can change everything later. It stays a private draft until you publish.</DialogDescription>
        </DialogHeader>
        <NewCourseForm categories={categories} onCancel={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

export function NewCourseForm({ categories, onCancel }: { categories: CategoryOption[]; onCancel?: () => void }) {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);
  const form = useForm<CreateCourseValues, unknown, z.output<typeof createCourseSchema>>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: { title: "", categoryId: null },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    const result = await createCourseAction(values);
    if (!result.ok) {
      setFormError(result.error);
      if (result.fieldErrors?.title) form.setError("title", { message: result.fieldErrors.title[0] });
      if (result.fieldErrors?.categoryId) form.setError("categoryId", { message: result.fieldErrors.categoryId[0] });
      return;
    }
    toastResult(result);
    router.push(`/instructor/courses/${result.data.id}/details`);
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <DialogBody className="space-y-5">
        <FormError message={formError} />
        <Field label="Course title" htmlFor="new-course-title" error={errors.title?.message} required>
          <Input
            id="new-course-title"
            autoFocus
            placeholder="e.g. Foundations of Prayer"
            aria-invalid={Boolean(errors.title)}
            aria-describedby={describedBy("new-course-title", errors.title?.message)}
            {...form.register("title")}
          />
        </Field>
        <Field
          label="Category"
          htmlFor="new-course-category"
          optional
          error={errors.categoryId?.message}
          description="Helps learners find it in the catalogue."
        >
          <Controller
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <Select
                id="new-course-category"
                value={field.value ?? NO_CATEGORY}
                onValueChange={(v) => field.onChange(v === NO_CATEGORY ? null : v)}
                options={[{ value: NO_CATEGORY, label: "No category yet" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
                aria-invalid={Boolean(errors.categoryId)}
                aria-describedby={describedBy("new-course-category", errors.categoryId?.message, true)}
              />
            )}
          />
        </Field>
      </DialogBody>
      <DialogFooter>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={isSubmitting}>
          Create course
        </Button>
      </DialogFooter>
    </form>
  );
}
