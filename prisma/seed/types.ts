// Typed shapes for hand-written seed content (prisma/seed/content/*).
import type { CourseLevel } from "@prisma/client";

export type InstructorKey = "daniel" | "miriam" | "samuel" | "esther" | "grace";

export type CategorySlug =
  | "bible-study"
  | "discipleship"
  | "new-believers"
  | "leadership"
  | "marriage-and-family"
  | "youth"
  | "ministry-training"
  | "membership";

export type MediaKey = "teaching-1" | "teaching-2" | "teaching-3" | "devotional-audio";

/** A printable study guide rendered to PDF with pdf-lib. */
export type StudyGuide = {
  /** File name without extension, e.g. "romans-week-1-study-guide". */
  file: string;
  title: string;
  subtitle: string;
  scripture?: { text: string; reference: string };
  sections: { heading: string; paragraphs: string[]; bullets?: string[] }[];
  questions: string[];
  /** Optional closing line, e.g. a prayer. */
  closing?: string;
};

export type ResourceSeed = { title: string; guide: StudyGuide } | { title: string; url: string };

export type CommentThreadSeed = {
  question: string;
  /** Reply from the course's owner instructor. */
  reply: string;
  /** Optional thank-you from the original asker. */
  followUp?: string;
  /** Attribute the question to the demo learner when they have reached the lesson. */
  askedByDemoLearner?: boolean;
};

type QuizChoice = { text: string; correct?: boolean };

export type QuizQuestionSeed =
  | { type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE"; prompt: string; explanation: string; options: QuizChoice[] }
  | { type: "TRUE_FALSE"; prompt: string; explanation: string; answer: boolean };

type LessonBase = {
  title: string;
  summary: string;
  /** Optional lessons don't count toward completion. */
  optional?: boolean;
  resources?: ResourceSeed[];
  comments?: CommentThreadSeed[];
};

export type LessonSeed =
  | (LessonBase & { type: "VIDEO"; media: Exclude<MediaKey, "devotional-audio">; notes?: string })
  | (LessonBase & { type: "AUDIO"; notes?: string })
  | (LessonBase & { type: "TEXT"; content: string })
  | (LessonBase & { type: "PDF"; guide: StudyGuide; notes?: string })
  | (LessonBase & { type: "QUIZ"; passingScore: number; maxAttempts?: number; questions: QuizQuestionSeed[] })
  | (LessonBase & {
      type: "ASSIGNMENT";
      instructions: string;
      allowText?: boolean;
      allowFile?: boolean;
      dueDaysAfterEnrollment?: number;
      /** Realistic learner responses; seeded submissions draw from these. */
      sampleResponses: string[];
    });

export type SectionSeed = { title: string; description?: string; lessons: LessonSeed[] };

export type ThumbnailMotif =
  | "sunrise"
  | "open-book"
  | "mountain"
  | "ripples"
  | "basin"
  | "rings"
  | "harbor"
  | "seedlings"
  | "anchor"
  | "path"
  | "circle-table"
  | "dove";

export type CourseSeed = {
  slug: string;
  title: string;
  subtitle: string;
  /** Sanitizer-safe HTML (p, h2, h3, strong, em, ul, ol, li, blockquote, a). */
  description: string;
  category: CategorySlug;
  level: CourseLevel;
  tags: string[];
  objectives: string[];
  requirements: string[];
  audience: string[];
  owner: InstructorKey;
  coInstructors?: InstructorKey[];
  status: "PUBLISHED" | "DRAFT";
  featured?: boolean;
  certificateEnabled?: boolean;
  requireAssignmentApproval?: boolean;
  /** Days before now the course was published (PUBLISHED only). */
  publishedDaysAgo?: number;
  /** Relative demand used when simulating enrolments (0–1). */
  popularity: number;
  /** Share of non-dropped learners who finish (0–1). */
  completionRate: number;
  thumbnail: ThumbnailMotif;
  sections: SectionSeed[];
  /** Short, genuine review bodies used for seeded reviews. */
  reviews: string[];
};
