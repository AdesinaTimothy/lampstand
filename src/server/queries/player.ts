import "server-only";
import type { LessonType, ProgressStatus, SubmissionStatus } from "@prisma/client";
import { db } from "../db";
import { mediaUrl } from "../storage/urls";
import type { Viewer } from "../auth/viewer";
import { canManageCourse } from "../authz/policies";
import { getCurriculum, resolveNextLesson, type CurriculumSection } from "./course";

export type PlayerAccess =
  | { kind: "ok" }
  | { kind: "not-found" }
  | { kind: "sign-in" }
  | { kind: "enrol" };

export type PlayerQuiz = {
  passingScore: number;
  maxAttempts: number | null;
  showCorrectAnswers: boolean;
  questions: { id: string; type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE"; prompt: string; points: number; options: { id: string; text: string }[] }[];
  attempts: { id: string; attemptNumber: number; score: number; passed: boolean; submittedAt: string }[];
};

export type PlayerAssignment = {
  instructions: string;
  allowText: boolean;
  allowFile: boolean;
  dueAt: string | null;
  submission: {
    id: string;
    status: SubmissionStatus;
    text: string | null;
    file: { id: string; name: string; url: string; size: number } | null;
    feedback: string | null;
    reviewedBy: string | null;
    reviewedAt: string | null;
    submittedAt: string;
    revision: number;
  } | null;
};

export type PlayerComment = {
  id: string;
  body: string;
  createdAt: string;
  deleted: boolean;
  author: { id: string; name: string; avatarUrl: string | null; isInstructor: boolean };
  replies: Omit<PlayerComment, "replies">[];
};

export type PlayerData = {
  course: { id: string; slug: string; title: string; certificateEnabled: boolean; status: string };
  sections: (Omit<CurriculumSection, "lessons"> & { lessons: (CurriculumSection["lessons"][number] & { status: ProgressStatus | null })[] })[];
  lesson: {
    id: string;
    title: string;
    type: LessonType;
    summary: string | null;
    content: string | null;
    durationSeconds: number | null;
    media: { url: string; mimeType: string; downloadUrl: string; name: string } | null;
    resources: { id: string; title: string; href: string; external: boolean; size: number | null }[];
    quiz: PlayerQuiz | null;
    assignment: PlayerAssignment | null;
    isPreview: boolean;
  };
  progress: { status: ProgressStatus; positionSeconds: number; watchedSeconds: number } | null;
  enrollment: { id: string; status: string; progressPercent: number; certificateId: string | null } | null;
  bookmarked: boolean;
  notes: { id: string; body: string; positionSeconds: number | null; createdAt: string }[];
  comments: PlayerComment[];
  prevLessonId: string | null;
  nextLessonId: string | null;
  /** Instructor/staff viewing without enrolment: nothing is tracked. */
  previewMode: boolean;
  canManage: boolean;
  viewerId: string | null;
};

export async function getCourseForPlayer(organizationId: string, slug: string) {
  return db.course.findFirst({
    where: { organizationId, slug, deletedAt: null },
    select: { id: true, slug: true, title: true, status: true, certificateEnabled: true },
  });
}

/** Where /learn/<slug> should send the viewer. */
export async function getResumeLessonId(viewer: Viewer, courseId: string): Promise<string | null> {
  const [sections, enrollment, completed] = await Promise.all([
    getCurriculum(courseId),
    db.enrollment.findUnique({ where: { userId_courseId: { userId: viewer.id, courseId } }, select: { lastLessonId: true } }),
    db.lessonProgress.findMany({ where: { userId: viewer.id, status: "COMPLETED", lesson: { courseId } }, select: { lessonId: true } }),
  ]);
  return resolveNextLesson(sections, new Set(completed.map((c) => c.lessonId)), enrollment?.lastLessonId);
}

export async function getPlayerData(
  viewer: Viewer | null,
  course: NonNullable<Awaited<ReturnType<typeof getCourseForPlayer>>>,
  lessonId: string,
): Promise<{ access: PlayerAccess; data?: PlayerData }> {
  const lesson = await db.lesson.findFirst({
    where: { id: lessonId, courseId: course.id, deletedAt: null },
    select: {
      id: true,
      title: true,
      type: true,
      summary: true,
      content: true,
      durationSeconds: true,
      isPreview: true,
      media: { select: { id: true, mimeType: true, originalName: true } },
      resources: {
        orderBy: { position: "asc" },
        select: { id: true, title: true, url: true, asset: { select: { id: true, sizeBytes: true } } },
      },
      quiz: {
        select: {
          id: true,
          passingScore: true,
          maxAttempts: true,
          shuffleQuestions: true,
          showCorrectAnswers: true,
          questions: {
            orderBy: { position: "asc" },
            // isCorrect is deliberately NOT selected: answers never reach the client before grading.
            select: { id: true, type: true, prompt: true, points: true, options: { orderBy: { position: "asc" }, select: { id: true, text: true } } },
          },
        },
      },
      assignment: { select: { id: true, instructions: true, allowText: true, allowFile: true, dueDaysAfterEnrollment: true } },
    },
  });
  if (!lesson) return { access: { kind: "not-found" } };

  const [enrollment, canManage] = await Promise.all([
    viewer
      ? db.enrollment.findUnique({
          where: { userId_courseId: { userId: viewer.id, courseId: course.id } },
          select: { id: true, status: true, progressPercent: true, enrolledAt: true, certificate: { select: { id: true } } },
        })
      : null,
    canManageCourse(viewer, course.id),
  ]);
  const activeEnrollment = enrollment && enrollment.status !== "DROPPED" ? enrollment : null;
  const publicPreview = lesson.isPreview && course.status === "PUBLISHED";

  if (!activeEnrollment && !canManage && !publicPreview) {
    return { access: { kind: viewer ? "enrol" : "sign-in" } };
  }
  if (course.status !== "PUBLISHED" && !activeEnrollment && !canManage) return { access: { kind: "not-found" } };

  const [sections, progressRows, bookmark, notes, comments, attempts, submission] = await Promise.all([
    getCurriculum(course.id),
    viewer
      ? db.lessonProgress.findMany({
          where: { userId: viewer.id, lesson: { courseId: course.id } },
          select: { lessonId: true, status: true, positionSeconds: true, watchedSeconds: true },
        })
      : [],
    viewer ? db.bookmark.findUnique({ where: { userId_lessonId: { userId: viewer.id, lessonId } }, select: { id: true } }) : null,
    viewer
      ? db.lessonNote.findMany({
          where: { userId: viewer.id, lessonId },
          orderBy: [{ positionSeconds: "asc" }, { createdAt: "asc" }],
          select: { id: true, body: true, positionSeconds: true, createdAt: true },
        })
      : [],
    activeEnrollment || canManage ? getLessonComments(course.id, lessonId) : [],
    viewer && lesson.quiz
      ? db.quizAttempt.findMany({
          where: { quizId: lesson.quiz.id, userId: viewer.id },
          orderBy: { attemptNumber: "asc" },
          select: { id: true, attemptNumber: true, score: true, passed: true, submittedAt: true },
        })
      : [],
    viewer && lesson.assignment
      ? db.assignmentSubmission.findUnique({
          where: { assignmentId_userId: { assignmentId: lesson.assignment.id, userId: viewer.id } },
          select: {
            id: true,
            status: true,
            text: true,
            feedback: true,
            reviewedAt: true,
            submittedAt: true,
            revision: true,
            reviewedBy: { select: { name: true } },
            file: { select: { id: true, originalName: true, sizeBytes: true } },
          },
        })
      : null,
  ]);

  const progressMap = new Map(progressRows.map((p) => [p.lessonId, p]));
  const ordered = sections.flatMap((s) => s.lessons);
  const index = ordered.findIndex((l) => l.id === lessonId);
  const own = progressMap.get(lessonId);

  let questions = lesson.quiz?.questions ?? [];
  if (lesson.quiz?.shuffleQuestions) questions = [...questions].sort(() => Math.random() - 0.5);

  return {
    access: { kind: "ok" },
    data: {
      course: { id: course.id, slug: course.slug, title: course.title, certificateEnabled: course.certificateEnabled, status: course.status },
      sections: sections.map((s) => ({
        ...s,
        lessons: s.lessons.map((l) => ({ ...l, status: progressMap.get(l.id)?.status ?? null })),
      })),
      lesson: {
        id: lesson.id,
        title: lesson.title,
        type: lesson.type,
        summary: lesson.summary,
        content: lesson.content,
        durationSeconds: lesson.durationSeconds,
        isPreview: lesson.isPreview,
        media: lesson.media
          ? {
              url: mediaUrl(lesson.media.id),
              downloadUrl: mediaUrl(lesson.media.id, { download: true }),
              mimeType: lesson.media.mimeType,
              name: lesson.media.originalName,
            }
          : null,
        resources: lesson.resources.map((r) => ({
          id: r.id,
          title: r.title,
          href: r.asset ? mediaUrl(r.asset.id, { download: true }) : (r.url ?? "#"),
          external: !r.asset,
          size: r.asset?.sizeBytes ?? null,
        })),
        quiz: lesson.quiz
          ? {
              passingScore: lesson.quiz.passingScore,
              maxAttempts: lesson.quiz.maxAttempts,
              showCorrectAnswers: lesson.quiz.showCorrectAnswers,
              questions,
              attempts: attempts.map((a) => ({ ...a, submittedAt: a.submittedAt.toISOString() })),
            }
          : null,
        assignment: lesson.assignment
          ? {
              instructions: lesson.assignment.instructions,
              allowText: lesson.assignment.allowText,
              allowFile: lesson.assignment.allowFile,
              dueAt:
                lesson.assignment.dueDaysAfterEnrollment && activeEnrollment
                  ? new Date(activeEnrollment.enrolledAt.getTime() + lesson.assignment.dueDaysAfterEnrollment * 86_400_000).toISOString()
                  : null,
              submission: submission
                ? {
                    id: submission.id,
                    status: submission.status,
                    text: submission.text,
                    file: submission.file
                      ? { id: submission.file.id, name: submission.file.originalName, url: mediaUrl(submission.file.id, { download: true }), size: submission.file.sizeBytes }
                      : null,
                    feedback: submission.feedback,
                    reviewedBy: submission.reviewedBy?.name ?? null,
                    reviewedAt: submission.reviewedAt?.toISOString() ?? null,
                    submittedAt: submission.submittedAt.toISOString(),
                    revision: submission.revision,
                  }
                : null,
            }
          : null,
      },
      progress: own ? { status: own.status, positionSeconds: own.positionSeconds, watchedSeconds: own.watchedSeconds } : null,
      enrollment: activeEnrollment
        ? {
            id: activeEnrollment.id,
            status: activeEnrollment.status,
            progressPercent: activeEnrollment.status === "COMPLETED" ? 100 : activeEnrollment.progressPercent,
            certificateId: activeEnrollment.certificate?.id ?? null,
          }
        : null,
      bookmarked: Boolean(bookmark),
      notes: notes.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() })),
      comments,
      prevLessonId: index > 0 ? ordered[index - 1]!.id : null,
      nextLessonId: index >= 0 && index < ordered.length - 1 ? ordered[index + 1]!.id : null,
      previewMode: !activeEnrollment,
      canManage,
      viewerId: viewer?.id ?? null,
    },
  };
}

