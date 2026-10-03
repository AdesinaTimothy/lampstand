import { expect, test } from "@playwright/test";
import { db, signIn } from "./helpers";

test.describe("Certificate verification", () => {
  test("anyone can verify a certificate without seeing private details @mobile", async ({ page }) => {
    const cert = await db().certificate.findFirstOrThrow({
      where: { revokedAt: null, user: { email: "john@graceharbor.example" } },
      include: { user: { select: { email: true } } },
    });

    await page.goto("/verify");
    await page.getByLabel("Certificate ID").fill(cert.code.toLowerCase().replace(/-/g, " "));
    await page.getByRole("button", { name: "Verify" }).click();
    await expect(page).toHaveURL(new RegExp(`/verify/`));
    await expect(page.getByRole("heading", { name: "Valid certificate" })).toBeVisible();
    await expect(page.getByText(cert.recipientName).first()).toBeVisible();
    await expect(page.getByText(cert.courseTitle).first()).toBeVisible();
    await expect(page.locator("body")).not.toContainText(cert.user.email);

    await page.goto("/verify/LS-0000-0000-00");
    await expect(page.getByRole("heading", { name: "No certificate found" })).toBeVisible();
  });

  test("the recipient can view and download their certificate as a PDF", async ({ page }) => {
    await signIn(page, "john@graceharbor.example", undefined, "/certificates");
    await page.getByRole("link", { name: /Foundations of Faith/ }).first().click();
    await expect(page.getByRole("img", { name: /Certificate of completion awarded to John Carter/ })).toBeVisible();
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("link", { name: "Download PDF" }).click()]);
    expect(download.suggestedFilename()).toMatch(/^certificate-.*\.pdf$/);
    const path = await download.path();
    const { readFile } = await import("node:fs/promises");
    expect((await readFile(path!)).subarray(0, 5).toString()).toBe("%PDF-");
  });

  test("certificates are private to their owner", async ({ page }) => {
    const cert = await db().certificate.findFirstOrThrow({ where: { user: { email: "john@graceharbor.example" } } });
    await signIn(page, "sarah.mitchell@graceharbor.example");
    const res = await page.goto(`/certificates/${cert.id}`);
    expect(res?.status()).toBe(404);
    const pdf = await page.request.get(`/certificates/${cert.id}/pdf`);
    expect(pdf.status()).toBe(404);
  });
});
