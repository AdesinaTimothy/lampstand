import "server-only";
import type { EnrollmentStatus, Prisma } from "@prisma/client";
import { db } from "../db";
import { mediaUrl } from "../storage/urls";
import type { Viewer } from "../auth/viewer";
import { getStreak } from "../services/activity";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { getRecentCourses, getRecommendedCourses } from "./catalog";

const enrollmentCardSelect = {
  id: true,
  status: true,
  progressPercent: true,
  lastAccessedAt: true,
  enrolledAt: true,
  completedAt: true,
  lastLesson: { select: { id: true, title: true, type: true, deletedAt: true } },
  certificate: { select: { id: true } },
  course: {
    select: {
      id: true,
      slug: true,
      title: true,
      thumbnailId: true,
      category: { select: { name: true } },
      instructors: { orderBy: { position: "asc" }, take: 2, select: { user: { select: { name: true } } } },
      _count: { select: { lessons: { where: { deletedAt: null } } } },
    },
  },
} satisfies Prisma.EnrollmentSelect;

type EnrollmentRow = Prisma.EnrollmentGetPayload<{ select: typeof enrollmentCardSelect }>;

export type LearnerCourse = {
  enrollmentId: string;
  status: EnrollmentStatus;
  progressPercent: number;
  lastAccessedAt: Date | null;
  enrolledAt: Date;
  completedAt: Date | null;
  certificateId: string | null;
  lastLesson: { id: string; title: string; type: string } | null;
  course: { id: string; slug: string; title: string; thumbnailUrl: string | null; category: string | null; instructors: string[]; lessonCount: number };
};

function toLearnerCourse(e: EnrollmentRow): LearnerCourse {
  return {
    enrollmentId: e.id,
    status: e.status,
    progressPercent: e.status === "COMPLETED" ? 100 : e.progressPercent,
    lastAccessedAt: e.lastAccessedAt,
    enrolledAt: e.enrolledAt,
    completedAt: e.completedAt,
    certificateId: e.certificate?.id ?? null,
    lastLesson: e.lastLesson && !e.lastLesson.deletedAt ? { id: e.lastLesson.id, title: e.lastLesson.title, type: e.lastLesson.type } : null,
    course: {
      id: e.course.id,
      slug: e.course.slug,
      title: e.course.title,
      thumbnailUrl: e.course.thumbnailId ? mediaUrl(e.course.thumbnailId) : null,
      category: e.course.category?.name ?? null,
      instructors: e.course.instructors.map((i) => i.user.name),
      lessonCount: e.course._count.lessons,
    },
  };
}

const visibleCourse = (organizationId: string): Prisma.CourseWhereInput => ({ organizationId, deletedAt: null, status: { not: "DRAFT" } });

export async function listMyCourses(viewer: Viewer, filter: "all" | "in-progress" | "completed" = "all") {
  const where: Prisma.EnrollmentWhereInput = {
    userId: viewer.id,
    course: visibleCourse(viewer.organizationId),
    status: filter === "completed" ? "COMPLETED" : filter === "in-progress" ? "ACTIVE" : { not: "DROPPED" },
  };
  const [rows, counts] = await Promise.all([
    db.enrollment.findMany({
      where,
      orderBy: [{ lastAccessedAt: { sort: "desc", nulls: "last" } }, { enrolledAt: "desc" }],
      select: enrollmentCardSelect,
      take: 200,
    }),
    db.enrollment.groupBy({
      by: ["status"],
      where: { userId: viewer.id, course: visibleCourse(viewer.organizationId), status: { not: "DROPPED" } },
      _count: { _all: true },
    }),
  ]);
  const count = (s: EnrollmentStatus) => counts.find((c) => c.status === s)?._count._all ?? 0;
  return {
    courses: rows.map(toLearnerCourse),
    counts: { all: count("ACTIVE") + count("COMPLETED"), inProgress: count("ACTIVE"), completed: count("COMPLETED") },
  };
}

export type UpcomingAssignment = { lessonId: string; title: string; courseSlug: string; courseTitle: string; dueAt: Date; overdue: boolean; status: string | null };

async function getUpcomingAssignments(viewer: Viewer): Promise<UpcomingAssignment[]> {
  const enrollments = await db.enrollment.findMany({
    where: { userId: viewer.id, status: "ACTIVE", course: visibleCourse(viewer.organizationId) },
    select: { enrolledAt: true, courseId: true, course: { select: { slug: true, title: true } } },
  });
  if (enrollments.length === 0) return [];
  const assignments = await db.assignment.findMany({
    where: { dueDaysAfterEnrollment: { not: null }, lesson: { deletedAt: null, courseId: { in: enrollments.map((e) => e.courseId) } } },
    select: {
      dueDaysAfterEnrollment: true,
      lesson: { select: { id: true, title: true, courseId: true } },
      submissions: { where: { userId: viewer.id }, select: { status: true } },
    },
  });
  const byCourse = new Map(enrollments.map((e) => [e.courseId, e]));
  const now = Date.now();
  return assignments
    .map((a) => {
      const e = byCourse.get(a.lesson.courseId)!;
      const dueAt = new Date(e.enrolledAt.getTime() + a.dueDaysAfterEnrollment! * 86_400_000);
      const status = a.submissions[0]?.status ?? null;
      return { lessonId: a.lesson.id, title: a.lesson.title, courseSlug: e.course.slug, courseTitle: e.course.title, dueAt, overdue: dueAt.getTime() < now, status };
    })
    .filter((a) => a.status === null || a.status === "NEEDS_REVISION")
    .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())
    .slice(0, 5);
}

