// Simulates learners working through courses and produces rows that obey the
// app's rules exactly (services/progress.ts, quiz.ts, assignments.ts):
//  - a lesson is COMPLETED only through its real completion path (media watched
//    ≥ 90%, quiz passed, assignment submitted, text/PDF marked complete);
//  - an enrollment is COMPLETED only when every required lesson is complete, with
//    progressPercent = floor(completedRequired * 100 / required);
//  - certificates, activities and notifications mirror what the services emit.
import type { ActivityType, NotificationType, Prisma } from "@prisma/client";
import { generateCertificateCode } from "@/server/services/certificates";
import { ACHIEVEMENTS, type AchievementCode } from "@/lib/achievements";
import type { CourseModel, LessonModel, QuizModel } from "./catalog";
import { approvalFeedback, revisionFeedback } from "./content/people";
import { newId } from "./ids";
import { addMs, atLocalHour, DAY, HOUR, maxDate, minDate, MINUTE, NOW, nyDayKey, type Random } from "./random";

export type LearnerProfile = {
  id: string;
  name: string;
  createdAt: Date;
  level: "light" | "regular" | "keen";
};

export type EnrollmentPlan = {
  enrolledAt: Date;
  status: "ACTIVE" | "COMPLETED" | "DROPPED";
  /** Completion time of lessons 0..k-1, strictly ascending. */
  completions: Date[];
  /** The next lesson the learner has opened but not finished. */
  current?: { at: Date; positionRatio?: number; positionSeconds?: number; failedQuiz?: boolean };
  /** Lesson index → correct-answer counts per attempt (last must pass). */
  quizCorrect?: Record<number, number[]>;
  /** Assignment response index override. */
  responseIndex?: number;
  review?: { rating: number; body: string | null; at: Date } | null;
};

export type EnrollmentRecord = {
  id: string;
  userId: string;
  course: CourseModel;
  status: EnrollmentPlan["status"];
  percent: number;
  lastActivityAt: Date | null;
  completedAt: Date | null;
  certificateId: string | null;
};

type PendingSubmission = {
  row: Prisma.AssignmentSubmissionCreateManyInput & { id: string; submittedAt: Date };
  course: CourseModel;
  lesson: LessonModel;
  userName: string;
  isDemo: boolean;
};

const STREAK_TYPES: ActivityType[] = [
  "LESSON_STARTED",
  "LEARNING_SESSION",
  "LESSON_COMPLETED",
  "QUIZ_SUBMITTED",
  "ASSIGNMENT_SUBMITTED",
  "COURSE_COMPLETED",
];

const SECOND = 1000;

export class LearningSimulator {
  readonly enrollments: Prisma.EnrollmentCreateManyInput[] = [];
  readonly progress: (Prisma.LessonProgressCreateManyInput & { firstViewedAt: Date; lastViewedAt: Date })[] = [];
  readonly attempts: (Prisma.QuizAttemptCreateManyInput & { submittedAt: Date })[] = [];
  readonly certificates: (Prisma.CertificateCreateManyInput & { id: string })[] = [];
  readonly reviews: (Prisma.ReviewCreateManyInput & { createdAt: Date })[] = [];
  readonly activities: (Prisma.ActivityCreateManyInput & { createdAt: Date })[] = [];
  readonly notifications: Prisma.NotificationCreateManyInput[] = [];
  readonly userAchievements: Prisma.UserAchievementCreateManyInput[] = [];
  readonly records: EnrollmentRecord[] = [];
  private readonly pendingSubmissions: PendingSubmission[] = [];
  private readonly reviewCursor = new Map<string, number>();
  private readonly codes = new Set<string>();

  constructor(
    private readonly rng: Random,
    private readonly org: { id: string; name: string; signatoryName: string; signatoryTitle: string },
    private readonly demoUserId: string,
  ) {}

  // ───────────────────────────── helpers ─────────────────────────────

  private activity(userId: string, type: ActivityType, at: Date, courseId?: string, lessonId?: string, metadata?: Prisma.InputJsonValue) {
    this.activities.push({
      id: newId(),
      userId,
      organizationId: this.org.id,
      type,
      courseId: courseId ?? null,
      lessonId: lessonId ?? null,
      metadata,
      createdAt: at,
    });
  }

