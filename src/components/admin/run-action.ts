"use client";

import { toast } from "sonner";
import type { ActionResult } from "@/lib/errors";

/**
 * Shows the outcome of a Server Action as a toast and returns whether it
 * succeeded. Callers refresh server data (router.refresh) on success.
 */
export async function runWithToast<T>(
  promise: Promise<ActionResult<T>>,
  success?: string | ((data: T) => string | undefined),
): Promise<ActionResult<T>> {
  try {
    const result = await promise;
    if (result.ok) {
      const message = typeof success === "function" ? success(result.data) : (success ?? result.message);
      if (message) toast.success(message);
    } else {
      toast.error(result.error);
    }
    return result;
  } catch {
    const failure: ActionResult<T> = { ok: false, error: "We couldn't reach the server. Check your connection and try again.", code: "INTERNAL" };
    toast.error(failure.error);
    return failure;
  }
}
