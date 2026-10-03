"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, FormError, describedBy } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { registerSchema, type RegisterInput } from "@/lib/validation/auth";
import { PasswordInput } from "./password-input";
import { applyFieldErrors } from "./use-action-form";

export function RegisterForm() {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
    mode: "onTouched",
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: RegisterInput) {
    setFormError(null);
    const result = await registerAction(values);
    if (!result.ok) {
      applyFieldErrors(form, result);
      setFormError(result.error);
      return;
    }
    if (result.data.needsVerification) {
      router.push(`/verify-email?sent=${encodeURIComponent(result.data.email)}`);
    } else {
      router.replace("/dashboard?welcome=1");
      router.refresh();
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-5">
      <FormError message={formError} />
      <Field label="Full name" htmlFor="name" error={errors.name?.message}>
        <Input id="name" autoComplete="name" autoFocus aria-invalid={!!errors.name} aria-describedby={describedBy("name", errors.name?.message)} {...form.register("name")} />
      </Field>
      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          aria-invalid={!!errors.email}
          aria-describedby={describedBy("email", errors.email?.message)}
          {...form.register("email")}
        />
      </Field>
      <Field
        label="Password"
        htmlFor="password"
        error={errors.password?.message}
        description="At least 10 characters. A short phrase is easy to remember and hard to guess."
      >
        <PasswordInput
          id="password"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          aria-describedby={describedBy("password", errors.password?.message, true)}
          {...form.register("password")}
        />
      </Field>
      <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
        Create account
      </Button>
      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        By creating an account you agree to use this platform respectfully and in keeping with our church community.
      </p>
    </form>
  );
}
