"use client";

import * as React from "react";
import { Dialog as D } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

export function DialogContent({
  className,
  children,
  size = "md",
  hideClose,
  ...props
}: React.ComponentProps<typeof D.Content> & { size?: "sm" | "md" | "lg" | "xl"; hideClose?: boolean }) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-overlay backdrop-blur-[2px] data-[state=open]:animate-fade-in" />
      <D.Content
        className={cn(
          "fixed z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xl focus:outline-none",
          "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 data-[state=open]:animate-scale-in",
          size === "sm" && "max-w-sm",
          size === "md" && "max-w-lg",
          size === "lg" && "max-w-2xl",
          size === "xl" && "max-w-4xl",
          className,
        )}
        {...props}
      >
        {children}
        {!hideClose && (
          <D.Close className="absolute right-3.5 top-3.5 grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground">
            <X className="size-4" aria-hidden />
            <span className="sr-only">Close</span>
          </D.Close>
        )}
      </D.Content>
    </D.Portal>
  );
}

export function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5 px-6 pb-2 pt-6 pr-12", className)} {...props} />;
}

export function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("overflow-y-auto px-6 py-4 scrollbar-thin", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col-reverse gap-2 border-t border-border bg-surface-muted/50 px-6 py-4 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

export function DialogTitle({ className, ...props }: React.ComponentProps<typeof D.Title>) {
  return <D.Title className={cn("text-lg font-semibold tracking-tight", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: React.ComponentProps<typeof D.Description>) {
  return <D.Description className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

/** Side/bottom drawer built on the same accessible dialog primitive. */
export function SheetContent({
  side = "right",
  className,
  children,
  title,
  description,
  ...props
}: React.ComponentProps<typeof D.Content> & { side?: "left" | "right" | "bottom"; title: string; description?: string }) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-overlay data-[state=open]:animate-fade-in" />
      <D.Content
        className={cn(
          "fixed z-50 flex flex-col bg-surface shadow-xl focus:outline-none",
          side === "right" && "inset-y-0 right-0 w-[min(24rem,90vw)] border-l border-border data-[state=open]:animate-slide-in-right",
          side === "left" && "inset-y-0 left-0 w-[min(20rem,85vw)] border-r border-border data-[state=open]:animate-slide-in-left",
          side === "bottom" &&
            "inset-x-0 bottom-0 max-h-[85dvh] rounded-t-2xl border-t border-border pb-[env(safe-area-inset-bottom)] data-[state=open]:animate-slide-in-bottom",
          className,
        )}
        {...props}
      >
        {side === "bottom" && <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-border-strong" aria-hidden />}
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <D.Title className="truncate text-base font-semibold">{title}</D.Title>
            {description ? (
              <D.Description className="truncate text-xs text-muted-foreground">{description}</D.Description>
            ) : (
              <D.Description className="sr-only">{title}</D.Description>
            )}
          </div>
          <D.Close className="grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-surface-muted hover:text-foreground">
            <X className="size-4" aria-hidden />
            <span className="sr-only">Close</span>
          </D.Close>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">{children}</div>
      </D.Content>
    </D.Portal>
  );
}
