import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

test.describe("Admin journey", () => {
  test("an administrator sees live metrics, finds a member and reviews the audit log", async ({ page }) => {
    await signIn(page, "ruth@graceharbor.example", undefined, "/admin");
    await expect(page).toHaveURL(/\/admin$/);
    for (const title of ["Learner growth", "Weekly active learners", "Enrolments vs completions", "Popular courses"]) {
      await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
    }

    await page.goto("/admin/learners");
    await expect(page.getByRole("heading", { level: 1, name: "People" })).toBeVisible();
    await page.getByLabel("Search people").fill("John Carter");
    await page.getByLabel("Search people").press("Enter");
    await expect(page).toHaveURL(/q=John/);
    await page.getByRole("link", { name: "John Carter" }).first().click();
    await expect(page.getByRole("heading", { level: 1, name: "John Carter" })).toBeVisible();
    await expect(page.getByText("Foundations of Faith").first()).toBeVisible();

    await page.goto("/admin/audit-log");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("organization settings are reserved for owners", async ({ page }) => {
    await signIn(page, "ruth@graceharbor.example");
    await page.goto("/admin/settings");
    await expect(page).toHaveURL(/\/forbidden/);
  });

  test("learners and instructors can't open the admin console", async ({ page }) => {
    await signIn(page, "sarah.mitchell@graceharbor.example");
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/forbidden/);
    await page.goto("/instructor");
    await expect(page).toHaveURL(/\/forbidden/);
  });
});
