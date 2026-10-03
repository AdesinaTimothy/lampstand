"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/errors";
import {
  assignmentSchema,
  courseDetailsSchema,
  courseSettingsSchema,
  createCourseSchema,
  createLessonSchema,
  quizSchema,
  reorderSchema,
  resourceSchema,
  reviewSubmissionSchema,
  sectionSchema,
} from "@/lib/validation/course";
import { lessonBasicsSchema, lessonContentSchema, lessonMediaSchema } from "@/lib/validation/instructor";
import { parse, runAction } from "@/server/action";
import { requireViewer } from "@/server/auth/guards";
import * as courses from "@/server/services/courses";
import * as curriculum from "@/server/services/curriculum";
import { reviewSubmission } from "@/server/services/assignments";
import { getReadinessForCourse } from "@/server/queries/instructor";

/*
 * Instructor studio mutations. Each action: resolve the viewer → validate input
 * with the shared Zod schema → call the service (which authorizes against the
 * course) → revalidate the pages that display the changed data.
 */

const idSchema = z.string().min(1).max(40);

/** Every editor tab for any course, the studio overview/list and the public course pages. */
function revalidateCourse() {
  revalidatePath("/instructor", "layout");
  revalidatePath("/courses/[slug]", "page");
  revalidatePath("/courses");
}

/** Editor-only changes (draft structure) that don't affect the public catalogue listing. */
function revalidateEditor() {
  revalidatePath("/instructor/courses/[courseId]", "layout");
  revalidatePath("/courses/[slug]", "page");
  revalidatePath("/learn/[courseSlug]/[lessonId]", "page");
}

// ───────────────────────────── Courses ─────────────────────────────

export async function createCourseAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const viewer = await requireViewer();
    const data = parse(createCourseSchema, input);
    const course = await courses.createCourse(viewer, data);
    revalidatePath("/instructor", "layout");
    return { id: course.id };
  }, "Course created. Let's build it out.");
}

export async function updateCourseDetailsAction(courseId: unknown, input: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const viewer = await requireViewer();
    const id = parse(idSchema, courseId);
    await courses.updateCourseDetails(viewer, id, parse(courseDetailsSchema, input));
    revalidateCourse();
  }, "Course details saved.");
}

export async function updateCourseSettingsAction(courseId: unknown, input: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const viewer = await requireViewer();
    const id = parse(idSchema, courseId);
    await courses.updateCourseSettings(viewer, id, parse(courseSettingsSchema, input));
    revalidateCourse();
  }, "Settings saved.");
}

export async function getPublishReadinessAction(courseId: unknown): Promise<ActionResult<courses.ReadinessIssue[]>> {
  return runAction(async () => {
    const viewer = await requireViewer();
    return getReadinessForCourse(viewer, parse(idSchema, courseId));
  });
}

export async function publishCourseAction(courseId: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const viewer = await requireViewer();
    await courses.publishCourse(viewer, parse(idSchema, courseId));
    revalidateCourse();
    revalidatePath("/");
  }, "Published. Your course is now live in the catalogue.");
}

export async function unpublishCourseAction(courseId: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const viewer = await requireViewer();
    await courses.unpublishCourse(viewer, parse(idSchema, courseId));
    revalidateCourse();
    revalidatePath("/");
  }, "Unpublished. The course is back in draft.");
}

export async function archiveCourseAction(courseId: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const viewer = await requireViewer();
    await courses.archiveCourse(viewer, parse(idSchema, courseId));
    revalidateCourse();
    revalidatePath("/");
  }, "Course archived.");
}

export async function deleteCourseAction(courseId: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const viewer = await requireViewer();
    await courses.deleteCourse(viewer, parse(idSchema, courseId));
    revalidateCourse();
    revalidatePath("/");
  }, "Course deleted.");
}

// ───────────────────────────── Sections ─────────────────────────────

export async function createSectionAction(courseId: unknown, input: unknown): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const viewer = await requireViewer();
    const section = await curriculum.createSection(viewer, parse(idSchema, courseId), parse(sectionSchema, input));
    revalidateEditor();
    return { id: section.id };
  }, "Section added.");
}

