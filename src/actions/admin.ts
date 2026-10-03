"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/errors";
import {
  announcementSchema,
  categorySchema,
  changeRoleSchema,
  courseFeaturedSchema,
  courseInstructorsSchema,
  courseStatusActionSchema,
  inviteInstructorSchema,
  organizationSettingsSchema,
  revokeCertificateSchema,
  reviewVisibilitySchema,
  setStatusSchema,
} from "@/lib/validation/admin";
import { parse, runAction } from "@/server/action";
import { requireViewer } from "@/server/auth/guards";
import { enforceRateLimit } from "@/server/rate-limit";
import * as members from "@/server/services/members";
import * as organization from "@/server/services/organization";
import * as courses from "@/server/services/courses";
import { revokeCertificate } from "@/server/services/certificates";
import { setReviewHidden } from "@/server/services/engagement";
import { listCourseReviews, type AdminReview } from "@/server/queries/admin";

/*
 * Administration actions. Thin by design: parse → call the service (which
 * authorizes and audits) → revalidate the pages that show the changed data.
 */

const idSchema = z.string().min(1).max(40);

function revalidatePeople(userId?: string) {
  revalidatePath("/admin/learners");
  revalidatePath("/admin/instructors");
  if (userId) {
    revalidatePath(`/admin/learners/${userId}`);
    revalidatePath(`/admin/instructors/${userId}`);
  }
  revalidatePath("/admin/audit-log");
}

function revalidateCourses() {
  revalidatePath("/admin/courses");
  revalidatePath("/admin");
  revalidatePath("/admin/audit-log");
  // Featured flags and statuses change the public catalogue.
  revalidatePath("/", "layout");
}

// ───────────────────────────── People ─────────────────────────────

export async function changeMemberRoleAction(input: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const viewer = await requireViewer();
    const data = parse(changeRoleSchema, input);
    await members.changeMemberRole(viewer, data.userId, data.role);
    revalidatePeople(data.userId);
  }, "Role updated. They'll be asked to sign in again.");
}

export async function setMemberStatusAction(input: unknown): Promise<ActionResult<{ message: string }>> {
  return runAction(async () => {
    const viewer = await requireViewer();
    const data = parse(setStatusSchema, input);
    await members.setMemberStatus(viewer, data.userId, data.status);
    revalidatePeople(data.userId);
    return {
      message: data.status === "SUSPENDED" ? "Account suspended and signed out everywhere." : "Account reactivated.",
    };
  });
}

export async function inviteInstructorAction(input: unknown): Promise<ActionResult<{ userId: string; invited: boolean }>> {
  return runAction(async () => {
    const viewer = await requireViewer();
    const data = parse(inviteInstructorSchema, input);
    await enforceRateLimit(`invite:${viewer.id}`, 30, 60 * 60, "You've sent a lot of invitations. Please try again later.");
    const result = await members.inviteInstructor(viewer, data);
    revalidatePeople(result.userId);
    return result;
  });
}

// ───────────────────────────── Courses ─────────────────────────────

export async function setCourseInstructorsAction(input: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const viewer = await requireViewer();
    const data = parse(courseInstructorsSchema, input);
    await courses.setCourseInstructors(viewer, data.courseId, data.instructorIds);
    revalidateCourses();
    revalidatePath("/admin/instructors");
  }, "Instructors updated.");
}

export async function setCourseFeaturedAction(input: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const viewer = await requireViewer();
    const data = parse(courseFeaturedSchema, input);
    await courses.setCourseFeatured(viewer, data.courseId, data.featured);
    revalidateCourses();
  });
}

const STATUS_MESSAGES = {
  publish: "Course published. It's now visible in the catalogue.",
  unpublish: "Course unpublished. It's back in draft.",
  archive: "Course archived.",
} as const;

export async function changeCourseStatusAction(input: unknown): Promise<ActionResult<{ message: string }>> {
  return runAction(async () => {
    const viewer = await requireViewer();
    const data = parse(courseStatusActionSchema, input);
    if (data.action === "publish") await courses.publishCourse(viewer, data.courseId);
    else if (data.action === "unpublish") await courses.unpublishCourse(viewer, data.courseId);
    else await courses.archiveCourse(viewer, data.courseId);
    revalidateCourses();
    return { message: STATUS_MESSAGES[data.action] };
  });
}

export async function listCourseReviewsAction(courseId: unknown): Promise<ActionResult<{ courseTitle: string; reviews: AdminReview[] }>> {
  return runAction(async () => {
    const viewer = await requireViewer();
    return listCourseReviews(viewer, parse(idSchema, courseId));
  });
}

export async function setReviewHiddenAction(input: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const viewer = await requireViewer();
    const data = parse(reviewVisibilitySchema, input);
    await setReviewHidden(viewer, data.reviewId, data.hidden);
    revalidateCourses();
  }, "Review visibility updated.");
}

// ───────────────────────────── Categories ─────────────────────────────

export async function createCategoryAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const viewer = await requireViewer();
    const category = await organization.createCategory(viewer, parse(categorySchema, input));
    revalidatePath("/admin/categories");
    revalidatePath("/", "layout");
    return { id: category.id };
  }, "Category created.");
}

export async function updateCategoryAction(categoryId: unknown, input: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const viewer = await requireViewer();
    await organization.updateCategory(viewer, parse(idSchema, categoryId), parse(categorySchema, input));
    revalidatePath("/admin/categories");
    revalidatePath("/", "layout");
  }, "Category saved.");
}

export async function deleteCategoryAction(categoryId: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const viewer = await requireViewer();
    await organization.deleteCategory(viewer, parse(idSchema, categoryId));
    revalidatePath("/admin/categories");
    revalidatePath("/", "layout");
  }, "Category deleted.");
}

// ───────────────────────────── Organization ─────────────────────────────

export async function sendAnnouncementAction(input: unknown): Promise<ActionResult<{ recipients: number }>> {
  return runAction(async () => {
    const viewer = await requireViewer();
    const data = parse(announcementSchema, input);
    await enforceRateLimit(`announce:${viewer.id}`, 10, 60 * 60, "You've sent several announcements recently. Please wait a little.");
    const result = await organization.sendAnnouncement(viewer, data);
    revalidatePath("/admin/announcements");
    revalidatePath("/notifications");
    return result;
  });
}

export async function updateOrganizationSettingsAction(input: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const viewer = await requireViewer();
    await organization.updateOrganizationSettings(viewer, parse(organizationSettingsSchema, input));
    // Name, logo and tagline appear in every shell.
    revalidatePath("/", "layout");
  }, "Settings saved.");
}

export async function revokeCertificateAction(input: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const viewer = await requireViewer();
    const data = parse(revokeCertificateSchema, input);
    await revokeCertificate(viewer, data.certificateId, data.reason);
    revalidatePath("/admin/certificates");
    revalidatePath("/certificates");
  }, "Certificate revoked. Verification now shows it as revoked.");
}
