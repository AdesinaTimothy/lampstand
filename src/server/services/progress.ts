import "server-only";
import type { LessonType } from "@prisma/client";
import { AppError, forbidden, notFound } from "@/lib/errors";
import { db, type Tx } from "../db";
import { notify } from "../notifications";
import { getCurrentOrganization } from "../organization";
import type { Viewer } from "../auth/viewer";
import { recordActivity } from "./activity";
import { evaluateAchievements } from "./achievements";
import { issueCertificate } from "./certificates";

/*
 * Completion rules (see docs/ARCHITECTURE.md §6)
 *  - Video/audio: watched ≥ 90% of the duration, or within the final 10 seconds.
 *    "Watched" is the furthest point reached at a plausible playback rate, measured
 *    against server time — seeking ahead does not count.
 *  - Text/PDF: explicit "mark complete".
 *  - Quiz: a passing attempt. Assignment: submission (or approval, if required).
 */
export const COMPLETION_RATIO = 0.9;
export const COMPLETION_TAIL_SECONDS = 10;
const MAX_PLAYBACK_RATE = 2.5;
const PLAYBACK_SLACK_SECONDS = 15;

const MEDIA_TYPES: LessonType[] = ["VIDEO", "AUDIO"];

export type LearningEvents = {
  userId: string;
  courseId: string;
  lessonCompleted: boolean;
  courseCompleted: { courseTitle: string; courseSlug: string } | null;
  certificate: { id: string; code: string } | null;
};

export function isMediaComplete(watchedSeconds: number, durationSeconds: number | null | undefined): boolean {
  if (!durationSeconds || durationSeconds <= 0) return false;
  return watchedSeconds >= durationSeconds * COMPLETION_RATIO || durationSeconds - watchedSeconds <= COMPLETION_TAIL_SECONDS;
}

/**
 * Advances the furthest-watched point, but only as fast as real playback could
 * have reached it since the previous report.
 */
export function nextWatchedSeconds(opts: {
  previousWatched: number;
  reportedPosition: number;
  elapsedSeconds: number;
}): number {
  const { previousWatched, reportedPosition, elapsedSeconds } = opts;
  if (reportedPosition <= previousWatched) return previousWatched;
  const plausibleMax = previousWatched + Math.max(0, elapsedSeconds) * MAX_PLAYBACK_RATE + PLAYBACK_SLACK_SECONDS;
  return Math.floor(Math.min(reportedPosition, plausibleMax));
}

async function loadLesson(viewer: Viewer, lessonId: string) {
  const lesson = await db.lesson.findFirst({
    where: { id: lessonId, deletedAt: null, course: { organizationId: viewer.organizationId, deletedAt: null } },
    select: {
      id: true,
      type: true,
      courseId: true,
      durationSeconds: true,
      media: { select: { durationSeconds: true } },
    },
  });
  if (!lesson) throw notFound("Lesson");
  return lesson;
}

async function activeEnrollment(client: Tx | typeof db, userId: string, courseId: string) {
  const enrollment = await client.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { id: true, status: true },
  });
  if (!enrollment || enrollment.status === "DROPPED") {
    throw forbidden("Enrol in this course to save your progress.");
  }
  return enrollment;
}

/** Called when a learner opens a lesson. Silently ignores non-enrolled (preview) views. */
export async function recordLessonView(viewer: Viewer, lessonId: string): Promise<void> {
  const lesson = await loadLesson(viewer, lessonId);
  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: viewer.id, courseId: lesson.courseId } },
    select: { id: true, status: true },
  });
  if (!enrollment || enrollment.status === "DROPPED") return;

  const now = new Date();
  await db.$transaction(async (tx) => {
    const existing = await tx.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: viewer.id, lessonId } },
      select: { id: true },
    });
    if (existing) {
      await tx.lessonProgress.update({ where: { id: existing.id }, data: { lastViewedAt: now } });
    } else {
      await tx.lessonProgress.create({
        data: { userId: viewer.id, lessonId, enrollmentId: enrollment.id, firstViewedAt: now, lastViewedAt: now },
      });
      await recordActivity(tx, {
        userId: viewer.id,
        organizationId: viewer.organizationId,
        type: "LESSON_STARTED",
        courseId: lesson.courseId,
        lessonId,
      });
    }
    await tx.enrollment.update({
      where: { id: enrollment.id },
      data: { lastLessonId: lessonId, lastAccessedAt: now },
    });
  });
}

