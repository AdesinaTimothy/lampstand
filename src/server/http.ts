import "server-only";
import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { env } from "./env";

const STATUS: Record<AppError["code"], number> = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION: 400,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  UNPROCESSABLE: 422,
};

/** Converts errors from route handlers into safe JSON responses. */
export function errorResponse(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message, code: error.code, fieldErrors: error.fieldErrors }, { status: STATUS[error.code] });
  }
  console.error("[api] unexpected error", error);
  return NextResponse.json({ error: "Something went wrong. Please try again.", code: "INTERNAL" }, { status: 500 });
}

/**
 * CSRF defence for cookie-authenticated mutating route handlers: the request
 * must come from our own origin. (Server Actions get this check from Next.js.)
 */
export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const allowed = new URL(env.APP_URL).origin;
  const host = request.headers.get("host");
  const sameHost = origin && host && new URL(origin).host === host;
  if (!origin || (origin !== allowed && !sameHost)) {
    throw new AppError("FORBIDDEN", "Cross-site request blocked.");
  }
}
