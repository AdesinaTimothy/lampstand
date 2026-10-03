import "server-only";
import { Prisma, type CourseLevel } from "@prisma/client";
import { db } from "../db";
import { mediaUrl } from "../storage/urls";

export type CourseCardData = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  thumbnailUrl: string | null;
  level: CourseLevel;
  category: { name: string; slug: string } | null;
  instructors: string[];
  lessonCount: number;
  durationSeconds: number;
  enrollmentCount: number;
  ratingAverage: number;
  ratingCount: number;
  featured: boolean;
  publishedAt: Date | null;
  enrollment: { status: "ACTIVE" | "COMPLETED"; progressPercent: number } | null;
};

export const cardSelect = {
  id: true,
  slug: true,
  title: true,
  subtitle: true,
  thumbnailId: true,
  level: true,
  featured: true,
  publishedAt: true,
  enrollmentCount: true,
  ratingAverage: true,
  ratingCount: true,
  estimatedMinutes: true,
  category: { select: { name: true, slug: true } },
  instructors: { orderBy: { position: "asc" }, select: { user: { select: { name: true } } } },
} satisfies Prisma.CourseSelect;

type CardRow = Prisma.CourseGetPayload<{ select: typeof cardSelect }>;

/** Hydrates course rows into cards with lesson stats and the viewer's enrolment. */
export async function toCourseCards(rows: CardRow[], viewerId?: string | null): Promise<CourseCardData[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const [stats, enrollments] = await Promise.all([
    db.lesson.groupBy({
      by: ["courseId"],
      where: { courseId: { in: ids }, deletedAt: null },
      _count: { _all: true },
      _sum: { durationSeconds: true },
    }),
    viewerId
      ? db.enrollment.findMany({
          where: { userId: viewerId, courseId: { in: ids }, status: { not: "DROPPED" } },
          select: { courseId: true, status: true, progressPercent: true },
        })
      : Promise.resolve([]),
  ]);
  const statMap = new Map(stats.map((s) => [s.courseId, s]));
  const enrollmentMap = new Map(enrollments.map((e) => [e.courseId, e]));
  return rows.map((r) => {
    const s = statMap.get(r.id);
    const e = enrollmentMap.get(r.id);
    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      subtitle: r.subtitle,
      thumbnailUrl: r.thumbnailId ? mediaUrl(r.thumbnailId) : null,
      level: r.level,
      category: r.category,
      instructors: r.instructors.map((i) => i.user.name),
      lessonCount: s?._count._all ?? 0,
      durationSeconds: r.estimatedMinutes ? r.estimatedMinutes * 60 : (s?._sum.durationSeconds ?? 0),
      enrollmentCount: r.enrollmentCount,
      ratingAverage: r.ratingAverage,
      ratingCount: r.ratingCount,
      featured: r.featured,
      publishedAt: r.publishedAt,
      enrollment: e ? { status: e.status as "ACTIVE" | "COMPLETED", progressPercent: e.status === "COMPLETED" ? 100 : e.progressPercent } : null,
    };
  });
}

export const publishedWhere = (organizationId: string): Prisma.CourseWhereInput => ({
  organizationId,
  status: "PUBLISHED",
  deletedAt: null,
});

export const CATALOG_SORTS = ["popular", "newest", "rating", "title"] as const;
export type CatalogSort = (typeof CATALOG_SORTS)[number] | "relevance";
export const DURATION_BUCKETS = { short: [0, 3600], medium: [3600, 4 * 3600], long: [4 * 3600, Infinity] } as const;
export type DurationBucket = keyof typeof DURATION_BUCKETS;

export type CatalogParams = {
  organizationId: string;
  viewerId?: string | null;
  q?: string;
  category?: string;
  level?: CourseLevel;
  duration?: DurationBucket;
  sort?: CatalogSort;
  page?: number;
  pageSize?: number;
};

function escapeLike(q: string) {
  return q.replace(/[\\%_]/g, (m) => `\\${m}`);
}

/**
 * Ranked full-text course search across title, subtitle, description, lessons,
 * tags, category and instructor names. Returns ids in relevance order.
 */
export async function searchCourseIds(organizationId: string, q: string): Promise<string[]> {
  const term = q.trim().slice(0, 100);
  if (!term) return [];
  const like = `%${escapeLike(term)}%`;
  const rows = await db.$queryRaw<{ id: string }[]>`
    WITH query AS (SELECT websearch_to_tsquery('english', ${term}) AS tsq)
    SELECT c."id",
      ts_rank(
        setweight(to_tsvector('english', coalesce(c."title", '')), 'A') ||
        setweight(to_tsvector('english', coalesce(c."subtitle", '')), 'B') ||
        setweight(to_tsvector('english', coalesce(c."description", '')), 'C'),
        query.tsq
      ) * 2 + similarity(c."title", ${term}) + (CASE WHEN c."title" ILIKE ${like} THEN 0.5 ELSE 0 END) AS score
    FROM "Course" c, query
    WHERE c."organizationId" = ${organizationId}
      AND c."status" = 'PUBLISHED' AND c."deletedAt" IS NULL
      AND (
        (setweight(to_tsvector('english', coalesce(c."title", '')), 'A') ||
         setweight(to_tsvector('english', coalesce(c."subtitle", '')), 'B') ||
         setweight(to_tsvector('english', coalesce(c."description", '')), 'C')) @@ query.tsq
        OR c."title" ILIKE ${like}
        OR c."title" % ${term}
        OR EXISTS (SELECT 1 FROM "Lesson" l WHERE l."courseId" = c."id" AND l."deletedAt" IS NULL AND (l."title" ILIKE ${like} OR to_tsvector('english', l."title") @@ query.tsq))
        OR EXISTS (SELECT 1 FROM "CourseTag" ct JOIN "Tag" t ON t."id" = ct."tagId" WHERE ct."courseId" = c."id" AND t."name" ILIKE ${like})
        OR EXISTS (SELECT 1 FROM "Category" k WHERE k."id" = c."categoryId" AND k."name" ILIKE ${like})
        OR EXISTS (SELECT 1 FROM "CourseInstructor" ci JOIN "User" u ON u."id" = ci."userId" WHERE ci."courseId" = c."id" AND u."name" ILIKE ${like})
      )
    ORDER BY score DESC, c."enrollmentCount" DESC
    LIMIT 200`;
  return rows.map((r) => r.id);
}

