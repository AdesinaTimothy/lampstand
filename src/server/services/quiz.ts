import "server-only";
import { Prisma } from "@prisma/client";
import { AppError, forbidden, notFound } from "@/lib/errors";
import { db } from "../db";
import type { Viewer } from "../auth/viewer";
import { canManageCourse } from "../authz/policies";
import { recordActivity } from "./activity";
import { completeLessonTx, dispatchLearningEvents } from "./progress";

export type QuizAnswers = Record<string, string[]>;

type GradableQuestion = {
  id: string;
  points: number;
  options: { id: string; isCorrect: boolean }[];
};

export type QuestionResult = { questionId: string; correct: boolean; selected: string[]; correctOptionIds: string[] };

/**
 * Pure grading: a question earns its points only when the selected set exactly
 * matches the correct set (no partial credit for multiple-answer questions).
 */
export function gradeQuiz(questions: GradableQuestion[], answers: QuizAnswers, passingScore: number) {
  let pointsEarned = 0;
  let pointsTotal = 0;
  const results: QuestionResult[] = questions.map((q) => {
    const valid = new Set(q.options.map((o) => o.id));
    const selected = [...new Set(answers[q.id] ?? [])].filter((id) => valid.has(id));
    const correctIds = q.options.filter((o) => o.isCorrect).map((o) => o.id);
    const correct = selected.length === correctIds.length && correctIds.every((id) => selected.includes(id));
    pointsTotal += q.points;
    if (correct) pointsEarned += q.points;
    return { questionId: q.id, correct, selected, correctOptionIds: correctIds };
  });
  const score = pointsTotal === 0 ? 0 : Math.round((pointsEarned / pointsTotal) * 100);
  return { score, pointsEarned, pointsTotal, passed: score >= passingScore, results };
}

export type QuizSubmissionResult = {
  attemptId: string | null;
  attemptNumber: number;
  score: number;
  passed: boolean;
  pointsEarned: number;
  pointsTotal: number;
  passingScore: number;
  attemptsRemaining: number | null;
  /** Only present when the quiz reveals answers. */
  review: (QuestionResult & { explanation: string | null })[] | null;
  isPreview: boolean;
};

export async function submitQuizAttempt(viewer: Viewer, lessonId: string, answers: QuizAnswers): Promise<QuizSubmissionResult> {
  const lesson = await db.lesson.findFirst({
    where: { id: lessonId, deletedAt: null, type: "QUIZ", course: { organizationId: viewer.organizationId, deletedAt: null } },
    select: {
      id: true,
      courseId: true,
      quiz: {
        include: {
          questions: { orderBy: { position: "asc" }, include: { options: { orderBy: { position: "asc" } } } },
        },
      },
    },
  });
  if (!lesson?.quiz) throw notFound("Quiz");
  const quiz = lesson.quiz;
  if (quiz.questions.length === 0) throw new AppError("UNPROCESSABLE", "This quiz has no questions yet.");

  const unanswered = quiz.questions.filter((q) => !(answers[q.id]?.length));
  if (unanswered.length > 0) {
    throw new AppError("VALIDATION", `Answer every question before submitting (${unanswered.length} remaining).`);
  }

  const graded = gradeQuiz(quiz.questions, answers, quiz.passingScore);
  const review = quiz.showCorrectAnswers
    ? graded.results.map((r) => ({
        ...r,
        explanation: quiz.questions.find((q) => q.id === r.questionId)?.explanation ?? null,
      }))
    : null;

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: viewer.id, courseId: lesson.courseId } },
    select: { id: true, status: true },
  });

  if (!enrollment || enrollment.status === "DROPPED") {
    // Instructors previewing their own course get grading without a stored attempt.
    if (await canManageCourse(viewer, lesson.courseId)) {
      return {
        attemptId: null,
        attemptNumber: 0,
        ...graded,
        passingScore: quiz.passingScore,
        attemptsRemaining: null,
        review: graded.results.map((r) => ({
          ...r,
          explanation: quiz.questions.find((q) => q.id === r.questionId)?.explanation ?? null,
        })),
        isPreview: true,
      };
    }
    throw forbidden("Enrol in this course to take the quiz.");
  }

  const outcome = await db.$transaction(async (tx) => {
    const previous = await tx.quizAttempt.findMany({
      where: { quizId: quiz.id, userId: viewer.id },
      select: { attemptNumber: true, passed: true },
      orderBy: { attemptNumber: "desc" },
    });
    if (quiz.maxAttempts && previous.length >= quiz.maxAttempts && !previous.some((p) => p.passed)) {
      throw new AppError("UNPROCESSABLE", "You've used all attempts for this quiz. Ask your instructor if you need another try.");
    }
    const attemptNumber = (previous[0]?.attemptNumber ?? 0) + 1;
    const attempt = await tx.quizAttempt.create({
      data: {
        quizId: quiz.id,
        userId: viewer.id,
        enrollmentId: enrollment.id,
        attemptNumber,
        answers: Object.fromEntries(graded.results.map((r) => [r.questionId, r.selected])),
        score: graded.score,
        pointsEarned: graded.pointsEarned,
        pointsTotal: graded.pointsTotal,
        passed: graded.passed,
      },
    });
    await recordActivity(tx, {
      userId: viewer.id,
      organizationId: viewer.organizationId,
      type: "QUIZ_SUBMITTED",
      courseId: lesson.courseId,
      lessonId,
      metadata: { score: graded.score, passed: graded.passed },
    });
    const events = graded.passed
      ? await completeLessonTx(tx, {
          userId: viewer.id,
          organizationId: viewer.organizationId,
          lessonId,
          courseId: lesson.courseId,
          enrollmentId: enrollment.id,
        })
      : null;
    return { attempt, events, attemptsUsed: previous.length + 1 };
  }).catch((error) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError("CONFLICT", "That attempt was already submitted.");
    }
    throw error;
  });

  if (outcome.events) await dispatchLearningEvents(outcome.events);

  return {
    attemptId: outcome.attempt.id,
    attemptNumber: outcome.attempt.attemptNumber,
    ...graded,
    passingScore: quiz.passingScore,
    attemptsRemaining: quiz.maxAttempts ? Math.max(0, quiz.maxAttempts - outcome.attemptsUsed) : null,
    review,
    isPreview: false,
  };
}
