// Demo data for Lampstand: Grace Harbor Church.
//
//   npm run db:seed        (prisma db seed → tsx --conditions=react-server prisma/seed.ts)
//
// Idempotent: wipes every application table and the seeded storage files, then
// rebuilds a realistic, internally consistent dataset. Content lives in
// prisma/seed/content; the learning simulation lives in prisma/seed/learning.ts.
import "./seed/load-env";
import { readdir, rm } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { ACHIEVEMENTS, type AchievementCode } from "@/lib/achievements";
import { hashPassword } from "@/server/auth/password";
import { env } from "@/server/env";
import { getStorage } from "@/server/storage";
import { type CourseModel, type Instructor, seedCategories, seedCourses } from "./seed/catalog";
import {
  courseLaunchNotifications,
  seedAnnouncements,
  seedAuditLog,
  seedBookmarksAndNotes,
  seedComments,
  seedVerifications,
} from "./seed/community";
import { categories as categorySeeds, courses as courseSeeds, people } from "./seed/content";
import { type EnrollmentPlan, LearningSimulator, type LearnerProfile } from "./seed/learning";
import { MediaLibrary } from "./seed/media";
import { addMs, DAY, daysAgo, HOUR, MINUTE, NOW, nyDayStart, Random } from "./seed/random";
import type { InstructorKey } from "./seed/types";

const DEMO_PASSWORD = "Lampstand2026!";
const ORG = {
  name: "Grace Harbor Church",
  slug: env.APP_ORGANIZATION_SLUG,
  tagline: "Rooted in Scripture. Growing together.",
  description:
    "Grace Harbor is a church family in the heart of the city, gathering to worship Jesus, grow in God's Word and serve our neighbors. Our online classes help you take your next step, wherever you are.",
  website: "https://graceharbor.example",
  email: "hello@graceharbor.example",
  timezone: "America/New_York",
  signatoryName: "Pastor Daniel Okafor",
  signatoryTitle: "Lead Pastor",
};

const db = new PrismaClient();
const rng = new Random(20261003);

async function chunked<T>(rows: T[], size: number, insert: (chunk: T[]) => Promise<unknown>) {
  for (let i = 0; i < rows.length; i += size) await insert(rows.slice(i, i + size));
}

// ───────────────────────────── reset ─────────────────────────────

