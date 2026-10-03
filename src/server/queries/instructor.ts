import "server-only";
import { cache } from "react";
import { Prisma, type ActivityType, type CourseStatus, type LessonType, type SubmissionStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { stripHtml } from "@/lib/utils";
import type { CourseStatusFilter, SubmissionFilter } from "@/lib/validation/instructor";
import { db } from "../db";
import { mediaUrl } from "../storage/urls";
import type { Viewer } from "../auth/viewer";
import { can, canManageCourse } from "../authz/policies";
import { getPublishReadiness, type ReadinessIssue } from "../services/courses";

/*
 * Read models for the instructor studio. Every function takes the viewer and
 * only returns courses that viewer may manage: organization staff with
 * `course:manage_any` see every course; instructors see the ones they teach.
 */

// ───────────────────────────── Scope helpers ─────────────────────────────

export function manageableCoursesWhere(viewer: Viewer): Prisma.CourseWhereInput {
  const base: Prisma.CourseWhereInput = { organizationId: viewer.organizationId, deletedAt: null };
  if (can(viewer, "course:manage_any")) return base;
  if (viewer.role !== "INSTRUCTOR") return { ...base, id: { in: [] } };
  return { ...base, instructors: { some: { userId: viewer.id } } };
}

/** Resolves a course the viewer may manage, or renders the 404 page (never reveals existence). */
async function requireManageableCourse(viewer: Viewer, courseId: string) {
  if (!(await canManageCourse(viewer, courseId))) notFound();
}

const WEEKS = 12;
const DAY = 86_400_000;

/** Monday 00:00 UTC of the week containing `date` (matches Postgres date_trunc('week')). */
function weekStart(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const offset = (d.getUTCDay() + 6) % 7;
  return new Date(d.getTime() - offset * DAY);
}

function lastWeeks(count = WEEKS): Date[] {
  const current = weekStart(new Date());
  return Array.from({ length: count }, (_, i) => new Date(current.getTime() - (count - 1 - i) * 7 * DAY));
}

const weekLabel = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

type WeekRow = { week: Date; n: number };

async function weeklyCounts(column: "enrolledAt" | "completedAt", courseIds: string[], since: Date): Promise<Map<number, number>> {
  if (courseIds.length === 0) return new Map();
  const col = Prisma.raw(`"${column}"`);
  const rows = await db.$queryRaw<WeekRow[]>`
    SELECT date_trunc('week', ${col}) AS week, count(*)::int AS n
    FROM "Enrollment"
    WHERE "courseId" IN (${Prisma.join(courseIds)}) AND ${col} IS NOT NULL AND ${col} >= ${since}
    GROUP BY 1`;
  return new Map(rows.map((r) => [new Date(r.week).getTime(), r.n]));
}

export type WeeklyPoint = { week: string; enrolments: number; completions: number };

async function weeklySeries(courseIds: string[]): Promise<WeeklyPoint[]> {
  const weeks = lastWeeks();
  const since = weeks[0]!;
  const [enrolled, completed] = await Promise.all([
    weeklyCounts("enrolledAt", courseIds, since),
    weeklyCounts("completedAt", courseIds, since),
  ]);
  return weeks.map((w) => ({
    week: weekLabel(w),
    enrolments: enrolled.get(w.getTime()) ?? 0,
    completions: completed.get(w.getTime()) ?? 0,
  }));
}

export async function listCategoryOptions(viewer: Viewer) {
  return db.category.findMany({
    where: { organizationId: viewer.organizationId },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });
}

// ───────────────────────────── Overview ─────────────────────────────

const FEED_TYPES: ActivityType[] = [
  "ENROLLED",
  "LESSON_COMPLETED",
  "QUIZ_SUBMITTED",
  "ASSIGNMENT_SUBMITTED",
  "COURSE_COMPLETED",
  "CERTIFICATE_ISSUED",
  "REVIEW_POSTED",
];

export type ActivityItem = {
  id: string;
  type: ActivityType;
  createdAt: Date;
  learner: { name: string; avatarUrl: string | null };
  course: { id: string; title: string } | null;
  lesson: { title: string } | null;
};

export type AttentionDraft = { id: string; title: string; errorCount: number; firstIssue: ReadinessIssue | null };

export async function getInstructorOverview(viewer: Viewer) {
  const scope = manageableCoursesWhere(viewer);
  const courses = await db.course.findMany({
    where: scope,
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, status: true },
  });
  const ids = courses.map((c) => c.id);
  const inCourses = { in: ids };

  const [byStatus, learnerRows, quizAvg, pendingCount, pending, weekly, activity] = await Promise.all([
    db.enrollment.groupBy({ by: ["status"], where: { courseId: inCourses }, _count: { _all: true } }),
    ids.length
      ? db.$queryRaw<{ n: number }[]>`
          SELECT count(DISTINCT "userId")::int AS n FROM "Enrollment"
          WHERE "courseId" IN (${Prisma.join(ids)}) AND status <> 'DROPPED'`
      : Promise.resolve([{ n: 0 }]),
    db.quizAttempt.aggregate({ where: { quiz: { lesson: { courseId: inCourses, deletedAt: null } } }, _avg: { score: true }, _count: { _all: true } }),
    db.assignmentSubmission.count({ where: { status: "SUBMITTED", assignment: { lesson: { courseId: inCourses, deletedAt: null } } } }),
    db.assignmentSubmission.findMany({
      where: { status: "SUBMITTED", assignment: { lesson: { courseId: inCourses, deletedAt: null } } },
      orderBy: { submittedAt: "asc" },
      take: 4,
      select: {
        id: true,
        submittedAt: true,
        user: { select: { name: true, avatarId: true } },
        assignment: { select: { lesson: { select: { title: true, course: { select: { title: true } } } } } },
      },
    }),
    weeklySeries(ids),
    db.activity.findMany({
      where: { courseId: inCourses, type: { in: FEED_TYPES } },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        type: true,
        createdAt: true,
        user: { select: { name: true, avatarId: true } },
        course: { select: { id: true, title: true } },
        lesson: { select: { title: true } },
      },
    }),
  ]);

  const drafts = courses.filter((c) => c.status === "DRAFT").slice(0, 4);
  const draftReadiness: AttentionDraft[] = await Promise.all(
    drafts.map(async (c) => {
      const issues = (await getPublishReadiness(c.id)).filter((i) => i.level === "error");
      return { id: c.id, title: c.title, errorCount: issues.length, firstIssue: issues[0] ?? null };
    }),
  );

  const statusCount = (s: string) => byStatus.find((b) => b.status === s)?._count._all ?? 0;
  const active = statusCount("ACTIVE");
  const completed = statusCount("COMPLETED");

  return {
    scope: can(viewer, "course:manage_any") ? ("organization" as const) : ("mine" as const),
    courses: {
      total: courses.length,
      published: courses.filter((c) => c.status === "PUBLISHED").length,
      drafts: courses.filter((c) => c.status === "DRAFT").length,
    },
    learners: learnerRows[0]?.n ?? 0,
    completions: completed,
    completionRate: active + completed > 0 ? Math.round((completed / (active + completed)) * 100) : null,
    averageQuizScore: quizAvg._count._all > 0 ? Math.round(quizAvg._avg.score ?? 0) : null,
    quizAttempts: quizAvg._count._all,
    pendingCount,
    pending: pending.map((p) => ({
      id: p.id,
      submittedAt: p.submittedAt,
      learner: { name: p.user.name, avatarUrl: p.user.avatarId ? mediaUrl(p.user.avatarId) : null },
      lessonTitle: p.assignment.lesson.title,
      courseTitle: p.assignment.lesson.course.title,
    })),
    drafts: draftReadiness,
    weekly,
    activity: activity.map<ActivityItem>((a) => ({
      id: a.id,
      type: a.type,
      createdAt: a.createdAt,
      learner: { name: a.user.name, avatarUrl: a.user.avatarId ? mediaUrl(a.user.avatarId) : null },
      course: a.course,
      lesson: a.lesson,
    })),
  };
}