export async function listCatalog(params: CatalogParams) {
  const pageSize = params.pageSize ?? 12;
  const page = Math.max(1, params.page ?? 1);
  const where: Prisma.CourseWhereInput = {
    ...publishedWhere(params.organizationId),
    ...(params.category ? { category: { slug: params.category } } : {}),
    ...(params.level ? { level: params.level } : {}),
  };

  let rankedIds: string[] | null = null;
  if (params.q?.trim()) {
    rankedIds = await searchCourseIds(params.organizationId, params.q);
    where.id = { in: rankedIds };
  }

  const orderBy = orderFor(params.sort, Boolean(rankedIds));

  // Common case: paginate in the database.
  if (!params.duration && !rankedIds) {
    const [total, rows] = await Promise.all([
      db.course.count({ where }),
      db.course.findMany({ where, select: cardSelect, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
    ]);
    return { items: await toCourseCards(rows, params.viewerId), total, page, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
  }

  // Search results (≤200 ranked ids) and duration buckets (derived from lesson
  // aggregates) are filtered/ordered in memory over a bounded set.
  const rows = await db.course.findMany({ where, select: cardSelect, orderBy, take: 500 });
  let cards = await toCourseCards(rows, params.viewerId);
  if (params.duration) {
    const [min, max] = DURATION_BUCKETS[params.duration];
    cards = cards.filter((c) => c.durationSeconds >= min && c.durationSeconds < max);
  }
  if (rankedIds && (!params.sort || params.sort === "relevance")) {
    const rank = new Map(rankedIds.map((id, i) => [id, i]));
    cards.sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
  }
  const total = cards.length;
  return {
    items: cards.slice((page - 1) * pageSize, page * pageSize),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

function orderFor(sort: CatalogSort | undefined, hasQuery: boolean): Prisma.CourseOrderByWithRelationInput[] {
  switch (sort ?? (hasQuery ? "relevance" : "popular")) {
    case "newest":
      return [{ publishedAt: "desc" }];
    case "rating":
      return [{ ratingAverage: "desc" }, { ratingCount: "desc" }];
    case "title":
      return [{ title: "asc" }];
    case "relevance":
    case "popular":
    default:
      return [{ featured: "desc" }, { enrollmentCount: "desc" }, { publishedAt: "desc" }];
  }
}

export async function getFeaturedCourses(organizationId: string, viewerId?: string | null, take = 3) {
  const rows = await db.course.findMany({
    where: { ...publishedWhere(organizationId), featured: true },
    select: cardSelect,
    orderBy: [{ publishedAt: "desc" }],
    take,
  });
  return toCourseCards(rows, viewerId);
}

export async function getPopularCourses(organizationId: string, viewerId?: string | null, take = 8) {
  const rows = await db.course.findMany({
    where: publishedWhere(organizationId),
    select: cardSelect,
    orderBy: [{ enrollmentCount: "desc" }, { ratingAverage: "desc" }],
    take,
  });
  return toCourseCards(rows, viewerId);
}

export async function getRecentCourses(organizationId: string, viewerId?: string | null, take = 8) {
  const rows = await db.course.findMany({
    where: publishedWhere(organizationId),
    select: cardSelect,
    orderBy: [{ publishedAt: "desc" }],
    take,
  });
  return toCourseCards(rows, viewerId);
}

/**
 * Recommendations: courses in the categories a learner already engages with,
 * excluding ones they've taken; falls back to popular courses.
 */
export async function getRecommendedCourses(organizationId: string, viewerId: string, take = 4, excludeIds: string[] = []) {
  const mine = await db.enrollment.findMany({
    where: { userId: viewerId },
    select: { courseId: true, course: { select: { categoryId: true } } },
  });
  const taken = new Set([...mine.map((m) => m.courseId), ...excludeIds]);
  const categoryIds = [...new Set(mine.map((m) => m.course.categoryId).filter((c): c is string => Boolean(c)))];
  const rows = await db.course.findMany({
    where: { ...publishedWhere(organizationId), id: { notIn: [...taken] }, ...(categoryIds.length ? { categoryId: { in: categoryIds } } : {}) },
    select: cardSelect,
    orderBy: [{ ratingAverage: "desc" }, { enrollmentCount: "desc" }],
    take,
  });
  if (rows.length < take) {
    const more = await db.course.findMany({
      where: { ...publishedWhere(organizationId), id: { notIn: [...taken, ...rows.map((r) => r.id)] } },
      select: cardSelect,
      orderBy: [{ enrollmentCount: "desc" }],
      take: take - rows.length,
    });
    rows.push(...more);
  }
  return toCourseCards(rows, viewerId);
}

export async function getCategoriesWithCounts(organizationId: string) {
  const categories = await db.category.findMany({
    where: { organizationId },
    orderBy: { position: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      icon: true,
      _count: { select: { courses: { where: { status: "PUBLISHED", deletedAt: null } } } },
    },
  });
  return categories.map((c) => ({ ...c, courseCount: c._count.courses }));
}
