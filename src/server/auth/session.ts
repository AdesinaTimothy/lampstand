import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { db } from "../db";
import { isProduction } from "../env";
import { generateToken, hashToken } from "./tokens";
import { getRequestMeta } from "../request";

export const SESSION_COOKIE = isProduction ? "__Secure-lampstand_session" : "lampstand_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
// Extend the session at most once a day to avoid a write on every request.
const SESSION_REFRESH_MS = 24 * 60 * 60 * 1000;

export async function createSession(userId: string): Promise<void> {
  const token = generateToken();
  const meta = await getRequestMeta();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.session.create({
    data: { tokenHash: hashToken(token), userId, expiresAt, ipAddress: meta.ipAddress, userAgent: meta.userAgent },
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Validates the session cookie. Memoized per request. */
export const getSession = cache(async () => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, userId: true, expiresAt: true, lastUsedAt: true },
  });
  if (!session) return null;

  const now = Date.now();
  if (session.expiresAt.getTime() <= now) {
    await db.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }

  if (now - session.lastUsedAt.getTime() > SESSION_REFRESH_MS) {
    await db.session
      .update({
        where: { id: session.id },
        data: { lastUsedAt: new Date(now), expiresAt: new Date(now + SESSION_TTL_MS) },
      })
      .catch(() => undefined);
  }
  return session;
});

export async function destroyCurrentSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  jar.delete(SESSION_COOKIE);
}

/** Signs a user out everywhere — used after password reset or suspension. */
export async function revokeAllSessions(userId: string, exceptSessionId?: string): Promise<void> {
  await db.session.deleteMany({
    where: { userId, ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}) },
  });
}