export type InstructorOverview = Awaited<ReturnType<typeof getInstructorOverview>>;

/** Pending reviews badge in the studio navigation. */
export async function countPendingSubmissions(viewer: Viewer) {
  return db.assignmentSubmission.count({
    where: { status: "SUBMITTED", assignment: { lesson: { deletedAt: null, course: manageableCoursesWhere(viewer) } } },
  });
}

// ───────────────────────────── Course list ─────────────────────────────

export type InstructorCourseRow = {
  id: string;
  title: string;
  slug: string;
  status: CourseStatus;
  thumbnailUrl: string | null;
  categoryName: string | null;
  lessonCount: number;
  learners: number;
  completionRate: number | null;
  ratingAverage: number;
  ratingCount: number;
  updatedAt: Date;
};

const STATUS_FOR_FILTER: Record<CourseStatusFilter, CourseStatus | undefined> = {
  all: undefined,
  published: "PUBLISHED",
  drafts: "DRAFT",
  archived: "ARCHIVED",
};

export async function listInstructorCourses(viewer: Viewer, params: { status: CourseStatusFilter; q: string }) {
  const q = params.q.trim().slice(0, 100);
  const base: Prisma.CourseWhereInput = {
    ...manageableCoursesWhere(viewer),
    ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
  };
  const status = STATUS_FOR_FILTER[params.status];
  const [rows, statusCounts] = await Promise.all([
    db.course.findMany({
      where: { ...base, ...(status ? { status } : {}) },
      orderBy: { updatedAt: "desc" },
      take: 200,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        thumbnailId: true,
        updatedAt: true,
        ratingAverage: true,
        ratingCount: true,
        category: { select: { name: true } },
        _count: { select: { lessons: { where: { deletedAt: null } } } },
      },
    }),
    db.course.groupBy({ by: ["status"], where: base, _count: { _all: true } }),
  ]);
  const enrollment = rows.length
    ? await db.enrollment.groupBy({
        by: ["courseId", "status"],
        where: { courseId: { in: rows.map((r) => r.id) }, status: { not: "DROPPED" } },
        _count: { _all: true },
      })
    : [];

  const courses: InstructorCourseRow[] = rows.map((r) => {
    const learners = enrollment.filter((e) => e.courseId === r.id).reduce((n, e) => n + e._count._all, 0);
    const completed = enrollment.find((e) => e.courseId === r.id && e.status === "COMPLETED")?._count._all ?? 0;
    return {
      id: r.id,
      title: r.title,
      slug: r.slug,
      status: r.status,
      thumbnailUrl: r.thumbnailId ? mediaUrl(r.thumbnailId) : null,
      categoryName: r.category?.name ?? null,
      lessonCount: r._count.lessons,
      learners,
      completionRate: learners > 0 ? Math.round((completed / learners) * 100) : null,
      ratingAverage: r.ratingAverage,
      ratingCount: r.ratingCount,
      updatedAt: r.updatedAt,
    };
  });
  const count = (s: CourseStatus) => statusCounts.find((c) => c.status === s)?._count._all ?? 0;
  return {
    courses,
    counts: {
      all: statusCounts.reduce((n, c) => n + c._count._all, 0),
      published: count("PUBLISHED"),
      drafts: count("DRAFT"),
      archived: count("ARCHIVED"),
    } satisfies Record<CourseStatusFilter, number>,
  };
}

