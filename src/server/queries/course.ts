import "server-only";
import { cache } from "react";
import type { LessonType } from "@prisma/client";
import { db } from "../db";
import { mediaUrl } from "../storage/urls";
import type { Viewer } from "../auth/viewer";
import { canManageCourse } from "../authz/policies";

export type CurriculumLesson = {
  id: string;
  title: string;
  type: LessonType;
  durationSeconds: number | null;
  isPreview: boolean;
  isRequired: boolean;
  resourceCount: number;
};

export type CurriculumSection = { id: string; title: string; description: string | null; lessons: CurriculumLesson[] };

/** Ordered, non-deleted curriculum (public fields only). Empty sections are dropped. */
export async function getCurriculum(courseId: string, opts: { includeEmpty?: boolean } = {}): Promise<CurriculumSection[]> {
  const sections = await db.courseSection.findMany({
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
          _count: { select: { resources: true } },
        },
      },
    },
  });
  return sections
    .filter((s) => opts.includeEmpty || s.lessons.length > 0)
    .map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      lessons: s.lessons.map(({ _count, ...l }) => ({ ...l, resourceCount: _count.resources })),
    }));
}

export const getCourseBySlug = cache(async (organizationId: string, slug: string) => {
  return db.course.findFirst({
    where: { organizationId, slug, deletedAt: null },
    select: {
      id: true,
      slug: true,
      title: true,
      subtitle: true,
      description: true,
      thumbnailId: true,
      previewLessonId: true,
      level: true,
      language: true,
      status: true,
      objectives: true,
      requirements: true,
      audience: true,
      estimatedMinutes: true,
      certificateEnabled: true,
      enrollmentCount: true,
      ratingAverage: true,
      ratingCount: true,
      publishedAt: true,
      updatedAt: true,
      category: { select: { name: true, slug: true } },
      tags: { select: { tag: { select: { name: true, slug: true } } } },
      instructors: {
        orderBy: { position: "asc" },
        select: {
          user: {
            select: {
              id: true,
              name: true,
              headline: true,
              bio: true,
              avatarId: true,
              _count: { select: { teaching: true } },
            },
          },
        },
      },
    },
  });
});

export type CourseDetail = NonNullable<Awaited<ReturnType<typeof getCourseBySlug>>>;

export async function getCourseReviews(courseId: string, take = 6) {
  const [reviews, distribution] = await Promise.all([
    db.review.findMany({
      where: { courseId, hidden: false },
      orderBy: [{ createdAt: "desc" }],
      take,
      select: {
        id: true,
        rating: true,
        body: true,
        createdAt: true,
        user: { select: { name: true, avatarId: true } },
      },
    }),
    db.review.groupBy({ by: ["rating"], where: { courseId, hidden: false }, _count: { _all: true } }),
  ]);
  const dist = [5, 4, 3, 2, 1].map((r) => ({ rating: r, count: distribution.find((d) => d.rating === r)?._count._all ?? 0 }));
  return {
    reviews: reviews.map((r) => ({ ...r, user: { name: r.user.name, avatarUrl: r.user.avatarId ? mediaUrl(r.user.avatarId) : null } })),
    distribution: dist,
  };
}

/** Viewer's relationship to a course: enrolment, per-lesson progress, management rights. */
export async function getViewerCourseState(viewer: Viewer | null, courseId: string) {
  if (!viewer) return { enrollment: null, completedLessonIds: new Set<string>(), canManage: false, review: null };
  const [enrollment, canManage, review] = await Promise.all([
    db.enrollment.findUnique({
      where: { userId_courseId: { userId: viewer.id, courseId } },
      select: {
        id: true,
        status: true,
        progressPercent: true,
        lastLessonId: true,
        completedAt: true,
        enrolledAt: true,
        certificate: { select: { id: true, code: true } },
      },
    }),
    canManageCourse(viewer, courseId),
    db.review.findUnique({
      where: { courseId_userId: { courseId, userId: viewer.id } },
      select: { rating: true, body: true },
    }),
  ]);
  const active = enrollment && enrollment.status !== "DROPPED" ? enrollment : null;
  const completed = active
    ? await db.lessonProgress.findMany({
        where: { userId: viewer.id, status: "COMPLETED", lesson: { courseId } },
        select: { lessonId: true },
      })
    : [];
  return { enrollment: active, completedLessonIds: new Set(completed.map((c) => c.lessonId)), canManage, review };
}

/**
 * Where "Continue" should take the learner: the last lesson if unfinished,
 * otherwise the next unfinished lesson in order, otherwise the first lesson.
 */
export function resolveNextLesson(
  sections: CurriculumSection[],
  completed: Set<string>,
  lastLessonId: string | null | undefined,
): string | null {
  const ordered = sections.flatMap((s) => s.lessons);
  if (ordered.length === 0) return null;
  const lastIndex = lastLessonId ? ordered.findIndex((l) => l.id === lastLessonId) : -1;
  if (lastIndex >= 0 && !completed.has(ordered[lastIndex]!.id)) return ordered[lastIndex]!.id;
  const after = ordered.slice(lastIndex + 1).find((l) => !completed.has(l.id));
  if (after) return after.id;
  const any = ordered.find((l) => !completed.has(l.id));
  return (any ?? ordered[0]!).id;
}

export async function getCourseResourcesCount(courseId: string) {
  return db.lessonResource.count({ where: { lesson: { courseId, deletedAt: null } } });
}