  /** In-app notification; older ones are usually read already. */
  notify(
    userId: string,
    type: NotificationType,
    at: Date,
    content: { title: string; body?: string | null; href?: string | null },
    read?: boolean,
  ) {
    const ageDays = (NOW.getTime() - at.getTime()) / DAY;
    const isRead = read ?? (ageDays > 3 ? this.rng.chance(0.88) : ageDays > 1 ? this.rng.chance(0.45) : this.rng.chance(0.15));
    const readAt = isRead ? minDate(addMs(at, this.rng.int(5, 20 * 60) * MINUTE), addMs(NOW, -MINUTE)) : null;
    this.notifications.push({
      id: newId(),
      userId,
      type,
      title: content.title,
      body: content.body ?? null,
      href: content.href ?? null,
      readAt: readAt && readAt > at ? readAt : isRead ? addMs(at, SECOND) : null,
      createdAt: at,
    });
  }

  private certificateCode(): string {
    for (;;) {
      const code = generateCertificateCode();
      if (!this.codes.has(code)) {
        this.codes.add(code);
        return code;
      }
    }
  }

  private static minimumPassing(quiz: QuizModel): number {
    const total = quiz.questions.length;
    for (let c = 0; c <= total; c++) if (Math.round((c / total) * 100) >= quiz.passingScore) return c;
    return total;
  }

  /** Builds an answer sheet with exactly `correct` questions answered correctly. */
  private answers(quiz: QuizModel, correct: number): Record<string, string[]> {
    const right = new Set(this.rng.sample(quiz.questions.map((q) => q.id), correct));
    const sheet: Record<string, string[]> = {};
    for (const q of quiz.questions) {
      const correctIds = q.options.filter((o) => o.isCorrect).map((o) => o.id);
      const wrongIds = q.options.filter((o) => !o.isCorrect).map((o) => o.id);
      if (right.has(q.id)) {
        sheet[q.id] = correctIds;
      } else if (q.type === "MULTIPLE_CHOICE") {
        // Typical mistakes: missing one correct option, or adding a wrong one.
        sheet[q.id] =
          correctIds.length > 1 && this.rng.chance(0.6)
            ? correctIds.slice(0, -1)
            : wrongIds.length
              ? [...correctIds, this.rng.pick(wrongIds)]
              : correctIds.slice(0, -1);
      } else {
        sheet[q.id] = [this.rng.pick(wrongIds)];
      }
    }
    return sheet;
  }

  private attempt(userId: string, enrollmentId: string, course: CourseModel, lesson: LessonModel, correct: number, at: Date, attemptNumber: number) {
    const quiz = lesson.quiz!;
    const total = quiz.questions.length;
    const score = Math.round((correct / total) * 100);
    const passed = score >= quiz.passingScore;
    this.attempts.push({
      id: newId(),
      quizId: quiz.id,
      userId,
      enrollmentId,
      attemptNumber,
      answers: this.answers(quiz, correct),
      score,
      pointsEarned: correct,
      pointsTotal: total,
      passed,
      startedAt: addMs(at, -this.rng.int(2, 7) * MINUTE),
      submittedAt: at,
    });
    this.activity(userId, "QUIZ_SUBMITTED", at, course.id, lesson.id, { score, passed });
    return passed;
  }

  private pickReview(course: CourseModel): string | null {
    const pool = course.seed.reviews;
    const i = this.reviewCursor.get(course.id) ?? 0;
    this.reviewCursor.set(course.id, i + 1);
    return i < pool.length ? pool[i] : null;
  }

  // ───────────────────────────── plans ─────────────────────────────

