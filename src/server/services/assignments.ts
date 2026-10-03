import "server-only";
import { AppError, forbidden, notFound } from "@/lib/errors";
import { db } from "../db";
import { notify } from "../notifications";
import type { Viewer } from "../auth/viewer";
import { assertCanManageCourse } from "../authz/policies";
import { recordActivity } from "./activity";
import { completeLessonTx, dispatchLearningEvents, type LearningEvents } from "./progress";

export async function submitAssignment(viewer: Viewer, input: { lessonId: string; text: string; fileId: string | null }) {
  const lesson = await db.lesson.findFirst({
    where: { id: input.lessonId, deletedAt: null, type: "ASSIGNMENT", course: { organizationId: viewer.organizationId, deletedAt: null } },
    select: {
      id: true,
      title: true,
      courseId: true,
      assignment: true,
      course: {
        select: { title: true, requireAssignmentApproval: true, instructors: { select: { userId: true } } },
      },
    },
  });
  if (!lesson?.assignment) throw notFound("Assignment");
  const assignment = lesson.assignment;

  const text = input.text.trim();
  if (!text && !input.fileId) throw new AppError("VALIDATION", "Add a written response or attach a file.");
  if (text && !assignment.allowText) throw new AppError("VALIDATION", "This assignment accepts file uploads only.");
  if (input.fileId && !assignment.allowFile) throw new AppError("VALIDATION", "This assignment accepts written responses only.");

  if (input.fileId) {
    // Learners may only attach files they uploaded themselves.
    const file = await db.mediaAsset.findFirst({ where: { id: input.fileId, uploadedById: viewer.id }, select: { id: true } });
    if (!file) throw forbidden("That file can't be attached.");
  }

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: viewer.id, courseId: lesson.courseId } },
    select: { id: true, status: true },
  });
  if (!enrollment || enrollment.status === "DROPPED") throw forbidden("Enrol in this course to submit work.");

  const { submission, events } = await db.$transaction(async (tx) => {
    const existing = await tx.assignmentSubmission.findUnique({
      where: { assignmentId_userId: { assignmentId: assignment.id, userId: viewer.id } },
    });
    if (existing?.status === "APPROVED") {
      throw new AppError("UNPROCESSABLE", "This assignment has already been approved.");
    }
    const submission = existing
      ? await tx.assignmentSubmission.update({
          where: { id: existing.id },
          data: {
            text: text || null,
            fileId: input.fileId,
            status: "SUBMITTED",
            revision: { increment: 1 },
            submittedAt: new Date(),
          },
        })
      : await tx.assignmentSubmission.create({
          data: {
            assignmentId: assignment.id,
            userId: viewer.id,
            enrollmentId: enrollment.id,
            text: text || null,
            fileId: input.fileId,
          },
        });
    await recordActivity(tx, {
      userId: viewer.id,
      organizationId: viewer.organizationId,
      type: "ASSIGNMENT_SUBMITTED",
      courseId: lesson.courseId,
      lessonId: lesson.id,
    });
    const events: LearningEvents | null = lesson.course.requireAssignmentApproval
      ? null
      : await completeLessonTx(tx, {
          userId: viewer.id,
          organizationId: viewer.organizationId,
          lessonId: lesson.id,
          courseId: lesson.courseId,
          enrollmentId: enrollment.id,
        });
    return { submission, events };
  });

  if (events) await dispatchLearningEvents(events);
  await Promise.all(
    lesson.course.instructors.map((i) =>
      notify(i.userId, {
        type: "ASSIGNMENT_SUBMITTED",
        title: `${viewer.name} submitted “${lesson.title}”`,
        body: lesson.course.title,
        href: `/instructor/submissions?submission=${submission.id}`,
      }),
    ),
  ).catch((e) => console.error("[assignments] notify failed", e));
  return submission;
}

export async function reviewSubmission(
  viewer: Viewer,
  input: { submissionId: string; status: "APPROVED" | "NEEDS_REVISION"; feedback: string },
) {
  const submission = await db.assignmentSubmission.findUnique({
    where: { id: input.submissionId },
    select: {
      id: true,
      userId: true,
      enrollmentId: true,
      assignment: {
        select: {
          lesson: {
            select: {
              id: true,
              title: true,
              courseId: true,
              course: { select: { slug: true, organizationId: true, requireAssignmentApproval: true } },
            },
          },
        },
      },
    },
  });
  if (!submission) throw notFound("Submission");
  const lesson = submission.assignment.lesson;
  await assertCanManageCourse(viewer, lesson.courseId);
  if (input.status === "NEEDS_REVISION" && !input.feedback.trim()) {
    throw new AppError("VALIDATION", "Explain what needs revising so the learner can improve their work.", {
      feedback: ["Feedback is required when requesting a revision"],
    });
  }

  const events = await db.$transaction(async (tx) => {
    await tx.assignmentSubmission.update({
      where: { id: submission.id },
      data: { status: input.status, feedback: input.feedback || null, reviewedById: viewer.id, reviewedAt: new Date() },
    });
    if (input.status === "APPROVED" && lesson.course.requireAssignmentApproval) {
      return completeLessonTx(tx, {
        userId: submission.userId,
        organizationId: lesson.course.organizationId,
        lessonId: lesson.id,
        courseId: lesson.courseId,
        enrollmentId: submission.enrollmentId,
      });
    }
    return null;
  });

  if (events) await dispatchLearningEvents(events);
  await notify(submission.userId, {
    type: "ASSIGNMENT_REVIEWED",
    title: input.status === "APPROVED" ? `Your work on “${lesson.title}” was approved` : `Feedback on “${lesson.title}”`,
    body: input.feedback || undefined,
    href: `/learn/${lesson.course.slug}/${lesson.id}`,
    email: { cta: "View feedback" },
  });
}
