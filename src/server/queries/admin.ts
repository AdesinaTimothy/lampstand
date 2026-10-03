import "server-only";
import { Prisma, type CourseStatus, type EnrollmentStatus, type MemberRole, type MembershipStatus, type SubmissionStatus } from "@prisma/client";
import { notFound } from "@/lib/errors";
import { assignableRoles } from "@/lib/roles";
import { db } from "../db";
import type { Viewer } from "../auth/viewer";
import { assertCan, can } from "../authz/policies";
import { mediaUrl } from "../storage/urls";
import { activitySelect, describeActivity, getQuizPerformanceForOrg, type ActivityItem, type QuizPerformance } from "./analytics";

/*
 * Read models for the administration console. Every function asserts the
 * permission it needs and scopes to the viewer's organization.
 */

export const ADMIN_PAGE_SIZE = 20;
const ACTIVE_WINDOW_DAYS = 30;

type SearchParams = Record<string, string | string[] | undefined>;

function one(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  const trimmed = v?.trim();
  return trimmed ? trimmed.slice(0, 100) : undefined;
}

function pick<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

function pageOf(value: string | undefined): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 && n < 100_000 ? n : 1;
}

/** Escapes LIKE wildcards so user input is matched literally. */
function likePattern(q: string): string {
  return `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

function pageCount(total: number) {
  return Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
}

// ───────────────────────────── People ─────────────────────────────

const ROLES = ["OWNER", "ADMIN", "INSTRUCTOR", "LEARNER"] as const satisfies readonly MemberRole[];
const STATUSES = ["ACTIVE", "SUSPENDED"] as const satisfies readonly MembershipStatus[];
const ACTIVITY = ["active", "inactive"] as const;
export const PEOPLE_SORTS = ["newest", "name", "last_active", "progress"] as const;

export type PeopleFilters = {
  q?: string;
  role?: MemberRole;
  status?: MembershipStatus;
  activity?: (typeof ACTIVITY)[number];
  sort: (typeof PEOPLE_SORTS)[number];
  page: number;
};

export function parsePeopleFilters(sp: SearchParams): PeopleFilters {
  return {
    q: one(sp.q),
    role: pick(one(sp.role), ROLES),
    status: pick(one(sp.status), STATUSES),
    activity: pick(one(sp.activity), ACTIVITY),
    sort: pick(one(sp.sort), PEOPLE_SORTS) ?? "newest",
    page: pageOf(one(sp.page)),
  };
}

export type PersonRow = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: MemberRole;
  status: MembershipStatus;
  joinedAt: Date;
  lastActiveAt: Date | null;
  enrolled: number;
  completed: number;
  averageProgress: number;
};

export async function listPeople(viewer: Viewer, filters: PeopleFilters) {
  assertCan(viewer, "learner:view");
  const org = viewer.organizationId;
  const conditions: Prisma.Sql[] = [Prisma.sql`m."organizationId" = ${org}`, Prisma.sql`u."deletedAt" IS NULL`];
  if (filters.q) {
    const pattern = likePattern(filters.q);
    conditions.push(Prisma.sql`(u.name ILIKE ${pattern} OR u.email ILIKE ${pattern})`);
  }
  if (filters.role) conditions.push(Prisma.sql`m.role::text = ${filters.role}`);
  if (filters.status) conditions.push(Prisma.sql`m.status::text = ${filters.status}`);
  const where = Prisma.join(conditions, " AND ");

  const activityWhere =
    filters.activity === "active"
      ? Prisma.sql`WHERE p.last_active > (now() AT TIME ZONE 'UTC') - make_interval(days => ${ACTIVE_WINDOW_DAYS}::int)`
      : filters.activity === "inactive"
        ? Prisma.sql`WHERE p.last_active IS NULL OR p.last_active <= (now() AT TIME ZONE 'UTC') - make_interval(days => ${ACTIVE_WINDOW_DAYS}::int)`
        : Prisma.empty;

  const orderBy = {
    newest: Prisma.sql`p.joined DESC, p.name ASC`,
    name: Prisma.sql`lower(p.name) ASC, p.joined DESC`,
    last_active: Prisma.sql`p.last_active DESC NULLS LAST, p.name ASC`,
    progress: Prisma.sql`p.avg_progress DESC, p.completed DESC, p.name ASC`,
  }[filters.sort];

  const base = Prisma.sql`
    WITH people AS (
      SELECT
        u.id, u.name, u.email, u."avatarId", m.role::text AS role, m.status::text AS status, m."createdAt" AS joined,
        GREATEST(u."lastActiveAt", la.last) AS last_active,
        coalesce(es.enrolled, 0)::int AS enrolled,
        coalesce(es.completed, 0)::int AS completed,
        coalesce(es.avg_progress, 0)::float8 AS avg_progress
      FROM "Membership" m
      JOIN "User" u ON u.id = m."userId"
      LEFT JOIN LATERAL (
        SELECT max(a."createdAt") AS last FROM "Activity" a WHERE a."userId" = u.id AND a."organizationId" = ${org}
      ) la ON true
      LEFT JOIN LATERAL (
        SELECT
          count(*) FILTER (WHERE e.status <> 'DROPPED') AS enrolled,
          count(*) FILTER (WHERE e.status = 'COMPLETED') AS completed,
          avg(e."progressPercent") FILTER (WHERE e.status <> 'DROPPED') AS avg_progress
        FROM "Enrollment" e
        JOIN "Course" c ON c.id = e."courseId"
        WHERE e."userId" = u.id AND c."organizationId" = ${org} AND c."deletedAt" IS NULL
      ) es ON true
      WHERE ${where}
    )`;

  const [countRows, rows, summary] = await Promise.all([
    db.$queryRaw<{ total: number }[]>`${base} SELECT count(*)::int AS total FROM people p ${activityWhere}`,
    db.$queryRaw<
      {
        id: string;
        name: string;
        email: string;
        avatarId: string | null;
        role: MemberRole;
        status: MembershipStatus;
        joined: Date;
        last_active: Date | null;
        enrolled: number;
        completed: number;
        avg_progress: number;
      }[]
    >`${base}
      SELECT * FROM people p ${activityWhere}
      ORDER BY ${orderBy}
      LIMIT ${ADMIN_PAGE_SIZE} OFFSET ${(filters.page - 1) * ADMIN_PAGE_SIZE}`,
    db.membership.groupBy({
      by: ["role"],
      where: { organizationId: org, user: { deletedAt: null } },
      _count: { _all: true },
    }),
  ]);

  const total = countRows[0]?.total ?? 0;
  const people: PersonRow[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    avatarUrl: r.avatarId ? mediaUrl(r.avatarId) : null,
    role: r.role,
    status: r.status,
    joinedAt: r.joined,
    lastActiveAt: r.last_active,
    enrolled: r.enrolled,
    completed: r.completed,
    averageProgress: r.avg_progress,
  }));
  const roleCounts = Object.fromEntries(ROLES.map((role) => [role, summary.find((s) => s.role === role)?._count._all ?? 0])) as Record<
    MemberRole,
    number
  >;
  return { people, total, page: filters.page, pageCount: pageCount(total), roleCounts };
}

// ───────────────────────────── Person profile ─────────────────────────────

export type PersonProfile = Awaited<ReturnType<typeof getPersonProfile>>;

export async function getPersonProfile(viewer: Viewer, userId: string) {
  assertCan(viewer, "learner:view");
  const org = viewer.organizationId;
  const membership = await db.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId: org } },
    select: {
      role: true,
      status: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          headline: true,
          bio: true,
          avatarId: true,
          emailVerifiedAt: true,
          platformRole: true,
          status: true,
          lastActiveAt: true,
          createdAt: true,
          deletedAt: true,
        },
      },
    },
  });
  if (!membership || membership.user.deletedAt) throw notFound("Person");

  const courseScope = { organizationId: org, deletedAt: null } satisfies Prisma.CourseWhereInput;
  const [enrollments, certificates, attempts, attemptStats, submissions, activity, achievements, lastActivity, teaching] = await Promise.all([
    db.enrollment.findMany({
      where: { userId, course: courseScope },
      orderBy: [{ lastAccessedAt: { sort: "desc", nulls: "last" } }, { enrolledAt: "desc" }],
      select: {
        id: true,
        status: true,
        progressPercent: true,
        enrolledAt: true,
        completedAt: true,
        lastAccessedAt: true,
        lastLesson: { select: { title: true } },
        course: { select: { id: true, title: true, slug: true, status: true } },
      },
    }),
    db.certificate.findMany({
      where: { userId, course: { organizationId: org } },
      orderBy: { issuedAt: "desc" },
      select: { id: true, code: true, courseTitle: true, issuedAt: true, revokedAt: true, revokedReason: true },
    }),
    db.quizAttempt.findMany({
      where: { userId, quiz: { lesson: { course: courseScope } } },
      orderBy: { submittedAt: "desc" },
      take: 15,
      select: {
        id: true,
        score: true,
        passed: true,
        attemptNumber: true,
        submittedAt: true,
        quiz: { select: { lesson: { select: { title: true, course: { select: { title: true } } } } } },
      },
    }),
    db.quizAttempt.aggregate({
      where: { userId, quiz: { lesson: { course: courseScope } } },
      _avg: { score: true },
      _count: { _all: true },
    }),
    db.assignmentSubmission.findMany({
      where: { userId, assignment: { lesson: { course: courseScope } } },
      orderBy: { submittedAt: "desc" },
      take: 20,
      select: {
        id: true,
        status: true,
        revision: true,
        submittedAt: true,
        reviewedAt: true,
        assignment: { select: { lesson: { select: { title: true, course: { select: { title: true } } } } } },
      },
    }),
    db.activity.findMany({
      where: { userId, organizationId: org, type: { not: "LEARNING_SESSION" } },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: activitySelect,
    }),
    db.userAchievement.findMany({
      where: { userId },
      orderBy: { earnedAt: "desc" },
      select: { earnedAt: true, achievement: { select: { code: true, title: true, description: true, icon: true } } },
    }),
    db.activity.findFirst({ where: { userId, organizationId: org }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
    db.courseInstructor.count({ where: { userId, course: courseScope } }),
  ]);
  const passedCount = await db.quizAttempt.count({ where: { userId, passed: true, quiz: { lesson: { course: courseScope } } } });

  const u = membership.user;
  const lastActive = [u.lastActiveAt, lastActivity?.createdAt].filter((d): d is Date => Boolean(d)).sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
  const isSelf = viewer.id === u.id;
  const allowed = can(viewer, "learner:manage") ? assignableRoles(viewer.isSuperAdmin ? "SUPER_ADMIN" : viewer.role) : [];
  const canActOnMember = !isSelf && allowed.includes(membership.role) && u.platformRole !== "SUPER_ADMIN";
  const open = enrollments.filter((e) => e.status !== "DROPPED");

  return {
    person: {
      id: u.id,
      name: u.name,
      email: u.email,
      headline: u.headline,
      bio: u.bio,
      avatarUrl: u.avatarId ? mediaUrl(u.avatarId) : null,
      emailVerified: Boolean(u.emailVerifiedAt),
      accountSuspended: u.status === "SUSPENDED",
      role: membership.role,
      status: membership.status,
      joinedAt: membership.createdAt,
      lastActiveAt: lastActive,
      teachingCount: teaching,
    },
    permissions: {
      isSelf,
      canChangeRole: canActOnMember,
      canChangeStatus: canActOnMember,
      assignableRoles: canActOnMember ? allowed : [],
    },
    summary: {
      enrolled: open.length,
      completed: open.filter((e) => e.status === "COMPLETED").length,
      inProgress: open.filter((e) => e.status === "ACTIVE").length,
      averageProgress: open.length ? open.reduce((s, e) => s + e.progressPercent, 0) / open.length : 0,
      certificates: certificates.filter((c) => !c.revokedAt).length,
      quizAttempts: attemptStats._count._all,
      quizAverage: attemptStats._avg.score,
      quizPassed: passedCount,
    },
    enrollments: enrollments.map((e) => ({
      id: e.id,
      status: e.status as EnrollmentStatus,
      progressPercent: e.progressPercent,
      enrolledAt: e.enrolledAt,
      completedAt: e.completedAt,
      lastAccessedAt: e.lastAccessedAt,
      lastLessonTitle: e.lastLesson?.title ?? null,
      course: { id: e.course.id, title: e.course.title, slug: e.course.slug, status: e.course.status as CourseStatus },
    })),
    certificates,
    quizAttempts: attempts.map((a) => ({
      id: a.id,
      score: a.score,
      passed: a.passed,
      attemptNumber: a.attemptNumber,
      submittedAt: a.submittedAt,
      quizTitle: a.quiz.lesson.title,
      courseTitle: a.quiz.lesson.course.title,
    })),
    submissions: submissions.map((s) => ({
      id: s.id,
      status: s.status as SubmissionStatus,
      revision: s.revision,
      submittedAt: s.submittedAt,
      reviewedAt: s.reviewedAt,
      lessonTitle: s.assignment.lesson.title,
      courseTitle: s.assignment.lesson.course.title,
    })),
    activity: activity.map((a) => describeActivity(a)) satisfies ActivityItem[],
    achievements: achievements.map((a) => ({ ...a.achievement, earnedAt: a.earnedAt })),
  };
}

// ───────────────────────────── Instructors ─────────────────────────────

export type InstructorRow = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: MemberRole;
  status: MembershipStatus;
  courses: number;
  publishedCourses: number;
  learners: number;
  completionRate: number | null;
  ratingAverage: number | null;
  ratingCount: number;
  lastActiveAt: Date | null;
};

export async function listInstructors(viewer: Viewer): Promise<InstructorRow[]> {
  assertCan(viewer, "instructor:manage");
  const org = viewer.organizationId;
  const rows = await db.$queryRaw<
    {
      id: string;
      name: string;
      email: string;
      avatarId: string | null;
      role: MemberRole;
      status: MembershipStatus;
      courses: number;
      published: number;
      learners: number;
      enrolled: number;
      completed: number;
      rating_sum: number | null;
      rating_count: number;
      last_active: Date | null;
    }[]
  >`
    SELECT
      u.id, u.name, u.email, u."avatarId", m.role::text AS role, m.status::text AS status,
      coalesce(cs.courses, 0)::int AS courses,
      coalesce(cs.published, 0)::int AS published,
      coalesce(cs.rating_sum, 0)::float8 AS rating_sum,
      coalesce(cs.rating_count, 0)::int AS rating_count,
      coalesce(es.learners, 0)::int AS learners,
      coalesce(es.enrolled, 0)::int AS enrolled,
      coalesce(es.completed, 0)::int AS completed,
      GREATEST(u."lastActiveAt", la.last, cs.last_edit) AS last_active
    FROM "Membership" m
    JOIN "User" u ON u.id = m."userId"
    LEFT JOIN LATERAL (
      SELECT
        count(*) AS courses,
        count(*) FILTER (WHERE c.status = 'PUBLISHED') AS published,
        sum(c."ratingAverage" * c."ratingCount") AS rating_sum,
        sum(c."ratingCount") AS rating_count,
        max(c."updatedAt") AS last_edit
      FROM "CourseInstructor" ci
      JOIN "Course" c ON c.id = ci."courseId"
      WHERE ci."userId" = u.id AND c."organizationId" = ${org} AND c."deletedAt" IS NULL
    ) cs ON true
    LEFT JOIN LATERAL (
      SELECT
        count(DISTINCT e."userId") FILTER (WHERE e.status <> 'DROPPED') AS learners,
        count(*) FILTER (WHERE e.status <> 'DROPPED') AS enrolled,
        count(*) FILTER (WHERE e.status = 'COMPLETED') AS completed
      FROM "CourseInstructor" ci
      JOIN "Course" c ON c.id = ci."courseId"
      JOIN "Enrollment" e ON e."courseId" = c.id
      WHERE ci."userId" = u.id AND c."organizationId" = ${org} AND c."deletedAt" IS NULL
    ) es ON true
    LEFT JOIN LATERAL (
      SELECT max(a."createdAt") AS last FROM "Activity" a WHERE a."userId" = u.id AND a."organizationId" = ${org}
    ) la ON true
    WHERE m."organizationId" = ${org}
      AND u."deletedAt" IS NULL
      AND (m.role = 'INSTRUCTOR' OR coalesce(cs.courses, 0) > 0)
    ORDER BY learners DESC, lower(u.name) ASC`;

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    avatarUrl: r.avatarId ? mediaUrl(r.avatarId) : null,
    role: r.role,
    status: r.status,
    courses: r.courses,
    publishedCourses: r.published,
    learners: r.learners,
    completionRate: r.enrolled > 0 ? (r.completed / r.enrolled) * 100 : null,
    ratingAverage: r.rating_count > 0 && r.rating_sum !== null ? r.rating_sum / r.rating_count : null,
    ratingCount: r.rating_count,
    lastActiveAt: r.last_active,
  }));
}

export type InstructorCourseStat = {
  id: string;
  title: string;
  slug: string;
  status: CourseStatus;
  role: "OWNER" | "CO_INSTRUCTOR";
  enrolled: number;
  completed: number;
  completionRate: number | null;
  averageProgress: number;
  ratingAverage: number;
  ratingCount: number;
  updatedAt: Date;
};

export async function getInstructorDetail(viewer: Viewer, userId: string) {
  assertCan(viewer, "instructor:manage");
  const org = viewer.organizationId;
  const membership = await db.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId: org } },
    select: {
      role: true,
      status: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true, headline: true, bio: true, avatarId: true, deletedAt: true, lastActiveAt: true } },
    },
  });
  if (!membership || membership.user.deletedAt) throw notFound("Instructor");

  const links = await db.courseInstructor.findMany({
    where: { userId, course: { organizationId: org, deletedAt: null } },
    orderBy: { course: { updatedAt: "desc" } },
    select: {
      role: true,
      course: {
        select: { id: true, title: true, slug: true, status: true, ratingAverage: true, ratingCount: true, updatedAt: true },
      },
    },
  });
  const courseIds = links.map((l) => l.course.id);
  const [enrollmentStats, quizzes, learners, recentReviews] = await Promise.all([
    courseIds.length
      ? db.enrollment.groupBy({
          by: ["courseId", "status"],
          where: { courseId: { in: courseIds } },
          _count: { _all: true },
          _avg: { progressPercent: true },
        })
      : Promise.resolve([]),
    getQuizPerformanceForOrg(org, courseIds),
    courseIds.length
      ? db.enrollment.findMany({
          where: { courseId: { in: courseIds }, status: { not: "DROPPED" } },
          distinct: ["userId"],
          select: { userId: true },
        })
      : Promise.resolve([]),
    db.review.findMany({
      where: { courseId: { in: courseIds }, hidden: false },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, rating: true, body: true, createdAt: true, user: { select: { name: true } }, course: { select: { title: true } } },
    }),
  ]);

  const courses: InstructorCourseStat[] = links.map(({ role, course }) => {
    const stats = enrollmentStats.filter((s) => s.courseId === course.id && s.status !== "DROPPED");
    const enrolled = stats.reduce((n, s) => n + s._count._all, 0);
    const completed = stats.find((s) => s.status === "COMPLETED")?._count._all ?? 0;
    const progressSum = stats.reduce((n, s) => n + (s._avg.progressPercent ?? 0) * s._count._all, 0);
    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      status: course.status,
      role,
      enrolled,
      completed,
      completionRate: enrolled > 0 ? (completed / enrolled) * 100 : null,
      averageProgress: enrolled > 0 ? progressSum / enrolled : 0,
      ratingAverage: course.ratingAverage,
      ratingCount: course.ratingCount,
      updatedAt: course.updatedAt,
    };
  });

  const totalEnrolled = courses.reduce((n, c) => n + c.enrolled, 0);
  const totalCompleted = courses.reduce((n, c) => n + c.completed, 0);
  const ratingCount = courses.reduce((n, c) => n + c.ratingCount, 0);
  const ratingSum = courses.reduce((n, c) => n + c.ratingAverage * c.ratingCount, 0);
  const u = membership.user;

  return {
    instructor: {
      id: u.id,
      name: u.name,
      email: u.email,
      headline: u.headline,
      bio: u.bio,
      avatarUrl: u.avatarId ? mediaUrl(u.avatarId) : null,
      role: membership.role,
      status: membership.status,
      joinedAt: membership.createdAt,
      lastActiveAt: u.lastActiveAt,
    },
    totals: {
      courses: courses.length,
      published: courses.filter((c) => c.status === "PUBLISHED").length,
      learners: learners.length,
      enrolled: totalEnrolled,
      completed: totalCompleted,
      completionRate: totalEnrolled > 0 ? (totalCompleted / totalEnrolled) * 100 : null,
      ratingAverage: ratingCount > 0 ? ratingSum / ratingCount : null,
      ratingCount,
    },
    courses,
    quizzes: quizzes satisfies QuizPerformance[],
    recentReviews,
  };
}

// ───────────────────────────── Courses ─────────────────────────────

const COURSE_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const satisfies readonly CourseStatus[];

export type AdminCourseFilters = { q?: string; status?: CourseStatus; page: number };

export function parseCourseFilters(sp: SearchParams): AdminCourseFilters {
  return { q: one(sp.q), status: pick(one(sp.status), COURSE_STATUSES), page: pageOf(one(sp.page)) };
}

export type AdminCourseRow = {
  id: string;
  title: string;
  slug: string;
  status: CourseStatus;
  featured: boolean;
  category: string | null;
  thumbnailUrl: string | null;
  instructors: { id: string; name: string; avatarUrl: string | null }[];
  enrolled: number;
  completed: number;
  completionRate: number | null;
  ratingAverage: number;
  ratingCount: number;
  reviewCount: number;
  hiddenReviewCount: number;
  updatedAt: Date;
  publishedAt: Date | null;
};

export async function listAdminCourses(viewer: Viewer, filters: AdminCourseFilters) {
  assertCan(viewer, "course:manage_any");
  const where: Prisma.CourseWhereInput = {
    organizationId: viewer.organizationId,
    deletedAt: null,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.q
      ? {
          OR: [
            { title: { contains: filters.q, mode: "insensitive" } },
            { instructors: { some: { user: { name: { contains: filters.q, mode: "insensitive" } } } } },
          ],
        }
      : {}),
  };
  const [total, rows, statusCounts] = await Promise.all([
    db.course.count({ where }),
    db.course.findMany({
      where,
      orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
      skip: (filters.page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        featured: true,
        thumbnailId: true,
        ratingAverage: true,
        ratingCount: true,
        updatedAt: true,
        publishedAt: true,
        category: { select: { name: true } },
        instructors: { orderBy: { position: "asc" }, select: { user: { select: { id: true, name: true, avatarId: true } } } },
      },
    }),
    db.course.groupBy({
      by: ["status"],
      where: { organizationId: viewer.organizationId, deletedAt: null },
      _count: { _all: true },
    }),
  ]);
  const ids = rows.map((r) => r.id);
  const [enrollments, reviews] = ids.length
    ? await Promise.all([
        db.enrollment.groupBy({ by: ["courseId", "status"], where: { courseId: { in: ids } }, _count: { _all: true } }),
        db.review.groupBy({ by: ["courseId", "hidden"], where: { courseId: { in: ids } }, _count: { _all: true } }),
      ])
    : [[], []];

  const courses: AdminCourseRow[] = rows.map((r) => {
    const e = enrollments.filter((x) => x.courseId === r.id);
    const enrolled = e.filter((x) => x.status !== "DROPPED").reduce((n, x) => n + x._count._all, 0);
    const completed = e.find((x) => x.status === "COMPLETED")?._count._all ?? 0;
    const rv = reviews.filter((x) => x.courseId === r.id);
    return {
      id: r.id,
      title: r.title,
      slug: r.slug,
      status: r.status,
      featured: r.featured,
      category: r.category?.name ?? null,
      thumbnailUrl: r.thumbnailId ? mediaUrl(r.thumbnailId) : null,
      instructors: r.instructors.map((i) => ({ id: i.user.id, name: i.user.name, avatarUrl: i.user.avatarId ? mediaUrl(i.user.avatarId) : null })),
      enrolled,
      completed,
      completionRate: enrolled > 0 ? (completed / enrolled) * 100 : null,
      ratingAverage: r.ratingAverage,
      ratingCount: r.ratingCount,
      reviewCount: rv.reduce((n, x) => n + x._count._all, 0),
      hiddenReviewCount: rv.find((x) => x.hidden)?._count._all ?? 0,
      updatedAt: r.updatedAt,
      publishedAt: r.publishedAt,
    };
  });
  const counts = Object.fromEntries(COURSE_STATUSES.map((s) => [s, statusCounts.find((c) => c.status === s)?._count._all ?? 0])) as Record<
    CourseStatus,
    number
  >;
  return { courses, total, page: filters.page, pageCount: pageCount(total), statusCounts: counts };
}

export type InstructorOption = { id: string; name: string; email: string; role: MemberRole; avatarUrl: string | null };

/** People who may be assigned to teach a course (active instructors and staff). */
export async function listAssignableInstructors(viewer: Viewer): Promise<InstructorOption[]> {
  assertCan(viewer, "instructor:manage");
  const rows = await db.membership.findMany({
    where: {
      organizationId: viewer.organizationId,
      status: "ACTIVE",
      role: { in: ["INSTRUCTOR", "ADMIN", "OWNER"] },
      user: { deletedAt: null, status: "ACTIVE" },
    },
    orderBy: [{ role: "desc" }, { user: { name: "asc" } }],
    select: { role: true, user: { select: { id: true, name: true, email: true, avatarId: true } } },
  });
  return rows.map((r) => ({
    id: r.user.id,
    name: r.user.name,
    email: r.user.email,
    role: r.role,
    avatarUrl: r.user.avatarId ? mediaUrl(r.user.avatarId) : null,
  }));
}

export type AdminReview = {
  id: string;
  rating: number;
  body: string | null;
  hidden: boolean;
  createdAt: Date;
  user: { id: string; name: string; avatarUrl: string | null };
};

export async function listCourseReviews(viewer: Viewer, courseId: string): Promise<{ courseTitle: string; reviews: AdminReview[] }> {
  assertCan(viewer, "review:moderate");
  const course = await db.course.findFirst({
    where: { id: courseId, organizationId: viewer.organizationId, deletedAt: null },
    select: { title: true },
  });
  if (!course) throw notFound("Course");
  const reviews = await db.review.findMany({
    where: { courseId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, rating: true, body: true, hidden: true, createdAt: true, user: { select: { id: true, name: true, avatarId: true } } },
  });
  return {
    courseTitle: course.title,
    reviews: reviews.map((r) => ({
      ...r,
      user: { id: r.user.id, name: r.user.name, avatarUrl: r.user.avatarId ? mediaUrl(r.user.avatarId) : null },
    })),
  };
}

// ───────────────────────────── Categories ─────────────────────────────

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  courseCount: number;
  publishedCount: number;
};

export async function listAdminCategories(viewer: Viewer): Promise<AdminCategory[]> {
  assertCan(viewer, "category:manage");
  const [categories, published] = await Promise.all([
    db.category.findMany({
      where: { organizationId: viewer.organizationId },
      orderBy: [{ position: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        icon: true,
        _count: { select: { courses: { where: { deletedAt: null } } } },
      },
    }),
    db.course.groupBy({
      by: ["categoryId"],
      where: { organizationId: viewer.organizationId, deletedAt: null, status: "PUBLISHED" },
      _count: { _all: true },
    }),
  ]);
  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    icon: c.icon,
    courseCount: c._count.courses,
    publishedCount: published.find((p) => p.categoryId === c.id)?._count._all ?? 0,
  }));
}

// ───────────────────────────── Certificates ─────────────────────────────

export type CertificateFilters = { q?: string; status?: "valid" | "revoked"; page: number };

export function parseCertificateFilters(sp: SearchParams): CertificateFilters {
  return { q: one(sp.q), status: pick(one(sp.status), ["valid", "revoked"] as const), page: pageOf(one(sp.page)) };
}

export async function listCertificates(viewer: Viewer, filters: CertificateFilters) {
  assertCan(viewer, "certificate:manage");
  const where: Prisma.CertificateWhereInput = {
    course: { organizationId: viewer.organizationId },
    ...(filters.status === "valid" ? { revokedAt: null } : filters.status === "revoked" ? { revokedAt: { not: null } } : {}),
    ...(filters.q
      ? {
          OR: [
            { recipientName: { contains: filters.q, mode: "insensitive" } },
            { code: { contains: filters.q.toUpperCase().replace(/\s+/g, ""), mode: "insensitive" } },
            { courseTitle: { contains: filters.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [total, rows, revoked] = await Promise.all([
    db.certificate.count({ where }),
    db.certificate.findMany({
      where,
      orderBy: { issuedAt: "desc" },
      skip: (filters.page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      select: {
        id: true,
        code: true,
        recipientName: true,
        courseTitle: true,
        issuedAt: true,
        completedAt: true,
        revokedAt: true,
        revokedReason: true,
        userId: true,
        user: { select: { avatarId: true } },
        _count: { select: { verifications: true } },
      },
    }),
    db.certificate.count({ where: { course: { organizationId: viewer.organizationId }, revokedAt: { not: null } } }),
  ]);
  return {
    certificates: rows.map((r) => ({
      id: r.id,
      code: r.code,
      recipientName: r.recipientName,
      recipientId: r.userId,
      avatarUrl: r.user.avatarId ? mediaUrl(r.user.avatarId) : null,
      courseTitle: r.courseTitle,
      issuedAt: r.issuedAt,
      revokedAt: r.revokedAt,
      revokedReason: r.revokedReason,
      verifications: r._count.verifications,
    })),
    total,
    revokedTotal: revoked,
    page: filters.page,
    pageCount: pageCount(total),
  };
}

// ───────────────────────────── Audit log ─────────────────────────────

export type AuditFilters = { action?: string; entity?: string; page: number };

export function parseAuditFilters(sp: SearchParams): AuditFilters {
  const action = one(sp.action);
  const entity = one(sp.entity);
  return {
    action: action && /^[a-z_.]+$/.test(action) ? action : undefined,
    entity: entity && /^[A-Za-z]+$/.test(entity) ? entity : undefined,
    page: pageOf(one(sp.page)),
  };
}

function summarizeValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? "" : "s"}`;
  if (typeof value === "object") return "…";
  if (typeof value === "boolean") return value ? "yes" : "no";
  const text = String(value);
  return text.length > 60 ? `${text.slice(0, 59)}…` : text;
}

