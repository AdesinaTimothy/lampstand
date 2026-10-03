import "server-only";
import { createHmac, randomInt } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { AppError, notFound } from "@/lib/errors";
import { db, type Tx } from "../db";
import { env } from "../env";
import { audit } from "../audit";
import type { Viewer } from "../auth/viewer";
import { assertCan } from "../authz/policies";

// Crockford base32 without ambiguous characters (no I, L, O, U).
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** e.g. "LS-7K2M-9QXP-4T" — 50 bits of randomness, readable aloud, unguessable. */
export function generateCertificateCode(): string {
  const chars = Array.from({ length: 10 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `LS-${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 10)}`;
}

export function normalizeCertificateCode(input: string): string {
  const compact = input.toUpperCase().replace(/[^0-9A-Z]/g, "");
  // Strip the prefix before mapping look-alikes, or the "L" in "LS" becomes "1".
  const body = (compact.startsWith("LS") && compact.length === 12 ? compact.slice(2) : compact).replace(/O/g, "0").replace(/[IL]/g, "1");
  if (body.length !== 10) return input.trim().toUpperCase();
  return `LS-${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8, 10)}`;
}

/**
 * Issues the certificate for a completed enrollment. Idempotent: the unique
 * enrollmentId constraint guarantees at most one certificate per enrollment.
 * Names are snapshotted so later edits don't alter an issued certificate.
 */
export async function issueCertificate(tx: Tx, enrollmentId: string) {
  const existing = await tx.certificate.findUnique({ where: { enrollmentId } });
  if (existing) return { certificate: existing, created: false };

  const enrollment = await tx.enrollment.findUniqueOrThrow({
    where: { id: enrollmentId },
    select: {
      userId: true,
      courseId: true,
      completedAt: true,
      user: { select: { name: true } },
      course: {
        select: {
          title: true,
          certificateEnabled: true,
          organization: {
            select: { name: true, certificateSignatoryName: true, certificateSignatoryTitle: true },
          },
          instructors: {
            orderBy: [{ role: "asc" }, { position: "asc" }],
            take: 1,
            select: { user: { select: { name: true } } },
          },
        },
      },
    },
  });
  if (!enrollment.course.certificateEnabled) return { certificate: null, created: false };

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCertificateCode();
    const clash = await tx.certificate.findUnique({ where: { code }, select: { id: true } });
    if (clash) continue;
    const certificate = await tx.certificate.create({
      data: {
        code,
        enrollmentId,
        userId: enrollment.userId,
        courseId: enrollment.courseId,
        recipientName: enrollment.user.name,
        courseTitle: enrollment.course.title,
        organizationName: enrollment.course.organization.name,
        instructorName: enrollment.course.instructors[0]?.user.name ?? null,
        signatoryName: enrollment.course.organization.certificateSignatoryName,
        signatoryTitle: enrollment.course.organization.certificateSignatoryTitle,
        completedAt: enrollment.completedAt ?? new Date(),
      },
    });
    return { certificate, created: true };
  }
  throw new Error("Could not allocate a unique certificate code");
}

export type PublicCertificate = {
  code: string;
  recipientName: string;
  courseTitle: string;
  organizationName: string;
  instructorName: string | null;
  signatoryName: string | null;
  signatoryTitle: string | null;
  completedAt: Date;
  issuedAt: Date;
  status: "VALID" | "REVOKED";
  revokedAt: Date | null;
  courseSlug: string | null;
};

type CertificateWithCourse = Prisma.CertificateGetPayload<{
  include: { course: { select: { slug: true; status: true; deletedAt: true } } };
}>;

function toPublic(c: CertificateWithCourse): PublicCertificate {
  return {
    code: c.code,
    recipientName: c.recipientName,
    courseTitle: c.courseTitle,
    organizationName: c.organizationName,
    instructorName: c.instructorName,
    signatoryName: c.signatoryName,
    signatoryTitle: c.signatoryTitle,
    completedAt: c.completedAt,
    issuedAt: c.issuedAt,
    status: c.revokedAt ? "REVOKED" : "VALID",
    revokedAt: c.revokedAt,
    courseSlug: c.course.status === "PUBLISHED" && !c.course.deletedAt ? c.course.slug : null,
  };
}

/** Public lookup. Exposes only what's needed to confirm authenticity — never email or user id. */
export async function findPublicCertificate(code: string): Promise<PublicCertificate | null> {
  const cert = await db.certificate.findUnique({
    where: { code: normalizeCertificateCode(code) },
    include: { course: { select: { slug: true, status: true, deletedAt: true } } },
  });
  return cert ? toPublic(cert) : null;
}

export async function logVerification(code: string, meta: { ipAddress: string | null; userAgent: string | null }) {
  const cert = await db.certificate.findUnique({ where: { code: normalizeCertificateCode(code) }, select: { id: true } });
  if (!cert) return;
  const ipHash = meta.ipAddress ? createHmac("sha256", env.APP_SECRET).update(meta.ipAddress).digest("hex").slice(0, 32) : null;
  await db.certificateVerification.create({
    data: { certificateId: cert.id, ipHash, userAgent: meta.userAgent?.slice(0, 200) ?? null },
  });
}

export async function revokeCertificate(viewer: Viewer, certificateId: string, reason: string) {
  assertCan(viewer, "certificate:manage");
  const cert = await db.certificate.findFirst({
    where: { id: certificateId, course: { organizationId: viewer.organizationId } },
    select: { id: true, revokedAt: true, code: true },
  });
  if (!cert) throw notFound("Certificate");
  if (cert.revokedAt) throw new AppError("CONFLICT", "This certificate is already revoked.");
  await db.$transaction(async (tx) => {
    await tx.certificate.update({ where: { id: cert.id }, data: { revokedAt: new Date(), revokedReason: reason } });
    await audit(viewer, "certificate.revoked", { type: "Certificate", id: cert.id }, { code: cert.code, reason }, tx);
  });
}
