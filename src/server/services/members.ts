import "server-only";
import type { MemberRole } from "@prisma/client";
import { AppError, forbidden, notFound } from "@/lib/errors";
import { assignableRoles } from "@/lib/roles";
import { db } from "../db";
import { env } from "../env";
import { audit } from "../audit";
import { generateToken, hashToken } from "../auth/tokens";
import { revokeAllSessions } from "../auth/session";
import { sendEmail } from "../mail";
import { emailTemplates } from "../mail/templates";
import { notify } from "../notifications";
import type { Viewer } from "../auth/viewer";
import { assertCan } from "../authz/policies";
import { getCurrentOrganization } from "../organization";

async function loadMembership(viewer: Viewer, userId: string) {
  const membership = await db.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId: viewer.organizationId } },
    select: { id: true, role: true, status: true, user: { select: { name: true, platformRole: true } } },
  });
  if (!membership) throw notFound("Member");
  return membership;
}

export async function changeMemberRole(viewer: Viewer, userId: string, role: MemberRole) {
  assertCan(viewer, "learner:manage");
  if (userId === viewer.id) throw forbidden("You can't change your own role.");
  const membership = await loadMembership(viewer, userId);
  const allowed = assignableRoles(viewer.isSuperAdmin ? "SUPER_ADMIN" : viewer.role);
  // Admins can't touch owners/admins, nor promote anyone to those roles.
  if (!allowed.includes(role) || !allowed.includes(membership.role)) {
    throw forbidden("Only the organization owner can change administrator roles.");
  }
  if (membership.role === "OWNER" && role !== "OWNER") {
    const owners = await db.membership.count({ where: { organizationId: viewer.organizationId, role: "OWNER", status: "ACTIVE" } });
    if (owners <= 1) throw new AppError("UNPROCESSABLE", "An organization must keep at least one owner.");
  }
  if (membership.role === role) return;

  await db.$transaction(async (tx) => {
    await tx.membership.update({ where: { id: membership.id }, data: { role } });
    await audit(viewer, "member.role_changed", { type: "User", id: userId }, { from: membership.role, to: role }, tx);
  });
  // Privilege changes invalidate existing sessions so stale tabs re-authenticate.
  await revokeAllSessions(userId);
  await notify(userId, {
    type: "SECURITY",
    title: "Your role was updated",
    body: `You are now ${role === "INSTRUCTOR" ? "an instructor" : role === "LEARNER" ? "a learner" : `an ${role.toLowerCase()}`}.`,
  });
}

export async function setMemberStatus(viewer: Viewer, userId: string, status: "ACTIVE" | "SUSPENDED") {
  assertCan(viewer, "learner:manage");
  if (userId === viewer.id) throw forbidden("You can't suspend your own account.");
  const membership = await loadMembership(viewer, userId);
  const allowed = assignableRoles(viewer.isSuperAdmin ? "SUPER_ADMIN" : viewer.role);
  if (!allowed.includes(membership.role) || membership.user.platformRole === "SUPER_ADMIN") {
    throw forbidden("You don't have permission to change this member's status.");
  }
  if (membership.status === status) return;
  await db.$transaction(async (tx) => {
    await tx.membership.update({ where: { id: membership.id }, data: { status } });
    await audit(viewer, status === "SUSPENDED" ? "member.suspended" : "member.reactivated", { type: "User", id: userId }, undefined, tx);
  });
  if (status === "SUSPENDED") await revokeAllSessions(userId);
}

/**
 * Adds an instructor. Existing members are promoted; new people get an account
 * and a set-password link (a password-reset token, valid for 24h via resend).
 */
export async function inviteInstructor(viewer: Viewer, input: { name: string; email: string }) {
  assertCan(viewer, "instructor:manage");
  const org = await getCurrentOrganization();
  const existing = await db.user.findUnique({
    where: { email: input.email },
    select: { id: true, memberships: { where: { organizationId: viewer.organizationId } } },
  });

  if (existing) {
    const membership = existing.memberships[0];
    if (membership && membership.role !== "LEARNER") {
      throw new AppError("CONFLICT", "This person already has an instructor or administrator role.");
    }
    await db.$transaction(async (tx) => {
      if (membership) await tx.membership.update({ where: { id: membership.id }, data: { role: "INSTRUCTOR" } });
      else await tx.membership.create({ data: { userId: existing.id, organizationId: viewer.organizationId, role: "INSTRUCTOR" } });
      await audit(viewer, "instructor.added", { type: "User", id: existing.id }, { email: input.email }, tx);
    });
    await revokeAllSessions(existing.id);
    await notify(existing.id, {
      type: "SECURITY",
      title: "You've been made an instructor",
      body: `You can now create and teach courses for ${org.name}.`,
      href: "/instructor",
      email: { cta: "Open instructor dashboard", force: true },
    });
    return { userId: existing.id, invited: false };
  }

  const token = generateToken();
  const user = await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        memberships: { create: { organizationId: viewer.organizationId, role: "INSTRUCTOR" } },
        tokens: {
          create: {
            type: "PASSWORD_RESET",
            tokenHash: hashToken(token),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        },
      },
      select: { id: true },
    });
    await audit(viewer, "instructor.invited", { type: "User", id: user.id }, { email: input.email }, tx);
    return user;
  });
  const url = new URL(`/reset-password?token=${token}&invite=1`, env.APP_URL).toString();
  await sendEmail(
    input.email,
    "auth.instructor_invite",
    emailTemplates.notification({
      org: org.name,
      title: `${viewer.name} invited you to teach at ${org.name}`,
      body: "Set a password to activate your instructor account. This link is valid for 7 days.",
      url,
      cta: "Set your password",
    }),
  );
  return { userId: user.id, invited: true };
}