/** One readable line from the audit metadata, e.g. "from LEARNER → INSTRUCTOR". */
export function summarizeMetadata(meta: Prisma.JsonValue): string | null {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null;
  const record = meta as Record<string, unknown>;
  if ("from" in record && "to" in record) return `${summarizeValue(record.from)} → ${summarizeValue(record.to)}`;
  const parts = Object.entries(record).map(([k, v]) => `${k.replace(/([A-Z])/g, " $1").toLowerCase()}: ${summarizeValue(v)}`);
  return parts.length ? parts.join(" · ") : null;
}

export async function listAuditLog(viewer: Viewer, filters: AuditFilters) {
  assertCan(viewer, "audit:view");
  const org = viewer.organizationId;
  const where: Prisma.AuditLogWhereInput = {
    organizationId: org,
    ...(filters.action ? { action: filters.action } : {}),
    ...(filters.entity ? { entityType: filters.entity } : {}),
  };
  const [total, rows, actions, entities] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        metadata: true,
        ipAddress: true,
        createdAt: true,
        actor: { select: { id: true, name: true, avatarId: true } },
      },
    }),
    db.auditLog.groupBy({ by: ["action"], where: { organizationId: org }, _count: { _all: true }, orderBy: { action: "asc" } }),
    db.auditLog.groupBy({ by: ["entityType"], where: { organizationId: org }, _count: { _all: true }, orderBy: { entityType: "asc" } }),
  ]);

  // Resolve entity names in batches so rows read as sentences, not ids.
  const idsOf = (type: string) => [...new Set(rows.filter((r) => r.entityType === type && r.entityId).map((r) => r.entityId as string))];
  const [users, courses, categories] = await Promise.all([
    idsOf("User").length ? db.user.findMany({ where: { id: { in: idsOf("User") } }, select: { id: true, name: true } }) : [],
    idsOf("Course").length ? db.course.findMany({ where: { id: { in: idsOf("Course") }, organizationId: org }, select: { id: true, title: true } }) : [],
    idsOf("Category").length
      ? db.category.findMany({ where: { id: { in: idsOf("Category") }, organizationId: org }, select: { id: true, name: true } })
      : [],
  ]);
  const names = new Map<string, string>([
    ...users.map((u) => [u.id, u.name] as const),
    ...courses.map((c) => [c.id, c.title] as const),
    ...categories.map((c) => [c.id, c.name] as const),
  ]);

  return {
    entries: rows.map((r) => ({
      id: r.id,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      entityName: r.entityId ? (names.get(r.entityId) ?? null) : null,
      entityHref:
        r.entityId && r.entityType === "User" && names.has(r.entityId)
          ? `/admin/learners/${r.entityId}`
          : r.entityId && r.entityType === "Course" && names.has(r.entityId)
            ? `/instructor/courses/${r.entityId}`
            : null,
      summary: summarizeMetadata(r.metadata),
      ipAddress: r.ipAddress,
      createdAt: r.createdAt,
      actor: r.actor ? { id: r.actor.id, name: r.actor.name, avatarUrl: r.actor.avatarId ? mediaUrl(r.actor.avatarId) : null } : null,
    })),
    actions: actions.map((a) => ({ value: a.action, count: a._count._all })),
    entities: entities.map((e) => ({ value: e.entityType, count: e._count._all })),
    total,
    page: filters.page,
    pageCount: pageCount(total),
  };
}

