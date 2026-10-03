import "server-only";
import { db } from "../db";

/** Real platform totals for the landing page. */
export async function getPlatformTotals(organizationId: string) {
  const [courses, lessons, learners, certificates] = await Promise.all([
    db.course.count({ where: { organizationId, status: "PUBLISHED", deletedAt: null } }),
    db.lesson.count({ where: { deletedAt: null, course: { organizationId, status: "PUBLISHED", deletedAt: null } } }),
    db.membership.count({ where: { organizationId, status: "ACTIVE" } }),
    db.certificate.count({ where: { revokedAt: null, course: { organizationId } } }),
  ]);
  return { courses, lessons, learners, certificates };
}