  /** A realistic random journey through one course, or null if it can't fit in time. */
  randomPlan(learner: LearnerProfile, course: CourseModel): EnrollmentPlan | null {
    const rng = this.rng;
    if (!course.publishedAt) return null;
    const start = addMs(maxDate(learner.createdAt, course.publishedAt), rng.int(1, 72) * HOUR);
    if (start.getTime() > NOW.getTime() - 2 * HOUR) return null;
    const span = NOW.getTime() - start.getTime();
    let enrolledAt = atLocalHour(addMs(start, span * Math.pow(rng.next(), 1.8)), rng);
    if (enrolledAt < start) enrolledAt = start;
    const available = NOW.getTime() - enrolledAt.getTime();
    const n = course.lessons.length;

    const completionBias = learner.level === "keen" ? 1.5 : learner.level === "light" ? 0.5 : 1;
    const r = rng.next();
    let status: EnrollmentPlan["status"] = "ACTIVE";
    let k: number;
    if (r < 0.07) {
      status = "DROPPED";
      k = rng.int(0, Math.max(1, Math.floor(n / 3)));
    } else if (r < 0.18) {
      k = 0;
    } else if (available > Math.max(4 * DAY, n * 12 * HOUR) && rng.chance(Math.min(0.9, course.seed.completionRate * completionBias))) {
      status = "COMPLETED";
      k = n;
    } else {
      k = learner.level === "light" ? rng.int(1, Math.max(1, Math.ceil(n / 3))) : rng.int(1, n - 1);
    }

    let end: Date;
    if (status === "COMPLETED") {
      // Most people take a lesson or two at a sitting, not a whole course in a night.
      end = addMs(enrolledAt, Math.max(k * rng.float(8, 30) * HOUR, available * rng.float(0.2, 0.92)));
    } else if (status === "DROPPED") {
      end = addMs(enrolledAt, Math.max(k * 40 * MINUTE, available * rng.float(0.05, 0.4)));
    } else {
      const recencyDays =
        learner.level === "keen" ? rng.float(0, 7) : learner.level === "regular" ? rng.float(0, 30) : rng.float(6, 60);
      end = maxDate(addMs(NOW, -recencyDays * DAY), addMs(enrolledAt, k * rng.float(6, 20) * HOUR));
    }
    end = minDate(end, addMs(NOW, -10 * MINUTE));

    const completions = this.spread(enrolledAt, end, k);
    let current: EnrollmentPlan["current"];
    if (status === "ACTIVE" && k < n && (k > 0 ? rng.chance(0.65) : rng.chance(0.4))) {
      const last = completions.at(-1) ?? enrolledAt;
      const at = minDate(addMs(last, rng.int(10, k > 0 ? 3 * 24 * 60 : 120) * MINUTE), addMs(NOW, -5 * MINUTE));
      if (at > last) current = { at, positionRatio: rng.float(0.15, 0.75), failedQuiz: rng.chance(0.5) };
    }
    return { enrolledAt, status, completions, current };
  }

  /** k ascending timestamps in (from, to], at plausible local hours, ≥ 15 min apart. */
  private spread(from: Date, to: Date, k: number): Date[] {
    if (k === 0) return [];
    const rng = this.rng;
    const lo = from.getTime() + 15 * MINUTE;
    const hi = Math.max(lo + k * 20 * MINUTE, to.getTime());
    const raw = Array.from({ length: k - 1 }, () => lo + rng.next() * (hi - lo)).sort((a, b) => a - b);
    raw.push(hi);
    const times = raw.map((t) => atLocalHour(new Date(t), rng)).sort((a, b) => a.getTime() - b.getTime());
    const out: Date[] = [];
    for (const t of times) {
      const floor = out.length ? out[out.length - 1].getTime() + 15 * MINUTE + rng.int(0, 20) * MINUTE : lo;
      out.push(new Date(Math.max(t.getTime(), floor)));
    }
    // Squeeze back under NOW if pushed past it.
    const limit = NOW.getTime() - 2 * MINUTE;
    for (let i = out.length - 1; i >= 0; i--) {
      const cap = i === out.length - 1 ? limit : out[i + 1].getTime() - 3 * MINUTE;
      if (out[i].getTime() > cap) out[i] = new Date(cap);
    }
    return out;
  }

  // ───────────────────────────── enrollment ─────────────────────────────

