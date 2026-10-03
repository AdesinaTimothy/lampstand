import "server-only";
import { Prisma, type ActivityType } from "@prisma/client";
import { db } from "../db";
import { mediaUrl } from "../storage/urls";
import type { Viewer } from "../auth/viewer";
import { assertCan } from "../authz/policies";

/*
 * Organization analytics for the admin overview. Everything aggregates in SQL;
 * timestamps are stored as UTC `timestamp(3)`, so "now" is pinned to UTC to keep
 * comparisons independent of the database session timezone.
 */

const NOW = Prisma.sql`(now() AT TIME ZONE 'UTC')`;
const PERIOD = Prisma.sql`interval '30 days'`;

export type Metric = {
  value: number;
  /** Same measure for the previous period (null when not comparable). */
  previous: number | null;
};

export type OverviewKpis = {
  members: Metric & { newThisPeriod: number };
  activeLearners: Metric;
  courses: { total: number; published: number; drafts: number };
  enrollments: Metric & { total: number };
  completions: Metric & { total: number };
  completionRate: Metric;
  quizScore: Metric & { attempts: number };
  quizPassRate: Metric;
  certificates: Metric & { total: number };
};

type KpiRow = {
  members_now: number;
  members_prev: number;
  active_now: number;
  active_prev: number;
  courses_total: number;
  courses_published: number;
  courses_draft: number;
  enroll_total: number;
  enroll_now: number;
  enroll_prev: number;
  completed_total: number;
  completed_now: number;
  completed_prev: number;
  open_total: number;
  open_prev_total: number;
  completed_prev_total: number;
  quiz_now_avg: number | null;
  quiz_prev_avg: number | null;
  quiz_now_pass: number | null;
  quiz_prev_pass: number | null;
  quiz_now_count: number;
  cert_total: number;
  cert_now: number;
  cert_prev: number;
};

