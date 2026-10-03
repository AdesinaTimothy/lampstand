import "server-only";
import { ACHIEVEMENTS, type AchievementCode } from "@/lib/achievements";
import { db } from "../db";
import { notify } from "../notifications";
import { getStreak } from "./activity";

let catalogueSynced = false;
async function syncCatalogue() {
  if (catalogueSynced) return;
  await Promise.all(
    ACHIEVEMENTS.map((a, position) =>
      db.achievement.upsert({
        where: { code: a.code },
        create: { ...a, position },
        update: { title: a.title, description: a.description, icon: a.icon, position },
      }),
    ),
  );
  catalogueSynced = true;
}

/**
 * Evaluates milestone achievements for a user and awards any newly met.
 * Safe to call after any learning event; awarding is idempotent.
 */
export async function evaluateAchievements(userId: string, timezone: string): Promise<AchievementCode[]> {
  await syncCatalogue();
  const [earned, lessonsCompleted, coursesCompleted, perfectQuiz, streak] = await Promise.all([
    db.userAchievement.findMany({ where: { userId }, select: { achievement: { select: { code: true } } } }),
    db.lessonProgress.count({ where: { userId, status: "COMPLETED" } }),
    db.enrollment.count({ where: { userId, status: "COMPLETED" } }),
    db.quizAttempt.count({ where: { userId, score: 100 } }),
    getStreak(userId, timezone),
  ]);
  const have = new Set(earned.map((e) => e.achievement.code));
  const met: Record<AchievementCode, boolean> = {
    FIRST_STEP: lessonsCompleted >= 1,
    WELL_STUDIED: lessonsCompleted >= 25,
    FIRST_COURSE: coursesCompleted >= 1,
    THREE_COURSES: coursesCompleted >= 3,
    PERFECT_QUIZ: perfectQuiz >= 1,
    STREAK_7: streak.longest >= 7,
    STREAK_30: streak.longest >= 30,
  };
  const newly = (Object.keys(met) as AchievementCode[]).filter((code) => met[code] && !have.has(code));
  if (newly.length === 0) return [];

  const rows = await db.achievement.findMany({ where: { code: { in: newly } } });
  await db.userAchievement.createMany({
    data: rows.map((a) => ({ userId, achievementId: a.id })),
    skipDuplicates: true,
  });
  for (const a of rows) {
    await notify(userId, {
      type: "ACHIEVEMENT_EARNED",
      title: `Achievement unlocked: ${a.title}`,
      body: a.description,
      href: "/profile#achievements",
    });
  }
  return newly;
}
