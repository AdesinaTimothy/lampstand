import { beforeAll, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { createCourse, getPublishReadiness, publishCourse, updateCourseDetails } from "@/server/services/courses";
import { enrollInCourse } from "@/server/services/enrollment";
import { canManageCourse } from "@/server/authz/policies";
import type { Viewer } from "@/server/auth/viewer";
import { createMember, createOrg, createPublishedCourse, resetDatabase } from "./fixtures";

let owner: Viewer;
let otherInstructor: Viewer;
let learner: Viewer;
let admin: Viewer;
let outsider: Viewer;

beforeAll(async () => {
  await resetDatabase();
  const org = await createOrg();
  const otherOrg = await db.organization.create({ data: { name: "Other Church", slug: "other-church" } });
  owner = await createMember(org.id, "INSTRUCTOR");
  otherInstructor = await createMember(org.id, "INSTRUCTOR");
  learner = await createMember(org.id, "LEARNER");
  admin = await createMember(org.id, "ADMIN");
  outsider = await createMember(otherOrg.id, "OWNER");
});

describe("course authoring and authorization", () => {
  it("lets instructors create drafts but not learners", async () => {
    const course = await createCourse(owner, { title: "Psalms for Everyday Life", categoryId: null });
    const row = await db.course.findUniqueOrThrow({ where: { id: course.id }, include: { instructors: true, sections: true } });
    expect(row).toMatchObject({ status: "DRAFT", slug: "psalms-for-everyday-life" });
    expect(row.instructors[0]?.userId).toBe(owner.id);
    await expect(createCourse(learner, { title: "Nope", categoryId: null })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("creates unique slugs for duplicate titles", async () => {
    const a = await createCourse(owner, { title: "Prayer Basics", categoryId: null });
    const b = await createCourse(owner, { title: "Prayer Basics", categoryId: null });
    const [ra, rb] = await Promise.all([a, b].map((c) => db.course.findUniqueOrThrow({ where: { id: c.id } })));
    expect(ra!.slug).not.toBe(rb!.slug);
  });

  it("scopes management to the course's own instructors, staff, and the organization", async () => {
    const course = await createCourse(owner, { title: "Acts of the Apostles", categoryId: null });
    expect(await canManageCourse(owner, course.id)).toBe(true);
    expect(await canManageCourse(admin, course.id)).toBe(true);
    expect(await canManageCourse(otherInstructor, course.id)).toBe(false);
    expect(await canManageCourse(learner, course.id)).toBe(false);
    expect(await canManageCourse(outsider, course.id)).toBe(false);
    await expect(
      updateCourseDetails(otherInstructor, course.id, { title: "Hijacked" } as never),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("blocks publishing until the course is ready, and blocks enrolment in drafts", async () => {
    const course = await createCourse(owner, { title: "Unfinished Study", categoryId: null });
    const issues = await getPublishReadiness(course.id);
    expect(issues.filter((i) => i.level === "error").map((i) => i.message)).toEqual(
      expect.arrayContaining(["Add a course thumbnail image", "Choose a category", "Add at least one lesson"]),
    );
    await expect(publishCourse(owner, course.id)).rejects.toBeTruthy();
    await expect(enrollInCourse(learner, course.id)).rejects.toMatchObject({ code: "UNPROCESSABLE" });
  });

  it("reports a complete course as ready", async () => {
    const { course } = await createPublishedCourse(owner.organizationId, owner);
    const thumb = await db.mediaAsset.create({
      data: { organizationId: owner.organizationId, storageProvider: "local", storageKey: `t/${Date.now()}.webp`, kind: "IMAGE", visibility: "PUBLIC", mimeType: "image/webp", sizeBytes: 10, originalName: "t.webp" },
    });
    const category = await db.category.create({ data: { organizationId: owner.organizationId, name: "Bible Study", slug: "bible-study" } });
    await db.course.update({ where: { id: course.id }, data: { thumbnailId: thumb.id, categoryId: category.id } });
    const errors = (await getPublishReadiness(course.id)).filter((i) => i.level === "error");
    expect(errors).toEqual([]);
  });
});
