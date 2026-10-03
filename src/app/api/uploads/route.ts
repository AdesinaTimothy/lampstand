import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { UPLOAD_PURPOSES, type UploadPurpose } from "@/lib/upload-rules";
import { requireViewer } from "@/server/auth/guards";
import { assertSameOrigin, errorResponse } from "@/server/http";
import { enforceRateLimit } from "@/server/rate-limit";
import { storeUpload } from "@/server/services/media";
import { mediaUrl } from "@/server/storage/urls";

export const runtime = "nodejs";

/**
 * Raw-body upload: the file is streamed straight to storage (never buffered as
 * multipart), so large videos don't exhaust server memory.
 *   POST /api/uploads?purpose=lesson-video
 *   Headers: Content-Type, X-File-Name (URI-encoded), X-Media-Duration (optional)
 */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const viewer = await requireViewer();
    const url = new URL(request.url);
    const purpose = url.searchParams.get("purpose") as UploadPurpose | null;
    if (!purpose || !UPLOAD_PURPOSES.includes(purpose)) throw new AppError("VALIDATION", "Unknown upload type.");
    await enforceRateLimit(`upload:${viewer.id}`, 60, 60 * 60, "Upload limit reached. Please try again later.");
    if (!request.body) throw new AppError("VALIDATION", "No file received.");

    const filename = decodeURIComponent(request.headers.get("x-file-name") ?? "upload");
    const duration = Number(request.headers.get("x-media-duration"));
    const asset = await storeUpload(viewer, purpose, {
      body: request.body,
      filename,
      durationSeconds: Number.isFinite(duration) && duration > 0 ? duration : null,
    });
    return NextResponse.json({
      id: asset.id,
      url: mediaUrl(asset.id),
      kind: asset.kind,
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes,
      originalName: asset.originalName,
      durationSeconds: asset.durationSeconds,
      width: asset.width,
      height: asset.height,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
