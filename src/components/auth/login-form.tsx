"use client";

import Link from "next/link";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { loginAction, resendVerificationAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, FormError, describedBy } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";
import { PasswordInput } from "./password-input";
import { applyFieldErrors } from "./use-action-form";

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);
  const [unverified, setUnverified] = React.useState<string | null>(null);
  const [resent, setResent] = React.useState(false);
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "", next } });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: LoginInput) {
    setFormError(null);
    const result = await loginAction(values);
    if (!result.ok) {
      applyFieldErrors(form, result);
      setFormError(result.error);
      return;
    }
    if ("unverified" in result.data) {
      setUnverified(result.data.email);
      return;
    }
    router.replace(result.data.redirectTo);
    router.refresh();
  }

  if (unverified) {
    return (
      <div className="text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary-soft text-primary">
          <MailCheck className="size-5" aria-hidden />
        </div>
        <h2 className="mt-4 text-lg font-semibold">Confirm your email first</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a confirmation link to <span className="font-medium text-foreground">{unverified}</span>. Open it to finish setting up
          your account.
        </p>
        <Button
          variant="outline"
          className="mt-6 w-full"
          disabled={resent}
          onClick={async () => {
            await resendVerificationAction({ email: unverified });
            setResent(true);
          }}
        >
          {resent ? "Link sent — check your inbox" : "Resend confirmation link"}
        </Button>
        <button className="mt-3 text-sm text-muted-foreground hover:text-foreground" onClick={() => setUnverified(null)}>
          Use a different account
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-5">
      {notice && (
        <p role="status" className="rounded-lg bg-success-soft px-3.5 py-3 text-sm text-success">
          {notice}
        </p>
      )}
      <FormError message={formError} />
      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoFocus
          aria-invalid={!!errors.email}
          aria-describedby={describedBy("email", errors.email?.message)}
          {...form.register("email")}
        />
      </Field>
      <Field label="Password" htmlFor="password" error={errors.password?.message}>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          aria-describedby={describedBy("password", errors.password?.message)}
          {...form.register("password")}
        />
      </Field>
      <div className="-mt-2 flex justify-end">
        <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
          Forgot password?
        </Link>
      </div>
      <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
        Sign in
      </Button>
    </form>
  );
}
