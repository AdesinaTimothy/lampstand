import "server-only";
import type { LessonType } from "@prisma/client";
import { z } from "zod";
import { AppError, notFound } from "@/lib/errors";
import { stripHtml } from "@/lib/utils";
import type { assignmentSchema, lessonSchema, quizSchema, reorderSchema, resourceSchema } from "@/lib/validation/course";
import { db } from "../db";
import { sanitizeRichText } from "../sanitize";
import type { Viewer } from "../auth/viewer";
import { assertCanManageCourse, assertCanManageLesson, assertCanManageSection } from "../authz/policies";

// ───────────────────────────── Sections ─────────────────────────────

export async function createSection(viewer: Viewer, courseId: string, input: { title: string; description: string }) {
  await assertCanManageCourse(viewer, courseId);
  const last = await db.courseSection.aggregate({ where: { courseId }, _max: { position: true } });
  return db.courseSection.create({
    data: {
      courseId,
      title: input.title,
      description: input.description || null,
      position: (last._max.position ?? -1) + 1,
    },
    select: { id: true },
  });
}

export async function updateSection(viewer: Viewer, sectionId: string, input: { title: string; description: string }) {
  await assertCanManageSection(viewer, sectionId);
  await db.courseSection.update({
    where: { id: sectionId },
    data: { title: input.title, description: input.description || null },
  });
}

/** Deleting a section soft-deletes its lessons so learner history stays intact. */
export async function deleteSection(viewer: Viewer, sectionId: string) {
  const courseId = await assertCanManageSection(viewer, sectionId);
  const sectionCount = await db.courseSection.count({ where: { courseId } });
  if (sectionCount <= 1) throw new AppError("UNPROCESSABLE", "A course needs at least one section.");
  const liveLessons = await db.lesson.count({ where: { sectionId, deletedAt: null } });
  const hasHistory = await db.lessonProgress.count({ where: { lesson: { sectionId } } });
  if (liveLessons > 0 || hasHistory > 0) {
    throw new AppError("UNPROCESSABLE", "Move or delete this section's lessons first.");
  }
  await db.courseSection.delete({ where: { id: sectionId } });
}

/**
 * Applies a full curriculum ordering from the drag-and-drop builder. Every id must
 * belong to the course; lessons may move between sections.
 */
export async function reorderCurriculum(viewer: Viewer, input: z.output<typeof reorderSchema>) {
  await assertCanManageCourse(viewer, input.courseId);
  const [sections, lessons] = await Promise.all([
    db.courseSection.findMany({ where: { courseId: input.courseId }, select: { id: true } }),
    db.lesson.findMany({ where: { courseId: input.courseId, deletedAt: null }, select: { id: true } }),
  ]);
  const sectionIds = new Set(sections.map((s) => s.id));
  const lessonIds = new Set(lessons.map((l) => l.id));
  const submittedLessons = input.sections.flatMap((s) => s.lessonIds);
  if (
    input.sections.length !== sectionIds.size ||
    !input.sections.every((s) => sectionIds.has(s.id)) ||
    submittedLessons.length !== lessonIds.size ||
    !submittedLessons.every((id) => lessonIds.has(id)) ||
    new Set(submittedLessons).size !== submittedLessons.length
  ) {
    throw new AppError("CONFLICT", "The curriculum changed in another window. Refresh and try again.");
  }
  await db.$transaction([
    ...input.sections.map((s, position) => db.courseSection.update({ where: { id: s.id }, data: { position } })),
    ...input.sections.flatMap((s) =>
      s.lessonIds.map((lessonId, position) =>
        db.lesson.update({ where: { id: lessonId }, data: { sectionId: s.id, position } }),
      ),
    ),
  ]);
}

// ───────────────────────────── Lessons ─────────────────────────────

const DEFAULT_ASSIGNMENT = "<p>Describe what learners should do and how they should submit their work.</p>";

export async function createLesson(viewer: Viewer, input: { sectionId: string; title: string; type: LessonType }) {
  const courseId = await assertCanManageSection(viewer, input.sectionId);
  const last = await db.lesson.aggregate({
    where: { sectionId: input.sectionId, deletedAt: null },
    _max: { position: true },
  });
  return db.lesson.create({
    data: {
      courseId,
      sectionId: input.sectionId,
      title: input.title,
      type: input.type,
      position: (last._max.position ?? -1) + 1,
      ...(input.type === "QUIZ" ? { quiz: { create: {} } } : {}),
      ...(input.type === "ASSIGNMENT" ? { assignment: { create: { instructions: DEFAULT_ASSIGNMENT } } } : {}),
    },
    select: { id: true },
  });
}

