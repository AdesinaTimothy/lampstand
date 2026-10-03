import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { getViewer } from "@/server/auth/viewer";
import { db } from "@/server/db";
import { canAccessAsset } from "@/server/services/media";
import { getStorage } from "@/server/storage";

export const runtime = "nodejs";

/**
 * Serves media with access control and HTTP range support (video seeking).
 * Private files on S3 are redirected to a short-lived signed URL so the app
 * server doesn't proxy large media in production.
 */
export async function GET(request: Request, ctx: RouteContext<"/api/media/[assetId]">) {
  const { assetId } = await ctx.params;
  const asset = await db.mediaAsset.findUnique({ where: { id: assetId } });
  if (!asset) return new NextResponse("Not found", { status: 404 });

  const viewer = asset.visibility === "PUBLIC" ? null : await getViewer();
  if (!(await canAccessAsset(viewer, asset))) {
    return new NextResponse(viewer ? "Forbidden" : "Unauthorized", { status: viewer ? 403 : 401 });
  }

  const download = new URL(request.url).searchParams.get("download") === "1";
  const storage = getStorage();
  const cacheControl = asset.visibility === "PUBLIC" ? "public, max-age=31536000, immutable" : "private, max-age=3600";

  const signed = await storage.signedUrl(asset.storageKey, {
    expiresInSeconds: 3600,
    contentType: asset.mimeType,
    downloadName: download ? asset.originalName : undefined,
  });
  if (signed) return NextResponse.redirect(signed, { status: 302, headers: { "Cache-Control": "private, max-age=300" } });

  const rangeHeader = request.headers.get("range");
  let range: { start: number; end: number } | undefined;
  if (rangeHeader) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
    if (match) {
      const start = match[1] ? Number(match[1]) : Math.max(0, asset.sizeBytes - Number(match[2]));
      const end = match[1] && match[2] ? Number(match[2]) : asset.sizeBytes - 1;
      if (start >= asset.sizeBytes || start > end) {
        return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${asset.sizeBytes}` } });
      }
      range = { start, end: Math.min(end, asset.sizeBytes - 1) };
    }
  }

  const object = await storage.get(asset.storageKey, range);
  if (!object) return new NextResponse("Not found", { status: 404 });

  const headers = new Headers({
    "Content-Type": asset.mimeType,
    "Content-Length": String(object.contentLength),
    "Accept-Ranges": "bytes",
    "Cache-Control": cacheControl,
    "X-Content-Type-Options": "nosniff",
    // Uploaded files are data, never documents that can run script in our origin.
    "Content-Security-Policy":
      asset.mimeType === "application/pdf"
        ? "default-src 'none'; frame-ancestors 'self'"
        : "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'self'; sandbox",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "no-referrer",
    "Content-Disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(asset.originalName)}`,
  });
  if (object.range) headers.set("Content-Range", `bytes ${object.range.start}-${object.range.end}/${object.size}`);

  return new NextResponse(Readable.toWeb(object.body) as ReadableStream, { status: object.range ? 206 : 200, headers });
}
