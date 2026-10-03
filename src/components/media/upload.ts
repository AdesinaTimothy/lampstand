"use client";

import { UPLOAD_RULES, type UploadPurpose } from "@/lib/upload-rules";
import { formatBytes } from "@/lib/format";

export type UploadedAsset = {
  id: string;
  url: string;
  kind: "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT";
  mimeType: string;
  sizeBytes: number;
  originalName: string;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
};

/** Reads media duration in the browser so the server can store it. */
export function probeDuration(file: File): Promise<number | null> {
  if (!file.type.startsWith("video/") && !file.type.startsWith("audio/")) return Promise.resolve(null);
  return new Promise((resolve) => {
    const el = document.createElement(file.type.startsWith("video/") ? "video" : "audio");
    const url = URL.createObjectURL(file);
    const done = (v: number | null) => {
      URL.revokeObjectURL(url);
      resolve(v);
    };
    el.preload = "metadata";
    el.onloadedmetadata = () => done(Number.isFinite(el.duration) ? el.duration : null);
    el.onerror = () => done(null);
    el.src = url;
    setTimeout(() => done(null), 8000);
  });
}

export function validateFile(file: File, purpose: UploadPurpose): string | null {
  const rules = UPLOAD_RULES[purpose];
  if (file.size === 0) return "That file is empty.";
  if (file.size > rules.maxBytes) return `That file is too large (${formatBytes(file.size)}). The limit is ${formatBytes(rules.maxBytes)}.`;
  return null;
}

/**
 * Uploads with progress reporting (XHR, since fetch has no upload progress).
 * Returns an abort function alongside the promise.
 */
export function uploadFile(
  file: File,
  purpose: UploadPurpose,
  opts: { onProgress?: (fraction: number) => void; durationSeconds?: number | null } = {},
): { promise: Promise<UploadedAsset>; abort: () => void } {
  const xhr = new XMLHttpRequest();
  const promise = new Promise<UploadedAsset>((resolve, reject) => {
    xhr.open("POST", `/api/uploads?purpose=${purpose}`);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.setRequestHeader("X-File-Name", encodeURIComponent(file.name));
    if (opts.durationSeconds) xhr.setRequestHeader("X-Media-Duration", String(opts.durationSeconds));
    xhr.upload.onprogress = (e) => e.lengthComputable && opts.onProgress?.(e.loaded / e.total);
    xhr.onload = () => {
      let body: { error?: string } & Partial<UploadedAsset> = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300) resolve(body as UploadedAsset);
      else if (xhr.status === 401) reject(new Error("Your session expired. Please sign in again."));
      else reject(new Error(body.error ?? "The upload failed. Please try again."));
    };
    xhr.onerror = () => reject(new Error("Network error — check your connection and try again."));
    xhr.onabort = () => reject(new DOMException("Upload cancelled", "AbortError"));
    xhr.send(file);
  });
  return { promise, abort: () => xhr.abort() };
}