async function getKpis(organizationId: string): Promise<OverviewKpis> {
  const [row] = await db.$queryRaw<KpiRow[]>`
    WITH
    mem AS (
      SELECT
        count(*)::int AS members_now,
        count(*) FILTER (WHERE m."createdAt" <= ${NOW} - ${PERIOD})::int AS members_prev
      FROM "Membership" m
      JOIN "User" u ON u.id = m."userId"
      WHERE m."organizationId" = ${organizationId} AND u."deletedAt" IS NULL
    ),
    act AS (
      SELECT
        count(DISTINCT "userId") FILTER (WHERE "createdAt" > ${NOW} - ${PERIOD})::int AS active_now,
        count(DISTINCT "userId") FILTER (WHERE "createdAt" <= ${NOW} - ${PERIOD})::int AS active_prev
      FROM "Activity"
      WHERE "organizationId" = ${organizationId} AND "createdAt" > ${NOW} - interval '60 days'
    ),
    crs AS (
      SELECT
        count(*)::int AS courses_total,
        count(*) FILTER (WHERE status = 'PUBLISHED')::int AS courses_published,
        count(*) FILTER (WHERE status = 'DRAFT')::int AS courses_draft
      FROM "Course"
      WHERE "organizationId" = ${organizationId} AND "deletedAt" IS NULL
    ),
    enr AS (
      SELECT
        count(*)::int AS enroll_total,
        count(*) FILTER (WHERE e."enrolledAt" > ${NOW} - ${PERIOD})::int AS enroll_now,
        count(*) FILTER (WHERE e."enrolledAt" <= ${NOW} - ${PERIOD} AND e."enrolledAt" > ${NOW} - interval '60 days')::int AS enroll_prev,
        count(*) FILTER (WHERE e."completedAt" IS NOT NULL)::int AS completed_total,
        count(*) FILTER (WHERE e."completedAt" > ${NOW} - ${PERIOD})::int AS completed_now,
        count(*) FILTER (WHERE e."completedAt" <= ${NOW} - ${PERIOD} AND e."completedAt" > ${NOW} - interval '60 days')::int AS completed_prev,
        count(*) FILTER (WHERE e.status <> 'DROPPED')::int AS open_total,
        count(*) FILTER (WHERE e.status <> 'DROPPED' AND e."enrolledAt" <= ${NOW} - ${PERIOD})::int AS open_prev_total,
        count(*) FILTER (WHERE e.status <> 'DROPPED' AND e."completedAt" <= ${NOW} - ${PERIOD})::int AS completed_prev_total
      FROM "Enrollment" e
      JOIN "Course" c ON c.id = e."courseId"
      WHERE c."organizationId" = ${organizationId} AND c."deletedAt" IS NULL
    ),
    qz AS (
      SELECT
        avg(a.score) FILTER (WHERE a."submittedAt" > ${NOW} - ${PERIOD})::float8 AS quiz_now_avg,
        avg(a.score) FILTER (WHERE a."submittedAt" <= ${NOW} - ${PERIOD})::float8 AS quiz_prev_avg,
        (avg(CASE WHEN a.passed THEN 100 ELSE 0 END) FILTER (WHERE a."submittedAt" > ${NOW} - ${PERIOD}))::float8 AS quiz_now_pass,
        (avg(CASE WHEN a.passed THEN 100 ELSE 0 END) FILTER (WHERE a."submittedAt" <= ${NOW} - ${PERIOD}))::float8 AS quiz_prev_pass,
        count(*) FILTER (WHERE a."submittedAt" > ${NOW} - ${PERIOD})::int AS quiz_now_count
      FROM "QuizAttempt" a
      JOIN "Quiz" q ON q.id = a."quizId"
      JOIN "Lesson" l ON l.id = q."lessonId"
      JOIN "Course" c ON c.id = l."courseId"
      WHERE c."organizationId" = ${organizationId} AND a."submittedAt" > ${NOW} - interval '60 days'
    ),
    cert AS (
      SELECT
        count(*) FILTER (WHERE ce."revokedAt" IS NULL)::int AS cert_total,
        count(*) FILTER (WHERE ce."issuedAt" > ${NOW} - ${PERIOD})::int AS cert_now,
        count(*) FILTER (WHERE ce."issuedAt" <= ${NOW} - ${PERIOD} AND ce."issuedAt" > ${NOW} - interval '60 days')::int AS cert_prev
      FROM "Certificate" ce
      JOIN "Course" c ON c.id = ce."courseId"
      WHERE c."organizationId" = ${organizationId}
    )
    SELECT * FROM mem, act, crs, enr, qz, cert`;

  const rate = (num: number, den: number) => (den > 0 ? (num / den) * 100 : 0);
  return {
    members: { value: row.members_now, previous: row.members_prev, newThisPeriod: row.members_now - row.members_prev },
    activeLearners: { value: row.active_now, previous: row.active_prev },
    courses: { total: row.courses_total, published: row.courses_published, drafts: row.courses_draft },
    enrollments: { value: row.enroll_now, previous: row.enroll_prev, total: row.enroll_total },
    completions: { value: row.completed_now, previous: row.completed_prev, total: row.completed_total },
    completionRate: {
      value: rate(row.completed_total, row.open_total),
      previous: row.open_prev_total > 0 ? rate(row.completed_prev_total, row.open_prev_total) : null,
    },
    quizScore: { value: row.quiz_now_avg ?? 0, previous: row.quiz_prev_avg, attempts: row.quiz_now_count },
    quizPassRate: { value: row.quiz_now_pass ?? 0, previous: row.quiz_prev_pass },
    certificates: { value: row.cert_now, previous: row.cert_prev, total: row.cert_total },
  };
}

// ───────────────────────────── Time series ─────────────────────────────

export type GrowthPoint = { label: string; members: number };
export type WeeklyActivePoint = { label: string; active: number };
export type EnrollmentPoint = { label: string; enrolments: number; completions: number };
export type CertificatePoint = { label: string; certificates: number };

