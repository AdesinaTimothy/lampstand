import type { LessonType } from "@prisma/client";
import { LESSON_TYPE_LABELS } from "@/lib/course-meta";

export const LESSON_TYPE_ORDER: LessonType[] = ["VIDEO", "AUDIO", "TEXT", "PDF", "QUIZ", "ASSIGNMENT"];

export const LESSON_TYPE_DESCRIPTIONS: Record<LessonType, string> = {
  VIDEO: "Upload a teaching video. Completes when watched.",
  AUDIO: "A sermon, devotional or podcast episode.",
  TEXT: "Written content with headings, quotes and images.",
  PDF: "A study guide or handout learners read inline.",
  QUIZ: "Check understanding with graded questions.",
  ASSIGNMENT: "A reflection or task you review and give feedback on.",
};

export const LESSON_TYPE_DEFAULT_TITLES: Record<LessonType, string> = {
  VIDEO: "New video lesson",
  AUDIO: "New audio lesson",
  TEXT: "New reading",
  PDF: "New document",
  QUIZ: "New quiz",
  ASSIGNMENT: "New assignment",
};

export const lessonTypeLabel = (type: LessonType) => LESSON_TYPE_LABELS[type];
