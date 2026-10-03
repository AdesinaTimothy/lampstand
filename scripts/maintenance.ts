/**
 * Periodic housekeeping. Run every 10–15 minutes from cron or a scheduled job:
 *   npm run maintenance
 * - retries emails that failed to send (up to 5 attempts)
 * - purges expired sessions, used/expired tokens and stale rate-limit windows
 */
import "../prisma/seed/load-env";
import { db } from "../src/server/db";
import { deliver } from "../src/server/mail";

async function main() {
  const now = new Date();
  const failed = await db.outboundEmail.findMany({
    where: { status: { in: ["FAILED", "QUEUED"] }, attempts: { lt: 5 }, createdAt: { lt: new Date(now.getTime() - 60_000) } },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: { id: true },
  });
  let sent = 0;
  for (const e of failed) if (await deliver(e.id)) sent++;

  const [sessions, tokens, limits] = await Promise.all([
    db.session.deleteMany({ where: { expiresAt: { lt: now } } }),
    db.verificationToken.deleteMany({ where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null }, createdAt: { lt: new Date(now.getTime() - 7 * 86_400_000) } }] } }),
    db.rateLimit.deleteMany({ where: { expiresAt: { lt: now } } }),
  ]);
  console.log(
    `[maintenance] emails retried ${failed.length} (sent ${sent}); removed ${sessions.count} sessions, ${tokens.count} tokens, ${limits.count} rate-limit windows`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
