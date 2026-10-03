import "server-only";
import { AppError, notFound } from "@/lib/errors";
import { db } from "../db";
import { notify } from "../notifications";
import type { Viewer } from "../auth/viewer";
import { recordActivity } from "./activity";

export async function enrollInCourse(viewer: Viewer, courseId: string) {
  const course = await db.course.findFirst({
    where: { id: courseId, organizationId: viewer.organizationId, deletedAt: null },
    select: { id: true, title: true, slug: true, status: true },
  });
  if (!course) throw notFound("Course");
  if (course.status !== "PUBLISHED") throw new AppError("UNPROCESSABLE", "This course isn't open for enrolment.");

  const result = await db.$transaction(async (tx) => {
    const existing = await tx.enrollment.findUnique({
      where: { userId_courseId: { userId: viewer.id, courseId } },
    });
    if (existing && existing.status !== "DROPPED") return { enrollment: existing, isNew: false };

    const enrollment = existing
      ? await tx.enrollment.update({
          where: { id: existing.id },
          data: { status: "ACTIVE", enrolledAt: new Date() },
        })
      : await tx.enrollment.create({ data: { userId: viewer.id, courseId } });

    await tx.course.update({ where: { id: courseId }, data: { enrollmentCount: { increment: 1 } } });
    await recordActivity(tx, {
      userId: viewer.id,
      organizationId: viewer.organizationId,
      type: "ENROLLED",
      courseId,
    });
    return { enrollment, isNew: true };
  });

  if (result.isNew) {
    await notify(viewer.id, {
      type: "ENROLLED",
      title: `You're enrolled in ${course.title}`,
      body: "Your progress is saved automatically, so you can learn at your own pace.",
      href: `/learn/${course.slug}`,
    }).catch((e) => console.error("[enrollment] notify failed", e));
  }
  return result.enrollment;
}

/** Leaves a course. Progress is kept so re-enrolling resumes where the learner left off. */
export async function leaveCourse(viewer: Viewer, courseId: string) {
  await db.$transaction(async (tx) => {
    const enrollment = await tx.enrollment.findUnique({
      where: { userId_courseId: { userId: viewer.id, courseId } },
    });
    if (!enrollment || enrollment.status === "DROPPED") throw notFound("Enrolment");
    if (enrollment.status === "COMPLETED") {
      throw new AppError("UNPROCESSABLE", "Completed courses stay on your record.");
    }
    await tx.enrollment.update({ where: { id: enrollment.id }, data: { status: "DROPPED" } });
    await tx.course.update({ where: { id: courseId }, data: { enrollmentCount: { decrement: 1 } } });
  });
}