// ───────────────────────────── Course editor ─────────────────────────────

/** Header data for every course editor tab. Cached per request; 404s if not manageable. */
export const getCourseEditorHeader = cache(async (viewer: Viewer, courseId: string) => {
  await requireManageableCourse(viewer, courseId);
  const course = await db.course.findUniqueOrThrow({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
      sections: {
        orderBy: { position: "asc" },
        select: { lessons: { where: { deletedAt: null }, orderBy: { position: "asc" }, take: 1, select: { id: true } } },
      },
    },
  });
  const firstLessonId = course.sections.find((s) => s.lessons.length > 0)?.lessons[0]?.id ?? null;
  const { sections: _sections, ...rest } = course;
  void _sections;
  return { ...rest, firstLessonId };
});

export type CourseEditorHeader = Awaited<ReturnType<typeof getCourseEditorHeader>>;

export async function getCourseDetailsForEditor(viewer: Viewer, courseId: string) {
  await requireManageableCourse(viewer, courseId);
  const [course, categories] = await Promise.all([
    db.course.findUniqueOrThrow({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        subtitle: true,
        description: true,
        categoryId: true,
        level: true,
        objectives: true,
        requirements: true,
        audience: true,
        estimatedMinutes: true,
        thumbnailId: true,
        tags: { select: { tag: { select: { name: true } } } },
      },
    }),
    listCategoryOptions(viewer),
  ]);
  return {
    course: {
      ...course,
      tags: course.tags.map((t) => t.tag.name),
      thumbnailUrl: course.thumbnailId ? mediaUrl(course.thumbnailId) : null,
    },
    categories,
  };
}