  enroll(user: { id: string; name: string }, course: CourseModel, plan: EnrollmentPlan): EnrollmentRecord {
    const rng = this.rng;
    const enrollmentId = newId();
    const userId = user.id;
    const attemptsPerQuiz = new Map<string, number>();

    this.activity(userId, "ENROLLED", plan.enrolledAt, course.id);
    this.notify(userId, "ENROLLED", addMs(plan.enrolledAt, SECOND), {
      title: `You're enrolled in ${course.title}`,
      body: "Your progress is saved automatically, so you can learn at your own pace.",
      href: `/learn/${course.slug}`,
    });

    let previous = plan.enrolledAt;
    for (const [i, t] of plan.completions.entries()) {
      const lesson = course.lessons[i];
      const duration = lesson.durationSeconds ?? 300;
      const started = maxDate(addMs(previous, MINUTE), addMs(t, -(duration * SECOND + rng.int(2, 12) * MINUTE)));
      this.activity(userId, "LESSON_STARTED", started, course.id, lesson.id);
      const isMedia = lesson.type === "VIDEO" || lesson.type === "AUDIO";
      if (isMedia) this.activity(userId, "LEARNING_SESSION", addMs(started, 5 * SECOND), course.id, lesson.id);

      if (lesson.type === "QUIZ") {
        const quiz = lesson.quiz!;
        const min = LearningSimulator.minimumPassing(quiz);
        const total = quiz.questions.length;
        const plan_ = plan.quizCorrect?.[i] ?? [
          ...(rng.chance(0.22) && min > 0 ? [rng.int(Math.max(0, min - 2), min - 1)] : []),
          rng.chance(0.4) ? total : rng.int(min, total),
        ];
        plan_.forEach((correct, a) => {
          const at = a === plan_.length - 1 ? t : addMs(started, (a + 1) * 3 * MINUTE);
          const n = (attemptsPerQuiz.get(quiz.id) ?? 0) + 1;
          attemptsPerQuiz.set(quiz.id, n);
          const passed = this.attempt(userId, enrollmentId, course, lesson, correct, at, n);
          if (a === plan_.length - 1 && !passed) throw new Error(`Seed plan for ${course.slug} ends with a failing quiz attempt`);
        });
      }
      if (lesson.type === "ASSIGNMENT") {
        const responses = lesson.assignment!.sampleResponses;
        const text = responses[plan.responseIndex ?? rng.int(0, responses.length - 1)];
        this.pendingSubmissions.push({
          row: {
            id: newId(),
            assignmentId: lesson.assignment!.id,
            userId,
            enrollmentId,
            text,
            status: "SUBMITTED",
            revision: 1,
            submittedAt: t,
            updatedAt: t,
          },
          course,
          lesson,
          userName: user.name,
          isDemo: userId === this.demoUserId,
        });
        this.activity(userId, "ASSIGNMENT_SUBMITTED", t, course.id, lesson.id);
      }

      this.progress.push({
        id: newId(),
        userId,
        lessonId: lesson.id,
        enrollmentId,
        status: "COMPLETED",
        positionSeconds: isMedia ? duration : 0,
        watchedSeconds: isMedia ? duration : 0,
        completedAt: t,
        firstViewedAt: started,
        lastViewedAt: t,
      });
      this.activity(userId, "LESSON_COMPLETED", addMs(t, SECOND), course.id, lesson.id);
      previous = t;
    }

    const required = course.lessons.filter((l) => l.isRequired);
    const completedRequired = plan.completions.filter((_, i) => course.lessons[i].isRequired).length;
    const allDone = required.length > 0 && completedRequired === required.length;
    if (plan.status === "COMPLETED" && !allDone) throw new Error(`Plan marks ${course.slug} completed without all lessons`);
    const status = allDone && plan.status !== "DROPPED" ? "COMPLETED" : plan.status === "COMPLETED" ? "ACTIVE" : plan.status;
    const percent = status === "COMPLETED" ? 100 : required.length ? Math.floor((completedRequired * 100) / required.length) : 0;

    let completedAt: Date | null = null;
    let certificateId: string | null = null;
    if (status === "COMPLETED") {
      completedAt = plan.completions.at(-1)!;
      this.activity(userId, "COURSE_COMPLETED", addMs(completedAt, 2 * SECOND), course.id);
      this.notify(userId, "COURSE_COMPLETED", addMs(completedAt, 3 * SECOND), {
        title: `You completed ${course.title}`,
        body: "Well done, good and faithful student. Take a moment to celebrate what you've learned.",
        href: `/courses/${course.slug}`,
      });
      if (course.certificateEnabled) {
        certificateId = newId();
        const issuedAt = addMs(completedAt, 3 * SECOND);
        this.certificates.push({
          id: certificateId,
          code: this.certificateCode(),
          userId,
          courseId: course.id,
          enrollmentId,
          recipientName: user.name,
          courseTitle: course.title,
          organizationName: this.org.name,
          instructorName: course.ownerName,
          signatoryName: this.org.signatoryName,
          signatoryTitle: this.org.signatoryTitle,
          completedAt,
          issuedAt,
        });
        this.activity(userId, "CERTIFICATE_ISSUED", issuedAt, course.id, undefined, { certificateId });
        this.notify(userId, "CERTIFICATE_ISSUED", addMs(issuedAt, SECOND), {
          title: "Your certificate is ready",
          body: `Your certificate for ${course.title} has been issued.`,
          href: `/certificates/${certificateId}`,
        });
      }
    }

    // The lesson the learner has open right now.
    let lastLessonId: string | null = plan.completions.length ? course.lessons[plan.completions.length - 1].id : null;
    let lastAccessedAt: Date | null = plan.completions.at(-1) ?? null;
    const currentLesson = course.lessons[plan.completions.length];
    if (plan.current && currentLesson && status !== "COMPLETED") {
      const at = plan.current.at;
      const isMedia = currentLesson.type === "VIDEO" || currentLesson.type === "AUDIO";
      const duration = currentLesson.durationSeconds ?? 0;
      const position = isMedia
        ? Math.min(
            Math.floor(duration * 0.85),
            plan.current.positionSeconds ?? Math.max(5, Math.floor(duration * (plan.current.positionRatio ?? 0.4))),
          )
        : 0;
      const lastViewed = minDate(addMs(at, Math.max(position, 30) * SECOND), addMs(NOW, -MINUTE));
      this.activity(userId, "LESSON_STARTED", at, course.id, currentLesson.id);
      if (isMedia) this.activity(userId, "LEARNING_SESSION", addMs(at, 5 * SECOND), course.id, currentLesson.id);
      if (currentLesson.type === "QUIZ" && plan.current.failedQuiz) {
        const quiz = currentLesson.quiz!;
        const min = LearningSimulator.minimumPassing(quiz);
        const n = (attemptsPerQuiz.get(quiz.id) ?? 0) + 1;
        attemptsPerQuiz.set(quiz.id, n);
        this.attempt(userId, enrollmentId, course, currentLesson, rng.int(Math.max(0, min - 2), Math.max(0, min - 1)), lastViewed, n);
      }
      this.progress.push({
        id: newId(),
        userId,
        lessonId: currentLesson.id,
        enrollmentId,
        status: "IN_PROGRESS",
        positionSeconds: position,
        watchedSeconds: position,
        completedAt: null,
        firstViewedAt: at,
        lastViewedAt: lastViewed,
      });
      lastLessonId = currentLesson.id;
      lastAccessedAt = lastViewed;
    }

    this.enrollments.push({
      id: enrollmentId,
      userId,
      courseId: course.id,
      status,
      progressPercent: percent,
      lastLessonId,
      lastAccessedAt,
      enrolledAt: plan.enrolledAt,
      completedAt,
      updatedAt: lastAccessedAt ?? plan.enrolledAt,
    });

    // Reviews come from learners who've done a meaningful part of the course.
    const lastActivityAt = lastAccessedAt ?? null;
    const eligible = status === "COMPLETED" || percent >= 20;
    if (plan.review !== undefined) {
      if (plan.review) this.addReview(userId, course, plan.review.rating, plan.review.body, plan.review.at);
    } else if (eligible && rng.chance(status === "COMPLETED" ? 0.75 : 0.4)) {
      const roll = rng.next();
      const rating = roll < 0.62 ? 5 : roll < 0.94 ? 4 : 3;
      const base = completedAt ?? lastActivityAt ?? plan.enrolledAt;
      const at = minDate(addMs(base, rng.int(20, 36 * 60) * MINUTE), addMs(NOW, -rng.int(5, 90) * MINUTE));
      // Three-star ratings are usually left without comment; the written pool is warm.
      if (at > base) this.addReview(userId, course, rating, rating >= 4 && rng.chance(0.85) ? this.pickReview(course) : null, at);
    }

    const record: EnrollmentRecord = {
      id: enrollmentId,
      userId,
      course,
      status,
      percent,
      lastActivityAt,
      completedAt,
      certificateId,
    };
    this.records.push(record);
    return record;
  }