export async function getLearningStats(userId: string) {
  const [completedLessons, timeRows, certificates, courses] = await Promise.all([
    db.lessonProgress.count({ where: { userId, status: "COMPLETED" } }),
    db.$queryRaw<{ seconds: bigint | null }[]>`
      SELECT SUM(CASE WHEN lp."status" = 'COMPLETED' THEN GREATEST(COALESCE(l."durationSeconds", 0), lp."watchedSeconds", 300) ELSE lp."watchedSeconds" END)::bigint AS seconds
      FROM "LessonProgress" lp JOIN "Lesson" l ON l."id" = lp."lessonId"
      WHERE lp."userId" = ${userId}`,
    db.certificate.count({ where: { userId, revokedAt: null } }),
    db.enrollment.groupBy({ by: ["status"], where: { userId, status: { not: "DROPPED" } }, _count: { _all: true } }),
  ]);
  const count = (s: EnrollmentStatus) => courses.find((c) => c.status === s)?._count._all ?? 0;
  return {
    completedLessons,
    learningSeconds: Number(timeRows[0]?.seconds ?? 0),
    certificates,
    coursesCompleted: count("COMPLETED"),
    coursesInProgress: count("ACTIVE"),
  };
}

export async function getDashboard(viewer: Viewer, timezone: string) {
  const [active, completed, stats, streak, certificates, upcoming, achievements] = await Promise.all([
    db.enrollment.findMany({
      where: { userId: viewer.id, status: "ACTIVE", course: visibleCourse(viewer.organizationId) },
      orderBy: [{ lastAccessedAt: { sort: "desc", nulls: "last" } }, { enrolledAt: "desc" }],
      take: 7,
      select: enrollmentCardSelect,
    }),
    db.enrollment.findMany({
      where: { userId: viewer.id, status: "COMPLETED", course: visibleCourse(viewer.organizationId) },
      orderBy: { completedAt: "desc" },
      take: 4,
      select: enrollmentCardSelect,
    }),
    getLearningStats(viewer.id),
    getStreak(viewer.id, timezone),
    db.certificate.findMany({
      where: { userId: viewer.id, revokedAt: null },
      orderBy: { issuedAt: "desc" },
      take: 3,
      select: { id: true, code: true, courseTitle: true, issuedAt: true },
    }),
    getUpcomingAssignments(viewer),
    db.userAchievement.findMany({
      where: { userId: viewer.id },
      orderBy: { earnedAt: "desc" },
      take: 3,
      select: { earnedAt: true, achievement: { select: { code: true, title: true, description: true, icon: true } } },
    }),
  ]);
  const enrolledIds = [...active, ...completed].map((e) => e.course.id);
  const [recommended, recentlyAdded] = await Promise.all([
    getRecommendedCourses(viewer.organizationId, viewer.id, 4, enrolledIds),
    getRecentCourses(viewer.organizationId, viewer.id, 4),
  ]);
  const inProgress = active.map(toLearnerCourse);
  // "Continue learning" is the most recently touched course, if any was touched.
  const continueCourse = inProgress.find((c) => c.lastAccessedAt) ?? null;
  return {
    continueCourse,
    inProgress: inProgress.filter((c) => c !== continueCourse).slice(0, 6),
    completed: completed.map(toLearnerCourse),
    stats,
    streak,
    certificates,
    upcoming,
    achievements,
    recommended,
    recentlyAdded: recentlyAdded.filter((c) => !enrolledIds.includes(c.id)).slice(0, 4),
  };
}

export async function listMyCertificates(viewer: Viewer) {
  return db.certificate.findMany({
    where: { userId: viewer.id },
    orderBy: { issuedAt: "desc" },
    select: {
      id: true,
      code: true,
      courseTitle: true,
      issuedAt: true,
      completedAt: true,
      revokedAt: true,
      course: { select: { slug: true, thumbnailId: true } },
    },
  });
}

