import "server-only";
import { z } from "zod";
import { AppError, type ActionResult } from "@/lib/errors";

/** Parses untrusted input, converting Zod issues into field errors. */
export function parse<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input);
  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".") || "_form";
      (fieldErrors[key] ??= []).push(issue.message);
    }
    const first = result.error.issues[0]?.message ?? "Please check the form and try again.";
    throw new AppError("VALIDATION", first, fieldErrors);
  }
  return result.data;
}

/**
 * Runs a Server Action body and converts failures into a typed result. Expected
 * errors (AppError) are returned to the client; anything else is logged and
 * replaced with a generic message so internals never leak.
 */
export async function runAction<T>(fn: () => Promise<T>, successMessage?: string): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data, message: successMessage };
  } catch (error) {
    if (isNextControlFlow(error)) throw error;
    if (error instanceof AppError) {
      return { ok: false, error: error.message, code: error.code, fieldErrors: error.fieldErrors };
    }
    console.error("[action] unexpected error", error);
    return { ok: false, error: "Something went wrong on our side. Please try again.", code: "INTERNAL" };
  }
}

/** redirect()/notFound() throw special errors that must propagate. */
function isNextControlFlow(error: unknown): boolean {
  const digest = (error as { digest?: unknown } | null)?.digest;
  return typeof digest === "string" && (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_HTTP_ERROR_FALLBACK") || digest === "NEXT_NOT_FOUND");
}
