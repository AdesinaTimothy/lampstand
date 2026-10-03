import "server-only";
import { AppError } from "@/lib/errors";
import { db } from "./db";

/**
 * Fixed-window rate limiter backed by Postgres so limits hold across instances.
 * One atomic upsert per check. Swap for Redis if traffic grows significantly.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<{ ok: boolean; remaining: number }> {
  const rows = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" ("key", "count", "windowStart", "expiresAt")
    VALUES (${key}, 1, now(), now() + make_interval(secs => ${windowSeconds}::double precision))
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."expiresAt" <= now() THEN 1 ELSE "RateLimit"."count" + 1 END,
      "windowStart" = CASE WHEN "RateLimit"."expiresAt" <= now() THEN now() ELSE "RateLimit"."windowStart" END,
      "expiresAt" = CASE WHEN "RateLimit"."expiresAt" <= now() THEN now() + make_interval(secs => ${windowSeconds}::double precision) ELSE "RateLimit"."expiresAt" END
    RETURNING "count"`;
  const count = Number(rows[0]?.count ?? 1);
  return { ok: count <= limit, remaining: Math.max(0, limit - count) };
}

export async function enforceRateLimit(key: string, limit: number, windowSeconds: number, message?: string) {
  const result = await rateLimit(key, limit, windowSeconds);
  if (!result.ok) {
    throw new AppError("RATE_LIMITED", message ?? "Too many attempts. Please wait a few minutes and try again.");
  }
}
