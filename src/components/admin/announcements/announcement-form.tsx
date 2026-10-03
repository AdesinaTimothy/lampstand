"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SwitchField } from "@/components/ui/checkbox";
import { Field, FormError, describedBy } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { announcementSchema } from "@/lib/validation/admin";
import { sendAnnouncementAction } from "@/actions/admin";
import { ConfirmActionDialog } from "../confirm-action-dialog";
import { runWithToast } from "../run-action";

type Values = z.input<typeof announcementSchema>;
type Output = z.output<typeof announcementSchema>;

export function AnnouncementForm({ recipients }: { recipients: number }) {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);
  const [pendingValues, setPendingValues] = React.useState<Output | null>(null);
  const form = useForm<Values, unknown, Output>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { title: "", body: "", sendEmail: false },
  });
  const { errors, isSubmitting } = form.formState;
  const body = useWatch({ control: form.control, name: "body" }) ?? "";
  const sendEmail = useWatch({ control: form.control, name: "sendEmail" });

  // Validate first, then ask for confirmation before anything is sent.
  const review = form.handleSubmit((values) => {
    setFormError(null);
    setPendingValues(values);
  });

  async function send(values: Output) {
    const result = await runWithToast(sendAnnouncementAction(values), (d) => `Announcement sent to ${d.recipients} member${d.recipients === 1 ? "" : "s"}.`);
    if (!result.ok) {
      for (const [key, messages] of Object.entries(result.fieldErrors ?? {})) {
        if (key === "title" || key === "body") form.setError(key, { message: messages[0] });
      }
      setFormError(result.error);
      return;
    }
    form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={review} noValidate className="grid gap-5">
      <FormError message={formError} />
      <Field label="Title" htmlFor="announcement-title" error={errors.title?.message} required>
        <Input
          id="announcement-title"
          maxLength={140}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={describedBy("announcement-title", errors.title?.message)}
          placeholder="e.g. New Alpha course starts Sunday"
          {...form.register("title")}
        />
      </Field>
      <Field
        label="Message"
        htmlFor="announcement-body"
        error={errors.body?.message}
        description={`${body.length}/2000 · Plain text. Appears in everyone's notifications.`}
        required
      >
        <Textarea
          id="announcement-body"
          rows={6}
          maxLength={2000}
          aria-invalid={Boolean(errors.body)}
          aria-describedby={describedBy("announcement-body", errors.body?.message, true)}
          {...form.register("body")}
        />
      </Field>
      <Controller
        control={form.control}
        name="sendEmail"
        render={({ field }) => (
          <SwitchField
            id="announcement-email"
            label="Also send by email"
            description="Members who turned off email notifications won't receive it."
            checked={Boolean(field.value)}
            onCheckedChange={field.onChange}
          />
        )}
      />
      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting} className="w-full sm:w-auto">
          <Send aria-hidden />
          Send announcement
        </Button>
      </div>
      <ConfirmActionDialog
        open={pendingValues !== null}
        onOpenChange={(o) => !o && setPendingValues(null)}
        tone="primary"
        title="Send this announcement?"
        description={`“${pendingValues?.title ?? ""}” goes to ${recipients} active member${recipients === 1 ? "" : "s"} as an in-app notification${
          sendEmail ? " and by email" : ""
        }. Announcements can't be recalled.`}
        confirmLabel="Send now"
        onConfirm={async () => {
          if (pendingValues) await send(pendingValues);
        }}
      />
    </form>
  );
}