export type EditorLessonItem = {
  id: string;
  title: string;
  type: LessonType;
  durationSeconds: number | null;
  isPreview: boolean;
  isRequired: boolean;
  /** Why the lesson isn't ready for learners yet, if anything. */
  issue: string | null;
};

export type EditorSection = { id: string; title: string; description: string | null; lessons: EditorLessonItem[] };

type LessonForIssue = {
  type: LessonType;
  mediaId: string | null;
  content: string | null;
  quiz: { _count: { questions: number } } | null;
  assignment: { instructions: string } | null;
};

/** Mirrors the per-lesson rules in `getPublishReadiness`. */
function lessonIssue(lesson: LessonForIssue): string | null {
  switch (lesson.type) {
    case "VIDEO":
      return lesson.mediaId ? null : "No video uploaded yet";
    case "AUDIO":
      return lesson.mediaId ? null : "No audio uploaded yet";
    case "PDF":
      return lesson.mediaId ? null : "No document uploaded yet";
    case "TEXT":
      return stripHtml(lesson.content).length >= 20 ? null : "Content not written yet";
    case "QUIZ":
      return lesson.quiz && lesson.quiz._count.questions > 0 ? null : "No questions yet";
    case "ASSIGNMENT":
      return lesson.assignment && stripHtml(lesson.assignment.instructions).length >= 10 ? null : "Instructions missing";
  }
}

export async function getCurriculumForEditor(viewer: Viewer, courseId: string) {
  await requireManageableCourse(viewer, courseId);
  const [sections, readiness] = await Promise.all([
    db.courseSection.findMany({
      where: { courseId },
      orderBy: { position: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        lessons: {
          where: { deletedAt: null },
          orderBy: { position: "asc" },
          select: {
            id: true,
            title: true,
            type: true,
            durationSeconds: true,
            isPreview: true,
            isRequired: true,
            mediaId: true,
            content: true,
            quiz: { select: { _count: { select: { questions: true } } } },
            assignment: { select: { instructions: true } },
          },
        },
      },
    }),
    getPublishReadiness(courseId),
  ]);
  return {
    sections: sections.map<EditorSection>((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      lessons: s.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        type: l.type,
        durationSeconds: l.durationSeconds,
        isPreview: l.isPreview,
        isRequired: l.isRequired,
        issue: lessonIssue(l),
      })),
    })),
    readiness,
  };
}

/** Live readiness for the publish dialog. */
export async function getReadinessForCourse(viewer: Viewer, courseId: string) {
  await requireManageableCourse(viewer, courseId);
  return getPublishReadiness(courseId);
}

export async function getCourseSettingsForEditor(viewer: Viewer, courseId: string) {
  await requireManageableCourse(viewer, courseId);
  const course = await db.course.findUniqueOrThrow({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      certificateEnabled: true,
      requireAssignmentApproval: true,
      previewLessonId: true,
      _count: { select: { enrollments: true } },
      lessons: {
        where: { deletedAt: null, type: "VIDEO" },
        orderBy: [{ section: { position: "asc" } }, { position: "asc" }],
        select: { id: true, title: true },
      },
    },
  });
  return {
    id: course.id,
    title: course.title,
    slug: course.slug,
    status: course.status,
    certificateEnabled: course.certificateEnabled,
    requireAssignmentApproval: course.requireAssignmentApproval,
    previewLessonId: course.previewLessonId,
    enrollmentCount: course._count.enrollments,
    videoLessons: course.lessons,
    canDeleteAny: can(viewer, "course:manage_any"),
  };
}

