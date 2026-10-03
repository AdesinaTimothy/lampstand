import { z } from "zod";

const id = z.string().min(1).max(40);
const optionalId = z
  .string()
  .max(40)
  .nullish()
  .transform((v) => (v ? v : null));
const shortList = (max: number, itemMax = 160) =>
  z
    .array(z.string().trim().max(itemMax))
    .max(max)
    .transform((items) => items.filter(Boolean));

export const COURSE_LEVELS = ["ALL_LEVELS", "BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
export const LESSON_TYPES = ["VIDEO", "AUDIO", "TEXT", "PDF", "QUIZ", "ASSIGNMENT"] as const;

export const createCourseSchema = z.object({
  title: z.string().trim().min(4, "Give the course a title of at least 4 characters").max(120),
  categoryId: optionalId,
});

export const courseDetailsSchema = z.object({
  title: z.string().trim().min(4, "Title must be at least 4 characters").max(120),
  subtitle: z.string().trim().max(200).optional().default(""),
  description: z.string().max(50_000).optional().default(""),
  categoryId: optionalId,
  level: z.enum(COURSE_LEVELS),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  objectives: shortList(12),
  requirements: shortList(10),
  audience: shortList(8),
  estimatedMinutes: z.coerce.number().int().min(0).max(100_000).nullish(),
  thumbnailId: optionalId,
});
export type CourseDetailsInput = z.input<typeof courseDetailsSchema>;

export const courseSettingsSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes"),
  certificateEnabled: z.boolean(),
  requireAssignmentApproval: z.boolean(),
  previewLessonId: optionalId,
});

export const sectionSchema = z.object({
  title: z.string().trim().min(2, "Section title is required").max(120),
  description: z.string().trim().max(500).optional().default(""),
});

export const createLessonSchema = z.object({
  sectionId: id,
  title: z.string().trim().min(2, "Lesson title is required").max(140),
  type: z.enum(LESSON_TYPES),
});

export const lessonSchema = z.object({
  title: z.string().trim().min(2, "Lesson title is required").max(140),
  summary: z.string().trim().max(500).optional().default(""),
  content: z.string().max(200_000).optional().default(""),
  mediaId: optionalId,
  durationSeconds: z.coerce.number().int().min(0).max(24 * 3600).nullish(),
  isPreview: z.boolean().default(false),
  isRequired: z.boolean().default(true),
});
export type LessonInput = z.input<typeof lessonSchema>;

export const resourceSchema = z
  .object({
    title: z.string().trim().min(1, "Give the resource a title").max(140),
    assetId: optionalId,
    url: z
      .string()
      .trim()
      .max(2000)
      .nullish()
      .transform((v) => v || null)
      .refine((v) => !v || /^https:\/\//i.test(v), "Links must start with https://"),
  })
  .refine((v) => Boolean(v.assetId) !== Boolean(v.url), { message: "Upload a file or add a link", path: ["url"] });

export const QUESTION_TYPES = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE"] as const;

export const quizSchema = z
  .object({
    passingScore: z.coerce.number().int().min(0).max(100),
    maxAttempts: z.coerce.number().int().min(1).max(50).nullish(),
    shuffleQuestions: z.boolean(),
    showCorrectAnswers: z.boolean(),
    questions: z
      .array(
        z.object({
          id: z.string().max(40).optional(),
          type: z.enum(QUESTION_TYPES),
          prompt: z.string().trim().min(3, "Write the question").max(1000),
          explanation: z.string().trim().max(2000).optional().default(""),
          points: z.coerce.number().int().min(1).max(100).default(1),
          options: z
            .array(
              z.object({
                id: z.string().max(40).optional(),
                text: z.string().trim().min(1, "Option text is required").max(500),
                isCorrect: z.boolean(),
              }),
            )
            .min(2, "Add at least two options")
            .max(8),
        }),
      )
      .max(100),
  })
  .superRefine((quiz, ctx) => {
    quiz.questions.forEach((q, i) => {
      const correct = q.options.filter((o) => o.isCorrect).length;
      if (correct === 0) {
        ctx.addIssue({ code: "custom", path: ["questions", i, "options"], message: "Mark at least one correct answer" });
      }
      if ((q.type === "SINGLE_CHOICE" || q.type === "TRUE_FALSE") && correct > 1) {
        ctx.addIssue({ code: "custom", path: ["questions", i, "options"], message: "Only one answer can be correct" });
      }
      if (q.type === "TRUE_FALSE" && q.options.length !== 2) {
        ctx.addIssue({ code: "custom", path: ["questions", i, "options"], message: "True/false questions have two options" });
      }
    });
  });
export type QuizInput = z.input<typeof quizSchema>;

export const assignmentSchema = z
  .object({
    instructions: z.string().max(50_000),
    allowText: z.boolean(),
    allowFile: z.boolean(),
    dueDaysAfterEnrollment: z.coerce.number().int().min(1).max(365).nullish(),
  })
  .refine((v) => v.allowText || v.allowFile, { message: "Allow at least one way to submit", path: ["allowText"] });

export const reorderSchema = z.object({
  courseId: id,
  sections: z
    .array(z.object({ id, lessonIds: z.array(id).max(500) }))
    .min(0)
    .max(200),
});

export const quizSubmissionSchema = z.object({
  lessonId: id,
  answers: z.record(z.string().max(40), z.array(z.string().max(40)).max(8)),
});

export const submissionSchema = z.object({
  lessonId: id,
  text: z.string().trim().max(20_000).optional().default(""),
  fileId: optionalId,
});

export const reviewSubmissionSchema = z.object({
  submissionId: id,
  status: z.enum(["APPROVED", "NEEDS_REVISION"]),
  feedback: z.string().trim().max(5000).optional().default(""),
});

export const courseReviewSchema = z.object({
  courseId: id,
  rating: z.coerce.number().int().min(1, "Choose a rating").max(5),
  body: z.string().trim().max(2000).optional().default(""),
});

export const noteSchema = z.object({
  lessonId: id,
  body: z.string().trim().min(1, "Write a note").max(5000),
  positionSeconds: z.coerce.number().int().min(0).max(86400).nullish(),
});

export const commentSchema = z.object({
  lessonId: id,
  body: z.string().trim().min(1, "Write a comment").max(3000),
  parentId: optionalId,
});

export const progressUpdateSchema = z.object({
  lessonId: id,
  positionSeconds: z.number().min(0).max(86400),
  durationSeconds: z.number().min(0).max(86400).nullish(),
});
