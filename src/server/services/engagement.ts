import "server-only";
import { AppError, forbidden, notFound } from "@/lib/errors";
import { db } from "../db";
import type { Viewer } from "../auth/viewer";
import { assertCan, canManageCourse } from "../authz/policies";
import { recordActivity } from "./activity";

/** Lesson-level interactions require enrolment (or teaching the course). */
async function assertLessonParticipant(viewer: Viewer, lessonId: string) {
  const lesson = await db.lesson.findFirst({
    where: { id: lessonId, deletedAt: null, course: { organizationId: viewer.organizationId, deletedAt: null } },
    select: { id: true, courseId: true },
  });
  if (!lesson) throw notFound("Lesson");
  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: viewer.id, courseId: lesson.courseId } },
    select: { status: true },
  });
  const enrolled = enrollment && enrollment.status !== "DROPPED";
  if (!enrolled && !(await canManageCourse(viewer, lesson.courseId))) {
    throw forbidden("Enrol in this course to use this feature.");
  }
  return lesson;
}

export async function toggleBookmark(viewer: Viewer, lessonId: string): Promise<{ bookmarked: boolean }> {
  await assertLessonParticipant(viewer, lessonId);
  const existing = await db.bookmark.findUnique({ where: { userId_lessonId: { userId: viewer.id, lessonId } } });
  if (existing) {
    await db.bookmark.delete({ where: { id: existing.id } });
    return { bookmarked: false };
  }
  await db.bookmark.create({ data: { userId: viewer.id, lessonId } });
  return { bookmarked: true };
}

export async function addNote(viewer: Viewer, input: { lessonId: string; body: string; positionSeconds?: number | null }) {
  await assertLessonParticipant(viewer, input.lessonId);
  const count = await db.lessonNote.count({ where: { userId: viewer.id, lessonId: input.lessonId } });
  if (count >= 200) throw new AppError("UNPROCESSABLE", "You've reached the note limit for this lesson.");
  return db.lessonNote.create({
    data: { userId: viewer.id, lessonId: input.lessonId, body: input.body, positionSeconds: input.positionSeconds ?? null },
  });
}

export async function deleteNote(viewer: Viewer, noteId: string) {
  const { count } = await db.lessonNote.deleteMany({ where: { id: noteId, userId: viewer.id } });
  if (count === 0) throw notFound("Note");
}

export async function addComment(viewer: Viewer, input: { lessonId: string; body: string; parentId: string | null }) {
  await assertLessonParticipant(viewer, input.lessonId);
  if (input.parentId) {
    const parent = await db.lessonComment.findFirst({
      where: { id: input.parentId, lessonId: input.lessonId, deletedAt: null },
      select: { parentId: true },
    });
    if (!parent) throw notFound("Comment");
    // One level of threading keeps discussions readable on phones.
    if (parent.parentId) input = { ...input, parentId: parent.parentId };
  }
  return db.lessonComment.create({
    data: { lessonId: input.lessonId, userId: viewer.id, body: input.body, parentId: input.parentId },
  });
}

export async function deleteComment(viewer: Viewer, commentId: string) {
  const comment = await db.lessonComment.findFirst({
    where: { id: commentId, deletedAt: null },
    select: { userId: true, lesson: { select: { courseId: true } } },
  });
  if (!comment) throw notFound("Comment");
  if (comment.userId !== viewer.id && !(await canManageCourse(viewer, comment.lesson.courseId))) throw forbidden();
  await db.lessonComment.update({ where: { id: commentId }, data: { deletedAt: new Date(), body: "" } });
}

/** One review per learner per course; rating aggregates update in the same transaction. */
export async function upsertReview(viewer: Viewer, input: { courseId: string; rating: number; body: string }) {
  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: viewer.id, courseId: input.courseId } },
    select: { status: true, progressPercent: true, course: { select: { organizationId: true } } },
  });
  if (!enrollment || enrollment.course.organizationId !== viewer.organizationId || enrollment.status === "DROPPED") {
    throw forbidden("Enrol in this course to leave a review.");
  }
  if (enrollment.status !== "COMPLETED" && enrollment.progressPercent < 20) {
    throw new AppError("UNPROCESSABLE", "Complete a little more of the course before leaving a review.");
  }
  await db.$transaction(async (tx) => {
    const existing = await tx.review.findUnique({
      where: { courseId_userId: { courseId: input.courseId, userId: viewer.id } },
      select: { id: true },
    });
    await tx.review.upsert({
      where: { courseId_userId: { courseId: input.courseId, userId: viewer.id } },
      create: { courseId: input.courseId, userId: viewer.id, rating: input.rating, body: input.body || null },
      update: { rating: input.rating, body: input.body || null },
    });
    await refreshRating(tx, input.courseId);
    if (!existing) {
      await recordActivity(tx, {
        userId: viewer.id,
        organizationId: viewer.organizationId,
        type: "REVIEW_POSTED",
        courseId: input.courseId,
      });
    }
  });
}

export async function setReviewHidden(viewer: Viewer, reviewId: string, hidden: boolean) {
  assertCan(viewer, "review:moderate");
  const review = await db.review.findFirst({
    where: { id: reviewId, course: { organizationId: viewer.organizationId } },
    select: { courseId: true },
  });
  if (!review) throw notFound("Review");
  await db.$transaction(async (tx) => {
    await tx.review.update({ where: { id: reviewId }, data: { hidden } });
    await refreshRating(tx, review.courseId);
  });
}

async function refreshRating(tx: Parameters<Parameters<typeof db.$transaction>[0]>[0], courseId: string) {
  const agg = await tx.review.aggregate({ where: { courseId, hidden: false }, _avg: { rating: true }, _count: true });
  await tx.course.update({
    where: { id: courseId },
    data: { ratingAverage: agg._avg.rating ?? 0, ratingCount: agg._count },
  });
}

export async function markNotificationsRead(viewer: Viewer, ids?: string[]) {
  await db.notification.updateMany({
    where: { userId: viewer.id, readAt: null, ...(ids ? { id: { in: ids } } : {}) },
    data: { readAt: new Date() },
  });
}