export async function updateSectionAction(sectionId: unknown, input: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const viewer = await requireViewer();
    await curriculum.updateSection(viewer, parse(idSchema, sectionId), parse(sectionSchema, input));
    revalidateEditor();
  }, "Section renamed.");
}

export async function deleteSectionAction(sectionId: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const viewer = await requireViewer();
    await curriculum.deleteSection(viewer, parse(idSchema, sectionId));
    revalidateEditor();
  }, "Section deleted.");
}

export async function reorderCurriculumAction(input: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const viewer = await requireViewer();
    await curriculum.reorderCurriculum(viewer, parse(reorderSchema, input));
    revalidateEditor();
  });
}

// ───────────────────────────── Lessons ─────────────────────────────

export async function createLessonAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const viewer = await requireViewer();
    const lesson = await curriculum.createLesson(viewer, parse(createLessonSchema, input));
    revalidateEditor();
    return { id: lesson.id };
  }, "Lesson added.");
}

export async function updateLessonBasicsAction(lessonId: unknown, input: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const viewer = await requireViewer();
    await curriculum.updateLessonBasics(viewer, parse(idSchema, lessonId), parse(lessonBasicsSchema, input));
    revalidateEditor();
  }, "Lesson saved.");
}

/** Autosave target for reading lessons. Intentionally doesn't revalidate the editor to avoid re-rendering while typing. */
export async function saveLessonContentAction(input: unknown): Promise<ActionResult<{ durationSeconds: number | null }>> {
  return runAction(async () => {
    const viewer = await requireViewer();
    const data = parse(lessonContentSchema, input);
    const result = await curriculum.updateLessonContent(viewer, data.lessonId, data.content);
    revalidatePath("/learn/[courseSlug]/[lessonId]", "page");
    return result;
  });
}

export async function setLessonMediaAction(input: unknown): Promise<ActionResult<{ durationSeconds: number | null }>> {
  return runAction(async () => {
    const viewer = await requireViewer();
    const data = parse(lessonMediaSchema, input);
    const result = await curriculum.setLessonMedia(viewer, data.lessonId, data.mediaId);
    revalidateEditor();
    return result;
  });
}

export async function deleteLessonAction(lessonId: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const viewer = await requireViewer();
    await curriculum.deleteLesson(viewer, parse(idSchema, lessonId));
    revalidateEditor();
  }, "Lesson deleted.");
}

export async function duplicateLessonAction(lessonId: unknown): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const viewer = await requireViewer();
    const lesson = await curriculum.duplicateLesson(viewer, parse(idSchema, lessonId));
    revalidateEditor();
    return { id: lesson.id };
  }, "Lesson duplicated.");
}

export async function saveQuizAction(lessonId: unknown, input: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const viewer = await requireViewer();
    await curriculum.saveQuiz(viewer, parse(idSchema, lessonId), parse(quizSchema, input));
    revalidateEditor();
  }, "Quiz saved.");
}

export async function saveAssignmentAction(lessonId: unknown, input: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const viewer = await requireViewer();
    await curriculum.saveAssignment(viewer, parse(idSchema, lessonId), parse(assignmentSchema, input));
    revalidateEditor();
  }, "Assignment saved.");
}

export async function addResourceAction(lessonId: unknown, input: unknown): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const viewer = await requireViewer();
    const resource = await curriculum.addResource(viewer, parse(idSchema, lessonId), parse(resourceSchema, input));
    revalidateEditor();
    return { id: resource.id };
  }, "Resource added.");
}

export async function removeResourceAction(resourceId: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const viewer = await requireViewer();
    await curriculum.removeResource(viewer, parse(idSchema, resourceId));
    revalidateEditor();
  }, "Resource removed.");
}

// ───────────────────────────── Submissions ─────────────────────────────

export async function reviewSubmissionAction(input: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const viewer = await requireViewer();
    const data = parse(reviewSubmissionSchema, input);
    await reviewSubmission(viewer, data);
    revalidatePath("/instructor", "layout");
  }, "Review sent to the learner.");
}
