"use client";

import * as React from "react";
import { AlertDialog as A } from "radix-ui";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";
import { Loader2 } from "lucide-react";

type ConfirmDialogProps = {
  trigger: React.ReactNode;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  tone?: "danger" | "primary";
  onConfirm: () => Promise<unknown> | void;
};

/** Accessible confirmation for destructive or consequential actions. */
export function ConfirmDialog({ trigger, title, description, confirmLabel = "Confirm", tone = "danger", onConfirm }: ConfirmDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  return (
    <A.Root open={open} onOpenChange={(o) => !pending && setOpen(o)}>
      <A.Trigger asChild>{trigger}</A.Trigger>
      <A.Portal>
        <A.Overlay className="fixed inset-0 z-50 bg-overlay data-[state=open]:animate-fade-in" />
        <A.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface p-6 shadow-xl data-[state=open]:animate-scale-in">
          <A.Title className="text-lg font-semibold tracking-tight">{title}</A.Title>
          <A.Description className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</A.Description>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <A.Cancel className={buttonVariants({ variant: "outline" })} disabled={pending}>
              Cancel
            </A.Cancel>
            <button
              type="button"
              className={cn(buttonVariants({ variant: tone === "danger" ? "danger" : "primary" }))}
              disabled={pending}
              onClick={async () => {
                setPending(true);
                try {
                  await onConfirm();
                  setOpen(false);
                } finally {
                  setPending(false);
                }
              }}
            >
              {pending && <Loader2 className="animate-spin" aria-hidden />}
              {confirmLabel}
            </button>
          </div>
        </A.Content>
      </A.Portal>
    </A.Root>
  );
}
