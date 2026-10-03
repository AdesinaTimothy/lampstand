import type { MemberRole } from "@prisma/client";
import { db } from "@/server/db";
import { hashPassword } from "@/server/auth/password";
import type { Viewer } from "@/server/auth/viewer";

export const PASSWORD = "Correct-Horse-Battery-9";

/** Empties every table (keeps migrations). Tests build exactly the data they need. */
export async function resetDatabase() {
  const tables = await db.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  await db.$executeRawUnsafe(`TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(", ")} RESTART IDENTITY CASCADE`);
}

export async function createOrg() {
  return db.organization.create({
    data: { name: "Test Church", slug: "test-church", requireEmailVerification: true, certificateSignatoryName: "Pastor Test", certificateSignatoryTitle: "Lead Pastor" },
    include: { logo: { select: { id: true } } },
  });
}

let counter = 0;
export async function createMember(organizationId: string, role: MemberRole = "LEARNER", opts: { name?: string } = {}): Promise<Viewer> {
  counter++;
  const email = `${role.toLowerCase()}${counter}-${Date.now()}@test.example`;
  const user = await db.user.create({
    data: {
      email,
      name: opts.name ?? `Test ${role.toLowerCase()} ${counter}`,
      passwordHash: await hashPassword(PASSWORD),
      emailVerifiedAt: new Date(),
      memberships: { create: { organizationId, role } },
    },
  });
  return {
    id: user.id,
    sessionId: "test-session",
    email,
    name: user.name,
    avatarUrl: null,
    emailVerified: true,
    platformRole: "USER",
    organizationId,
    role,
    isSuperAdmin: false,
  };
}

/**
 * A published course: required reading, required quiz (2 questions, pass 50%),
 * required 60-second video, and an optional reading.
 */
export async function createPublishedCourse(organizationId: string, instructor: Viewer, opts: { certificateEnabled?: boolean } = {}) {
  const video = await db.mediaAsset.create({
    data: {
      organizationId,
      uploadedById: instructor.id,
      storageProvider: "local",
      storageKey: `test/${Date.now()}.mp4`,
      kind: "VIDEO",
      visibility: "PRIVATE",
      mimeType: "video/mp4",
      sizeBytes: 1000,
      originalName: "lesson.mp4",
      durationSeconds: 60,
    },
  });
  const course = await db.course.create({
    data: {
      organizationId,
      title: "Walking in Grace",
      slug: `walking-in-grace-${Date.now()}`,
      description: "<p>A short course used by the test suite to exercise enrolment, progress and certificates end to end.</p>",
      status: "PUBLISHED",
      publishedAt: new Date(),
      certificateEnabled: opts.certificateEnabled ?? true,
      createdById: instructor.id,
      objectives: ["Understand grace"],
      instructors: { create: { userId: instructor.id, role: "OWNER" } },
    },
  });
  const section = await db.courseSection.create({ data: { courseId: course.id, title: "Section one", position: 0 } });
  const lesson = (position: number, data: Record<string, unknown>) =>
    db.lesson.create({ data: { courseId: course.id, sectionId: section.id, position, title: `Lesson ${position + 1}`, ...data } as never });

  const reading = await lesson(0, { type: "TEXT", content: "<p>Grace is the unearned favour of God toward us.</p>", isRequired: true });
  const quizLesson = await lesson(1, { type: "QUIZ", isRequired: true });
  const quiz = await db.quiz.create({ data: { lessonId: quizLesson.id, passingScore: 50, maxAttempts: 3, showCorrectAnswers: true } });
  const q1 = await db.quizQuestion.create({
    data: {
      quizId: quiz.id,
      type: "SINGLE_CHOICE",
      prompt: "Grace is…",
      position: 0,
      points: 1,
      options: { create: [{ text: "Earned", position: 0, isCorrect: false }, { text: "A gift", position: 1, isCorrect: true }] },
    },
    include: { options: true },
  });
  const q2 = await db.quizQuestion.create({
    data: {
      quizId: quiz.id,
      type: "MULTIPLE_CHOICE",
      prompt: "Pick the fruits of the Spirit",
      position: 1,
      points: 1,
      options: {
        create: [
          { text: "Love", position: 0, isCorrect: true },
          { text: "Joy", position: 1, isCorrect: true },
          { text: "Pride", position: 2, isCorrect: false },
        ],
      },
    },
    include: { options: true },
  });
  const videoLesson = await lesson(2, { type: "VIDEO", mediaId: video.id, durationSeconds: 60, isRequired: true });
  const optional = await lesson(3, { type: "TEXT", content: "<p>Further reading for those who want more.</p>", isRequired: false });
  return { course, section, reading, quizLesson, quiz, questions: [q1, q2], videoLesson, optional };
}
