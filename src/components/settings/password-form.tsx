"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";
import { changePasswordAction } from "@/actions/auth";
import { applyFieldErrors } from "@/components/auth/use-action-form";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Field, FormError, describedBy } from "@/components/ui/field";
import { changePasswordSchema } from "@/lib/validation/auth";

type Input = z.input<typeof changePasswordSchema>;

export function PasswordForm() {
  const [formError, setFormError] = React.useState<string | null>(null);
  const form = useForm<Input>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
    mode: "onTouched",
  });
  const { errors, isSubmitting } = form.formState;

  return (
    <form
      noValidate
      className="grid gap-5"
      onSubmit={form.handleSubmit(async (values) => {
        setFormError(null);
        const res = await changePasswordAction(values);
        if (!res.ok) {
          applyFieldErrors(form, res);
          setFormError(res.error);
          return;
        }
        toast.success(res.message ?? "Password updated");
        form.reset();
      })}
    >
      <FormError message={formError} />
      <Field label="Current password" htmlFor="currentPassword" error={errors.currentPassword?.message}>
        <PasswordInput
          id="currentPassword"
          autoComplete="current-password"
          aria-invalid={!!errors.currentPassword}
          aria-describedby={describedBy("currentPassword", errors.currentPassword?.message)}
          {...form.register("currentPassword")}
        />
      </Field>
      <Field label="New password" htmlFor="newPassword" error={errors.newPassword?.message} description="At least 10 characters.">
        <PasswordInput
          id="newPassword"
          autoComplete="new-password"
          aria-invalid={!!errors.newPassword}
          aria-describedby={describedBy("newPassword", errors.newPassword?.message, true)}
          {...form.register("newPassword")}
        />
      </Field>
      <Field label="Confirm new password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          aria-invalid={!!errors.confirmPassword}
          aria-describedby={describedBy("confirmPassword", errors.confirmPassword?.message)}
          {...form.register("confirmPassword")}
        />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting}>
          Update password
        </Button>
      </div>
    </form>
  );
}