async function getLearnerGrowth(organizationId: string): Promise<GrowthPoint[]> {
  return db.$queryRaw<GrowthPoint[]>`
    WITH weeks AS (
      SELECT generate_series(date_trunc('week', ${NOW}) - interval '25 weeks', date_trunc('week', ${NOW}), interval '1 week') AS week
    )
    SELECT
      to_char(w.week, 'FMMon FMDD') AS label,
      (
        SELECT count(*)::int
        FROM "Membership" m
        JOIN "User" u ON u.id = m."userId"
        WHERE m."organizationId" = ${organizationId}
          AND u."deletedAt" IS NULL
          AND m."createdAt" < w.week + interval '1 week'
      ) AS members
    FROM weeks w
    ORDER BY w.week`;
}

async function getWeeklyActive(organizationId: string): Promise<WeeklyActivePoint[]> {
  return db.$queryRaw<WeeklyActivePoint[]>`
    WITH weeks AS (
      SELECT generate_series(date_trunc('week', ${NOW}) - interval '25 weeks', date_trunc('week', ${NOW}), interval '1 week') AS week
    ),
    agg AS (
      SELECT date_trunc('week', "createdAt") AS week, count(DISTINCT "userId")::int AS active
      FROM "Activity"
      WHERE "organizationId" = ${organizationId}
        AND "createdAt" >= date_trunc('week', ${NOW}) - interval '25 weeks'
      GROUP BY 1
    )
    SELECT to_char(w.week, 'FMMon FMDD') AS label, coalesce(a.active, 0)::int AS active
    FROM weeks w
    LEFT JOIN agg a ON a.week = w.week
    ORDER BY w.week`;
}

async function getEnrollmentFlow(organizationId: string): Promise<EnrollmentPoint[]> {
  return db.$queryRaw<EnrollmentPoint[]>`
    WITH weeks AS (
      SELECT generate_series(date_trunc('week', ${NOW}) - interval '11 weeks', date_trunc('week', ${NOW}), interval '1 week') AS week
    ),
    org_enrollments AS (
      SELECT e."enrolledAt", e."completedAt"
      FROM "Enrollment" e
      JOIN "Course" c ON c.id = e."courseId"
      WHERE c."organizationId" = ${organizationId} AND c."deletedAt" IS NULL
    ),
    enr AS (
      SELECT date_trunc('week', "enrolledAt") AS week, count(*)::int AS n
      FROM org_enrollments
      WHERE "enrolledAt" >= date_trunc('week', ${NOW}) - interval '11 weeks'
      GROUP BY 1
    ),
    cmp AS (
      SELECT date_trunc('week', "completedAt") AS week, count(*)::int AS n
      FROM org_enrollments
      WHERE "completedAt" >= date_trunc('week', ${NOW}) - interval '11 weeks'
      GROUP BY 1
    )
    SELECT
      to_char(w.week, 'FMMon FMDD') AS label,
      coalesce(enr.n, 0)::int AS enrolments,
      coalesce(cmp.n, 0)::int AS completions
    FROM weeks w
    LEFT JOIN enr ON enr.week = w.week
    LEFT JOIN cmp ON cmp.week = w.week
    ORDER BY w.week`;
}

async function getCertificatesByMonth(organizationId: string): Promise<CertificatePoint[]> {
  return db.$queryRaw<CertificatePoint[]>`
    WITH months AS (
      SELECT generate_series(date_trunc('month', ${NOW}) - interval '11 months', date_trunc('month', ${NOW}), interval '1 month') AS month
    ),
    agg AS (
      SELECT date_trunc('month', ce."issuedAt") AS month, count(*)::int AS n
      FROM "Certificate" ce
      JOIN "Course" c ON c.id = ce."courseId"
      WHERE c."organizationId" = ${organizationId}
        AND ce."issuedAt" >= date_trunc('month', ${NOW}) - interval '11 months'
      GROUP BY 1
    )
    SELECT to_char(m.month, 'FMMon') AS label, coalesce(agg.n, 0)::int AS certificates
    FROM months m
    LEFT JOIN agg ON agg.month = m.month
    ORDER BY m.month`;
}

// ───────────────────────────── Rankings ─────────────────────────────

export type PopularCourse = {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  enrolled: number;
  completed: number;
  completionRate: number;
  averageProgress: number;
  ratingAverage: number;
  ratingCount: number;
};

