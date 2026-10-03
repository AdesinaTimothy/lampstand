import { z } from "zod";
import { lessonSchema } from "./course";

/** Schemas used only by the instructor studio, derived from the shared course schemas. */

export const lessonBasicsSchema = lessonSchema.pick({ title: true, summary: true, isPreview: true, isRequired: true });
export type LessonBasicsInput = z.input<typeof lessonBasicsSchema>;

export const lessonContentSchema = z.object({
  lessonId: z.string().min(1).max(40),
  content: z.string().max(200_000),
});

export const lessonMediaSchema = z.object({
  lessonId: z.string().min(1).max(40),
  mediaId: z
    .string()
    .max(40)
    .nullish()
    .transform((v) => v || null),
});

export const COURSE_STATUS_FILTERS = ["all", "published", "drafts", "archived"] as const;
export type CourseStatusFilter = (typeof COURSE_STATUS_FILTERS)[number];

export const SUBMISSION_FILTERS = ["pending", "revision", "approved", "all"] as const;
export type SubmissionFilter = (typeof SUBMISSION_FILTERS)[number];
