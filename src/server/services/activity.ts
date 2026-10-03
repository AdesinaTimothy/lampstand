import "server-only";
import type { ActivityType, Prisma } from "@prisma/client";
import { db, type DbClient } from "../db";

export async function recordActivity(
  client: DbClient,
  data: {
    userId: string;
    organizationId: string;
    type: ActivityType;
    courseId?: string | null;
    lessonId?: string | null;
    metadata?: Prisma.InputJsonValue;
  },
) {
  await client.activity.create({ data });
}

const STREAK_TYPES: ActivityType[] = [
  "LESSON_STARTED",
  "LEARNING_SESSION",
  "LESSON_COMPLETED",
  "QUIZ_SUBMITTED",
  "ASSIGNMENT_SUBMITTED",
  "COURSE_COMPLETED",
];

export type StreakSummary = { current: number; longest: number; activeToday: boolean; days: string[] };

/** Pure streak computation over sorted-desc ISO dates (YYYY-MM-DD). Exported for tests. */
export function computeStreak(daysDesc: string[], today: string): Omit<StreakSummary, "days"> {
  const toDay = (s: string) => Math.round(Date.parse(`${s}T00:00:00Z`) / 86_400_000);
  const todayN = toDay(today);
  const set = new Set(daysDesc.map(toDay));
  const activeToday = set.has(todayN);

  let current = 0;
  let cursor = activeToday ? todayN : todayN - 1;
  while (set.has(cursor)) {
    current++;
    cursor--;
  }

  let longest = 0;
  let run = 0;
  let prev: number | null = null;
  for (const n of [...set].sort((a, b) => a - b)) {
    run = prev !== null && n === prev + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = n;
  }
  return { current, longest, activeToday };
}

/** Learning streak in the organization's timezone. */
export async function getStreak(userId: string, timezone: string): Promise<StreakSummary> {
  const rows = await db.$queryRaw<{ day: string }[]>`
    SELECT DISTINCT to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${timezone}, 'YYYY-MM-DD') AS day
    FROM "Activity"
    WHERE "userId" = ${userId}
      AND "type"::text = ANY(${STREAK_TYPES})
      AND "createdAt" > now() - interval '400 days'
    ORDER BY day DESC`;
  const [{ today }] = await db.$queryRaw<{ today: string }[]>`
    SELECT to_char(now() AT TIME ZONE ${timezone}, 'YYYY-MM-DD') AS today`;
  const days = rows.map((r) => r.day);
  return { ...computeStreak(days, today), days };
}