/** Heartbeat from the video/audio player (every ~10s, on pause, and on page hide). */
export async function saveMediaProgress(
  viewer: Viewer,
  input: { lessonId: string; positionSeconds: number; durationSeconds?: number | null },
): Promise<{ watchedSeconds: number; completed: boolean; events: LearningEvents | null }> {
  const lesson = await loadLesson(viewer, input.lessonId);
  if (!MEDIA_TYPES.includes(lesson.type)) throw new AppError("VALIDATION", "This lesson has no media to track.");
  const enrollment = await activeEnrollment(db, viewer.id, lesson.courseId);

  // Prefer durations we measured at upload; fall back to what the player reports.
  const duration =
    lesson.durationSeconds || lesson.media?.durationSeconds || (input.durationSeconds ? Math.round(input.durationSeconds) : null);
  const position = Math.floor(duration ? Math.min(input.positionSeconds, duration) : input.positionSeconds);
  const now = new Date();

  const result = await db.$transaction(async (tx) => {
    const existing = await tx.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: viewer.id, lessonId: lesson.id } },
    });
    const elapsedSeconds = existing ? (now.getTime() - existing.lastViewedAt.getTime()) / 1000 : 0;
    const watchedSeconds = nextWatchedSeconds({
      previousWatched: existing?.watchedSeconds ?? 0,
      reportedPosition: position,
      elapsedSeconds,
    });

    const progress = existing
      ? await tx.lessonProgress.update({
          where: { id: existing.id },
          data: { positionSeconds: position, watchedSeconds, lastViewedAt: now },
        })
      : await tx.lessonProgress.create({
          data: {
            userId: viewer.id,
            lessonId: lesson.id,
            enrollmentId: enrollment.id,
            positionSeconds: position,
            watchedSeconds,
          },
        });

    await tx.enrollment.update({
      where: { id: enrollment.id },
      data: { lastLessonId: lesson.id, lastAccessedAt: now },
    });
    await recordDailySession(tx, viewer, lesson.courseId, lesson.id, now);

    if (progress.status !== "COMPLETED" && isMediaComplete(watchedSeconds, duration)) {
      const events = await completeLessonTx(tx, {
        userId: viewer.id,
        organizationId: viewer.organizationId,
        lessonId: lesson.id,
        courseId: lesson.courseId,
        enrollmentId: enrollment.id,
      });
      return { watchedSeconds, completed: true, events };
    }
    return { watchedSeconds, completed: progress.status === "COMPLETED", events: null };
  });

  if (result.events) await dispatchLearningEvents(result.events);
  return result;
}

async function recordDailySession(tx: Tx, viewer: Viewer, courseId: string, lessonId: string, now: Date) {
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const already = await tx.activity.findFirst({
    where: { userId: viewer.id, lessonId, type: "LEARNING_SESSION", createdAt: { gte: startOfDay } },
    select: { id: true },
  });
  if (!already) {
    await recordActivity(tx, {
      userId: viewer.id,
      organizationId: viewer.organizationId,
      type: "LEARNING_SESSION",
      courseId,
      lessonId,
    });
  }
}

/** Explicit completion for reading lessons (and media lessons with no measurable duration). */
export async function markLessonComplete(viewer: Viewer, lessonId: string): Promise<LearningEvents> {
  const lesson = await loadLesson(viewer, lessonId);
  if (lesson.type === "QUIZ") throw new AppError("VALIDATION", "Pass the quiz to complete this lesson.");
  if (lesson.type === "ASSIGNMENT") throw new AppError("VALIDATION", "Submit the assignment to complete this lesson.");
  if (MEDIA_TYPES.includes(lesson.type) && (lesson.durationSeconds || lesson.media?.durationSeconds)) {
    throw new AppError("VALIDATION", "Keep going — this lesson completes automatically when you've watched it.");
  }
  const enrollment = await activeEnrollment(db, viewer.id, lesson.courseId);
  const events = await db.$transaction((tx) =>
    completeLessonTx(tx, {
      userId: viewer.id,
      organizationId: viewer.organizationId,
      lessonId,
      courseId: lesson.courseId,
      enrollmentId: enrollment.id,
    }),
  );
  await dispatchLearningEvents(events);
  return events;
}

/**
 * Marks a lesson complete (idempotent) and re-evaluates the enrollment. Used by
 * every completion path so the rules live in one place.
 */
