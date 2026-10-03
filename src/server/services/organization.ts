import "server-only";
import { z } from "zod";
import { AppError, notFound } from "@/lib/errors";
import { isCategoryIcon } from "@/lib/category-icons";
import { slugify } from "@/lib/utils";
import type { announcementSchema, categorySchema, organizationSettingsSchema, profileSchema } from "@/lib/validation/admin";
import { db } from "../db";
import { audit } from "../audit";
import { notifyMany } from "../notifications";
import { sendEmail } from "../mail";
import { emailTemplates } from "../mail/templates";
import { env } from "../env";
import type { Viewer } from "../auth/viewer";
import { assertCan } from "../authz/policies";

export async function updateOrganizationSettings(viewer: Viewer, input: z.output<typeof organizationSettingsSchema>) {
  assertCan(viewer, "organization:manage");
  if (input.logoId) {
    const logo = await db.mediaAsset.findFirst({
      where: { id: input.logoId, organizationId: viewer.organizationId, kind: "IMAGE" },
      select: { id: true },
    });
    if (!logo) throw new AppError("VALIDATION", "Upload the logo again.");
  }
  try {
    Intl.DateTimeFormat("en-US", { timeZone: input.timezone });
  } catch {
    throw new AppError("VALIDATION", "Choose a valid timezone.", { timezone: ["Unknown timezone"] });
  }
  await db.$transaction(async (tx) => {
    await tx.organization.update({
      where: { id: viewer.organizationId },
      data: {
        name: input.name,
        tagline: input.tagline || null,
        description: input.description || null,
        website: input.website || null,
        email: input.email || null,
        logoId: input.logoId ?? null,
        allowSelfRegistration: input.allowSelfRegistration,
        requireEmailVerification: input.requireEmailVerification,
        certificateSignatoryName: input.certificateSignatoryName || null,
        certificateSignatoryTitle: input.certificateSignatoryTitle || null,
        timezone: input.timezone,
      },
    });
    await audit(viewer, "organization.settings_updated", { type: "Organization", id: viewer.organizationId }, undefined, tx);
  });
}

export async function createCategory(viewer: Viewer, input: z.output<typeof categorySchema>) {
  assertCan(viewer, "category:manage");
  const slug = slugify(input.name);
  const clash = await db.category.findUnique({
    where: { organizationId_slug: { organizationId: viewer.organizationId, slug } },
    select: { id: true },
  });
  if (clash) throw new AppError("CONFLICT", "A category with that name already exists.", { name: ["Already exists"] });
  const last = await db.category.aggregate({ where: { organizationId: viewer.organizationId }, _max: { position: true } });
  const category = await db.category.create({
    data: {
      organizationId: viewer.organizationId,
      name: input.name,
      slug,
      description: input.description || null,
      icon: isCategoryIcon(input.icon) ? input.icon : "book-open",
      position: (last._max.position ?? -1) + 1,
    },
  });
  await audit(viewer, "category.created", { type: "Category", id: category.id }, { name: input.name });
  return category;
}

export async function updateCategory(viewer: Viewer, categoryId: string, input: z.output<typeof categorySchema>) {
  assertCan(viewer, "category:manage");
  const category = await db.category.findFirst({ where: { id: categoryId, organizationId: viewer.organizationId } });
  if (!category) throw notFound("Category");
  const slug = slugify(input.name);
  if (slug !== category.slug) {
    const clash = await db.category.findUnique({
      where: { organizationId_slug: { organizationId: viewer.organizationId, slug } },
      select: { id: true },
    });
    if (clash) throw new AppError("CONFLICT", "A category with that name already exists.", { name: ["Already exists"] });
  }
  await db.category.update({
    where: { id: categoryId },
    data: { name: input.name, slug, description: input.description || null, icon: isCategoryIcon(input.icon) ? input.icon : "book-open" },
  });
  await audit(viewer, "category.updated", { type: "Category", id: categoryId }, { name: input.name });
}

export async function deleteCategory(viewer: Viewer, categoryId: string) {
  assertCan(viewer, "category:manage");
  const category = await db.category.findFirst({
    where: { id: categoryId, organizationId: viewer.organizationId },
    select: { name: true, _count: { select: { courses: { where: { deletedAt: null } } } } },
  });
  if (!category) throw notFound("Category");
  if (category._count.courses > 0) {
    throw new AppError("UNPROCESSABLE", `Move the ${category._count.courses} course(s) in this category first.`);
  }
  await db.category.delete({ where: { id: categoryId } });
  await audit(viewer, "category.deleted", { type: "Category", id: categoryId }, { name: category.name });
}

export async function sendAnnouncement(viewer: Viewer, input: z.output<typeof announcementSchema>) {
  assertCan(viewer, "announcement:send");
  const announcement = await db.announcement.create({
    data: { organizationId: viewer.organizationId, authorId: viewer.id, title: input.title, body: input.body },
  });
  const members = await db.membership.findMany({
    where: { organizationId: viewer.organizationId, status: "ACTIVE", user: { deletedAt: null } },
    select: { userId: true, user: { select: { email: true, emailNotifications: true } } },
  });
  const count = await notifyMany(
    members.map((m) => m.userId),
    { type: "ANNOUNCEMENT", title: input.title, body: input.body, href: "/notifications" },
  );
  if (input.sendEmail) {
    const org = await db.organization.findUniqueOrThrow({ where: { id: viewer.organizationId }, select: { name: true } });
    const content = emailTemplates.notification({
      org: org.name,
      title: input.title,
      body: input.body,
      url: new URL("/dashboard", env.APP_URL).toString(),
      cta: "Open Lampstand",
    });
    // Recorded in the outbox; a production deployment should hand these to a queue.
    for (const m of members.filter((m) => m.user.emailNotifications)) {
      await sendEmail(m.user.email, "announcement", content);
    }
  }
  await audit(viewer, "announcement.sent", { type: "Announcement", id: announcement.id }, { recipients: count, email: input.sendEmail });
  return { recipients: count };
}

export async function updateProfile(viewer: Viewer, input: z.output<typeof profileSchema>) {
  if (input.avatarId) {
    const avatar = await db.mediaAsset.findFirst({
      where: { id: input.avatarId, uploadedById: viewer.id, kind: "IMAGE" },
      select: { id: true },
    });
    if (!avatar) throw new AppError("VALIDATION", "Upload your photo again.");
  }
  await db.user.update({
    where: { id: viewer.id },
    data: {
      name: input.name,
      headline: input.headline || null,
      bio: input.bio || null,
      avatarId: input.avatarId ?? null,
      profileVisibility: input.profileVisibility,
      emailNotifications: input.emailNotifications,
    },
  });
}
