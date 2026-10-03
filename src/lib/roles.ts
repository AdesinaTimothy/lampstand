// Isomorphic role metadata (safe for client components).
import type { MemberRole } from "@prisma/client";

export const ROLE_LABELS: Record<MemberRole, string> = {
  OWNER: "Owner",
  ADMIN: "Administrator",
  INSTRUCTOR: "Instructor",
  LEARNER: "Learner",
};

export const PERMISSIONS = [
  "course:create",
  "course:manage_any",
  "learner:view",
  "learner:manage",
  "instructor:manage",
  "category:manage",
  "organization:manage",
  "analytics:view_org",
  "certificate:manage",
  "review:moderate",
  "announcement:send",
  "audit:view",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ADMIN_PERMISSIONS: Permission[] = PERMISSIONS.filter((p) => p !== "organization:manage");

export const ROLE_PERMISSIONS: Record<MemberRole, readonly Permission[]> = {
  OWNER: PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
  INSTRUCTOR: ["course:create"],
  LEARNER: [],
};

export function roleHasPermission(role: MemberRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/** Roles an actor may assign. Only owners may create other admins/owners. */
export function assignableRoles(actorRole: MemberRole | "SUPER_ADMIN"): MemberRole[] {
  if (actorRole === "SUPER_ADMIN" || actorRole === "OWNER") return ["OWNER", "ADMIN", "INSTRUCTOR", "LEARNER"];
  if (actorRole === "ADMIN") return ["INSTRUCTOR", "LEARNER"];
  return [];
}
