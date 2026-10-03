import "server-only";
import { randomBytes } from "node:crypto";
import { Readable } from "node:stream";
import sharp, { type OutputInfo, type Sharp } from "sharp";
import type { MediaAsset } from "@prisma/client";
import { AppError, forbidden } from "@/lib/errors";
import { formatBytes } from "@/lib/format";
import { UPLOAD_RULES, type UploadPurpose } from "@/lib/upload-rules";
import { db } from "../db";
import { getStorage } from "../storage";
import { detectFileType, servedContentType } from "../storage/detect";
import { can, isInstructorOrStaff, isStaff } from "../authz/policies";
import type { Viewer } from "../auth/viewer";

const HEAD_BYTES = 4100;

type UploadInput = {
  body: ReadableStream<Uint8Array> | Readable | Buffer;
  filename: string;
  /** Client-measured media duration (video/audio); bounded and advisory only. */
  durationSeconds?: number | null;
};

function assertMayUpload(viewer: Viewer, purpose: UploadPurpose) {
  switch (purpose) {
    case "avatar":
    case "submission":
      return;
    case "organization-logo":
      if (!can(viewer, "organization:manage")) throw forbidden();
      return;
    default:
      if (!isInstructorOrStaff(viewer)) throw forbidden("Only instructors can upload course content.");
  }
}

function sanitizeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "file";
  return base.replace(/[^\w.\- ()]+/g, "_").slice(0, 120) || "file";
}

async function* chunksOf(body: UploadInput["body"]): AsyncGenerator<Buffer> {
  if (Buffer.isBuffer(body)) {
    yield body;
    return;
  }
  const readable = body instanceof Readable ? body : Readable.fromWeb(body as import("node:stream/web").ReadableStream);
  for await (const chunk of readable) yield Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array);
}

/** Splits a stream into its first bytes (for sniffing) and the full byte-limited stream. */
async function peek(body: UploadInput["body"], maxBytes: number) {
  const iterator = chunksOf(body)[Symbol.asyncIterator]();
  const buffered: Buffer[] = [];
  let headLength = 0;
  let done = false;
  while (headLength < HEAD_BYTES) {
    const next = await iterator.next();
    if (next.done) {
      done = true;
      break;
    }
    buffered.push(next.value);
    headLength += next.value.length;
  }
  const head = Buffer.concat(buffered).subarray(0, HEAD_BYTES);
  let total = 0;
  const tooLarge = () =>
    new AppError("VALIDATION", `That file is too large. The limit is ${formatBytes(maxBytes)}.`);

  async function* all() {
    for (const chunk of buffered) {
      total += chunk.length;
      if (total > maxBytes) throw tooLarge();
      yield chunk;
    }
    if (done) return;
    while (true) {
      const next = await iterator.next();
      if (next.done) return;
      total += next.value.length;
      if (total > maxBytes) throw tooLarge();
      yield next.value;
    }
  }
  return { head, stream: Readable.from(all()) };
}

async function collect(stream: Readable): Promise<Buffer> {
  const parts: Buffer[] = [];
  for await (const chunk of stream) parts.push(chunk as Buffer);
  return Buffer.concat(parts);
}

const IMAGE_TRANSFORMS: Partial<Record<UploadPurpose, (img: Sharp) => Sharp>> = {
  "course-thumbnail": (img) => img.resize(1600, 900, { fit: "cover", position: sharp.strategy.attention }),
  avatar: (img) => img.resize(512, 512, { fit: "cover", position: sharp.strategy.attention }),
  "organization-logo": (img) => img.resize(512, 512, { fit: "inside", withoutEnlargement: true }),
  "editor-image": (img) => img.resize({ width: 1600, withoutEnlargement: true }),
};

