"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FormError, describedBy } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { categorySchema } from "@/lib/validation/admin";
import { isCategoryIcon } from "@/lib/category-icons";
import { createCategoryAction, updateCategoryAction } from "@/actions/admin";
import { runWithToast } from "../run-action";
import { IconPicker } from "./icon-picker";

type Values = z.input<typeof categorySchema>;
type Output = z.output<typeof categorySchema>;

export function CategoryDialog({
  category,
  trigger,
}: {
  category?: { id: string; name: string; description: string | null; icon: string | null };
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const defaults: Values = {
    name: category?.name ?? "",
    description: category?.description ?? "",
    icon: isCategoryIcon(category?.icon) ? category.icon : "book-open",
  };
  const form = useForm<Values, unknown, Output>({ resolver: zodResolver(categorySchema), defaultValues: defaults });
  const { errors, isSubmitting } = form.formState;
  const editing = Boolean(category);
  const idPrefix = category ? `category-${category.id}` : "category-new";

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    const result = category
      ? await runWithToast(updateCategoryAction(category.id, values))
      : await runWithToast(createCategoryAction(values));
    if (!result.ok) {
      for (const [key, messages] of Object.entries(result.fieldErrors ?? {})) {
        if (key === "name" || key === "description" || key === "icon") form.setError(key, { message: messages[0] });
      }
      setFormError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          form.reset(defaults);
          setFormError(null);
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate className="contents">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit category" : "New category"}</DialogTitle>
            <DialogDescription>Categories group courses in the catalogue and help people find what they need.</DialogDescription>
          </DialogHeader>
          <DialogBody className="grid gap-5">
            <FormError message={formError} />
            <Field label="Name" htmlFor={`${idPrefix}-name`} error={errors.name?.message} required>
              <Input
                id={`${idPrefix}-name`}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={describedBy(`${idPrefix}-name`, errors.name?.message)}
                placeholder="e.g. Discipleship"
                {...form.register("name")}
              />
            </Field>
            <Field
              label="Description"
              htmlFor={`${idPrefix}-description`}
              error={errors.description?.message}
              description="One sentence shown on the category page."
              optional
            >
              <Textarea
                id={`${idPrefix}-description`}
                rows={3}
                aria-invalid={Boolean(errors.description)}
                aria-describedby={describedBy(`${idPrefix}-description`, errors.description?.message, true)}
                {...form.register("description")}
              />
            </Field>
            <fieldset className="grid gap-2">
              <legend className="mb-2 text-sm font-medium">Icon</legend>
              <Controller
                control={form.control}
                name="icon"
                render={({ field }) => <IconPicker value={field.value ?? "book-open"} onChange={field.onChange} />}
              />
            </fieldset>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editing ? "Save changes" : "Create category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