// ───────────────────────────── Announcements ─────────────────────────────

export async function listAnnouncements(viewer: Viewer, page: number) {
  assertCan(viewer, "announcement:send");
  const where = { organizationId: viewer.organizationId };
  const [total, rows, recipients] = await Promise.all([
    db.announcement.count({ where }),
    db.announcement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      select: { id: true, title: true, body: true, createdAt: true, author: { select: { name: true, avatarId: true } } },
    }),
    db.membership.count({ where: { organizationId: viewer.organizationId, status: "ACTIVE", user: { deletedAt: null } } }),
  ]);
  // Delivery details are recorded on the audit entry written when the announcement was sent.
  const audits = rows.length
    ? await db.auditLog.findMany({
        where: { organizationId: viewer.organizationId, action: "announcement.sent", entityId: { in: rows.map((r) => r.id) } },
        select: { entityId: true, metadata: true },
      })
    : [];
  const delivery = new Map(
    audits.map((a) => {
      const m = (a.metadata && typeof a.metadata === "object" && !Array.isArray(a.metadata) ? a.metadata : {}) as Record<string, unknown>;
      return [a.entityId, { recipients: typeof m.recipients === "number" ? m.recipients : null, email: m.email === true }] as const;
    }),
  );
  return {
    announcements: rows.map((r) => ({
      id: r.id,
      title: r.title,
      body: r.body,
      createdAt: r.createdAt,
      author: r.author ? { name: r.author.name, avatarUrl: r.author.avatarId ? mediaUrl(r.author.avatarId) : null } : null,
      recipients: delivery.get(r.id)?.recipients ?? null,
      emailed: delivery.get(r.id)?.email ?? false,
    })),
    total,
    page,
    pageCount: pageCount(total),
    activeMembers: recipients,
  };
}

export function parsePage(sp: SearchParams) {
  return pageOf(one(sp.page));
}

// ───────────────────────────── Settings ─────────────────────────────

export async function getOrganizationSettings(viewer: Viewer) {
  assertCan(viewer, "organization:manage");
  const org = await db.organization.findUniqueOrThrow({
    where: { id: viewer.organizationId },
    select: {
      name: true,
      slug: true,
      tagline: true,
      description: true,
      website: true,
      email: true,
      logoId: true,
      allowSelfRegistration: true,
      requireEmailVerification: true,
      certificateSignatoryName: true,
      certificateSignatoryTitle: true,
      timezone: true,
      updatedAt: true,
    },
  });
  return { ...org, logoUrl: org.logoId ? mediaUrl(org.logoId) : null };
}