async function getPopularCourses(organizationId: string, limit = 6): Promise<PopularCourse[]> {
  const rows = await db.$queryRaw<
    {
      id: string;
      title: string;
      slug: string;
      status: PopularCourse["status"];
      enrolled: number;
      completed: number;
      avg_progress: number;
      ratingAverage: number;
      ratingCount: number;
    }[]
  >`
    SELECT
      c.id, c.title, c.slug, c.status::text AS status, c."ratingAverage", c."ratingCount",
      count(e.id) FILTER (WHERE e.status <> 'DROPPED')::int AS enrolled,
      count(e.id) FILTER (WHERE e.status = 'COMPLETED')::int AS completed,
      coalesce(avg(e."progressPercent") FILTER (WHERE e.status <> 'DROPPED'), 0)::float8 AS avg_progress
    FROM "Course" c
    JOIN "Enrollment" e ON e."courseId" = c.id
    WHERE c."organizationId" = ${organizationId} AND c."deletedAt" IS NULL
    GROUP BY c.id
    HAVING count(e.id) FILTER (WHERE e.status <> 'DROPPED') > 0
    ORDER BY enrolled DESC, c.title ASC
    LIMIT ${limit}`;
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    status: r.status,
    enrolled: r.enrolled,
    completed: r.completed,
    completionRate: r.enrolled > 0 ? (r.completed / r.enrolled) * 100 : 0,
    averageProgress: r.avg_progress,
    ratingAverage: r.ratingAverage,
    ratingCount: r.ratingCount,
  }));
}

export type QuizPerformance = {
  quizId: string;
  lessonId: string;
  title: string;
  courseId: string;
  courseTitle: string;
  attempts: number;
  learners: number;
  averageScore: number;
  passRate: number;
  passingScore: number;
};

export async function getQuizPerformanceForOrg(organizationId: string, courseIds?: string[]): Promise<QuizPerformance[]> {
  const courseFilter = courseIds ? (courseIds.length ? Prisma.sql`AND c.id IN (${Prisma.join(courseIds)})` : Prisma.sql`AND false`) : Prisma.empty;
  return db.$queryRaw<QuizPerformance[]>`
    SELECT
      q.id AS "quizId", l.id AS "lessonId", l.title, c.id AS "courseId", c.title AS "courseTitle",
      q."passingScore" AS "passingScore",
      count(a.id)::int AS attempts,
      count(DISTINCT a."userId")::int AS learners,
      avg(a.score)::float8 AS "averageScore",
      avg(CASE WHEN a.passed THEN 100 ELSE 0 END)::float8 AS "passRate"
    FROM "QuizAttempt" a
    JOIN "Quiz" q ON q.id = a."quizId"
    JOIN "Lesson" l ON l.id = q."lessonId"
    JOIN "Course" c ON c.id = l."courseId"
    WHERE c."organizationId" = ${organizationId}
      AND c."deletedAt" IS NULL
      AND l."deletedAt" IS NULL
      ${courseFilter}
    GROUP BY q.id, l.id, c.id
    ORDER BY "passRate" ASC, "averageScore" ASC
    LIMIT 100`;
}

// ───────────────────────────── Activity feed ─────────────────────────────

export type ActivityItem = {
  id: string;
  type: ActivityType;
  createdAt: Date;
  user: { id: string; name: string; avatarUrl: string | null };
  /** Plain-language description, e.g. "completed “Prayer basics” in Foundations". */
  verb: string;
  object: string | null;
  context: string | null;
  href: string | null;
};

const FEED_TYPES: ActivityType[] = [
  "ENROLLED",
  "LESSON_COMPLETED",
  "QUIZ_SUBMITTED",
  "ASSIGNMENT_SUBMITTED",
  "COURSE_COMPLETED",
  "CERTIFICATE_ISSUED",
  "REVIEW_POSTED",
];

type ActivityRow = {
  id: string;
  type: ActivityType;
  createdAt: Date;
  metadata: Prisma.JsonValue;
  user: { id: string; name: string; avatarId: string | null };
  course: { title: string; slug: string } | null;
  lesson: { title: string } | null;
};