// ───────────────────────────── Lesson editor ─────────────────────────────

export async function getLessonForEditor(viewer: Viewer, courseId: string, lessonId: string) {
  await requireManageableCourse(viewer, courseId);
  const lesson = await db.lesson.findFirst({
    where: { id: lessonId, courseId, deletedAt: null },
    select: {
      id: true,
      title: true,
      type: true,
      summary: true,
      content: true,
      durationSeconds: true,
      isPreview: true,
      isRequired: true,
      updatedAt: true,
      section: { select: { title: true } },
      course: { select: { requireAssignmentApproval: true } },
      media: { select: { id: true, originalName: true, sizeBytes: true, mimeType: true, durationSeconds: true } },
      // Instructor-only: correct answers are included because only course managers reach this query.
      quiz: {
        select: {
          passingScore: true,
          maxAttempts: true,
          shuffleQuestions: true,
          showCorrectAnswers: true,
          _count: { select: { attempts: true } },
          questions: {
            orderBy: { position: "asc" },
            select: {
              id: true,
              type: true,
              prompt: true,
              explanation: true,
              points: true,
              options: { orderBy: { position: "asc" }, select: { id: true, text: true, isCorrect: true } },
            },
          },
        },
      },
      assignment: { select: { instructions: true, allowText: true, allowFile: true, dueDaysAfterEnrollment: true } },
      resources: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          title: true,
          url: true,
          asset: { select: { id: true, originalName: true, sizeBytes: true } },
        },
      },
    },
  });
  if (!lesson) notFound();

  const ordered = await db.lesson.findMany({
    where: { courseId, deletedAt: null },
    orderBy: [{ section: { position: "asc" } }, { position: "asc" }],
    select: { id: true, title: true },
  });
  const index = ordered.findIndex((l) => l.id === lessonId);
  return {
    lesson: {
      ...lesson,
      media: lesson.media ? { ...lesson.media, url: mediaUrl(lesson.media.id) } : null,
      resources: lesson.resources.map((r) => ({
        id: r.id,
        title: r.title,
        url: r.url,
        asset: r.asset ? { ...r.asset, url: mediaUrl(r.asset.id, { download: true }) } : null,
      })),
    },
    position: { index, total: ordered.length },
    previous: index > 0 ? ordered[index - 1]! : null,
    next: index >= 0 && index < ordered.length - 1 ? ordered[index + 1]! : null,
  };
}

export type LessonEditorData = Awaited<ReturnType<typeof getLessonForEditor>>;
export type EditorLesson = LessonEditorData["lesson"];

// ───────────────────────────── Learners ─────────────────────────────

export const LEARNERS_PAGE_SIZE = 20;

export async function listCourseLearners(viewer: Viewer, courseId: string, params: { q: string; page: number }) {
  await requireManageableCourse(viewer, courseId);
  const q = params.q.trim().slice(0, 100);
  const where: Prisma.EnrollmentWhereInput = {
    courseId,
    user: {
      deletedAt: null,
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {}),
    },
  };
  const [total, byStatus] = await Promise.all([
    db.enrollment.count({ where }),
    db.enrollment.groupBy({ by: ["status"], where: { courseId }, _count: { _all: true } }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / LEARNERS_PAGE_SIZE));
  const page = Math.min(Math.max(1, params.page), pageCount);
  const rows = await db.enrollment.findMany({
    where,
    orderBy: [{ lastAccessedAt: { sort: "desc", nulls: "last" } }, { enrolledAt: "desc" }],
    skip: (page - 1) * LEARNERS_PAGE_SIZE,
    take: LEARNERS_PAGE_SIZE,
    select: {
      id: true,
      status: true,
      progressPercent: true,
      enrolledAt: true,
      completedAt: true,
      lastAccessedAt: true,
      user: { select: { id: true, name: true, email: true, avatarId: true } },
    },
  });
  const count = (s: string) => byStatus.find((b) => b.status === s)?._count._all ?? 0;
  return {
    learners: rows.map((r) => ({
      id: r.id,
      status: r.status,
      progressPercent: r.progressPercent,
      enrolledAt: r.enrolledAt,
      completedAt: r.completedAt,
      lastActiveAt: r.lastAccessedAt,
      name: r.user.name,
      email: r.user.email,
      avatarUrl: r.user.avatarId ? mediaUrl(r.user.avatarId) : null,
    })),
    total,
    page,
    pageCount,
    summary: { active: count("ACTIVE"), completed: count("COMPLETED"), dropped: count("DROPPED") },
  };
}