async function getLessonComments(courseId: string, lessonId: string): Promise<PlayerComment[]> {
  const [rows, instructors] = await Promise.all([
    db.lessonComment.findMany({
      where: { lessonId },
      orderBy: { createdAt: "asc" },
      take: 200,
      select: {
        id: true,
        body: true,
        parentId: true,
        createdAt: true,
        deletedAt: true,
        user: { select: { id: true, name: true, avatarId: true } },
      },
    }),
    db.courseInstructor.findMany({ where: { courseId }, select: { userId: true } }),
  ]);
  const teaching = new Set(instructors.map((i) => i.userId));
  const toDto = (c: (typeof rows)[number]): Omit<PlayerComment, "replies"> => ({
    id: c.id,
    body: c.deletedAt ? "" : c.body,
    createdAt: c.createdAt.toISOString(),
    deleted: Boolean(c.deletedAt),
    author: {
      id: c.user.id,
      name: c.user.name,
      avatarUrl: c.user.avatarId ? mediaUrl(c.user.avatarId) : null,
      isInstructor: teaching.has(c.user.id),
    },
  });
  const roots = rows.filter((c) => !c.parentId);
  return roots
    .map((root) => ({ ...toDto(root), replies: rows.filter((r) => r.parentId === root.id && !r.deletedAt).map(toDto) }))
    .filter((c) => !c.deleted || c.replies.length > 0)
    .reverse();
}
