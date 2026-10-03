// Community and operations data layered on top of the learning simulation:
// lesson discussions, bookmarks, notes, announcements, audit log entries and
// certificate verifications.
import { randomBytes } from "node:crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import type { CourseModel } from "./catalog";
import { newId } from "./ids";
import type { LearningSimulator } from "./learning";
import { addMs, DAY, daysAgo, HOUR, minDate, MINUTE, NOW, type Random } from "./random";

type Member = { id: string; name: string; createdAt: Date; active: boolean };

export async function seedComments(opts: {
  db: PrismaClient;
  rng: Random;
  sim: LearningSimulator;
  courses: CourseModel[];
  demoUserId: string;
}) {
  const { db, rng, sim } = opts;
  const rows: Prisma.LessonCommentCreateManyInput[] = [];
  const viewers = new Map<string, { userId: string; at: Date }[]>();
  for (const p of sim.progress) {
    const list = viewers.get(p.lessonId) ?? [];
    list.push({ userId: p.userId, at: p.lastViewedAt });
    viewers.set(p.lessonId, list);
  }

  for (const course of opts.courses) {
    for (const lesson of course.lessons) {
      const threads = lesson.seed.comments ?? [];
      const used = new Set<string>();
      for (const thread of threads) {
        const candidates = (viewers.get(lesson.id) ?? []).filter((v) => !used.has(v.userId));
        const demo = candidates.find((v) => v.userId === opts.demoUserId);
        const others = candidates.filter((v) => v.userId !== opts.demoUserId);
        if (candidates.length === 0) continue;
        const asker = thread.askedByDemoLearner && demo ? demo : rng.pick(others.length ? others : candidates);
        used.add(asker.userId);
        const askedAt = minDate(addMs(asker.at, rng.int(3, 50) * MINUTE), addMs(NOW, -3 * HOUR));
        const repliedAt = minDate(addMs(askedAt, rng.int(2, 26) * HOUR), addMs(NOW, -2 * HOUR));
        const questionId = newId();
        rows.push({ id: questionId, lessonId: lesson.id, userId: asker.userId, body: thread.question, createdAt: askedAt, updatedAt: askedAt });
        rows.push({ id: newId(), lessonId: lesson.id, userId: course.ownerId, parentId: questionId, body: thread.reply, createdAt: repliedAt, updatedAt: repliedAt });
        if (thread.followUp) {
          const thanksAt = minDate(addMs(repliedAt, rng.int(1, 20) * HOUR), addMs(NOW, -HOUR));
          rows.push({ id: newId(), lessonId: lesson.id, userId: asker.userId, parentId: questionId, body: thread.followUp, createdAt: thanksAt, updatedAt: thanksAt });
        }
      }
    }
  }
  await db.lessonComment.createMany({ data: rows });
  return rows.length;
}