export async function storeUpload(viewer: Viewer, purpose: UploadPurpose, input: UploadInput): Promise<MediaAsset> {
  assertMayUpload(viewer, purpose);
  const rules = UPLOAD_RULES[purpose];
  const originalName = sanitizeFilename(input.filename);
  const { head, stream } = await peek(input.body, rules.maxBytes);

  if (head.length === 0) throw new AppError("VALIDATION", "The file is empty.");
  const detected = detectFileType(head, originalName);
  if (!detected || !rules.accept.includes(detected)) {
    throw new AppError("VALIDATION", `That file type isn't supported here. Accepted: ${rules.label}.`);
  }

  const storage = getStorage();
  const now = new Date();
  const id = randomBytes(16).toString("hex");
  const folder = `${viewer.organizationId}/${rules.kind.toLowerCase()}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  let contentType = servedContentType(detected, originalName);
  let width: number | null = null;
  let height: number | null = null;
  let size: number;
  let key: string;

  if (rules.kind === "IMAGE" && detected !== "image/gif") {
    // Re-encode images: normalises format, strips EXIF/GPS metadata and defeats
    // polyglot files.
    const buffer = await collect(stream);
    const transform = IMAGE_TRANSFORMS[purpose] ?? ((img: Sharp) => img);
    let output: { data: Buffer; info: OutputInfo };
    try {
      output = await transform(sharp(buffer, { failOn: "error" }).rotate())
        .webp({ quality: 82 })
        .toBuffer({ resolveWithObject: true });
    } catch {
      throw new AppError("VALIDATION", "That image appears to be damaged or unsupported.");
    }
    width = output.info.width;
    height = output.info.height;
    contentType = "image/webp";
    key = `${folder}/${id}.webp`;
    size = (await storage.put(key, output.data, { contentType })).size;
  } else {
    const ext = originalName.includes(".") ? originalName.split(".").pop()!.toLowerCase().slice(0, 8) : "bin";
    key = `${folder}/${id}.${ext}`;
    size = (await storage.put(key, stream, { contentType })).size;
  }

  const duration =
    (rules.kind === "VIDEO" || rules.kind === "AUDIO") && input.durationSeconds && Number.isFinite(input.durationSeconds)
      ? Math.min(Math.round(input.durationSeconds), 24 * 3600)
      : null;

  return db.mediaAsset.create({
    data: {
      organizationId: viewer.organizationId,
      uploadedById: viewer.id,
      storageProvider: storage.name,
      storageKey: key,
      kind: rules.kind,
      visibility: rules.visibility,
      mimeType: contentType,
      sizeBytes: size,
      originalName,
      width,
      height,
      durationSeconds: duration,
    },
  });
}

/**
 * Decides whether a viewer may read a private asset. Access is derived from what
 * the asset is attached to, so detaching content immediately revokes access.
 */
export async function canAccessAsset(viewer: Viewer | null, asset: MediaAsset): Promise<boolean> {
  if (asset.visibility === "PUBLIC") return true;
  if (!viewer) {
    // Anonymous visitors may stream preview lessons of published courses.
    return isPreviewMedia(asset.id);
  }
  if (asset.organizationId && asset.organizationId !== viewer.organizationId && !viewer.isSuperAdmin) return false;
  if (asset.uploadedById === viewer.id) return true;
  if (isStaff(viewer)) return true;

  const lessons = await db.lesson.findMany({
    where: {
      deletedAt: null,
      OR: [{ mediaId: asset.id }, { resources: { some: { assetId: asset.id } } }],
    },
    select: { id: true, isPreview: true, mediaId: true, courseId: true, course: { select: { status: true } } },
  });
  for (const lesson of lessons) {
    if (lesson.isPreview && lesson.mediaId === asset.id && lesson.course.status === "PUBLISHED") return true;
    const [enrollment, teaching] = await Promise.all([
      db.enrollment.findUnique({
        where: { userId_courseId: { userId: viewer.id, courseId: lesson.courseId } },
        select: { status: true },
      }),
      db.courseInstructor.findUnique({
        where: { courseId_userId: { courseId: lesson.courseId, userId: viewer.id } },
        select: { userId: true },
      }),
    ]);
    if (teaching) return true;
    if (enrollment && enrollment.status !== "DROPPED") return true;
  }

  const submission = await db.assignmentSubmission.findFirst({
    where: { fileId: asset.id },
    select: { userId: true, assignment: { select: { lesson: { select: { courseId: true } } } } },
  });
  if (submission) {
    if (submission.userId === viewer.id) return true;
    const teaching = await db.courseInstructor.findUnique({
      where: {
        courseId_userId: { courseId: submission.assignment.lesson.courseId, userId: viewer.id },
      },
      select: { userId: true },
    });
    return Boolean(teaching);
  }
  return false;
}

async function isPreviewMedia(assetId: string): Promise<boolean> {
  const lesson = await db.lesson.findFirst({
    where: { mediaId: assetId, isPreview: true, deletedAt: null, course: { status: "PUBLISHED", deletedAt: null } },
    select: { id: true },
  });
  return Boolean(lesson);
}
