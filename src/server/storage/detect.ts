import "server-only";
import type { DetectedType } from "@/lib/upload-rules";

const startsWith = (buf: Buffer, bytes: number[], offset = 0) =>
  buf.length >= offset + bytes.length && bytes.every((b, i) => buf[offset + i] === b);
const ascii = (buf: Buffer, start: number, end: number) => buf.subarray(start, end).toString("latin1");

/**
 * Identifies a file from its leading bytes. The browser-supplied MIME type and
 * file extension are never trusted for security decisions.
 */
export function detectFileType(head: Buffer, filename: string): DetectedType | null {
  if (startsWith(head, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (ascii(head, 0, 6) === "GIF87a" || ascii(head, 0, 6) === "GIF89a") return "image/gif";
  if (ascii(head, 0, 4) === "RIFF" && ascii(head, 8, 12) === "WEBP") return "image/webp";
  if (ascii(head, 0, 4) === "RIFF" && ascii(head, 8, 12) === "WAVE") return "audio/wav";
  if (ascii(head, 0, 5) === "%PDF-") return "application/pdf";
  if (ascii(head, 0, 4) === "OggS") return "audio/ogg";
  if (startsWith(head, [0x1a, 0x45, 0xdf, 0xa3])) return "video/webm";
  if (ascii(head, 4, 8) === "ftyp") {
    const brand = ascii(head, 8, 12);
    if (brand === "qt  ") return "video/quicktime";
    if (brand.startsWith("M4A") || brand.startsWith("M4B")) return "audio/mp4";
    return "video/mp4";
  }
  if (ascii(head, 0, 3) === "ID3" || startsWith(head, [0xff, 0xfb]) || startsWith(head, [0xff, 0xf3]) || startsWith(head, [0xff, 0xf2]))
    return "audio/mpeg";
  if (startsWith(head, [0x50, 0x4b, 0x03, 0x04]) && /\.(docx|pptx|xlsx)$/i.test(filename)) return "application/zip-office";
  if (startsWith(head, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]) && /\.(doc|ppt|xls)$/i.test(filename))
    return "application/msword-legacy";
  if (/\.(txt|md)$/i.test(filename) && !head.includes(0)) return "text/plain";
  return null;
}

/** The Content-Type we serve the file with (never text/html or anything executable). */
export function servedContentType(detected: DetectedType, filename: string): string {
  if (detected === "application/zip-office") {
    if (/\.docx$/i.test(filename)) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (/\.pptx$/i.test(filename)) return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
  if (detected === "application/msword-legacy") {
    if (/\.ppt$/i.test(filename)) return "application/vnd.ms-powerpoint";
    if (/\.xls$/i.test(filename)) return "application/vnd.ms-excel";
    return "application/msword";
  }
  if (detected === "text/plain") return "text/plain; charset=utf-8";
  return detected;
}