  private addReview(userId: string, course: CourseModel, rating: number, body: string | null, at: Date) {
    this.reviews.push({ id: newId(), courseId: course.id, userId, rating, body, hidden: false, createdAt: at, updatedAt: at });
    this.activity(userId, "REVIEW_POSTED", at, course.id);
  }

  // ───────────────────────────── finalize ─────────────────────────────

  /**
   * Decides which submissions instructors have reviewed. Older work is reviewed
   * (mostly approved, a few sent back for revision); a handful of recent ones
   * stay in the queue, weighted toward the busiest teachers.
   */
  finalizeSubmissions(opts: { pendingTarget: number; prioritizeOwners: string[]; demoFeedback?: string }) {
    const rng = this.rng;
    const sorted = [...this.pendingSubmissions].sort((a, b) => b.row.submittedAt.getTime() - a.row.submittedAt.getTime());
    const pending = new Set<PendingSubmission>();
    for (const ownerId of opts.prioritizeOwners) {
      sorted
        .filter((s) => !s.isDemo && s.course.ownerId === ownerId && !pending.has(s))
        .slice(0, 2)
        .forEach((s) => pending.add(s));
    }
    for (const s of sorted) {
      if (pending.size >= opts.pendingTarget) break;
      if (s.isDemo) continue;
      if (NOW.getTime() - s.row.submittedAt.getTime() < 4 * DAY) pending.add(s);
    }
    // Anything submitted in the last few hours can't have been reviewed yet.
    for (const s of sorted) if (!s.isDemo && NOW.getTime() - s.row.submittedAt.getTime() < 6 * HOUR) pending.add(s);

    const submissions: Prisma.AssignmentSubmissionCreateManyInput[] = [];
    for (const s of this.pendingSubmissions) {
      const first = s.userName.replace(/^(Dr\.|Pastor)\s+/, "").split(" ")[0];
      const row = { ...s.row };
      if (pending.has(s)) {
        for (const instructorId of s.course.instructorIds) {
          this.notify(
            instructorId,
            "ASSIGNMENT_SUBMITTED",
            addMs(row.submittedAt, 2 * SECOND),
            { title: `${s.userName} submitted “${s.lesson.title}”`, body: s.course.title, href: `/instructor/submissions?submission=${row.id}` },
            false,
          );
        }
      } else {
        const needsRevision = !s.isDemo && rng.chance(0.14);
        const age = NOW.getTime() - row.submittedAt.getTime();
        const reviewedAt = addMs(row.submittedAt, Math.min(age * 0.6, rng.int(3, 72) * HOUR));
        const feedback = s.isDemo && opts.demoFeedback ? opts.demoFeedback : rng.pick(needsRevision ? revisionFeedback : approvalFeedback);
        row.status = needsRevision ? "NEEDS_REVISION" : "APPROVED";
        row.feedback = feedback.replaceAll("{first}", first);
        row.reviewedById = s.course.ownerId;
        row.reviewedAt = reviewedAt;
        row.updatedAt = reviewedAt;
        // Instructors were notified at submission time and have long since seen it.
        for (const instructorId of s.course.instructorIds) {
          this.notify(
            instructorId,
            "ASSIGNMENT_SUBMITTED",
            addMs(row.submittedAt, 2 * SECOND),
            { title: `${s.userName} submitted “${s.lesson.title}”`, body: s.course.title, href: `/instructor/submissions?submission=${row.id}` },
            true,
          );
        }
        this.notify(row.userId, "ASSIGNMENT_REVIEWED", addMs(reviewedAt, SECOND), {
          title: row.status === "APPROVED" ? `Your work on “${s.lesson.title}” was approved` : `Feedback on “${s.lesson.title}”`,
          body: row.feedback,
          href: `/learn/${s.course.slug}/${s.lesson.id}`,
        });
      }
      submissions.push(row);
    }
    return submissions;
  }

