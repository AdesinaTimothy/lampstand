import "server-only";
import { db } from "../db";
import { mediaUrl } from "../storage/urls";
import { publishedWhere } from "./catalog";

const contains = (q: string) => ({ contains: q, mode: "insensitive" as const });

/** Fast typeahead: small, independent lookups, each capped. */
export async function getSuggestions(organizationId: string, raw: string) {
  const q = raw.trim().slice(0, 80);
  if (q.length < 2) return { courses: [], lessons: [], instructors: [], categories: [] };
  const published = publishedWhere(organizationId);
  const [courses, lessons, instructors, categories] = await Promise.all([
    db.course.findMany({
      where: { ...published, OR: [{ title: contains(q) }, { subtitle: contains(q) }, { tags: { some: { tag: { name: contains(q) } } } }] },
      orderBy: [{ enrollmentCount: "desc" }],
      take: 5,
      select: { slug: true, title: true, category: { select: { name: true } } },
    }),
    db.lesson.findMany({
      where: { deletedAt: null, title: contains(q), course: published },
      take: 4,
      orderBy: { course: { enrollmentCount: "desc" } },
      select: { id: true, title: true, course: { select: { slug: true, title: true } } },
    }),
    db.user.findMany({
      where: { deletedAt: null, name: contains(q), teaching: { some: { course: published } } },
      take: 3,
      select: { id: true, name: true },
    }),
    db.category.findMany({
      where: { organizationId, name: contains(q), courses: { some: published } },
      take: 3,
      select: { slug: true, name: true },
    }),
  ]);
  return {
    courses: courses.map((c) => ({ slug: c.slug, title: c.title, category: c.category?.name ?? null })),
    lessons: lessons.map((l) => ({ id: l.id, title: l.title, courseSlug: l.course.slug, courseTitle: l.course.title })),
    instructors,
    categories,
  };
}

/** Secondary results for the full search page (courses come from the ranked catalog search). */
export async function searchLessonsAndInstructors(organizationId: string, raw: string) {
  const q = raw.trim().slice(0, 100);
  if (!q) return { lessons: [], instructors: [] };
  const published = publishedWhere(organizationId);
  const [lessons, instructors] = await Promise.all([
    db.lesson.findMany({
      where: { deletedAt: null, OR: [{ title: contains(q) }, { summary: contains(q) }], course: published },
      take: 8,
      orderBy: { course: { enrollmentCount: "desc" } },
      select: { id: true, title: true, type: true, durationSeconds: true, isPreview: true, course: { select: { slug: true, title: true } } },
    }),
    db.user.findMany({
      where: { deletedAt: null, name: contains(q), teaching: { some: { course: published } } },
      take: 6,
      select: { id: true, name: true, headline: true, avatarId: true, _count: { select: { teaching: { where: { course: published } } } } },
    }),
  ]);
  return {
    lessons,
    instructors: instructors.map((i) => ({
      id: i.id,
      name: i.name,
      headline: i.headline,
      avatarUrl: i.avatarId ? mediaUrl(i.avatarId) : null,
      courseCount: i._count.teaching,
    })),
  };
}
