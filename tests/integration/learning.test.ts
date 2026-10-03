import { beforeAll, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { enrollInCourse } from "@/server/services/enrollment";
import { markLessonComplete, recordLessonView, saveMediaProgress } from "@/server/services/progress";
import { submitQuizAttempt } from "@/server/services/quiz";
import { findPublicCertificate, logVerification, revokeCertificate } from "@/server/services/certificates";
import type { Viewer } from "@/server/auth/viewer";
import { createMember, createOrg, createPublishedCourse, resetDatabase } from "./fixtures";

let instructor: Viewer;
let learner: Viewer;
let admin: Viewer;
let fx: Awaited<ReturnType<typeof createPublishedCourse>>;

/** Pretend `seconds` have passed since the last heartbeat. */
async function age(lessonId: string, userId: string, seconds: number) {
  await db.lessonProgress.update({
    where: { userId_lessonId: { userId, lessonId } },
    data: { lastViewedAt: new Date(Date.now() - seconds * 1000) },
  });
}

beforeAll(async () => {
  await resetDatabase();
  const org = await createOrg();
  instructor = await createMember(org.id, "INSTRUCTOR", { name: "Pastor Instructor" });
  learner = await createMember(org.id, "LEARNER", { name: "Lydia Learner" });
  admin = await createMember(org.id, "ADMIN");
  fx = await createPublishedCourse(org.id, instructor);
});

describe("learner journey", () => {
  it("enrols once, idempotently, and counts the enrolment", async () => {
    await enrollInCourse(learner, fx.course.id);
    await enrollInCourse(learner, fx.course.id);
    const course = await db.course.findUniqueOrThrow({ where: { id: fx.course.id } });
    expect(course.enrollmentCount).toBe(1);
    expect(await db.notification.count({ where: { userId: learner.id, type: "ENROLLED" } })).toBe(1);
  });

  it("does not complete a lesson just because it was opened", async () => {
    await recordLessonView(learner, fx.reading.id);
    const p = await db.lessonProgress.findUniqueOrThrow({ where: { userId_lessonId: { userId: learner.id, lessonId: fx.reading.id } } });
    expect(p.status).toBe("IN_PROGRESS");
    const e = await db.enrollment.findFirstOrThrow({ where: { userId: learner.id } });
    expect(e.lastLessonId).toBe(fx.reading.id);
    expect(e.progressPercent).toBe(0);
  });

  it("completes reading lessons explicitly and updates progress over required lessons only", async () => {
    await markLessonComplete(learner, fx.reading.id);
    await markLessonComplete(learner, fx.optional.id);
    const e = await db.enrollment.findFirstOrThrow({ where: { userId: learner.id } });
    expect(e.progressPercent).toBe(33); // 1 of 3 required
  });

  it("requires every question to be answered", async () => {
    await expect(submitQuizAttempt(learner, fx.quizLesson.id, {})).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("refuses to mark quizzes complete without a passing attempt", async () => {
    await expect(markLessonComplete(learner, fx.quizLesson.id)).rejects.toBeTruthy();
  });

  it("grades quizzes server-side and completes the lesson on a pass", async () => {
    const [q1, q2] = fx.questions;
    const wrong = q1!.options.find((o) => !o.isCorrect)!.id;
    const pride = q2!.options.find((o) => !o.isCorrect)!.id;
    const fail = await submitQuizAttempt(learner, fx.quizLesson.id, { [q1!.id]: [wrong], [q2!.id]: [pride] });
    expect(fail).toMatchObject({ passed: false, score: 0, attemptNumber: 1, attemptsRemaining: 2 });

    const right = q2!.options.filter((o) => o.isCorrect).map((o) => o.id);
    const pass = await submitQuizAttempt(learner, fx.quizLesson.id, { [q1!.id]: [wrong], [q2!.id]: right });
    expect(pass).toMatchObject({ passed: true, score: 50, attemptNumber: 2 });
    expect(pass.review?.length).toBe(2);

    const p = await db.lessonProgress.findUniqueOrThrow({ where: { userId_lessonId: { userId: learner.id, lessonId: fx.quizLesson.id } } });
    expect(p.status).toBe("COMPLETED");
  });

  it("does not credit a video when the learner seeks to the end", async () => {
    await saveMediaProgress(learner, { lessonId: fx.videoLesson.id, positionSeconds: 2 });
    await age(fx.videoLesson.id, learner.id, 5);
    const r = await saveMediaProgress(learner, { lessonId: fx.videoLesson.id, positionSeconds: 59 });
    expect(r.completed).toBe(false);
    expect(r.watchedSeconds).toBeLessThan(54);
  });

  it("completes the video after plausible watching, finishes the course and issues one certificate", async () => {
    for (const pos of [20, 40, 56]) {
      await age(fx.videoLesson.id, learner.id, 20);
      await saveMediaProgress(learner, { lessonId: fx.videoLesson.id, positionSeconds: pos });
    }
    const e = await db.enrollment.findFirstOrThrow({ where: { userId: learner.id }, include: { certificate: true } });
    expect(e.status).toBe("COMPLETED");
    expect(e.progressPercent).toBe(100);
    expect(e.certificate?.recipientName).toBe("Lydia Learner");
    expect(e.certificate?.instructorName).toBe("Pastor Instructor");
    expect(await db.certificate.count({ where: { userId: learner.id } })).toBe(1);

    // Further heartbeats or completions never issue a second certificate.
    await age(fx.videoLesson.id, learner.id, 20);
    await saveMediaProgress(learner, { lessonId: fx.videoLesson.id, positionSeconds: 60 });
    await markLessonComplete(learner, fx.reading.id);
    expect(await db.certificate.count({ where: { userId: learner.id } })).toBe(1);

    const types = (await db.notification.findMany({ where: { userId: learner.id } })).map((n) => n.type);
    expect(types).toEqual(expect.arrayContaining(["COURSE_COMPLETED", "CERTIFICATE_ISSUED"]));
    expect(await db.userAchievement.count({ where: { userId: learner.id } })).toBeGreaterThan(0);
  });

  it("verifies certificates publicly without exposing private data", async () => {
    const cert = await db.certificate.findFirstOrThrow({ where: { userId: learner.id } });
    const pub = await findPublicCertificate(cert.code.toLowerCase().replace(/-/g, " "));
    expect(pub).toMatchObject({ status: "VALID", recipientName: "Lydia Learner", courseTitle: "Walking in Grace" });
    const json = JSON.stringify(pub);
    expect(json).not.toContain(learner.email);
    expect(json).not.toContain(learner.id);

    await logVerification(cert.code, { ipAddress: "203.0.113.9", userAgent: "test" });
    const v = await db.certificateVerification.findFirstOrThrow({ where: { certificateId: cert.id } });
    expect(v.ipHash).not.toContain("203.0.113.9");

    expect(await findPublicCertificate("LS-0000-0000-00")).toBeNull();
  });

  it("only staff can revoke certificates, and revocation is audited", async () => {
    const cert = await db.certificate.findFirstOrThrow({ where: { userId: learner.id } });
    await expect(revokeCertificate(learner, cert.id, "Not allowed")).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(revokeCertificate(instructor, cert.id, "Not allowed")).rejects.toMatchObject({ code: "FORBIDDEN" });
    await revokeCertificate(admin, cert.id, "Issued in error during testing");
    expect((await findPublicCertificate(cert.code))?.status).toBe("REVOKED");
    expect(await db.auditLog.count({ where: { entityId: cert.id } })).toBe(1);
  });

  it("refuses progress for learners who aren't enrolled", async () => {
    const stranger = await createMember(learner.organizationId);
    await expect(saveMediaProgress(stranger, { lessonId: fx.videoLesson.id, positionSeconds: 10 })).rejects.toBeTruthy();
    await expect(submitQuizAttempt(stranger, fx.quizLesson.id, {})).rejects.toBeTruthy();
    await recordLessonView(stranger, fx.reading.id); // no-op, not an error
    expect(await db.lessonProgress.count({ where: { userId: stranger.id } })).toBe(0);
  });
});