/** A certificate page for its owner (and staff, who can view any in their organization). */
export async function getCertificateForViewer(viewer: Viewer, certificateId: string) {
  const cert = await db.certificate.findUnique({
    where: { id: certificateId },
    include: { course: { select: { slug: true, organizationId: true } } },
  });
  if (!cert || cert.course.organizationId !== viewer.organizationId) return null;
  const isOwner = cert.userId === viewer.id;
  const isStaff = viewer.isSuperAdmin || viewer.role === "OWNER" || viewer.role === "ADMIN";
  if (!isOwner && !isStaff) return null;
  return { ...cert, isOwner };
}

export async function listBookmarks(viewer: Viewer) {
  const rows = await db.bookmark.findMany({
    where: { userId: viewer.id, lesson: { deletedAt: null, course: visibleCourse(viewer.organizationId) } },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      createdAt: true,
      lesson: {
        select: {
          id: true,
          title: true,
          type: true,
          durationSeconds: true,
          course: { select: { slug: true, title: true } },
          progress: { where: { userId: viewer.id }, select: { status: true } },
        },
      },
    },
  });
  return rows.map((b) => ({
    id: b.id,
    createdAt: b.createdAt,
    lesson: { id: b.lesson.id, title: b.lesson.title, type: b.lesson.type, durationSeconds: b.lesson.durationSeconds, completed: b.lesson.progress[0]?.status === "COMPLETED" },
    course: b.lesson.course,
  }));
}

export const NOTIFICATIONS_PAGE_SIZE = 20;

export async function listNotifications(viewer: Viewer, opts: { page: number; unreadOnly: boolean }) {
  const where: Prisma.NotificationWhereInput = { userId: viewer.id, ...(opts.unreadOnly ? { readAt: null } : {}) };
  const [total, unread, items] = await Promise.all([
    db.notification.count({ where }),
    db.notification.count({ where: { userId: viewer.id, readAt: null } }),
    db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (opts.page - 1) * NOTIFICATIONS_PAGE_SIZE,
      take: NOTIFICATIONS_PAGE_SIZE,
      select: { id: true, type: true, title: true, body: true, href: true, readAt: true, createdAt: true },
    }),
  ]);
  return { items, total, unread, pageCount: Math.max(1, Math.ceil(total / NOTIFICATIONS_PAGE_SIZE)) };
}

export async function getAchievements(userId: string) {
  const earned = await db.userAchievement.findMany({
    where: { userId },
    select: { earnedAt: true, achievement: { select: { code: true } } },
  });
  const map = new Map(earned.map((e) => [e.achievement.code, e.earnedAt]));
  return ACHIEVEMENTS.map((a) => ({ ...a, earnedAt: map.get(a.code) ?? null }));
}

export async function getSettingsData(viewer: Viewer) {
  return db.user.findUniqueOrThrow({
    where: { id: viewer.id },
    select: {
      name: true,
      email: true,
      headline: true,
      bio: true,
      avatarId: true,
      profileVisibility: true,
      emailNotifications: true,
      emailVerifiedAt: true,
      passwordHash: true,
      createdAt: true,
    },
  }).then(({ passwordHash, ...rest }) => ({ ...rest, hasPassword: Boolean(passwordHash), avatarUrl: rest.avatarId ? mediaUrl(rest.avatarId) : null }));
}

/**
 * A member profile, honouring the subject's visibility setting:
 * PUBLIC → anyone; MEMBERS → signed-in members of the org; PRIVATE → self + staff.
 */
export async function getProfile(viewer: Viewer | null, organizationId: string, userId: string) {
  const user = await db.user.findFirst({
    where: { id: userId, deletedAt: null, status: "ACTIVE", memberships: { some: { organizationId, status: "ACTIVE" } } },
    select: {
      id: true,
      name: true,
      headline: true,
      bio: true,
      avatarId: true,
      profileVisibility: true,
      createdAt: true,
      memberships: { where: { organizationId }, select: { role: true } },
    },
  });
  if (!user) return null;
  const isSelf = viewer?.id === user.id;
  const isStaff = Boolean(viewer && viewer.organizationId === organizationId && (viewer.isSuperAdmin || viewer.role === "OWNER" || viewer.role === "ADMIN"));
  const visible =
    isSelf || isStaff || user.profileVisibility === "PUBLIC" || (user.profileVisibility === "MEMBERS" && viewer?.organizationId === organizationId);
  if (!visible) return { hidden: true as const, name: user.name };

  const [stats, achievements, certificates, streak] = await Promise.all([
    getLearningStats(user.id),
    getAchievements(user.id),
    db.certificate.findMany({
      where: { userId: user.id, revokedAt: null },
      orderBy: { issuedAt: "desc" },
      take: 12,
      select: { id: true, code: true, courseTitle: true, issuedAt: true },
    }),
    getStreak(user.id, "UTC"),
  ]);
  return {
    hidden: false as const,
    isSelf,
    user: { ...user, avatarUrl: user.avatarId ? mediaUrl(user.avatarId) : null, role: user.memberships[0]?.role ?? "LEARNER" },
    stats,
    achievements,
    certificates,
    streak: { current: streak.current, longest: streak.longest },
  };
}