/** Rough reading time: 200 wpm. */
function readingSeconds(html: string): number {
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length;
  return Math.max(60, Math.round((words / 200) * 60));
}

export async function updateLesson(viewer: Viewer, lessonId: string, input: z.output<typeof lessonSchema>) {
  await assertCanManageLesson(viewer, lessonId);
  const lesson = await db.lesson.findUniqueOrThrow({ where: { id: lessonId }, select: { type: true } });

  let durationSeconds = input.durationSeconds ?? null;
  if (input.mediaId) {
    const expectedKind = lesson.type === "VIDEO" ? "VIDEO" : lesson.type === "AUDIO" ? "AUDIO" : "DOCUMENT";
    const asset = await db.mediaAsset.findFirst({
      where: { id: input.mediaId, organizationId: viewer.organizationId, kind: expectedKind },
      select: { durationSeconds: true },
    });
    if (!asset) throw new AppError("VALIDATION", "That file doesn't match this lesson type. Please upload it again.");
    if (asset.durationSeconds && (lesson.type === "VIDEO" || lesson.type === "AUDIO")) durationSeconds = asset.durationSeconds;
  }
  const content = sanitizeRichText(input.content);
  if (lesson.type === "TEXT") durationSeconds = content ? readingSeconds(content) : null;

  await db.lesson.update({
    where: { id: lessonId },
    data: {
      title: input.title,
      summary: input.summary || null,
      content: content || null,
      mediaId: ["VIDEO", "AUDIO", "PDF"].includes(lesson.type) ? input.mediaId : null,
      durationSeconds,
      isPreview: input.isPreview,
      isRequired: input.isRequired,
    },
  });
}

/** Soft delete: progress history keeps referencing the lesson; it disappears from the course. */
export async function deleteLesson(viewer: Viewer, lessonId: string) {
  const courseId = await assertCanManageLesson(viewer, lessonId);
  await db.lesson.update({ where: { id: lessonId }, data: { deletedAt: new Date() } });
  await db.course.updateMany({ where: { id: courseId, previewLessonId: lessonId }, data: { previewLessonId: null } });
}

export async function duplicateLesson(viewer: Viewer, lessonId: string) {
  await assertCanManageLesson(viewer, lessonId);
  const source = await db.lesson.findUniqueOrThrow({
    where: { id: lessonId },
    include: {
      quiz: { include: { questions: { include: { options: true } } } },
      assignment: true,
      resources: true,
    },
  });
  await db.lesson.updateMany({
    where: { sectionId: source.sectionId, position: { gt: source.position }, deletedAt: null },
    data: { position: { increment: 1 } },
  });
  return db.lesson.create({
    data: {
      courseId: source.courseId,
      sectionId: source.sectionId,
      title: `${source.title} (copy)`,
      type: source.type,
      position: source.position + 1,
      summary: source.summary,
      content: source.content,
      mediaId: source.mediaId,
      durationSeconds: source.durationSeconds,
      isPreview: false,
      isRequired: source.isRequired,
      resources: {
        create: source.resources.map((r) => ({ title: r.title, assetId: r.assetId, url: r.url, position: r.position })),
      },
      ...(source.quiz
        ? {
            quiz: {
              create: {
                passingScore: source.quiz.passingScore,
                maxAttempts: source.quiz.maxAttempts,
                shuffleQuestions: source.quiz.shuffleQuestions,
                showCorrectAnswers: source.quiz.showCorrectAnswers,
                questions: {
                  create: source.quiz.questions.map((q) => ({
                    type: q.type,
                    prompt: q.prompt,
                    explanation: q.explanation,
                    points: q.points,
                    position: q.position,
                    options: { create: q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect, position: o.position })) },
                  })),
                },
              },
            },
          }
        : {}),
      ...(source.assignment
        ? {
            assignment: {
              create: {
                instructions: source.assignment.instructions,
                allowText: source.assignment.allowText,
                allowFile: source.assignment.allowFile,
                dueDaysAfterEnrollment: source.assignment.dueDaysAfterEnrollment,
              },
            },
          }
        : {}),
    },
    select: { id: true },
  });
}

// ───────────────────────────── Resources ─────────────────────────────

export async function addResource(viewer: Viewer, lessonId: string, input: z.output<typeof resourceSchema>) {
  await assertCanManageLesson(viewer, lessonId);
  if (input.assetId) {
    const asset = await db.mediaAsset.findFirst({
      where: { id: input.assetId, organizationId: viewer.organizationId },
      select: { id: true },
    });
    if (!asset) throw new AppError("VALIDATION", "That file couldn't be found. Please upload it again.");
  }
  const count = await db.lessonResource.count({ where: { lessonId } });
  if (count >= 20) throw new AppError("UNPROCESSABLE", "A lesson can have up to 20 resources.");
  return db.lessonResource.create({
    data: { lessonId, title: input.title, assetId: input.assetId, url: input.url, position: count },
    select: { id: true },
  });
}