export type CourseLearnerRow = Awaited<ReturnType<typeof listCourseLearners>>["learners"][number];

// ───────────────────────────── Analytics ─────────────────────────────

export async function getCourseAnalytics(viewer: Viewer, courseId: string) {
  await requireManageableCourse(viewer, courseId);
  const [course, sections, weekly, lessonCompletions, attemptsByQuiz, passesByQuiz, ratings, enrolled] = await Promise.all([
    db.course.findUniqueOrThrow({ where: { id: courseId }, select: { ratingAverage: true, ratingCount: true } }),
    db.courseSection.findMany({
      where: { courseId },
      orderBy: { position: "asc" },
      select: {
        lessons: {
          where: { deletedAt: null },
          orderBy: { position: "asc" },
          select: { id: true, title: true, type: true, isRequired: true, quiz: { select: { id: true } } },
        },
      },
    }),
    weeklySeries([courseId]),
    db.lessonProgress.groupBy({
      by: ["lessonId"],
      where: { status: "COMPLETED", lesson: { courseId, deletedAt: null }, enrollment: { status: { not: "DROPPED" } } },
      _count: { _all: true },
    }),
    db.quizAttempt.groupBy({
      by: ["quizId"],
      where: { quiz: { lesson: { courseId, deletedAt: null } } },
      _avg: { score: true },
      _count: { _all: true },
    }),
    db.quizAttempt.groupBy({
      by: ["quizId"],
      where: { passed: true, quiz: { lesson: { courseId, deletedAt: null } } },
      _count: { _all: true },
    }),
    db.review.groupBy({ by: ["rating"], where: { courseId, hidden: false }, _count: { _all: true } }),
    db.enrollment.count({ where: { courseId, status: { not: "DROPPED" } } }),
  ]);

  const lessons = sections.flatMap((s) => s.lessons);
  const completedBy = new Map(lessonCompletions.map((l) => [l.lessonId, l._count._all]));
  const funnel = lessons.map((l, i) => ({
    id: l.id,
    label: `${i + 1}. ${l.title}`,
    title: l.title,
    type: l.type,
    completed: completedBy.get(l.id) ?? 0,
  }));

  const quizzes = lessons
    .filter((l) => l.quiz)
    .map((l) => {
      const attempts = attemptsByQuiz.find((a) => a.quizId === l.quiz!.id);
      const passes = passesByQuiz.find((p) => p.quizId === l.quiz!.id)?._count._all ?? 0;
      const count = attempts?._count._all ?? 0;
      return {
        lessonId: l.id,
        title: l.title,
        attempts: count,
        averageScore: count > 0 ? Math.round(attempts?._avg.score ?? 0) : null,
        passRate: count > 0 ? Math.round((passes / count) * 100) : null,
      };
    });

  return {
    learners: enrolled,
    weekly,
    funnel,
    quizzes,
    rating: {
      average: course.ratingAverage,
      count: course.ratingCount,
      distribution: [5, 4, 3, 2, 1].map((r) => ({ rating: r, count: ratings.find((x) => x.rating === r)?._count._all ?? 0 })),
    },
  };
}

export type CourseAnalytics = Awaited<ReturnType<typeof getCourseAnalytics>>;

// ───────────────────────────── Submissions ─────────────────────────────

const SUBMISSION_STATUS: Record<SubmissionFilter, SubmissionStatus | undefined> = {
  pending: "SUBMITTED",
  revision: "NEEDS_REVISION",
  approved: "APPROVED",
  all: undefined,
};

