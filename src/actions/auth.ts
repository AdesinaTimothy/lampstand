"use server";

import { redirect } from "next/navigation";
import { AppError, type ActionResult } from "@/lib/errors";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  safeRedirectPath,
} from "@/lib/validation/auth";
import { parse, runAction } from "@/server/action";
import { createSession, destroyCurrentSession } from "@/server/auth/session";
import { requireViewer } from "@/server/auth/guards";
import { getCurrentOrganization } from "@/server/organization";
import { enforceRateLimit } from "@/server/rate-limit";
import { getRequestMeta } from "@/server/request";
import * as auth from "@/server/services/auth";

async function clientKey(scope: string, extra = "") {
  const { ipAddress } = await getRequestMeta();
  return `${scope}:${ipAddress ?? "unknown"}${extra ? `:${extra}` : ""}`;
}

export async function registerAction(input: unknown): Promise<ActionResult<{ needsVerification: boolean; email: string }>> {
  return runAction(async () => {
    const data = parse(registerSchema, input);
    await enforceRateLimit(await clientKey("register"), 5, 60 * 60);
    const org = await getCurrentOrganization();
    const user = await auth.registerUser(data, org);
    if (user.emailVerifiedAt) {
      await createSession(user.id);
      return { needsVerification: false, email: user.email };
    }
    return { needsVerification: true, email: user.email };
  });
}

export async function loginAction(
  input: unknown,
): Promise<ActionResult<{ redirectTo: string } | { unverified: true; email: string }>> {
  return runAction(async () => {
    const data = parse(loginSchema, input);
    // Per-IP and per-account limits slow down both spraying and targeted guessing.
    await enforceRateLimit(await clientKey("login"), 20, 15 * 60);
    await enforceRateLimit(`login-account:${data.email}`, 10, 15 * 60);
    const org = await getCurrentOrganization();
    const result = await auth.authenticate(data.email, data.password, org);
    if (result.status === "unverified") return { unverified: true as const, email: result.email };
    await createSession(result.userId);
    return { redirectTo: safeRedirectPath(data.next) };
  });
}

export async function logoutAction(): Promise<void> {
  await destroyCurrentSession();
  redirect("/");
}

export async function resendVerificationAction(input: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const { email } = parse(forgotPasswordSchema, input);
    await enforceRateLimit(await clientKey("resend-verification", email), 3, 15 * 60);
    await auth.resendVerification(email, await getCurrentOrganization());
  }, "If that account needs verifying, we've sent a new link.");
}

export async function forgotPasswordAction(input: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const { email } = parse(forgotPasswordSchema, input);
    await enforceRateLimit(await clientKey("forgot-password"), 5, 15 * 60);
    await enforceRateLimit(`forgot-password-account:${email}`, 3, 60 * 60);
    await auth.requestPasswordReset(email, await getCurrentOrganization());
  });
}

export async function resetPasswordAction(input: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const data = parse(resetPasswordSchema, input);
    await enforceRateLimit(await clientKey("reset-password"), 10, 15 * 60);
    await auth.resetPassword(data.token, data.password, await getCurrentOrganization());
  }, "Your password has been updated. Please sign in.");
}

export async function changePasswordAction(input: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const viewer = await requireViewer();
    const data = parse(changePasswordSchema, input);
    await enforceRateLimit(`change-password:${viewer.id}`, 5, 15 * 60);
    await auth.changePassword(viewer.id, viewer.sessionId, data, await getCurrentOrganization());
  }, "Password updated. Other devices have been signed out.");
}

/** Used by the verify-email page (GET link → consumes token server-side). */
export async function verifyEmailToken(token: string): Promise<{ ok: boolean; message: string }> {
  try {
    if (!token || token.length < 20) throw new AppError("UNPROCESSABLE", "This link is invalid.");
    const userId = await auth.verifyEmail(token);
    await createSession(userId);
    return { ok: true, message: "Your email is confirmed." };
  } catch (error) {
    if (error instanceof AppError) return { ok: false, message: error.message };
    console.error(error);
    return { ok: false, message: "We couldn't verify your email. Please try again." };
  }
}
