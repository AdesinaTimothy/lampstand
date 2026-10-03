import { beforeAll, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { authenticate, registerUser, requestPasswordReset, resetPassword, verifyEmail } from "@/server/services/auth";
import { AppError } from "@/lib/errors";
import { createOrg, resetDatabase } from "./fixtures";

type Org = Awaited<ReturnType<typeof createOrg>>;
let org: Org;

async function latestToken(to: string, path: string) {
  const mail = await db.outboundEmail.findFirst({ where: { to }, orderBy: { createdAt: "desc" } });
  const match = mail?.text.match(new RegExp(`${path}\\?token=([A-Za-z0-9_-]+)`));
  if (!match) throw new Error(`No ${path} link in email to ${to}`);
  return match[1]!;
}

beforeAll(async () => {
  await resetDatabase();
  org = await createOrg();
});

describe("registration and sign-in", () => {
  it("registers a learner, never stores the plain password, and requires verification", async () => {
    const user = await registerUser({ name: "Hannah Lee", email: "hannah@test.example", password: "a-long-passphrase-1" }, org);
    const row = await db.user.findUniqueOrThrow({ where: { id: user.id }, include: { memberships: true } });
    expect(row.passwordHash).toMatch(/^\$argon2id\$/);
    expect(row.memberships[0]?.role).toBe("LEARNER");
    expect(row.emailVerifiedAt).toBeNull();
    await expect(authenticate("hannah@test.example", "a-long-passphrase-1", org)).resolves.toMatchObject({ status: "unverified" });
  });

  it("verifies email with a single-use token", async () => {
    const token = await latestToken("hannah@test.example", "/verify-email");
    const stored = await db.verificationToken.findFirstOrThrow({ where: { type: "EMAIL_VERIFICATION" } });
    expect(stored.tokenHash).not.toBe(token); // only a hash is stored
    await verifyEmail(token);
    await expect(authenticate("hannah@test.example", "a-long-passphrase-1", org)).resolves.toMatchObject({ status: "ok" });
    await expect(verifyEmail(token)).rejects.toBeInstanceOf(AppError);
  });

  it("rejects duplicate emails", async () => {
    await expect(registerUser({ name: "Hannah Two", email: "hannah@test.example", password: "another-passphrase-2" }, org)).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("gives the same error for a wrong password and an unknown account", async () => {
    const wrong = await authenticate("hannah@test.example", "not-the-password", org).catch((e) => e);
    const unknown = await authenticate("nobody@test.example", "not-the-password", org).catch((e) => e);
    expect(wrong).toBeInstanceOf(AppError);
    expect(unknown.message).toBe(wrong.message);
  });

  it("blocks suspended members", async () => {
    const user = await registerUser({ name: "Sam Suspended", email: "sam@test.example", password: "a-long-passphrase-3" }, org);
    await db.membership.updateMany({ where: { userId: user.id }, data: { status: "SUSPENDED" } });
    await expect(authenticate("sam@test.example", "a-long-passphrase-3", org)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("resets a password and revokes existing sessions", async () => {
    const user = await db.user.findUniqueOrThrow({ where: { email: "hannah@test.example" } });
    await db.session.create({ data: { userId: user.id, tokenHash: "x".repeat(64), expiresAt: new Date(Date.now() + 86_400_000) } });
    await requestPasswordReset("hannah@test.example", org);
    const token = await latestToken("hannah@test.example", "/reset-password");
    await resetPassword(token, "a-brand-new-passphrase", org);
    await expect(authenticate("hannah@test.example", "a-brand-new-passphrase", org)).resolves.toMatchObject({ status: "ok" });
    await expect(authenticate("hannah@test.example", "a-long-passphrase-1", org)).rejects.toBeInstanceOf(AppError);
    expect(await db.session.count({ where: { userId: user.id } })).toBe(0);
  });

  it("silently ignores reset requests for unknown emails", async () => {
    const before = await db.outboundEmail.count();
    await requestPasswordReset("ghost@test.example", org);
    expect(await db.outboundEmail.count()).toBe(before);
  });
});