function readNumber(meta: Prisma.JsonValue, key: string): number | null {
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    const v = (meta as Record<string, unknown>)[key];
    return typeof v === "number" ? v : null;
  }
  return null;
}

function readBoolean(meta: Prisma.JsonValue, key: string): boolean | null {
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    const v = (meta as Record<string, unknown>)[key];
    return typeof v === "boolean" ? v : null;
  }
  return null;
}

export function describeActivity(row: ActivityRow): ActivityItem {
  const course = row.course?.title ?? "a removed course";
  const lesson = row.lesson?.title ?? null;
  let verb: string;
  let object: string | null = null;
  let context: string | null = null;
  switch (row.type) {
    case "ENROLLED":
      verb = "enrolled in";
      object = course;
      break;
    case "LESSON_STARTED":
      verb = "started";
      object = lesson;
      context = course;
      break;
    case "LEARNING_SESSION":
      verb = "studied";
      object = lesson;
      context = course;
      break;
    case "LESSON_COMPLETED":
      verb = "completed";
      object = lesson;
      context = course;
      break;
    case "QUIZ_SUBMITTED": {
      const score = readNumber(row.metadata, "score");
      const passed = readBoolean(row.metadata, "passed");
      verb = score === null ? "took the quiz" : `scored ${score}%${passed === null ? "" : passed ? " and passed" : ""} on`;
      object = lesson;
      context = course;
      break;
    }
    case "ASSIGNMENT_SUBMITTED":
      verb = "submitted";
      object = lesson;
      context = course;
      break;
    case "COURSE_COMPLETED":
      verb = "finished the course";
      object = course;
      break;
    case "CERTIFICATE_ISSUED":
      verb = "earned a certificate for";
      object = course;
      break;
    case "REVIEW_POSTED":
      verb = "reviewed";
      object = course;
      break;
  }
  return {
    id: row.id,
    type: row.type,
    createdAt: row.createdAt,
    user: { id: row.user.id, name: row.user.name, avatarUrl: row.user.avatarId ? mediaUrl(row.user.avatarId) : null },
    verb,
    object,
    context,
    href: row.course ? `/courses/${row.course.slug}` : null,
  };
}

export const activitySelect = {
  id: true,
  type: true,
  createdAt: true,
  metadata: true,
  user: { select: { id: true, name: true, avatarId: true } },
  course: { select: { title: true, slug: true } },
  lesson: { select: { title: true } },
} satisfies Prisma.ActivitySelect;

async function getRecentActivity(organizationId: string, take = 8) {
  const rows = await db.activity.findMany({
    where: { organizationId, type: { in: FEED_TYPES }, user: { deletedAt: null } },
    orderBy: { createdAt: "desc" },
    take,
    select: activitySelect,
  });
  return rows.map((r) => describeActivity(r));
}

// ───────────────────────────── Overview ─────────────────────────────

export type AdminOverview = {
  kpis: OverviewKpis;
  growth: GrowthPoint[];
  weeklyActive: WeeklyActivePoint[];
  enrollmentFlow: EnrollmentPoint[];
  certificatesByMonth: CertificatePoint[];
  popularCourses: PopularCourse[];
  quizzes: QuizPerformance[];
  recentActivity: ActivityItem[];
};

export async function getAdminOverview(viewer: Viewer): Promise<AdminOverview> {
  assertCan(viewer, "analytics:view_org");
  const org = viewer.organizationId;
  const [kpis, growth, weeklyActive, enrollmentFlow, certificatesByMonth, popularCourses, quizzes, recentActivity] = await Promise.all([
    getKpis(org),
    getLearnerGrowth(org),
    getWeeklyActive(org),
    getEnrollmentFlow(org),
    getCertificatesByMonth(org),
    getPopularCourses(org),
    getQuizPerformanceForOrg(org),
    getRecentActivity(org),
  ]);
  return { kpis, growth, weeklyActive, enrollmentFlow, certificatesByMonth, popularCourses, quizzes, recentActivity };
}
