import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "./label";

type FieldProps = {
  label?: React.ReactNode;
  htmlFor?: string;
  description?: React.ReactNode;
  error?: string;
  required?: boolean;
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
};

/**
 * Label + control + help text + error, wired for screen readers. The control
 * should receive `aria-describedby={describedBy(id)}` and `aria-invalid`.
 */
export function Field({ label, htmlFor, description, error, required, optional, className, children }: FieldProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      {label && (
        <div className="flex items-baseline justify-between gap-2">
          <Label htmlFor={htmlFor}>
            {label}
            {required && <span className="ml-0.5 text-danger" aria-hidden>*</span>}
          </Label>
          {optional && <span className="text-xs text-subtle-foreground">Optional</span>}
        </div>
      )}
      {children}
      {description && !error && (
        <p id={htmlFor ? `${htmlFor}-description` : undefined} className="text-[13px] leading-snug text-muted-foreground">
          {description}
        </p>
      )}
      {error && (
        <p id={htmlFor ? `${htmlFor}-error` : undefined} role="alert" className="flex items-start gap-1.5 text-[13px] leading-snug text-danger">
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}

export function describedBy(id: string, error?: string, hasDescription?: boolean) {
  return [error ? `${id}-error` : null, hasDescription && !error ? `${id}-description` : null].filter(Boolean).join(" ") || undefined;
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-danger/25 bg-danger-soft px-3.5 py-3 text-sm text-danger">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>{message}</p>
    </div>
  );
}