export async function removeResource(viewer: Viewer, resourceId: string) {
  const resource = await db.lessonResource.findUnique({ where: { id: resourceId }, select: { lessonId: true } });
  if (!resource) throw notFound("Resource");
  await assertCanManageLesson(viewer, resource.lessonId);
  await db.lessonResource.delete({ where: { id: resourceId } });
}

// ───────────────────────────── Quiz ─────────────────────────────

/**
 * Saves the full quiz definition. Questions/options with ids are updated in
 * place; missing ones are removed; new ones are created. Past attempts keep
 * their own snapshot so editing a quiz never rewrites a learner's results.
 */
export async function saveQuiz(viewer: Viewer, lessonId: string, input: z.output<typeof quizSchema>) {
  await assertCanManageLesson(viewer, lessonId);
  const lesson = await db.lesson.findUniqueOrThrow({
    where: { id: lessonId },
    select: { type: true, quiz: { select: { id: true, questions: { select: { id: true, options: { select: { id: true } } } } } } },
  });
  if (lesson.type !== "QUIZ") throw new AppError("VALIDATION", "This lesson isn't a quiz.");

  await db.$transaction(async (tx) => {
    const quiz = lesson.quiz
      ? await tx.quiz.update({
          where: { id: lesson.quiz.id },
          data: {
            passingScore: input.passingScore,
            maxAttempts: input.maxAttempts ?? null,
            shuffleQuestions: input.shuffleQuestions,
            showCorrectAnswers: input.showCorrectAnswers,
          },
        })
      : await tx.quiz.create({
          data: {
            lessonId,
            passingScore: input.passingScore,
            maxAttempts: input.maxAttempts ?? null,
            shuffleQuestions: input.shuffleQuestions,
            showCorrectAnswers: input.showCorrectAnswers,
          },
        });

    const existing = new Map((lesson.quiz?.questions ?? []).map((q) => [q.id, new Set(q.options.map((o) => o.id))]));
    const keep = new Set(input.questions.map((q) => q.id).filter((id): id is string => Boolean(id && existing.has(id))));
    await tx.quizQuestion.deleteMany({ where: { quizId: quiz.id, id: { notIn: [...keep] } } });

    for (const [position, q] of input.questions.entries()) {
      const data = {
        type: q.type,
        prompt: q.prompt,
        explanation: q.explanation || null,
        points: q.points,
        position,
      };
      if (q.id && keep.has(q.id)) {
        const knownOptions = existing.get(q.id)!;
        const keepOptions = q.options.map((o) => o.id).filter((id): id is string => Boolean(id && knownOptions.has(id)));
        await tx.quizQuestion.update({ where: { id: q.id }, data });
        await tx.quizOption.deleteMany({ where: { questionId: q.id, id: { notIn: keepOptions } } });
        for (const [optPosition, o] of q.options.entries()) {
          const optionData = { text: o.text, isCorrect: o.isCorrect, position: optPosition };
          if (o.id && knownOptions.has(o.id)) await tx.quizOption.update({ where: { id: o.id }, data: optionData });
          else await tx.quizOption.create({ data: { ...optionData, questionId: q.id } });
        }
      } else {
        await tx.quizQuestion.create({
          data: {
            ...data,
            quizId: quiz.id,
            options: { create: q.options.map((o, i) => ({ text: o.text, isCorrect: o.isCorrect, position: i })) },
          },
        });
      }
    }
  });
}

// ───────────────────────────── Assignment ─────────────────────────────

export async function saveAssignment(viewer: Viewer, lessonId: string, input: z.output<typeof assignmentSchema>) {
  await assertCanManageLesson(viewer, lessonId);
  const lesson = await db.lesson.findUniqueOrThrow({ where: { id: lessonId }, select: { type: true } });
  if (lesson.type !== "ASSIGNMENT") throw new AppError("VALIDATION", "This lesson isn't an assignment.");
  const data = {
    instructions: sanitizeRichText(input.instructions),
    allowText: input.allowText,
    allowFile: input.allowFile,
    dueDaysAfterEnrollment: input.dueDaysAfterEnrollment ?? null,
  };
  await db.assignment.upsert({ where: { lessonId }, create: { lessonId, ...data }, update: data });
}
