"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FormError, describedBy } from "@/components/ui/field";
import { Textarea } from "@/components/ui/input";
import { revokeCertificateSchema } from "@/lib/validation/admin";
import { revokeCertificateAction } from "@/actions/admin";
import { runWithToast } from "../run-action";

type Values = z.input<typeof revokeCertificateSchema>;
type Output = z.output<typeof revokeCertificateSchema>;

export function RevokeCertificateDialog({ certificateId, code, recipientName, courseTitle }: { certificateId: string; code: string; recipientName: string; courseTitle: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const form = useForm<Values, unknown, Output>({ resolver: zodResolver(revokeCertificateSchema), defaultValues: { certificateId, reason: "" } });
  const { errors, isSubmitting } = form.formState;
  const fieldId = `revoke-${certificateId}`;

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    const result = await runWithToast(revokeCertificateAction(values));
    if (!result.ok) {
      if (result.fieldErrors?.reason) form.setError("reason", { message: result.fieldErrors.reason[0] });
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
          form.reset({ certificateId, reason: "" });
          setFormError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="danger-ghost" size="sm">
          <Ban aria-hidden />
          Revoke
          <span className="sr-only"> certificate {code}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate className="contents">
          <DialogHeader>
            <DialogTitle>Revoke certificate?</DialogTitle>
            <DialogDescription>
              {recipientName}&apos;s certificate for “{courseTitle}” (<span className="font-mono">{code}</span>) will show as revoked to anyone who verifies
              it. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="grid gap-4">
            <FormError message={formError} />
            <Field label="Reason" htmlFor={fieldId} error={errors.reason?.message} description="Recorded in the audit log. Not shown publicly." required>
              <Textarea
                id={fieldId}
                rows={3}
                aria-invalid={Boolean(errors.reason)}
                aria-describedby={describedBy(fieldId, errors.reason?.message, true)}
                placeholder="e.g. Issued in error after a data import"
                {...form.register("reason")}
              />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" loading={isSubmitting}>
              Revoke certificate
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
