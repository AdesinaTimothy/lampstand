import { expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

export const DEMO_PASSWORD = "Lampstand2026!";

let prisma: PrismaClient | null = null;
/** Direct database access for things a person would get by email (verification links). */
export function db() {
  prisma ??= new PrismaClient();
  return prisma;
}

export async function signIn(page: Page, email: string, password = DEMO_PASSWORD, next?: string) {
  await page.goto(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

export async function latestEmailLink(to: string, path: string) {
  await expect
    .poll(async () => (await db().outboundEmail.findFirst({ where: { to }, orderBy: { createdAt: "desc" } }))?.text ?? "", { timeout: 15_000 })
    .toContain(path);
  const mail = await db().outboundEmail.findFirstOrThrow({ where: { to }, orderBy: { createdAt: "desc" } });
  const match = mail.text.match(new RegExp(`https?://[^\\s]+${path}\\?token=[A-Za-z0-9_-]+`));
  if (!match) throw new Error(`No ${path} link found`);
  return new URL(match[0]).pathname + new URL(match[0]).search;
}

export function uniqueEmail(prefix: string) {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 1e4)}@e2e.example`;
}
