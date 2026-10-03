import "server-only";
import { Prisma, type TokenType } from "@prisma/client";
import { AppError } from "@/lib/errors";
import type { RegisterInput } from "@/lib/validation/auth";
import { db } from "../db";
import { env } from "../env";
import { burnPasswordCheck, hashPassword, verifyPassword } from "../auth/password";
import { generateToken, hashToken } from "../auth/tokens";
import { revokeAllSessions } from "../auth/session";
import { sendEmail } from "../mail";
import { emailTemplates } from "../mail/templates";
import { notify } from "../notifications";
import type { CurrentOrganization } from "../organization";

const TOKEN_TTL_MS: Record<TokenType, number> = {
  EMAIL_VERIFICATION: 24 * 60 * 60 * 1000,
  PASSWORD_RESET: 60 * 60 * 1000,
};

async function issueToken(userId: string, type: TokenType): Promise<string> {
  const token = generateToken();
  // Only one live token of each type per user.
  await db.verificationToken.deleteMany({ where: { userId, type, usedAt: null } });
  await db.verificationToken.create({
    data: { userId, type, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + TOKEN_TTL_MS[type]) },
  });
  return token;
}

/** Atomically consumes a token; returns its user id or throws. */
async function consumeToken(token: string, type: TokenType): Promise<string> {
  const record = await db.verificationToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.type !== type || record.usedAt || record.expiresAt < new Date()) {
    throw new AppError("UNPROCESSABLE", "This link is invalid or has expired. Request a new one.");
  }
  const { count } = await db.verificationToken.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (count === 0) throw new AppError("UNPROCESSABLE", "This link has already been used.");
  return record.userId;
}

export async function sendVerificationEmail(user: { id: string; name: string; email: string }, org: CurrentOrganization) {
  const token = await issueToken(user.id, "EMAIL_VERIFICATION");
  const url = new URL(`/verify-email?token=${token}`, env.APP_URL).toString();
  await sendEmail(user.email, "auth.verify_email", emailTemplates.verifyEmail({ org: org.name, name: user.name, url }));
}

export async function registerUser(input: RegisterInput, org: CurrentOrganization) {
  if (!org.allowSelfRegistration) {
    throw new AppError("FORBIDDEN", "Registration is by invitation only. Please contact your church office.");
  }
  const passwordHash = await hashPassword(input.password);
  try {
    const user = await db.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        emailVerifiedAt: org.requireEmailVerification ? null : new Date(),
        memberships: { create: { organizationId: org.id, role: "LEARNER" } },
      },
      select: { id: true, name: true, email: true, emailVerifiedAt: true },
    });
    if (!user.emailVerifiedAt) await sendVerificationEmail(user, org);
    return user;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError("CONFLICT", "An account with this email already exists. Try signing in instead.", {
        email: ["An account with this email already exists"],
      });
    }
    throw error;
  }
}

export type AuthenticateResult =
  | { status: "ok"; userId: string }
  | { status: "unverified"; userId: string; email: string };

/**
 * Checks credentials. Uniform error and timing whether or not the email exists,
 * so the endpoint can't be used to enumerate accounts.
 */
export async function authenticate(email: string, password: string, org: CurrentOrganization): Promise<AuthenticateResult> {
  const invalid = new AppError("UNPROCESSABLE", "That email and password combination didn't work.");
  const user = await db.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      status: true,
      deletedAt: true,
      emailVerifiedAt: true,
      platformRole: true,
      memberships: { where: { organizationId: org.id }, select: { status: true } },
    },
  });
  if (!user?.passwordHash || user.deletedAt) {
    await burnPasswordCheck(password);
    throw invalid;
  }
  if (!(await verifyPassword(user.passwordHash, password))) throw invalid;

  const membership = user.memberships[0];
  if (user.status === "SUSPENDED" || membership?.status === "SUSPENDED") {
    throw new AppError("FORBIDDEN", "This account has been suspended. Please contact your church office.");
  }
  if (!membership && user.platformRole !== "SUPER_ADMIN") {
    // Member of another organization signing in here for the first time.
    await db.membership.create({ data: { userId: user.id, organizationId: org.id, role: "LEARNER" } });
  }
  if (!user.emailVerifiedAt && org.requireEmailVerification) {
    return { status: "unverified", userId: user.id, email: user.email };
  }
  await db.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });
  return { status: "ok", userId: user.id };
}

export async function verifyEmail(token: string): Promise<string> {
  const userId = await consumeToken(token, "EMAIL_VERIFICATION");
  await db.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
  return userId;
}

export async function resendVerification(email: string, org: CurrentOrganization): Promise<void> {
  const user = await db.user.findUnique({ where: { email }, select: { id: true, name: true, email: true, emailVerifiedAt: true } });
  if (!user || user.emailVerifiedAt) return; // Silent: don't reveal account state.
  await sendVerificationEmail(user, org);
}

export async function requestPasswordReset(email: string, org: CurrentOrganization): Promise<void> {
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, status: true, deletedAt: true },
  });
  if (!user || user.deletedAt || user.status !== "ACTIVE") return; // Silent by design.
  const token = await issueToken(user.id, "PASSWORD_RESET");
  const url = new URL(`/reset-password?token=${token}`, env.APP_URL).toString();
  await sendEmail(user.email, "auth.password_reset", emailTemplates.passwordReset({ org: org.name, name: user.name, url }));
}

export async function resetPassword(token: string, newPassword: string, org: CurrentOrganization): Promise<void> {
  const userId = await consumeToken(token, "PASSWORD_RESET");
  const user = await db.user.update({
    where: { id: userId },
    // Completing a reset proves control of the inbox, so it also verifies the email.
    data: { passwordHash: await hashPassword(newPassword), emailVerifiedAt: new Date() },
    select: { id: true, name: true, email: true, emailVerifiedAt: true },
  });
  await revokeAllSessions(userId);
  await sendEmail(user.email, "auth.password_changed", emailTemplates.passwordChanged({ org: org.name, name: user.name }));
}

export async function changePassword(
  userId: string,
  currentSessionId: string,
  input: { currentPassword: string; newPassword: string },
  org: CurrentOrganization,
) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { passwordHash: true, name: true, email: true } });
  if (!user.passwordHash || !(await verifyPassword(user.passwordHash, input.currentPassword))) {
    throw new AppError("VALIDATION", "Your current password is incorrect.", { currentPassword: ["Incorrect password"] });
  }
  await db.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(input.newPassword) } });
  await revokeAllSessions(userId, currentSessionId);
  await notify(userId, {
    type: "SECURITY",
    title: "Your password was changed",
    body: "Other devices have been signed out.",
    href: "/settings",
  });
  await sendEmail(user.email, "auth.password_changed", emailTemplates.passwordChanged({ org: org.name, name: user.name }));
}
