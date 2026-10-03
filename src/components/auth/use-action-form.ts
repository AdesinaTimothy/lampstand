"use client";

import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import type { ActionResult } from "@/lib/errors";

/** Copies server-side field errors from an ActionResult onto a react-hook-form instance. */
export function applyFieldErrors<T extends FieldValues>(form: UseFormReturn<T>, result: ActionResult<unknown>) {
  if (result.ok || !result.fieldErrors) return;
  for (const [field, messages] of Object.entries(result.fieldErrors)) {
    if (field === "_form") continue;
    form.setError(field as Path<T>, { type: "server", message: messages[0] });
  }
}
