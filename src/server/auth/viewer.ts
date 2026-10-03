import "server-only";
import { cache } from "react";
import type { MemberRole, PlatformRole } from "@prisma/client";
import { db } from "../db";
import { getSession } from "./session";
import { getCurrentOrganization } from "../organization";
import { mediaUrl } from "../storage/urls";

export type Viewer = {
  id: string;
  sessionId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  platformRole: PlatformRole;
  organizationId: string;
  /** Effective role in the current organization. Super admins act as OWNER. */
  role: MemberRole;
  isSuperAdmin: boolean;
};

/**
 * The signed-in user in the context of the current organization, or null.
 * Suspended users and suspended memberships resolve to null (treated as signed out).
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const session = await getSession();
  if (!session) return null;

  const org = await getCurrentOrganization();
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatarId: true,
      emailVerifiedAt: true,
      platformRole: true,
      status: true,
      deletedAt: true,
      memberships: {
        where: { organizationId: org.id },
        select: { role: true, status: true },
      },
    },
  });
  if (!user || user.status !== "ACTIVE" || user.deletedAt) return null;

  const isSuperAdmin = user.platformRole === "SUPER_ADMIN";
  const membership = user.memberships[0];
  if (!isSuperAdmin && (!membership || membership.status !== "ACTIVE")) return null;

  return {
    id: user.id,
    sessionId: session.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarId ? mediaUrl(user.avatarId) : null,
    emailVerified: Boolean(user.emailVerifiedAt),
    platformRole: user.platformRole,
    organizationId: org.id,
    role: isSuperAdmin ? "OWNER" : (membership?.role ?? "LEARNER"),
    isSuperAdmin,
  };
});
