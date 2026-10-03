export type ErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "UNPROCESSABLE";

/**
 * An expected, user-presentable failure. Messages are safe to show to the user;
 * anything else thrown is treated as an internal error and never leaked.
 */
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const notFound = (what = "That item") => new AppError("NOT_FOUND", `${what} could not be found.`);
export const forbidden = (message = "You don't have permission to do that.") => new AppError("FORBIDDEN", message);

export type ActionResult<T = void> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; code: ErrorCode | "INTERNAL"; fieldErrors?: Record<string, string[]> };