export async function seedBookmarksAndNotes(opts: {
  db: PrismaClient;
  rng: Random;
  sim: LearningSimulator;
  demo: { userId: string; bookmarks: string[]; notes: { lessonId: string; body: string; positionSeconds?: number; at: Date }[] };
}) {
  const { db, rng, sim, demo } = opts;
  const bookmarks: Prisma.BookmarkCreateManyInput[] = [];
  const seen = new Set<string>();
  const viewedAt = new Map<string, Date>();
  for (const p of sim.progress) viewedAt.set(`${p.userId}:${p.lessonId}`, p.lastViewedAt);

  for (const lessonId of demo.bookmarks) {
    const at = viewedAt.get(`${demo.userId}:${lessonId}`) ?? daysAgo(3);
    seen.add(`${demo.userId}:${lessonId}`);
    bookmarks.push({ userId: demo.userId, lessonId, createdAt: addMs(at, 2 * MINUTE) });
  }
  for (const p of rng.sample(
    sim.progress.filter((p) => p.userId !== demo.userId),
    32,
  )) {
    const key = `${p.userId}:${p.lessonId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    bookmarks.push({ userId: p.userId, lessonId: p.lessonId, createdAt: addMs(p.lastViewedAt, -MINUTE) });
  }
  await db.bookmark.createMany({ data: bookmarks });

  const genericNotes = [
    "Come back to this before small group on Thursday.",
    "Share this with Mom. She'd love it.",
    "Key verse to memorize this week.",
    "Question to ask: how does this fit with what we read last week?",
    "This was exactly what I needed today.",
  ];
  const notes: Prisma.LessonNoteCreateManyInput[] = demo.notes.map((n) => ({
    userId: demo.userId,
    lessonId: n.lessonId,
    body: n.body,
    positionSeconds: n.positionSeconds ?? null,
    createdAt: n.at,
    updatedAt: n.at,
  }));
  for (const p of rng.sample(
    sim.progress.filter((p) => p.userId !== demo.userId),
    14,
  )) {
    const at = addMs(p.firstViewedAt, rng.int(1, 4) * MINUTE);
    notes.push({ userId: p.userId, lessonId: p.lessonId, body: rng.pick(genericNotes), createdAt: at, updatedAt: at });
  }
  await db.lessonNote.createMany({ data: notes });
  return { bookmarks: bookmarks.length, notes: notes.length };
}

const ANNOUNCEMENTS = [
  {
    daysAgo: 136,
    title: "Welcome to Grace Harbor's new learning platform",
    body: "We're excited to launch our new online classes! You can now take the Membership Class, Foundations of Faith and more at your own pace, on your phone or computer. Your progress saves automatically. Questions? Reply to this message or stop by the Welcome Center on Sunday.",
  },
  {
    daysAgo: 58,
    title: "Kids ministry volunteers: training now online",
    body: "All Grace Harbor Kids volunteers now complete their annual safeguarding training through the Kids Ministry Volunteer Training course. Please finish it before September 30. Thank you for loving our kids so well!",
  },
  {
    daysAgo: 12,
    title: "Fall small groups are forming",
    body: "Sign-ups for fall small groups are open through Sunday. Many groups are studying Walking Through Romans together this season. Leaders, the new Leading a Small Group course is a great refresher before your first meeting.",
  },
];

export async function seedAnnouncements(opts: { db: PrismaClient; rng: Random; sim: LearningSimulator; organizationId: string; authorId: string; members: Member[] }) {
  const { db, rng, sim } = opts;
  const created: { id: string; title: string; at: Date; recipients: number }[] = [];
  for (const a of ANNOUNCEMENTS) {
    const at = addMs(daysAgo(a.daysAgo), -rng.int(0, 6) * HOUR);
    const recipients = opts.members.filter((m) => m.active && m.createdAt < at);
    const row = await db.announcement.create({
      data: { organizationId: opts.organizationId, authorId: opts.authorId, title: a.title, body: a.body, createdAt: at },
      select: { id: true },
    });
    for (const m of recipients) sim.notify(m.id, "ANNOUNCEMENT", at, { title: a.title, body: a.body, href: "/notifications" });
    created.push({ id: row.id, title: a.title, at, recipients: recipients.length });
  }
  return created;
}

export function courseLaunchNotifications(sim: LearningSimulator, courses: CourseModel[], members: Member[]) {
  for (const course of courses) {
    if (!course.publishedAt) continue;
    for (const m of members) {
      if (m.id === course.ownerId || m.createdAt > course.publishedAt) continue;
      sim.notify(m.id, "COURSE_PUBLISHED", addMs(course.publishedAt, 30_000), {
        title: `New course: ${course.title}`,
        body: "A new course is now available in the catalogue.",
        href: `/courses/${course.slug}`,
      });
    }
  }
}

export async function seedAuditLog(opts: {
  db: PrismaClient;
  rng: Random;
  organizationId: string;
  courses: CourseModel[];
  categories: { id: string; name: string }[];
  staff: Record<"daniel" | "ruth" | "support" | "esther" | "grace" | "miriam" | "samuel", { id: string; email: string }>;
  suspended: { id: string; at: Date }[];
  announcements: { id: string; at: Date; recipients: number }[];
}) {
  const { rng, staff } = opts;
  const ips = ["203.0.113.24", "203.0.113.57", "198.51.100.12", "198.51.100.83", "192.0.2.41"];
  const rows: Prisma.AuditLogCreateManyInput[] = [];
  const add = (actorId: string, action: string, entityType: string, entityId: string | null, at: Date, metadata?: Prisma.InputJsonValue) =>
    rows.push({ organizationId: opts.organizationId, actorId, action, entityType, entityId, metadata, ipAddress: rng.pick(ips), createdAt: at });

  add(staff.support.id, "organization.settings_updated", "Organization", opts.organizationId, daysAgo(157));
  add(staff.daniel.id, "instructor.invited", "User", staff.miriam.id, daysAgo(150), { email: staff.miriam.email });
  add(staff.daniel.id, "instructor.invited", "User", staff.samuel.id, daysAgo(148), { email: staff.samuel.email });
  add(staff.ruth.id, "instructor.invited", "User", staff.esther.id, daysAgo(146), { email: staff.esther.email });
  add(staff.ruth.id, "member.role_changed", "User", staff.grace.id, daysAgo(145), { from: "LEARNER", to: "INSTRUCTOR" });
  opts.categories.forEach((c, i) => add(staff.ruth.id, "category.created", "Category", c.id, addMs(daysAgo(152), i * 4 * MINUTE), { name: c.name }));
  add(staff.daniel.id, "organization.settings_updated", "Organization", opts.organizationId, daysAgo(141));

  for (const course of opts.courses) {
    add(course.ownerId, "course.created", "Course", course.id, course.createdAt, { title: course.title });
    if (course.instructorIds.length > 1) {
      add(staff.ruth.id, "course.instructors_changed", "Course", course.id, addMs(course.createdAt, 2 * DAY), { instructorIds: course.instructorIds });
    }
    if (course.publishedAt) add(course.ownerId, "course.published", "Course", course.id, course.publishedAt, { title: course.title });
  }
  for (const s of opts.suspended) add(staff.ruth.id, "member.suspended", "User", s.id, s.at);
  for (const a of opts.announcements) add(staff.ruth.id, "announcement.sent", "Announcement", a.id, a.at, { recipients: a.recipients, email: true });
  add(staff.daniel.id, "organization.settings_updated", "Organization", opts.organizationId, daysAgo(9));

  await opts.db.auditLog.createMany({ data: rows });
  return rows.length;
}

export async function seedVerifications(opts: { db: PrismaClient; rng: Random; certificates: { id: string; issuedAt: Date }[] }) {
  const { rng } = opts;
  const agents = [
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36",
  ];
  const rows: Prisma.CertificateVerificationCreateManyInput[] = [];
  for (const cert of rng.sample(opts.certificates, 7)) {
    const count = rng.int(1, 4);
    for (let i = 0; i < count; i++) {
      const span = NOW.getTime() - cert.issuedAt.getTime();
      const at = addMs(cert.issuedAt, Math.max(HOUR, span * rng.float(0.05, 0.95)));
      rows.push({ certificateId: cert.id, ipHash: randomBytes(16).toString("hex"), userAgent: rng.pick(agents), verifiedAt: minDate(at, addMs(NOW, -HOUR)) });
    }
  }
  await opts.db.certificateVerification.createMany({ data: rows });
  return rows.length;
}
