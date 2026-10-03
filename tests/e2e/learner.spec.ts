import { expect, test } from "@playwright/test";
import { latestEmailLink, uniqueEmail } from "./helpers";

test.describe("Learner journey", () => {
  test("register, verify, find a course, enrol, learn, bookmark and resume", async ({ page }) => {
    const email = uniqueEmail("learner");

    // Register
    await page.goto("/register");
    await page.getByLabel("Full name").fill("Naomi Brooks");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("a-quiet-morning-walk");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/verify-email/);
    await expect(page.getByText(email)).toBeVisible();

    // Verify via the emailed link (a POST confirm button, so link scanners can't consume it)
    await page.goto(await latestEmailLink(email, "/verify-email"));
    await page.getByRole("button", { name: "Confirm my email" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: /Naomi/ })).toBeVisible();
    await expect(page.getByText("Start your first course")).toBeVisible();

    // Discover through search
    const search = page.getByRole("combobox", { name: /search/i }).first();
    await search.fill("prayer");
    await search.press("Enter");
    await expect(page).toHaveURL(/\/search\?q=prayer/);
    await page.getByRole("link", { name: "Prayer That Shapes Us" }).first().click();
    await expect(page.getByRole("heading", { level: 1, name: "Prayer That Shapes Us" })).toBeVisible();

    // Enrol → straight into the player
    await page.getByRole("button", { name: /Enrol/ }).first().click();
    await expect(page).toHaveURL(/\/learn\/prayer-that-shapes-us\//);
    const contents = page.getByRole("navigation", { name: "Course contents" });
    await expect(contents).toBeVisible();

    // Opening a lesson doesn't complete it; finishing the reading does.
    await contents.getByRole("link", { name: /The Lord's Prayer as a Pattern/ }).click();
    await expect(page.getByRole("heading", { level: 1, name: "The Lord's Prayer as a Pattern" })).toBeVisible();
    await expect(page.getByRole("progressbar", { name: /Course progress 0%/ })).toBeVisible();
    await page.getByRole("button", { name: "Mark as complete" }).first().click();
    await expect(page.getByText("Lesson complete")).toBeVisible();
    await expect(page.getByText("Completed", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("progressbar", { name: /Course progress [1-9]\d?%/ })).toBeVisible();

    // Private notes
    await page.getByRole("tab", { name: "Notes" }).click();
    await page.getByLabel(/Add a private note/).fill("Pray the pattern slowly tomorrow morning.");
    await page.getByRole("button", { name: "Save note" }).click();
    await expect(page.getByText("Pray the pattern slowly tomorrow morning.")).toBeVisible();

    // Bookmark and find it again
    await page.getByRole("button", { name: "Bookmark this lesson" }).click();
    await expect(page.getByRole("button", { name: "Remove bookmark" })).toBeVisible();
    await page.goto("/bookmarks");
    await expect(page.getByRole("link", { name: /The Lord's Prayer as a Pattern/ })).toBeVisible();

    // Progress survives a fresh visit: the dashboard offers to pick up where they left off.
    await page.goto("/dashboard");
    await expect(page.getByText("Continue learning")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Prayer That Shapes Us" })).toBeVisible();
    await page.getByRole("link", { name: "Resume" }).click();
    await expect(page).toHaveURL(/\/learn\/prayer-that-shapes-us\//);
    // The reading was finished, so resuming moves on to the next lesson.
    await expect(page.getByRole("heading", { level: 1, name: "Guided Prayer: Be Still" })).toBeVisible();
  });

  test("protected pages send signed-out visitors to sign in and back", async ({ page }) => {
    await page.goto("/my-courses");
    await expect(page).toHaveURL(/\/login\?next=%2Fmy-courses/);
  });
});