async function reset() {
  const storage = getStorage();
  const assets = await db.mediaAsset.findMany({ select: { storageKey: true } });
  for (const a of assets) await storage.delete(a.storageKey).catch(() => undefined);
  if (storage.name === "local") {
    // Every asset row is about to be deleted, so nothing in local storage is referenced any more.
    const root = path.resolve(env.STORAGE_LOCAL_DIR);
    // Empty the folder rather than removing it: in the container its parent (/app)
    // belongs to root, so the app user can clear the storage folder but not delete it.
    if (root !== path.resolve("/") && root !== process.cwd()) {
      const entries = await readdir(root).catch(() => [] as string[]);
      for (const entry of entries) await rm(path.join(root, entry), { recursive: true, force: true });
    }
  }
  const tables = await db.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = current_schema() AND tablename <> '_prisma_migrations'`;
  if (tables.length) {
    await db.$executeRawUnsafe(`TRUNCATE TABLE ${tables.map((t) => `"${t.tablename}"`).join(", ")} RESTART IDENTITY CASCADE`);
  }
}

// ───────────────────────────── demo learner ─────────────────────────────

/** A timestamp `daysBack` New York days ago at roughly hh:mm local time. */
function nyAt(daysBack: number, hour: number, minute = rng.int(0, 50)): Date {
  const dayStart = nyDayStart(addMs(NOW, -daysBack * DAY));
  const at = addMs(dayStart, hour * HOUR + minute * MINUTE);
  if (at.getTime() <= NOW.getTime() - 10 * MINUTE) return at;
  // Today, but that hour hasn't happened yet: use "a little while ago", still today.
  const todayStart = nyDayStart(NOW);
  const recent = addMs(NOW, -rng.int(15, 45) * MINUTE);
  return recent > todayStart ? recent : addMs(todayStart, (NOW.getTime() - todayStart.getTime()) / 2);
}

function johnPlans(courses: Record<string, CourseModel>) {
  const foundations: EnrollmentPlan = {
    enrolledAt: nyAt(95, 20, 5),
    status: "COMPLETED",
    completions: [
      nyAt(94, 6, 40),
      nyAt(92, 6, 35),
      nyAt(90, 21, 10),
      nyAt(89, 6, 45),
      nyAt(87, 7, 5),
      nyAt(85, 6, 50),
      nyAt(84, 20, 30), // quiz: failed once, then 100%
      nyAt(82, 6, 40),
      nyAt(80, 12, 20),
      nyAt(79, 6, 55),
      nyAt(77, 21, 15), // "My Story of Grace" submitted
    ],
    quizCorrect: { 6: [3, 5] },
    responseIndex: 0,
    review: {
      rating: 5,
      body: "This course gave me a firm place to stand. The lesson on assurance answered questions I'd been too embarrassed to ask anyone.",
      at: nyAt(76, 19, 30),
    },
  };
  const romans: EnrollmentPlan = {
    enrolledAt: nyAt(24, 19, 0),
    status: "ACTIVE",
    completions: [
      nyAt(23, 6, 35),
      nyAt(21, 6, 40),
      nyAt(18, 21, 5),
      nyAt(14, 6, 45),
      nyAt(11, 7, 0),
      nyAt(4, 6, 50),
      nyAt(3, 7, 10), // Romans 1–5 checkpoint: 80% first time
      nyAt(2, 21, 0),
    ],
    quizCorrect: { 6: [4] },
    // "No Condemnation (Romans 8:1–17)": paused about half a minute in, this morning.
    current: { at: nyAt(0, 6, 45), positionSeconds: 31 },
    review: null,
  };
  const prayer: EnrollmentPlan = {
    enrolledAt: nyAt(9, 7, 0),
    status: "ACTIVE",
    completions: [nyAt(9, 7, 35), nyAt(8, 6, 50), nyAt(1, 6, 40)],
    review: null,
  };
  return [
    { course: courses["foundations-of-faith"], plan: foundations },
    { course: courses["walking-through-romans"], plan: romans },
    { course: courses["prayer-that-shapes-us"], plan: prayer },
  ];
}

// ───────────────────────────── main ─────────────────────────────

async function main() {
  const started = Date.now();
  console.log("🌱 Seeding Lampstand demo data for Grace Harbor Church…");
  await reset();

  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const organization = await db.organization.create({
    data: {
      name: ORG.name,
      slug: ORG.slug,
      tagline: ORG.tagline,
      description: ORG.description,
      website: ORG.website,
      email: ORG.email,
      timezone: ORG.timezone,
      certificateSignatoryName: ORG.signatoryName,
      certificateSignatoryTitle: ORG.signatoryTitle,
      allowSelfRegistration: true,
      requireEmailVerification: true,
      createdAt: daysAgo(160),
      updatedAt: daysAgo(9),
    },
  });

  const achievementIds = new Map<AchievementCode, string>();
  for (const [position, a] of ACHIEVEMENTS.entries()) {
    const row = await db.achievement.upsert({
      where: { code: a.code },
      create: { ...a, position },
      update: { title: a.title, description: a.description, icon: a.icon, position },
    });
    achievementIds.set(a.code, row.id);
  }

  // ── People ──
  const staffIds = {} as Record<(typeof people.staff)[number]["key"], { id: string; name: string; email: string; createdAt: Date }>;
  for (const s of people.staff) {
    const createdAt = addMs(daysAgo(s.joinedDaysAgo), -rng.int(1, 5) * HOUR);
    const user = await db.user.create({
      data: {
        email: s.email,
        name: s.name,
        passwordHash,
        emailVerifiedAt: addMs(createdAt, 20 * MINUTE),
        platformRole: s.superAdmin ? "SUPER_ADMIN" : "USER",
        headline: s.headline ?? null,
        bio: s.bio ?? null,
        profileVisibility: s.superAdmin ? "PRIVATE" : "PUBLIC",
        lastActiveAt: addMs(NOW, -rng.int(20, 600) * MINUTE),
        createdAt,
        updatedAt: createdAt,
        memberships: { create: { organizationId: organization.id, role: s.role, createdAt, updatedAt: createdAt } },
      },
    });
    staffIds[s.key] = { id: user.id, name: user.name, email: user.email, createdAt };
  }
  const instructors: Record<InstructorKey, Instructor> = {
    daniel: staffIds.daniel,
    miriam: staffIds.miriam,
    samuel: staffIds.samuel,
    esther: staffIds.esther,
    grace: staffIds.grace,
  };

  const johnCreatedAt = addMs(daysAgo(people.john.joinedDaysAgo), -3 * HOUR);
  const john = await db.user.create({
    data: {
      email: people.john.email,
      name: people.john.name,
      passwordHash,
      emailVerifiedAt: addMs(johnCreatedAt, 7 * MINUTE),
      headline: people.john.headline,
      bio: people.john.bio,
      profileVisibility: "MEMBERS",
      createdAt: johnCreatedAt,
      updatedAt: johnCreatedAt,
      memberships: { create: { organizationId: organization.id, role: "LEARNER", createdAt: johnCreatedAt, updatedAt: johnCreatedAt } },
    },
  });

  // Learner sign-ups accelerate over time (more recent growth), spread across 150 days.
  const learners: (LearnerProfile & { email: string; suspended: boolean })[] = [];
  const suspendIdx = new Set([7, 33]);
  for (const [i, l] of people.learners.entries()) {
    const createdAt = addMs(NOW, -Math.pow(rng.next(), 1.15) * 150 * DAY - rng.int(1, 600) * MINUTE);
    const roll = rng.next();
    const level: LearnerProfile["level"] = suspendIdx.has(i) ? "light" : roll < 0.27 ? "keen" : roll < 0.72 ? "regular" : "light";
    const suspended = suspendIdx.has(i);
    const user = await db.user.create({
      data: {
        email: l.email,
        name: l.name,
        passwordHash,
        emailVerifiedAt: addMs(createdAt, rng.int(2, 90) * MINUTE),
        headline: rng.pick(people.learnerHeadlines),
        profileVisibility: rng.pick(["MEMBERS", "MEMBERS", "PUBLIC", "PRIVATE"] as const),
        emailNotifications: rng.chance(0.85),
        createdAt,
        updatedAt: createdAt,
        memberships: {
          create: {
            organizationId: organization.id,
            role: "LEARNER",
            status: suspended ? "SUSPENDED" : "ACTIVE",
            createdAt,
            updatedAt: suspended ? daysAgo(rng.int(6, 20)) : createdAt,
          },
        },
      },
    });
    learners.push({ id: user.id, name: user.name, email: user.email, createdAt, level, suspended });
  }

  // ── Catalogue ──
  const categoryIds = await seedCategories(db, organization.id, daysAgo(152));
  const media = new MediaLibrary(db, organization.id, organization.name);
  await media.uploadLessonMedia(staffIds.daniel.id, daysAgo(145));
  const courseModels = await seedCourses({
    db,
    rng,
    organizationId: organization.id,
    courses: courseSeeds,
    categoryIds,
    instructors,
    media,
  });
  const bySlug = Object.fromEntries(courseModels.map((c) => [c.slug, c]));
  const published = courseModels.filter((c) => c.publishedAt);

  // ── Learning ──
  const sim = new LearningSimulator(
    rng,
    { id: organization.id, name: organization.name, signatoryName: ORG.signatoryName, signatoryTitle: ORG.signatoryTitle },
    john.id,
  );
  for (const { course, plan } of johnPlans(bySlug)) sim.enroll(john, course, plan);

  for (const learner of learners) {
    // A few of the newest members haven't started a course yet.
    if (NOW.getTime() - learner.createdAt.getTime() < 6 * DAY && rng.chance(0.6)) continue;
    const count =
      learner.level === "keen" ? rng.int(3, 6) : learner.level === "regular" ? rng.int(2, 4) : rng.int(1, 2);
    const pool = [...published];
    const chosen: CourseModel[] = [];
    while (chosen.length < count && pool.length) {
      const weights = pool.map((c) => c.seed.popularity);
      let roll = rng.next() * weights.reduce((a, b) => a + b, 0);
      const idx = weights.findIndex((w) => (roll -= w) < 0);
      chosen.push(pool.splice(idx === -1 ? pool.length - 1 : idx, 1)[0]);
    }
    for (const course of chosen) {
      const plan = sim.randomPlan(learner, course);
      if (plan) sim.enroll(learner, course, plan);
    }
  }

  const submissions = sim.finalizeSubmissions({
    pendingTarget: 7,
    prioritizeOwners: [staffIds.miriam.id, staffIds.daniel.id],
    demoFeedback:
      "John, thank you for sharing your story so honestly. The image of praying in your car in the parking lot moved me. I'd love for you to share this at a baptism Sunday sometime. Keep reading Mark with your wife!",
  });
  sim.finalizeAchievements(achievementIds);

  const members = [
    ...Object.values(staffIds).map((s) => ({ id: s.id, name: s.name, createdAt: s.createdAt, active: true })),
    { id: john.id, name: john.name, createdAt: johnCreatedAt, active: true },
    ...learners.map((l) => ({ id: l.id, name: l.name, createdAt: l.createdAt, active: !l.suspended })),
  ];
  courseLaunchNotifications(sim, published, members);
  const announcements = await seedAnnouncements({ db, rng, sim, organizationId: organization.id, authorId: staffIds.ruth.id, members });

  // ── Persist learning rows ──
  await chunked(sim.enrollments, 500, (data) => db.enrollment.createMany({ data }));
  await chunked(sim.progress, 1000, (data) => db.lessonProgress.createMany({ data }));
  await chunked(sim.attempts, 500, (data) => db.quizAttempt.createMany({ data }));
  await chunked(submissions, 500, (data) => db.assignmentSubmission.createMany({ data }));
  await chunked(sim.certificates, 500, (data) => db.certificate.createMany({ data }));
  await chunked(sim.reviews, 500, (data) => db.review.createMany({ data }));
  await chunked(sim.activities, 1000, (data) => db.activity.createMany({ data }));
  await chunked(sim.userAchievements, 1000, (data) => db.userAchievement.createMany({ data }));

  // Denormalized course counters, exactly as the services maintain them.
  for (const course of courseModels) {
    const active = sim.enrollments.filter((e) => e.courseId === course.id && e.status !== "DROPPED").length;
    const ratings = sim.reviews.filter((r) => r.courseId === course.id && !r.hidden).map((r) => r.rating);
    await db.course.update({
      where: { id: course.id },
      data: {
        enrollmentCount: active,
        ratingCount: ratings.length,
        ratingAverage: ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) / 100 : 0,
      },
    });
  }

  // ── Community & operations ──
  const romans = bySlug["walking-through-romans"];
  const foundations = bySlug["foundations-of-faith"];
  const prayer = bySlug["prayer-that-shapes-us"];
  const lessonByTitle = (course: CourseModel, title: string) => {
    const lesson = course.lessons.find((l) => l.title === title);
    if (!lesson) throw new Error(`Lesson not found: ${title}`);
    return lesson.id;
  };
  await seedComments({ db, rng, sim, courses: courseModels, demoUserId: john.id });
  await seedBookmarksAndNotes({
    db,
    rng,
    sim,
    demo: {
      userId: john.id,
      bookmarks: [
        lessonByTitle(romans, "Justified by Faith (Romans 3:21–26)"),
        lessonByTitle(foundations, "Assurance: Can I Know I Belong to God?"),
        lessonByTitle(prayer, "The Lord's Prayer as a Pattern"),
        lessonByTitle(romans, "Study Guide: Romans 1–4"),
      ],
      notes: [
        {
          lessonId: lessonByTitle(romans, "Reading Romans Well: Context and Structure"),
          body: "Map: 1–3 the problem · 3–5 the remedy · 6–8 new life · 9–11 Israel · 12–16 our response. Watch for every “therefore”!",
          at: nyAt(21, 6, 30),
        },
        {
          lessonId: lessonByTitle(romans, "Justified by Faith (Romans 3:21–26)"),
          body: "Justification = God's verdict about my standing, not my progress. Sanctification = my growing. Standing vs. growing.",
          positionSeconds: 31,
          at: nyAt(14, 6, 42),
        },
        {
          lessonId: lessonByTitle(romans, "No Condemnation (Romans 8:1–17)"),
          body: "8:1 no condemnation → 8:39 no separation. Read the whole chapter out loud on Sunday.",
          positionSeconds: 22,
          at: nyAt(0, 6, 46),
        },
        {
          lessonId: lessonByTitle(foundations, "Assurance: Can I Know I Belong to God?"),
          body: "Feelings rise and fall like the tide; God's promises are the harbor wall that doesn't move. John 10:27–29.",
          at: nyAt(87, 7, 0),
        },
        {
          lessonId: lessonByTitle(prayer, "The Lord's Prayer as a Pattern"),
          body: "Try praying each line in my own words on the walk from the train. “Your kingdom come” → pray for Mike at work.",
          at: nyAt(8, 6, 45),
        },
      ],
    },
  });

  const suspended = learners.filter((l) => l.suspended).map((l) => ({ id: l.id, at: daysAgo(rng.int(6, 20)) }));
  await seedAuditLog({
    db,
    rng,
    organizationId: organization.id,
    courses: courseModels,
    categories: categorySeeds.map((c) => ({ id: categoryIds.get(c.slug)!, name: c.name })),
    staff: {
      daniel: staffIds.daniel,
      ruth: staffIds.ruth,
      support: staffIds.support,
      esther: staffIds.esther,
      grace: staffIds.grace,
      miriam: staffIds.miriam,
      samuel: staffIds.samuel,
    },
    suspended,
    announcements,
  });
  await seedVerifications({ db, rng, certificates: sim.certificates.map((c) => ({ id: c.id, issuedAt: c.issuedAt as Date })) });

  // Notifications last: every step above may have queued some.
  await chunked(sim.notifications, 1000, (data) => db.notification.createMany({ data }));

  // Last-active timestamps follow real activity.
  const lastActive = sim.lastActivityByUser();
  for (const [userId, at] of lastActive) await db.user.update({ where: { id: userId }, data: { lastActiveAt: at } });
  for (const l of learners) if (!lastActive.has(l.id)) await db.user.update({ where: { id: l.id }, data: { lastActiveAt: addMs(l.createdAt, 15 * MINUTE) } });

  await printSummary(Date.now() - started);
}

async function printSummary(ms: number) {
  const counts: Record<string, number> = {
    Users: await db.user.count(),
    Courses: await db.course.count(),
    Lessons: await db.lesson.count(),
    "Media assets": await db.mediaAsset.count(),
    Enrollments: await db.enrollment.count(),
    "Lesson progress": await db.lessonProgress.count(),
    "Quiz attempts": await db.quizAttempt.count(),
    Submissions: await db.assignmentSubmission.count(),
    Certificates: await db.certificate.count(),
    Reviews: await db.review.count(),
    Activities: await db.activity.count(),
    Notifications: await db.notification.count(),
  };
  console.log(`\n✅ Seed complete in ${(ms / 1000).toFixed(1)}s`);
  console.table(counts);
  console.log("\nDemo accounts (password for all: " + DEMO_PASSWORD + ")");
  console.table([
    { role: "Super admin", name: "Lampstand Support", email: "support@lampstand.example", password: DEMO_PASSWORD },
    { role: "Owner · Lead Pastor", name: "Pastor Daniel Okafor", email: "daniel@graceharbor.example", password: DEMO_PASSWORD },
    { role: "Admin", name: "Ruth Martinez", email: "ruth@graceharbor.example", password: DEMO_PASSWORD },
    { role: "Instructor", name: "Dr. Miriam Chen", email: "miriam@graceharbor.example", password: DEMO_PASSWORD },
    { role: "Instructor", name: "Pastor Samuel Adeyemi", email: "samuel@graceharbor.example", password: DEMO_PASSWORD },
    { role: "Instructor", name: "Esther Whitfield", email: "esther@graceharbor.example", password: DEMO_PASSWORD },
    { role: "Instructor", name: "Grace Thompson", email: "grace@graceharbor.example", password: DEMO_PASSWORD },
    { role: "Learner (demo)", name: "John Carter", email: "john@graceharbor.example", password: DEMO_PASSWORD },
    { role: "Learner", name: "Sarah Mitchell (+45 more)", email: "sarah.mitchell@graceharbor.example", password: DEMO_PASSWORD },
  ]);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
