"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/errors";
import {
  commentSchema,
  courseReviewSchema,
  noteSchema,
  quizSubmissionSchema,
  submissionSchema,
} from "@/lib/validation/course";
import { parse, runAction } from "@/server/action";
import { requireViewer } from "@/server/auth/guards";
import { enrollInCourse, leaveCourse } from "@/server/services/enrollment";
import { markLessonComplete } from "@/server/services/progress";
import { submitQuizAttempt, type QuizSubmissionResult } from "@/server/services/quiz";
import { submitAssignment } from "@/server/services/assignments";
import * as engagement from "@/server/services/engagement";
import { enforceRateLimit } from "@/server/rate-limit";

const idSchema = z.string().min(1).max(40);

export async function enrollAction(courseId: unknown): Promise<ActionResult<{ courseId: string }>> {
  return runAction(async () => {
    const viewer = await requireViewer();
    const id = parse(idSchema, courseId);
    await enrollInCourse(viewer, id);
    revalidatePath("/dashboard");
    revalidatePath("/my-courses");
    return { courseId: id };
  }, "You're enrolled. Let's begin!");
}

export async function leaveCourseAction(courseId: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const viewer = await requireViewer();
    await leaveCourse(viewer, parse(idSchema, courseId));
    revalidatePath("/my-courses");
    revalidatePath("/dashboard");
  }, "You've left the course. Your progress is saved if you return.");
}

export async function completeLessonAction(
  lessonId: unknown,
): Promise<ActionResult<{ courseCompleted: boolean; certificateId: string | null }>> {
  return runAction(async () => {
    const viewer = await requireViewer();
    const events = await markLessonComplete(viewer, parse(idSchema, lessonId));
    return { courseCompleted: Boolean(events.courseCompleted), certificateId: events.certificate?.id ?? null };
  });
}

export async function submitQuizAction(input: unknown): Promise<ActionResult<QuizSubmissionResult>> {
  return runAction(async () => {
    const viewer = await requireViewer();
    const data = parse(quizSubmissionSchema, input);
    await enforceRateLimit(`quiz:${viewer.id}`, 30, 10 * 60, "You're submitting quizzes very quickly. Take a breath and try again shortly.");
    return submitQuizAttempt(viewer, data.lessonId, data.answers);
  });
}

export async function submitAssignmentAction(input: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const viewer = await requireViewer();
    const data = parse(submissionSchema, input);
    await submitAssignment(viewer, data);
  }, "Your work has been submitted.");
}

export async function toggleBookmarkAction(lessonId: unknown): Promise<ActionResult<{ bookmarked: boolean }>> {
  return runAction(async () => {
    const viewer = await requireViewer();
    const result = await engagement.toggleBookmark(viewer, parse(idSchema, lessonId));
    revalidatePath("/bookmarks");
    return result;
  });
}

export async function addNoteAction(input: unknown) {
  return runAction(async () => {
    const viewer = await requireViewer();
    const note = await engagement.addNote(viewer, parse(noteSchema, input));
    return { id: note.id, body: note.body, positionSeconds: note.positionSeconds, createdAt: note.createdAt.toISOString() };
  });
}

export async function deleteNoteAction(noteId: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const viewer = await requireViewer();
    await engagement.deleteNote(viewer, parse(idSchema, noteId));
  });
}

export async function addCommentAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const viewer = await requireViewer();
    await enforceRateLimit(`comment:${viewer.id}`, 20, 10 * 60, "You're posting quickly. Please wait a moment.");
    const comment = await engagement.addComment(viewer, parse(commentSchema, input));
    return { id: comment.id };
  });
}

export async function deleteCommentAction(commentId: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const viewer = await requireViewer();
    await engagement.deleteComment(viewer, parse(idSchema, commentId));
  });
}

export async function reviewCourseAction(input: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const viewer = await requireViewer();
    const data = parse(courseReviewSchema, input);
    await engagement.upsertReview(viewer, data);
    revalidatePath("/courses", "layout");
  }, "Thank you for your review.");
}

export async function markNotificationsReadAction(ids?: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const viewer = await requireViewer();
    const parsed = ids === undefined ? undefined : parse(z.array(idSchema).max(100), ids);
    await engagement.markNotificationsRead(viewer, parsed);
    revalidatePath("/notifications");
  });
}
