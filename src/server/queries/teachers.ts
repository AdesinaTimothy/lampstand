import "server-only";
import { cache } from "react";
import { db } from "../db";
import { mediaUrl } from "../storage/urls";
import { cardSelect, publishedWhere, toCourseCards } from "./catalog";

/** Public teacher page: anyone who teaches at least one published course. */
export const getTeacher = cache(async (organizationId: string, userId: string, viewerId?: string | null) => {
  const published = publishedWhere(organizationId);
  const user = await db.user.findFirst({
    where: { id: userId, deletedAt: null, status: "ACTIVE", teaching: { some: { course: published } } },
    select: { id: true, name: true, headline: true, bio: true, avatarId: true },
  });
  if (!user) return null;
  const rows = await db.course.findMany({
    where: { ...published, instructors: { some: { userId } } },
    select: cardSelect,
    orderBy: [{ enrollmentCount: "desc" }],
  });
  const courses = await toCourseCards(rows, viewerId);
  const learners = courses.reduce((n, c) => n + c.enrollmentCount, 0);
  const rated = courses.filter((c) => c.ratingCount > 0);
  const ratingCount = rated.reduce((n, c) => n + c.ratingCount, 0);
  const rating = ratingCount ? rated.reduce((n, c) => n + c.ratingAverage * c.ratingCount, 0) / ratingCount : 0;
  return { ...user, avatarUrl: user.avatarId ? mediaUrl(user.avatarId) : null, courses, learners, rating, ratingCount };
});
