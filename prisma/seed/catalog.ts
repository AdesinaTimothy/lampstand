// Creates categories, tags and courses (sections, lessons, quizzes, assignments,
// resources) from the typed content in ./content, and returns an in-memory model
// the learning simulation works from.
import type { LessonType, Prisma, PrismaClient } from "@prisma/client";
import { categories } from "./content/categories";
import type { MediaLibrary } from "./media";
import { addMs, DAY, daysAgo, HOUR, NOW, type Random, readingSeconds, slugify } from "./random";
import type { CourseSeed, InstructorKey, LessonSeed, QuizQuestionSeed, StudyGuide } from "./types";

export type QuizModel = {
  id: string;
  passingScore: number;
  questions: { id: string; type: QuizQuestionSeed["type"]; options: { id: string; isCorrect: boolean }[] }[];
};

export type LessonModel = {
  id: string;
  title: string;
  type: LessonType;
  durationSeconds: number | null;
  isRequired: boolean;
  quiz?: QuizModel;
  assignment?: { id: string; sampleResponses: string[] };
  seed: LessonSeed;
};

export type CourseModel = {
  id: string;
  slug: string;
  title: string;
  seed: CourseSeed;
  ownerId: string;
  ownerName: string;
  instructorIds: string[];
  publishedAt: Date | null;
  createdAt: Date;
  certificateEnabled: boolean;
  lessons: LessonModel[];
};

export type Instructor = { id: string; name: string };

function guideText(guide: StudyGuide): string {
  return [
    guide.title,
    guide.scripture?.text ?? "",
    ...guide.sections.flatMap((s) => [s.heading, ...s.paragraphs, ...(s.bullets ?? [])]),
    ...guide.questions,
    guide.closing ?? "",
  ].join(" ");
}

function lessonDuration(lesson: LessonSeed, media: MediaLibrary): number | null {
  switch (lesson.type) {
    case "VIDEO":
      return media.mediaFor(lesson.media).durationSeconds;
    case "AUDIO":
      return media.mediaFor("devotional-audio").durationSeconds;
    case "TEXT":
      return readingSeconds(lesson.content);
    case "PDF":
      return Math.max(60, Math.round(readingSeconds(guideText(lesson.guide)) / 60) * 60);
    case "QUIZ":
      return lesson.questions.length * 60;
    case "ASSIGNMENT":
      return 15 * 60;
  }
}

function quizOptions(q: QuizQuestionSeed): { text: string; isCorrect: boolean }[] {
  if (q.type === "TRUE_FALSE") {
    return [
      { text: "True", isCorrect: q.answer },
      { text: "False", isCorrect: !q.answer },
    ];
  }
  const options = q.options.map((o) => ({ text: o.text, isCorrect: !!o.correct }));
  const correct = options.filter((o) => o.isCorrect).length;
  if (q.type === "SINGLE_CHOICE" && correct !== 1) throw new Error(`Single-choice question needs one answer: ${q.prompt}`);
  if (q.type === "MULTIPLE_CHOICE" && correct < 1) throw new Error(`Multiple-choice question needs answers: ${q.prompt}`);
  return options;
}

export async function seedCategories(db: PrismaClient, organizationId: string, createdAt: Date) {
  const bySlug = new Map<string, string>();
  for (const [position, c] of categories.entries()) {
    const row = await db.category.create({
      data: { organizationId, name: c.name, slug: c.slug, description: c.description, icon: c.icon, position, createdAt, updatedAt: createdAt },
      select: { id: true },
    });
    bySlug.set(c.slug, row.id);
  }
  return bySlug;
}

