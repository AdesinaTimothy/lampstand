"use client";

import Link from "next/link";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MailCheck } from "lucide-react";
import { forgotPasswordAction, resetPasswordAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, FormError, describedBy } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { forgotPasswordSchema, resetPasswordSchema } from "@/lib/validation/auth";
import { PasswordInput } from "./password-input";
import { applyFieldErrors } from "./use-action-form";

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const form = useForm<z.infer<typeof forgotPasswordSchema>>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } });
  const { errors, isSubmitting } = form.formState;

  if (sentTo) {
    return (
      <div className="text-center" role="status">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary-soft text-primary">
          <MailCheck className="size-5" aria-hidden />
        </div>
        <h2 className="mt-4 text-lg font-semibold">Check your email</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          If an account exists for <span className="font-medium text-foreground">{sentTo}</span>, you&apos;ll receive a link to reset your
          password within a few minutes.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }
  return (
    <form
      noValidate
      className="grid gap-5"
      onSubmit={form.handleSubmit(async (values) => {
        setFormError(null);
        const result = await forgotPasswordAction(values);
        if (!result.ok) return setFormError(result.error);
        setSentTo(values.email);
      })}
    >
      <FormError message={formError} />
      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" autoFocus aria-invalid={!!errors.email} aria-describedby={describedBy("email", errors.email?.message)} {...form.register("email")} />
      </Field>
      <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
        Send reset link
      </Button>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);
  const form = useForm<z.input<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: "", confirmPassword: "" },
  });
  const { errors, isSubmitting } = form.formState;
  return (
    <form
      noValidate
      className="grid gap-5"
      onSubmit={form.handleSubmit(async (values) => {
        setFormError(null);
        const result = await resetPasswordAction(values);
        if (!result.ok) {
          applyFieldErrors(form, result);
          return setFormError(result.error);
        }
        router.replace("/login?notice=reset");
      })}
    >
      <FormError message={formError} />
      <Field label="New password" htmlFor="password" error={errors.password?.message} description="At least 10 characters.">
        <PasswordInput id="password" autoComplete="new-password" autoFocus aria-invalid={!!errors.password} aria-describedby={describedBy("password", errors.password?.message, true)} {...form.register("password")} />
      </Field>
      <Field label="Confirm new password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
        <PasswordInput id="confirmPassword" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} aria-describedby={describedBy("confirmPassword", errors.confirmPassword?.message)} {...form.register("confirmPassword")} />
      </Field>
      <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
        Update password
      </Button>
    </form>
  );
}
