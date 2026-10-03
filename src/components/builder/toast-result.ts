"use client";

import { toast } from "sonner";
import type { ActionResult } from "@/lib/errors";

/**
 * Shows the outcome of a Server Action as a toast and returns the data on success.
 * `fallbackSuccess` is used when the action didn't provide its own message.
 */
export function toastResult<T>(result: ActionResult<T>, fallbackSuccess?: string): result is { ok: true; data: T; message?: string } {
  if (result.ok) {
    const message = result.message ?? fallbackSuccess;
    if (message) toast.success(message);
    return true;
  }
  toast.error(result.error);
  return false;
}
