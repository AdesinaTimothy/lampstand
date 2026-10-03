import type { CourseLevel, LessonType } from "@prisma/client";

export const LEVEL_LABELS: Record<CourseLevel, string> = {
  ALL_LEVELS: "All levels",
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export const LESSON_TYPE_LABELS: Record<LessonType, string> = {
  VIDEO: "Video",
  AUDIO: "Audio",
  TEXT: "Reading",
  PDF: "Document",
  QUIZ: "Quiz",
  ASSIGNMENT: "Assignment",
};