export async function listSubmissions(viewer: Viewer, params: { status: SubmissionFilter; courseId: string | null }) {
  const scope: Prisma.AssignmentSubmissionWhereInput = {
    assignment: {
      lesson: {
        deletedAt: null,
        course: manageableCoursesWhere(viewer),
        ...(params.courseId ? { courseId: params.courseId } : {}),
      },
    },
  };
  const status = SUBMISSION_STATUS[params.status];
  const [rows, counts, courses] = await Promise.all([
    db.assignmentSubmission.findMany({
      where: { ...scope, ...(status ? { status } : {}) },
      orderBy: { submittedAt: params.status === "pending" ? "asc" : "desc" },
      take: 100,
      select: {
        id: true,
        status: true,
        revision: true,
        submittedAt: true,
        text: true,
        fileId: true,
        user: { select: { name: true, avatarId: true } },
        assignment: { select: { lesson: { select: { title: true, course: { select: { id: true, title: true } } } } } },
      },
    }),
    db.assignmentSubmission.groupBy({ by: ["status"], where: scope, _count: { _all: true } }),
    db.course.findMany({
      where: { ...manageableCoursesWhere(viewer), lessons: { some: { type: "ASSIGNMENT", deletedAt: null } } },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
  ]);
  const count = (s: SubmissionStatus) => counts.find((c) => c.status === s)?._count._all ?? 0;
  return {
    submissions: rows.map((r) => ({
      id: r.id,
      status: r.status,
      revision: r.revision,
      submittedAt: r.submittedAt,
      excerpt: r.text ? r.text.slice(0, 180) : null,
      hasFile: Boolean(r.fileId),
      learner: { name: r.user.name, avatarUrl: r.user.avatarId ? mediaUrl(r.user.avatarId) : null },
      lessonTitle: r.assignment.lesson.title,
      course: r.assignment.lesson.course,
    })),
    counts: {
      pending: count("SUBMITTED"),
      revision: count("NEEDS_REVISION"),
      approved: count("APPROVED"),
      all: counts.reduce((n, c) => n + c._count._all, 0),
    } satisfies Record<SubmissionFilter, number>,
    courses,
  };
}

export type SubmissionListItem = Awaited<ReturnType<typeof listSubmissions>>["submissions"][number];

/** One submission for the review panel, or null if it doesn't exist or isn't the viewer's to review. */
export async function getSubmissionForReview(viewer: Viewer, submissionId: string) {
  const row = await db.assignmentSubmission.findFirst({
    where: { id: submissionId, assignment: { lesson: { deletedAt: null, course: manageableCoursesWhere(viewer) } } },
    select: {
      id: true,
      status: true,
      revision: true,
      text: true,
      feedback: true,
      submittedAt: true,
      reviewedAt: true,
      reviewedBy: { select: { name: true } },
      user: { select: { name: true, email: true, avatarId: true } },
      file: { select: { id: true, originalName: true, sizeBytes: true, mimeType: true } },
      assignment: {
        select: {
          instructions: true,
          lesson: { select: { id: true, title: true, course: { select: { id: true, title: true, requireAssignmentApproval: true } } } },
        },
      },
    },
  });
  if (!row) return null;
  return {
    id: row.id,
    status: row.status,
    revision: row.revision,
    text: row.text,
    feedback: row.feedback,
    submittedAt: row.submittedAt,
    reviewedAt: row.reviewedAt,
    reviewerName: row.reviewedBy?.name ?? null,
    learner: { name: row.user.name, email: row.user.email, avatarUrl: row.user.avatarId ? mediaUrl(row.user.avatarId) : null },
    file: row.file
      ? { ...row.file, url: mediaUrl(row.file.id), downloadUrl: mediaUrl(row.file.id, { download: true }) }
      : null,
    instructions: row.assignment.instructions,
    lesson: { id: row.assignment.lesson.id, title: row.assignment.lesson.title },
    course: row.assignment.lesson.course,
  };
}

export type SubmissionDetail = NonNullable<Awaited<ReturnType<typeof getSubmissionForReview>>>;