  /** Awards achievements exactly as services/achievements.ts would have, dated when earned. */
  finalizeAchievements(achievementIds: Map<AchievementCode, string>) {
    const byUser = new Map<string, { lessons: Date[]; courses: Date[]; perfect: Date[]; days: Map<string, Date> }>();
    const get = (userId: string) => {
      let entry = byUser.get(userId);
      if (!entry) byUser.set(userId, (entry = { lessons: [], courses: [], perfect: [], days: new Map() }));
      return entry;
    };
    for (const a of this.activities) {
      const at = a.createdAt;
      const entry = get(a.userId);
      if (a.type === "LESSON_COMPLETED") entry.lessons.push(at);
      if (a.type === "COURSE_COMPLETED") entry.courses.push(at);
      if (STREAK_TYPES.includes(a.type)) {
        const key = nyDayKey(at);
        const existing = entry.days.get(key);
        if (!existing || at < existing) entry.days.set(key, at);
      }
    }
    for (const attempt of this.attempts) if (attempt.score === 100) get(attempt.userId).perfect.push(attempt.submittedAt);

    for (const [userId, e] of byUser) {
      const asc = (d: Date[]) => [...d].sort((a, b) => a.getTime() - b.getTime());
      const lessons = asc(e.lessons);
      const courses = asc(e.courses);
      const perfect = asc(e.perfect);
      const earned: [AchievementCode, Date][] = [];
      if (lessons.length >= 1) earned.push(["FIRST_STEP", lessons[0]]);
      if (lessons.length >= 25) earned.push(["WELL_STUDIED", lessons[24]]);
      if (courses.length >= 1) earned.push(["FIRST_COURSE", courses[0]]);
      if (courses.length >= 3) earned.push(["THREE_COURSES", courses[2]]);
      if (perfect.length >= 1) earned.push(["PERFECT_QUIZ", perfect[0]]);

      // Streaks over New York calendar days.
      const days = [...e.days.keys()].sort();
      const toN = (s: string) => Math.round(Date.parse(`${s}T00:00:00Z`) / DAY);
      let run = 0;
      let prev: number | null = null;
      for (const day of days) {
        const n = toN(day);
        run = prev !== null && n === prev + 1 ? run + 1 : 1;
        prev = n;
        if (run === 7 && !earned.some(([c]) => c === "STREAK_7")) earned.push(["STREAK_7", e.days.get(day)!]);
        if (run === 30 && !earned.some(([c]) => c === "STREAK_30")) earned.push(["STREAK_30", e.days.get(day)!]);
      }

      for (const [code, at] of earned) {
        const meta = ACHIEVEMENTS.find((a) => a.code === code)!;
        const earnedAt = addMs(at, 5 * SECOND);
        this.userAchievements.push({ userId, achievementId: achievementIds.get(code)!, earnedAt });
        this.notify(userId, "ACHIEVEMENT_EARNED", earnedAt, {
          title: `Achievement unlocked: ${meta.title}`,
          body: meta.description,
          href: "/profile#achievements",
        });
      }
    }
  }

  lastActivityByUser(): Map<string, Date> {
    const last = new Map<string, Date>();
    for (const a of this.activities) {
      const prev = last.get(a.userId);
      if (!prev || a.createdAt > prev) last.set(a.userId, a.createdAt);
    }
    for (const p of this.progress) {
      const prev = last.get(p.userId);
      if (!prev || p.lastViewedAt > prev) last.set(p.userId, p.lastViewedAt);
    }
    return last;
  }
}
