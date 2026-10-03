import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

/**
 * The full chain: an instructor builds and publishes a course, a learner
 * completes it, receives a certificate, and a stranger verifies it.
 */
test("instructor publishes a course that a learner completes and gets certified for", async ({ browser }) => {
  test.setTimeout(180_000);
  const title = `Rhythms of Prayer ${Date.now().toString(36)}`;

  // ── Instructor builds the course ────────────────────────────────────
  const instructor = await browser.newPage();
  await signIn(instructor, "samuel@graceharbor.example", undefined, "/instructor/courses/new");
  await instructor.getByLabel("Course title").fill(title);
  await instructor.getByLabel("Category").click();
  await instructor.getByRole("option", { name: "Discipleship" }).click();
  await instructor.getByRole("button", { name: "Create course" }).click();
  await expect(instructor).toHaveURL(/\/details$/);

  // Learners can't enrol in a draft.
  await expect(instructor.getByRole("button", { name: "Publish" })).toBeVisible();

  await instructor.locator(".ProseMirror").first().click();
  await instructor.keyboard.type("A short, practical course on building a daily habit of prayer, one small and sustainable step at a time.");
  await instructor.getByLabel(/Upload an image/).setInputFiles("tests/e2e/fixtures/cover.png");
  await expect(instructor.getByRole("img", { name: "Course thumbnail preview" })).toBeVisible();
  await instructor.getByLabel("What learners will learn").fill("Build a daily rhythm of prayer");
  await instructor.getByRole("button", { name: "Add" }).first().click();
  await instructor.getByRole("button", { name: "Save changes" }).click();
  await expect(instructor.getByText("All changes saved")).toBeVisible();

  await instructor.getByRole("link", { name: "Curriculum" }).click();
  await instructor.getByRole("button", { name: "Add lesson" }).click();
  await instructor.getByRole("radio", { name: /^Reading/ }).click();
  await instructor.getByRole("dialog").getByLabel("Title").fill("A Daily Rhythm");
  await instructor.getByRole("button", { name: "Add reading lesson" }).click();
  await instructor.getByRole("link", { name: "Lesson 1: A Daily Rhythm" }).click();
  await instructor.locator(".ProseMirror").first().click();
  await instructor.keyboard.type("Prayer is less about perfect words and more about showing up. Choose a time, a place and a short pattern, and begin.");
  await expect(instructor.getByRole("status").filter({ hasText: "Saved" })).toBeVisible();

  await instructor.getByRole("button", { name: "Publish" }).click();
  await expect(instructor.getByText("Everything learners need is in place.")).toBeVisible();
  await instructor.getByRole("button", { name: "Publish now" }).click();
  await expect(instructor.getByRole("button", { name: "Unpublish" })).toBeVisible();
  const previewHref = await instructor.getByRole("link", { name: "Preview" }).getAttribute("href");
  const slug = previewHref!.split("/")[2]!;
  await instructor.close();

  // ── Learner finds, enrols and completes it ─────────────────────────
  const learner = await browser.newPage();
  await signIn(learner, "priya.raman@graceharbor.example", undefined, `/courses/${slug}`);
  await expect(learner.getByRole("heading", { level: 1, name: title })).toBeVisible();
  await learner.getByRole("button", { name: /Enrol/ }).first().click();
  await expect(learner.getByRole("heading", { level: 1, name: "A Daily Rhythm" })).toBeVisible();
  await learner.getByRole("button", { name: "Mark as complete" }).first().click();

  const done = learner.getByRole("dialog", { name: "Course complete" });
  await expect(done).toBeVisible();
  await done.getByRole("link", { name: "View certificate" }).click();
  await expect(learner.getByRole("img", { name: /Certificate of completion awarded to Priya Raman/ })).toBeVisible();
  const verifyHref = await learner.getByRole("link", { name: /\/verify\/LS-/ }).getAttribute("href");
  await learner.close();

  // ── Anyone can verify it ───────────────────────────────────────────
  const visitor = await (await browser.newContext()).newPage();
  await visitor.goto(verifyHref!);
  await expect(visitor.getByRole("heading", { name: "Valid certificate" })).toBeVisible();
  await expect(visitor.getByText(title).first()).toBeVisible();
  await expect(visitor.getByText("Priya Raman").first()).toBeVisible();
});