export async function completeLessonTx(
  tx: Tx,
  ctx: { userId: string; organizationId: string; lessonId: string; courseId: string; enrollmentId: string },
): Promise<LearningEvents> {
  const now = new Date();
  const existing = await tx.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: ctx.userId, lessonId: ctx.lessonId } },
    select: { id: true, status: true },
  });
  let lessonCompleted = false;
  if (!existing) {
    await tx.lessonProgress.create({
      data: {
        userId: ctx.userId,
        lessonId: ctx.lessonId,
        enrollmentId: ctx.enrollmentId,
        status: "COMPLETED",
        completedAt: now,
      },
    });
    lessonCompleted = true;
  } else if (existing.status !== "COMPLETED") {
    await tx.lessonProgress.update({
      where: { id: existing.id },
      data: { status: "COMPLETED", completedAt: now, lastViewedAt: now },
    });
    lessonCompleted = true;
  }
  if (lessonCompleted) {
    await recordActivity(tx, {
      userId: ctx.userId,
      organizationId: ctx.organizationId,
      type: "LESSON_COMPLETED",
      courseId: ctx.courseId,
      lessonId: ctx.lessonId,
    });
  }
  const recomputed = await recomputeEnrollmentTx(tx, ctx.enrollmentId);
  return { userId: ctx.userId, courseId: ctx.courseId, lessonCompleted, ...recomputed };
}

/**
 * Recalculates completion percentage; completes the course and issues the
 * certificate when every required lesson is done.
 */
export async function recomputeEnrollmentTx(
  tx: Tx,
  enrollmentId: string,
): Promise<Pick<LearningEvents, "courseCompleted" | "certificate"> & { percent: number }> {
  const enrollment = await tx.enrollment.findUniqueOrThrow({
    where: { id: enrollmentId },
    select: {
      id: true,
      userId: true,
      courseId: true,
      status: true,
      course: { select: { title: true, slug: true, organizationId: true } },
    },
  });
  const required = await tx.lesson.findMany({
    where: { courseId: enrollment.courseId, deletedAt: null, isRequired: true },
    select: { id: true },
  });
  const completed = required.length
    ? await tx.lessonProgress.count({
        where: { enrollmentId, status: "COMPLETED", lessonId: { in: required.map((l) => l.id) } },
      })
    : 0;
  const percent = required.length ? Math.floor((completed * 100) / required.length) : 0;

  if (enrollment.status === "COMPLETED") {
    // Completion is permanent; adding lessons later never revokes it.
    return { percent: 100, courseCompleted: null, certificate: null };
  }

  if (required.length > 0 && completed === required.length) {
    const now = new Date();
    await tx.enrollment.update({
      where: { id: enrollmentId },
      data: { status: "COMPLETED", completedAt: now, progressPercent: 100 },
    });
    await recordActivity(tx, {
      userId: enrollment.userId,
      organizationId: enrollment.course.organizationId,
      type: "COURSE_COMPLETED",
      courseId: enrollment.courseId,
    });
    const { certificate, created } = await issueCertificate(tx, enrollmentId);
    if (certificate && created) {
      await recordActivity(tx, {
        userId: enrollment.userId,
        organizationId: enrollment.course.organizationId,
        type: "CERTIFICATE_ISSUED",
        courseId: enrollment.courseId,
        metadata: { certificateId: certificate.id },
      });
    }
    return {
      percent: 100,
      courseCompleted: { courseTitle: enrollment.course.title, courseSlug: enrollment.course.slug },
      certificate: certificate ? { id: certificate.id, code: certificate.code } : null,
    };
  }

  await tx.enrollment.update({ where: { id: enrollmentId }, data: { progressPercent: percent } });
  return { percent, courseCompleted: null, certificate: null };
}

/** Side effects that must not run inside the transaction (notifications, achievements). */
export async function dispatchLearningEvents(events: LearningEvents): Promise<void> {
  try {
    if (events.courseCompleted) {
      await notify(events.userId, {
        type: "COURSE_COMPLETED",
        title: `You completed ${events.courseCompleted.courseTitle}`,
        body: "Well done, good and faithful student. Take a moment to celebrate what you've learned.",
        href: `/courses/${events.courseCompleted.courseSlug}`,
      });
    }
    if (events.certificate) {
      await notify(events.userId, {
        type: "CERTIFICATE_ISSUED",
        title: "Your certificate is ready",
        body: events.courseCompleted
          ? `Your certificate for ${events.courseCompleted.courseTitle} has been issued.`
          : "A new certificate has been issued.",
        href: `/certificates/${events.certificate.id}`,
        email: { cta: "View certificate" },
      });
    }
    if (events.lessonCompleted || events.courseCompleted) {
      const org = await getCurrentOrganization();
      await evaluateAchievements(events.userId, org.timezone);
    }
  } catch (error) {
    // Learning progress is already committed; a notification failure must not surface as an error.
    console.error("[progress] failed to dispatch learning events", error);
  }
}