export async function seedCourses(opts: {
  db: PrismaClient;
  rng: Random;
  organizationId: string;
  courses: CourseSeed[];
  categoryIds: Map<string, string>;
  instructors: Record<InstructorKey, Instructor>;
  media: MediaLibrary;
}): Promise<CourseModel[]> {
  const { db, rng, organizationId, media, instructors } = opts;

  // Tags shared across courses.
  const tagIds = new Map<string, string>();
  for (const name of [...new Set(opts.courses.flatMap((c) => c.tags))]) {
    const row = await db.tag.create({ data: { organizationId, name, slug: slugify(name) }, select: { id: true } });
    tagIds.set(name, row.id);
  }

  const models: CourseModel[] = [];
  for (const seed of opts.courses) {
    const owner = instructors[seed.owner];
    const team = [seed.owner, ...(seed.coInstructors ?? [])].map((k) => instructors[k]);
    const publishedAt = seed.status === "PUBLISHED" ? addMs(daysAgo(seed.publishedDaysAgo ?? 30), -rng.int(1, 8) * HOUR) : null;
    const createdAt = publishedAt ? addMs(publishedAt, -rng.int(6, 21) * DAY) : daysAgo(6);
    const updatedAt = publishedAt ? addMs(publishedAt, rng.int(1, 10) * DAY) : addMs(NOW, -rng.int(2, 5) * HOUR);

    const thumbnail = await media.thumbnail(seed.slug, seed.thumbnail, owner.id, createdAt);
    const course = await db.course.create({
      data: {
        organizationId,
        slug: seed.slug,
        title: seed.title,
        subtitle: seed.subtitle,
        description: seed.description.trim(),
        thumbnailId: thumbnail.id,
        categoryId: opts.categoryIds.get(seed.category) ?? null,
        level: seed.level,
        status: seed.status,
        featured: seed.featured ?? false,
        objectives: seed.objectives,
        requirements: seed.requirements,
        audience: seed.audience,
        certificateEnabled: seed.certificateEnabled ?? true,
        requireAssignmentApproval: seed.requireAssignmentApproval ?? false,
        publishedAt,
        createdById: owner.id,
        createdAt,
        updatedAt: updatedAt > NOW ? NOW : updatedAt,
        instructors: {
          create: team.map((t, position) => ({
            userId: t.id,
            role: position === 0 ? "OWNER" : "CO_INSTRUCTOR",
            position,
            createdAt: addMs(createdAt, position * HOUR),
          })),
        },
        tags: { create: seed.tags.map((name) => ({ tagId: tagIds.get(name)! })) },
      },
      select: { id: true },
    });

    const lessons: LessonModel[] = [];
    let lessonIndex = 0;
    for (const [sectionPosition, section] of seed.sections.entries()) {
      const sectionRow = await db.courseSection.create({
        data: {
          courseId: course.id,
          title: section.title,
          description: section.description ?? null,
          position: sectionPosition,
          createdAt: addMs(createdAt, sectionPosition * HOUR),
          updatedAt: addMs(createdAt, sectionPosition * HOUR),
        },
        select: { id: true },
      });

      for (const [position, lesson] of section.lessons.entries()) {
        const lessonCreatedAt = addMs(createdAt, (lessonIndex + 1) * 3 * HOUR);
        const mediaId =
          lesson.type === "VIDEO"
            ? media.mediaFor(lesson.media).id
            : lesson.type === "AUDIO"
              ? media.mediaFor("devotional-audio").id
              : lesson.type === "PDF"
                ? (await media.guide(lesson.guide, owner.id, lessonCreatedAt)).id
                : null;
        const content =
          lesson.type === "TEXT"
            ? lesson.content.trim()
            : lesson.type === "VIDEO" || lesson.type === "AUDIO" || lesson.type === "PDF"
              ? (lesson.notes?.trim() ?? null)
              : null;

        const resources: Prisma.LessonResourceCreateWithoutLessonInput[] = [];
        if (lesson.type === "PDF") {
          // The study guide is also offered as a download alongside the viewer.
          resources.push({ title: `${lesson.guide.title} (PDF)`, asset: { connect: { id: mediaId! } }, position: 0, createdAt: lessonCreatedAt });
        }
        for (const resource of lesson.resources ?? []) {
          if ("url" in resource) {
            resources.push({ title: resource.title, url: resource.url, position: resources.length, createdAt: lessonCreatedAt });
          } else {
            const asset = await media.guide(resource.guide, owner.id, lessonCreatedAt);
            resources.push({ title: resource.title, asset: { connect: { id: asset.id } }, position: resources.length, createdAt: lessonCreatedAt });
          }
        }

        const row = await db.lesson.create({
          data: {
            courseId: course.id,
            sectionId: sectionRow.id,
            title: lesson.title,
            type: lesson.type,
            position,
            summary: lesson.summary,
            content,
            mediaId,
            durationSeconds: lessonDuration(lesson, media),
            isPreview: lessonIndex === 0,
            isRequired: !lesson.optional,
            createdAt: lessonCreatedAt,
            updatedAt: lessonCreatedAt,
            resources: resources.length ? { create: resources } : undefined,
            quiz:
              lesson.type === "QUIZ"
                ? {
                    create: {
                      passingScore: lesson.passingScore,
                      maxAttempts: lesson.maxAttempts ?? null,
                      createdAt: lessonCreatedAt,
                      updatedAt: lessonCreatedAt,
                      questions: {
                        create: lesson.questions.map((q, qi) => ({
                          type: q.type,
                          prompt: q.prompt,
                          explanation: q.explanation,
                          points: 1,
                          position: qi,
                          createdAt: lessonCreatedAt,
                          updatedAt: lessonCreatedAt,
                          options: { create: quizOptions(q).map((o, oi) => ({ ...o, position: oi })) },
                        })),
                      },
                    },
                  }
                : undefined,
            assignment:
              lesson.type === "ASSIGNMENT"
                ? {
                    create: {
                      instructions: lesson.instructions.trim(),
                      allowText: lesson.allowText ?? true,
                      allowFile: lesson.allowFile ?? true,
                      dueDaysAfterEnrollment: lesson.dueDaysAfterEnrollment ?? null,
                      createdAt: lessonCreatedAt,
                      updatedAt: lessonCreatedAt,
                    },
                  }
                : undefined,
          },
          select: {
            id: true,
            type: true,
            durationSeconds: true,
            isRequired: true,
            quiz: {
              select: {
                id: true,
                passingScore: true,
                questions: {
                  orderBy: { position: "asc" },
                  select: { id: true, type: true, options: { orderBy: { position: "asc" }, select: { id: true, isCorrect: true } } },
                },
              },
            },
            assignment: { select: { id: true } },
          },
        });

        lessons.push({
          id: row.id,
          title: lesson.title,
          type: row.type,
          durationSeconds: row.durationSeconds,
          isRequired: row.isRequired,
          quiz: row.quiz ?? undefined,
          assignment:
            row.assignment && lesson.type === "ASSIGNMENT" ? { id: row.assignment.id, sampleResponses: lesson.sampleResponses } : undefined,
          seed: lesson,
        });
        lessonIndex++;
      }
    }

    // The landing-page trailer is the first video lesson.
    const trailer = lessons.find((l) => l.type === "VIDEO");
    if (trailer && seed.status === "PUBLISHED") {
      await db.course.update({ where: { id: course.id }, data: { previewLessonId: trailer.id, updatedAt: updatedAt > NOW ? NOW : updatedAt } });
    }

    models.push({
      id: course.id,
      slug: seed.slug,
      title: seed.title,
      seed,
      ownerId: owner.id,
      ownerName: owner.name,
      instructorIds: team.map((t) => t.id),
      publishedAt,
      createdAt,
      certificateEnabled: seed.certificateEnabled ?? true,
      lessons,
    });
  }
  return models;
}
