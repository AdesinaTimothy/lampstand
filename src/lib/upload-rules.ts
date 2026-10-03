// Upload purposes and their limits. Shared by the client (early feedback) and the
// server (enforcement — the server never trusts the client's checks).
import type { AssetKind } from "@prisma/client";

export const UPLOAD_PURPOSES = [
  "course-thumbnail",
  "avatar",
  "organization-logo",
  "editor-image",
  "lesson-video",
  "lesson-audio",
  "lesson-document",
  "lesson-resource",
  "submission",
] as const;
export type UploadPurpose = (typeof UPLOAD_PURPOSES)[number];

const MB = 1024 * 1024;

export type DetectedType =
  | "image/jpeg"
  | "image/png"
  | "image/gif"
  | "image/webp"
  | "application/pdf"
  | "video/mp4"
  | "video/quicktime"
  | "video/webm"
  | "audio/mpeg"
  | "audio/mp4"
  | "audio/wav"
  | "audio/ogg"
  | "application/zip-office"
  | "application/msword-legacy"
  | "text/plain";

export const UPLOAD_RULES: Record<
  UploadPurpose,
  { kind: AssetKind; maxBytes: number; accept: DetectedType[]; visibility: "PUBLIC" | "PRIVATE"; label: string; inputAccept: string }
> = {
  "course-thumbnail": {
    kind: "IMAGE",
    maxBytes: 10 * MB,
    accept: ["image/jpeg", "image/png", "image/webp"],
    visibility: "PUBLIC",
    label: "JPG, PNG or WebP up to 10 MB",
    inputAccept: "image/jpeg,image/png,image/webp",
  },
  avatar: {
    kind: "IMAGE",
    maxBytes: 5 * MB,
    accept: ["image/jpeg", "image/png", "image/webp"],
    visibility: "PUBLIC",
    label: "JPG, PNG or WebP up to 5 MB",
    inputAccept: "image/jpeg,image/png,image/webp",
  },
  "organization-logo": {
    kind: "IMAGE",
    maxBytes: 5 * MB,
    accept: ["image/jpeg", "image/png", "image/webp"],
    visibility: "PUBLIC",
    label: "JPG, PNG or WebP up to 5 MB",
    inputAccept: "image/jpeg,image/png,image/webp",
  },
  "editor-image": {
    kind: "IMAGE",
    maxBytes: 10 * MB,
    accept: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    visibility: "PUBLIC",
    label: "JPG, PNG, GIF or WebP up to 10 MB",
    inputAccept: "image/jpeg,image/png,image/webp,image/gif",
  },
  "lesson-video": {
    kind: "VIDEO",
    maxBytes: 2048 * MB,
    accept: ["video/mp4", "video/quicktime", "video/webm"],
    visibility: "PRIVATE",
    label: "MP4, MOV or WebM up to 2 GB",
    inputAccept: "video/mp4,video/quicktime,video/webm",
  },
  "lesson-audio": {
    kind: "AUDIO",
    maxBytes: 300 * MB,
    accept: ["audio/mpeg", "audio/mp4", "audio/wav", "audio/ogg"],
    visibility: "PRIVATE",
    label: "MP3, M4A, WAV or OGG up to 300 MB",
    inputAccept: "audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/ogg",
  },
  "lesson-document": {
    kind: "DOCUMENT",
    maxBytes: 100 * MB,
    accept: ["application/pdf"],
    visibility: "PRIVATE",
    label: "PDF up to 100 MB",
    inputAccept: "application/pdf",
  },
  "lesson-resource": {
    kind: "DOCUMENT",
    maxBytes: 100 * MB,
    accept: [
      "application/pdf",
      "application/zip-office",
      "application/msword-legacy",
      "text/plain",
      "image/jpeg",
      "image/png",
      "audio/mpeg",
    ],
    visibility: "PRIVATE",
    label: "PDF, Word, PowerPoint, Excel, text, images or MP3 up to 100 MB",
    inputAccept: ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.mp3",
  },
  submission: {
    kind: "DOCUMENT",
    maxBytes: 25 * MB,
    accept: ["application/pdf", "application/zip-office", "application/msword-legacy", "text/plain", "image/jpeg", "image/png"],
    visibility: "PRIVATE",
    label: "PDF, Word, text or images up to 25 MB",
    inputAccept: ".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png",
  },
};
