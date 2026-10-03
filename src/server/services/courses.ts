import "server-only";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { AppError, forbidden, notFound } from "@/lib/errors";
import { slugify, stripHtml } from "@/lib/utils";
import type { courseDetailsSchema, courseSettingsSchema } from "@/lib/validation/course";
import { db, type Tx } from "../db";
import { audit } from "../audit";
import { notifyMany } from "../notifications";
import { sanitizeRichText } from "../sanitize";
import type { Viewer } from "../auth/viewer";
import { assertCan, assertCanManageCourse, can } from "../authz/policies";

async function uniqueCourseSlug(client: Tx | typeof db, organizationId: string, base: string, excludeId?: string) {
  const root = slugify(base) || "course";
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const clash = await client.course.findFirst({
      where: { organizationId, slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    if (!clash) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

export async function createCourse(viewer: Viewer, input: { title: string; categoryId: string | null }) {
  assertCan(viewer, "course:create");
  if (input.categoryId) await assertCategory(viewer, input.categoryId);
  return db.$transaction(async (tx) => {
    const slug = await uniqueCourseSlug(tx, viewer.organizationId, input.title);
    const course = await tx.course.create({
      data: {
        organizationId: viewer.organizationId,
        title: input.title,
        slug,
        categoryId: input.categoryId,
        createdById: viewer.id,
        instructors: { create: { userId: viewer.id, role: "OWNER" } },
        // A starting structure so the builder is never empty.
        sections: { create: { title: "Getting started", position: 0 } },
      },
      select: { id: true },
    });
    await audit(viewer, "course.created", { type: "Course", id: course.id }, { title: input.title }, tx);
    return course;
  });
}

async function assertCategory(viewer: Viewer, categoryId: string) {
  const category = await db.category.findFirst({
    where: { id: categoryId, organizationId: viewer.organizationId },
    select: { id: true },
  });
  if (!category) throw new AppError("VALIDATION", "Choose a valid category.", { categoryId: ["Choose a valid category"] });
}

async function assertOwnAsset(viewer: Viewer, assetId: string, kind: "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT") {
  const asset = await db.mediaAsset.findFirst({
    where: { id: assetId, organizationId: viewer.organizationId, kind },
    select: { id: true, durationSeconds: true },
  });
  if (!asset) throw new AppError("VALIDATION", "That file couldn't be found. Please upload it again.");
  return asset;
}

export async function updateCourseDetails(viewer: Viewer, courseId: string, input: z.output<typeof courseDetailsSchema>) {
  await assertCanManageCourse(viewer, courseId);
  if (input.categoryId) await assertCategory(viewer, input.categoryId);
  if (input.thumbnailId) await assertOwnAsset(viewer, input.thumbnailId, "IMAGE");

  const tagSlugs = [...new Map(input.tags.map((t) => [slugify(t), t.trim()])).entries()].filter(([s]) => s);

  await db.$transaction(async (tx) => {
    const tags = await Promise.all(
      tagSlugs.map(([slug, name]) =>
        tx.tag.upsert({
          where: { organizationId_slug: { organizationId: viewer.organizationId, slug } },
          create: { organizationId: viewer.organizationId, slug, name },
          update: {},
          select: { id: true },
        }),
      ),
    );
    await tx.courseTag.deleteMany({ where: { courseId } });
    if (tags.length) await tx.courseTag.createMany({ data: tags.map((t) => ({ courseId, tagId: t.id })) });
    await tx.course.update({
      where: { id: courseId },
      data: {
        title: input.title,
        subtitle: input.subtitle || null,
        description: sanitizeRichText(input.description) || null,
        categoryId: input.categoryId,
        level: input.level,
        objectives: input.objectives,
        requirements: input.requirements,
        audience: input.audience,
        estimatedMinutes: input.estimatedMinutes ?? null,
        thumbnailId: input.thumbnailId,
      },
    });
  });
}

export async function updateCourseSettings(viewer: Viewer, courseId: string, input: z.output<typeof courseSettingsSchema>) {
  await assertCanManageCourse(viewer, courseId);
  const course = await db.course.findUniqueOrThrow({ where: { id: courseId }, select: { slug: true, status: true } });
  if (input.slug !== course.slug) {
    const clash = await db.course.findFirst({
      where: { organizationId: viewer.organizationId, slug: input.slug, id: { not: courseId } },
      select: { id: true },
    });
    if (clash) throw new AppError("CONFLICT", "Another course already uses that URL.", { slug: ["This URL is taken"] });
  }
  if (input.previewLessonId) {
    const lesson = await db.lesson.findFirst({
      where: { id: input.previewLessonId, courseId, deletedAt: null, type: "VIDEO" },
      select: { id: true },
    });
    if (!lesson) throw new AppError("VALIDATION", "Choose a video lesson from this course as the preview.");
  }
  await db.course.update({
    where: { id: courseId },
    data: {
      slug: input.slug,
      certificateEnabled: input.certificateEnabled,
      requireAssignmentApproval: input.requireAssignmentApproval,
      previewLessonId: input.previewLessonId,
    },
  });
}

// ───────────────────────────── Publishing ─────────────────────────────

export type ReadinessIssue = { level: "error" | "warning"; message: string; href?: string };

/**
 * Everything that must be true before learners can see a course. Shown live in the
 * builder and enforced again on publish.
 */
export async function getPublishReadiness(courseId: string): Promise<ReadinessIssue[]> {
  const course = await db.course.findUniqueOrThrow({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      description: true,
      thumbnailId: true,
      categoryId: true,
      objectives: true,
      sections: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          title: true,
          lessons: {
            where: { deletedAt: null },
            orderBy: { position: "asc" },
            select: {
              id: true,
              title: true,
              type: true,
              isRequired: true,
              mediaId: true,
              content: true,
              quiz: { select: { questions: { select: { id: true } } } },
              assignment: { select: { instructions: true } },
            },
          },
        },
      },
    },
  });

  const base = `/instructor/courses/${course.id}`;
  const issues: ReadinessIssue[] = [];
  const err = (message: string, href?: string) => issues.push({ level: "error", message, href });
  const warn = (message: string, href?: string) => issues.push({ level: "warning", message, href });

  if (stripHtml(course.description).length < 80) err("Write a course description of at least 80 characters", `${base}/details`);
  if (!course.thumbnailId) err("Add a course thumbnail image", `${base}/details`);
  if (!course.categoryId) err("Choose a category", `${base}/details`);
  if (course.objectives.length === 0) err("List at least one thing learners will learn", `${base}/details`);

  const lessons = course.sections.flatMap((s) => s.lessons);
  if (lessons.length === 0) err("Add at least one lesson", `${base}/curriculum`);
  if (lessons.length > 0 && !lessons.some((l) => l.isRequired)) err("Mark at least one lesson as required", `${base}/curriculum`);

  for (const section of course.sections) {
    if (section.lessons.length === 0) warn(`Section “${section.title}” has no lessons and will be hidden`, `${base}/curriculum`);
  }
  for (const lesson of lessons) {
    const href = `${base}/lessons/${lesson.id}`;
    const name = `“${lesson.title}”`;
    switch (lesson.type) {
      case "VIDEO":
      case "AUDIO":
        if (!lesson.mediaId) err(`Upload ${lesson.type === "VIDEO" ? "a video" : "audio"} for ${name}`, href);
        break;
      case "PDF":
        if (!lesson.mediaId) err(`Upload a PDF for ${name}`, href);
        break;
      case "TEXT":
        if (stripHtml(lesson.content).length < 20) err(`Write the content for ${name}`, href);
        break;
      case "QUIZ":
        if (!lesson.quiz || lesson.quiz.questions.length === 0) err(`Add questions to the quiz ${name}`, href);
        break;
      case "ASSIGNMENT":
        if (!lesson.assignment || stripHtml(lesson.assignment.instructions).length < 10)
          err(`Write instructions for the assignment ${name}`, href);
        break;
    }
  }
  return issues;
}

export async function publishCourse(viewer: Viewer, courseId: string) {
  await assertCanManageCourse(viewer, courseId);
  const issues = await getPublishReadiness(courseId);
  const blocking = issues.filter((i) => i.level === "error");
  if (blocking.length > 0) {
    throw new AppError(
      "UNPROCESSABLE",
      `This course isn't ready to publish yet: ${blocking.length} item${blocking.length === 1 ? "" : "s"} to fix.`,
    );
  }
  const course = await db.course.findUniqueOrThrow({
    where: { id: courseId },
    select: { status: true, publishedAt: true, title: true, slug: true },
  });
  if (course.status === "PUBLISHED") return;
  const firstPublish = !course.publishedAt;

  await db.$transaction(async (tx) => {
    await tx.course.update({
      where: { id: courseId },
      data: { status: "PUBLISHED", publishedAt: course.publishedAt ?? new Date() },
    });
    await audit(viewer, "course.published", { type: "Course", id: courseId }, { title: course.title }, tx);
  });

  if (firstPublish) {
    const members = await db.membership.findMany({
      where: { organizationId: viewer.organizationId, status: "ACTIVE", userId: { not: viewer.id } },
      select: { userId: true },
    });
    await notifyMany(
      members.map((m) => m.userId),
      {
        type: "COURSE_PUBLISHED",
        title: `New course: ${course.title}`,
        body: "A new course is now available in the catalogue.",
        href: `/courses/${course.slug}`,
      },
    );
  }
}

export async function unpublishCourse(viewer: Viewer, courseId: string) {
  await assertCanManageCourse(viewer, courseId);
  await db.$transaction(async (tx) => {
    const course = await tx.course.update({ where: { id: courseId }, data: { status: "DRAFT" }, select: { title: true } });
    await audit(viewer, "course.unpublished", { type: "Course", id: courseId }, { title: course.title }, tx);
  });
}

export async function archiveCourse(viewer: Viewer, courseId: string) {
  await assertCanManageCourse(viewer, courseId);
  await db.$transaction(async (tx) => {
    const course = await tx.course.update({ where: { id: courseId }, data: { status: "ARCHIVED", featured: false }, select: { title: true } });
    await audit(viewer, "course.archived", { type: "Course", id: courseId }, { title: course.title }, tx);
  });
}

/** Soft delete. Instructors may delete their drafts nobody has enrolled in; staff may delete any. */
export async function deleteCourse(viewer: Viewer, courseId: string) {
  await assertCanManageCourse(viewer, courseId);
  const course = await db.course.findUniqueOrThrow({
    where: { id: courseId },
    select: { title: true, status: true, _count: { select: { enrollments: true } } },
  });
  if (!can(viewer, "course:manage_any") && (course.status === "PUBLISHED" || course._count.enrollments > 0)) {
    throw forbidden("Courses with learners can only be removed by an administrator. Unpublish it instead.");
  }
  await db.$transaction(async (tx) => {
    await tx.course.update({
      where: { id: courseId },
      data: { deletedAt: new Date(), status: "ARCHIVED", featured: false, slug: `deleted-${courseId}` },
    });
    await audit(viewer, "course.deleted", { type: "Course", id: courseId }, { title: course.title }, tx);
  });
}

export async function setCourseFeatured(viewer: Viewer, courseId: string, featured: boolean) {
  assertCan(viewer, "course:manage_any");
  const course = await db.course.findFirst({
    where: { id: courseId, organizationId: viewer.organizationId, deletedAt: null },
    select: { status: true },
  });
  if (!course) throw notFound("Course");
  if (featured && course.status !== "PUBLISHED") throw new AppError("UNPROCESSABLE", "Only published courses can be featured.");
  await db.$transaction(async (tx) => {
    await tx.course.update({ where: { id: courseId }, data: { featured } });
    await audit(viewer, featured ? "course.featured" : "course.unfeatured", { type: "Course", id: courseId }, undefined, tx);
  });
}

/** Admin: choose which instructors teach a course. The first becomes the owner. */
export async function setCourseInstructors(viewer: Viewer, courseId: string, instructorIds: string[]) {
  assertCan(viewer, "instructor:manage");
  const course = await db.course.findFirst({
    where: { id: courseId, organizationId: viewer.organizationId, deletedAt: null },
    select: { id: true },
  });
  if (!course) throw notFound("Course");
  const unique = [...new Set(instructorIds)];
  const valid = await db.membership.count({
    where: {
      organizationId: viewer.organizationId,
      userId: { in: unique },
      status: "ACTIVE",
      role: { in: ["INSTRUCTOR", "ADMIN", "OWNER"] },
    },
  });
  if (valid !== unique.length) throw new AppError("VALIDATION", "Only active instructors can be assigned to a course.");

  await db.$transaction(async (tx) => {
    await tx.courseInstructor.deleteMany({ where: { courseId } });
    await tx.courseInstructor.createMany({
      data: unique.map((userId, position) => ({ courseId, userId, position, role: position === 0 ? "OWNER" : "CO_INSTRUCTOR" })),
    });
    await audit(viewer, "course.instructors_changed", { type: "Course", id: courseId }, { instructorIds: unique }, tx);
  });
}

export function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
