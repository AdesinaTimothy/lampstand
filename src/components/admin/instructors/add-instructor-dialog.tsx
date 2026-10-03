"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { CheckCircle2, MailPlus, UserPlus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FormError, describedBy } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { inviteInstructorSchema } from "@/lib/validation/admin";
import { inviteInstructorAction } from "@/actions/admin";

type Values = z.input<typeof inviteInstructorSchema>;
type Output = z.output<typeof inviteInstructorSchema>;
type Outcome = { userId: string; invited: boolean; name: string; email: string };

export function AddInstructorDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [outcome, setOutcome] = React.useState<Outcome | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const form = useForm<Values, unknown, Output>({ resolver: zodResolver(inviteInstructorSchema), defaultValues: { name: "", email: "" } });
  const { errors, isSubmitting } = form.formState;

  function reset() {
    form.reset();
    setOutcome(null);
    setFormError(null);
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    const result = await inviteInstructorAction(values);
    if (!result.ok) {
      for (const [key, messages] of Object.entries(result.fieldErrors ?? {})) {
        if (key === "name" || key === "email") form.setError(key, { message: messages[0] });
      }
      setFormError(result.error);
      return;
    }
    setOutcome({ ...result.data, name: values.name, email: values.email });
    router.refresh();
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <UserPlus aria-hidden />
          Add instructor
        </Button>
      </DialogTrigger>
      <DialogContent>
        {outcome ? (
          <>
            <DialogHeader>
              <span className="mb-2 grid size-10 place-items-center rounded-full bg-success-soft text-success">
                <CheckCircle2 className="size-5" aria-hidden />
              </span>
              <DialogTitle>{outcome.invited ? "Invitation sent" : "Instructor added"}</DialogTitle>
              <DialogDescription>
                {outcome.invited
                  ? `${outcome.name} doesn't have an account yet. We emailed ${outcome.email} a link to set a password; it's valid for 7 days.`
                  : `${outcome.name} already had an account and is now an instructor. They've been notified and will be asked to sign in again.`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={reset}>
                Add another
              </Button>
              <Link href={`/admin/instructors/${outcome.userId}`} className={buttonVariants()} onClick={() => setOpen(false)}>
                View instructor
              </Link>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={onSubmit} noValidate className="contents">
            <DialogHeader>
              <DialogTitle>Add an instructor</DialogTitle>
              <DialogDescription>
                Existing members are promoted straight away. Anyone new receives an email invitation to set a password.
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="grid gap-4">
              <FormError message={formError} />
              <Field label="Full name" htmlFor="instructor-name" error={errors.name?.message} required>
                <Input
                  id="instructor-name"
                  autoComplete="off"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={describedBy("instructor-name", errors.name?.message)}
                  {...form.register("name")}
                />
              </Field>
              <Field label="Email" htmlFor="instructor-email" error={errors.email?.message} required>
                <Input
                  id="instructor-email"
                  type="email"
                  inputMode="email"
                  autoComplete="off"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={describedBy("instructor-email", errors.email?.message)}
                  {...form.register("email")}
                />
              </Field>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting}>
                <MailPlus aria-hidden />
                Add instructor
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
