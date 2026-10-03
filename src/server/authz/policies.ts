import "server-only";
import { roleHasPermission, type Permission } from "@/lib/roles";
import { AppError, forbidden, notFound } from "@/lib/errors";
import { db, type DbClient } from "../db";
import type { Viewer } from "../auth/viewer";

export function can(viewer: Viewer | null, permission: Permission): boolean {
  if (!viewer) return false;
  if (viewer.isSuperAdmin) return true;
  return roleHasPermission(viewer.role, permission);
}

export function assertCan(viewer: Viewer | null, permission: Permission): asserts viewer is Viewer {
  if (!viewer) throw new AppError("UNAUTHENTICATED", "Please sign in to continue.");
  if (!can(viewer, permission)) throw forbidden();
}

export function isStaff(viewer: Viewer | null): boolean {
  return Boolean(viewer && (viewer.isSuperAdmin || viewer.role === "OWNER" || viewer.role === "ADMIN"));
}

export function isInstructorOrStaff(viewer: Viewer | null): boolean {
  return Boolean(viewer && (isStaff(viewer) || viewer.role === "INSTRUCTOR"));
}

/**
 * Course-level policy: org staff may manage any course in their organization;
 * instructors only courses they are attached to.
 */
export async function canManageCourse(viewer: Viewer | null, courseId: string, client: DbClient = db) {
  if (!viewer) return false;
  const course = await client.course.findFirst({
    where: { id: courseId, organizationId: viewer.organizationId, deletedAt: null },
    select: { id: true, instructors: { where: { userId: viewer.id }, select: { userId: true } } },
  });
  if (!course) return false;
  if (can(viewer, "course:manage_any")) return true;
  return viewer.role === "INSTRUCTOR" && course.instructors.length > 0;
}

export async function assertCanManageCourse(viewer: Viewer | null, courseId: string, client: DbClient = db) {
  if (!viewer) throw new AppError("UNAUTHENTICATED", "Please sign in to continue.");
  const course = await client.course.findFirst({
    where: { id: courseId, organizationId: viewer.organizationId, deletedAt: null },
    select: { id: true },
  });
  if (!course) throw notFound("Course");
  if (!(await canManageCourse(viewer, courseId, client))) throw forbidden("You can only manage courses you teach.");
}

/** Resolves a lesson's course and asserts the viewer may edit it. */
export async function assertCanManageLesson(viewer: Viewer | null, lessonId: string, client: DbClient = db) {
  const lesson = await client.lesson.findFirst({
    where: { id: lessonId, deletedAt: null },
    select: { courseId: true },
  });
  if (!lesson) throw notFound("Lesson");
  await assertCanManageCourse(viewer, lesson.courseId, client);
  return lesson.courseId;
}

export async function assertCanManageSection(viewer: Viewer | null, sectionId: string, client: DbClient = db) {
  const section = await client.courseSection.findUnique({ where: { id: sectionId }, select: { courseId: true } });
  if (!section) throw notFound("Section");
  await assertCanManageCourse(viewer, section.courseId, client);
  return section.courseId;
}
