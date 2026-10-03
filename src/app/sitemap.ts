import type { MetadataRoute } from "next";
import { db } from "@/server/db";
import { env } from "@/server/env";
import { getCurrentOrganization } from "@/server/organization";
import { publishedWhere } from "@/server/queries/catalog";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.APP_URL.replace(/\/$/, "");
  const org = await getCurrentOrganization();
  const published = publishedWhere(org.id);
  const [courses, categories, teachers] = await Promise.all([
    db.course.findMany({ where: published, select: { slug: true, updatedAt: true } }),
    db.category.findMany({ where: { organizationId: org.id, courses: { some: published } }, select: { slug: true } }),
    db.user.findMany({ where: { deletedAt: null, teaching: { some: { course: published } } }, select: { id: true, updatedAt: true } }),
  ]);
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/courses`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/verify`, changeFrequency: "yearly", priority: 0.3 },
    ...courses.map((c) => ({ url: `${base}/courses/${c.slug}`, lastModified: c.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...categories.map((c) => ({ url: `${base}/courses?category=${c.slug}`, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...teachers.map((t) => ({ url: `${base}/instructors/${t.id}`, lastModified: t.updatedAt, changeFrequency: "monthly" as const, priority: 0.5 })),
  ];
}
