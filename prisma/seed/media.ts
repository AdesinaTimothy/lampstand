// Uploads seed media through the app's storage driver and records MediaAsset rows.
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { AssetKind, AssetVisibility, PrismaClient } from "@prisma/client";
import { getStorage } from "@/server/storage";
import { renderStudyGuide } from "./pdf";
import { renderThumbnail, THUMB_HEIGHT, THUMB_WIDTH } from "./thumbnails";
import type { MediaKey, StudyGuide, ThumbnailMotif } from "./types";

const ASSET_DIR = path.resolve(__dirname, "..", "seed-assets");

/** Exact durations of the bundled sample files (verified with ffprobe). */
const SEED_MEDIA: Record<MediaKey, { file: string; kind: AssetKind; mimeType: string; durationSeconds: number; originalName: string }> = {
  "teaching-1": { file: "teaching-1.mp4", kind: "VIDEO", mimeType: "video/mp4", durationSeconds: 48, originalName: "teaching-session-1.mp4" },
  "teaching-2": { file: "teaching-2.mp4", kind: "VIDEO", mimeType: "video/mp4", durationSeconds: 72, originalName: "teaching-session-2.mp4" },
  "teaching-3": { file: "teaching-3.mp4", kind: "VIDEO", mimeType: "video/mp4", durationSeconds: 96, originalName: "teaching-session-3.mp4" },
  "devotional-audio": { file: "devotional-audio.mp3", kind: "AUDIO", mimeType: "audio/mpeg", durationSeconds: 75, originalName: "devotional.mp3" },
};

export type StoredAsset = { id: string; durationSeconds: number | null };

export class MediaLibrary {
  private readonly storage = getStorage();
  private readonly guides = new Map<string, StoredAsset>();
  readonly media = new Map<MediaKey, StoredAsset>();

  constructor(
    private readonly db: PrismaClient,
    private readonly organizationId: string,
    private readonly organizationName: string,
  ) {}

  private async store(input: {
    key: string;
    body: Buffer;
    kind: AssetKind;
    visibility: AssetVisibility;
    mimeType: string;
    originalName: string;
    uploadedById: string;
    createdAt: Date;
    width?: number;
    height?: number;
    durationSeconds?: number;
  }): Promise<StoredAsset> {
    const { size } = await this.storage.put(input.key, input.body, { contentType: input.mimeType });
    const asset = await this.db.mediaAsset.create({
      data: {
        organizationId: this.organizationId,
        uploadedById: input.uploadedById,
        storageProvider: this.storage.name,
        storageKey: input.key,
        kind: input.kind,
        visibility: input.visibility,
        mimeType: input.mimeType,
        sizeBytes: size,
        originalName: input.originalName,
        width: input.width ?? null,
        height: input.height ?? null,
        durationSeconds: input.durationSeconds ?? null,
        createdAt: input.createdAt,
      },
      select: { id: true, durationSeconds: true },
    });
    return asset;
  }

  async uploadLessonMedia(uploadedById: string, createdAt: Date) {
    for (const [key, meta] of Object.entries(SEED_MEDIA) as [MediaKey, (typeof SEED_MEDIA)[MediaKey]][]) {
      const body = await readFile(path.join(ASSET_DIR, meta.file));
      const asset = await this.store({
        key: `${this.organizationId}/${meta.kind.toLowerCase()}/seed/${meta.file}`,
        body,
        kind: meta.kind,
        visibility: "PRIVATE",
        mimeType: meta.mimeType,
        originalName: meta.originalName,
        uploadedById,
        createdAt,
        durationSeconds: meta.durationSeconds,
      });
      this.media.set(key, asset);
    }
  }

  mediaFor(key: MediaKey): StoredAsset {
    const asset = this.media.get(key);
    if (!asset) throw new Error(`Seed media ${key} not uploaded`);
    return asset;
  }

  async thumbnail(slug: string, motif: ThumbnailMotif, uploadedById: string, createdAt: Date): Promise<StoredAsset> {
    const body = await renderThumbnail(motif);
    return this.store({
      key: `${this.organizationId}/image/seed/${slug}.webp`,
      body,
      kind: "IMAGE",
      visibility: "PUBLIC",
      mimeType: "image/webp",
      originalName: `${slug}.webp`,
      uploadedById,
      createdAt,
      width: THUMB_WIDTH,
      height: THUMB_HEIGHT,
    });
  }

  /** Renders a study guide once and reuses the asset wherever the guide appears. */
  async guide(guide: StudyGuide, uploadedById: string, createdAt: Date): Promise<StoredAsset> {
    const existing = this.guides.get(guide.file);
    if (existing) return existing;
    const body = await renderStudyGuide(guide, this.organizationName);
    const asset = await this.store({
      key: `${this.organizationId}/document/seed/${guide.file}.pdf`,
      body,
      kind: "DOCUMENT",
      visibility: "PRIVATE",
      mimeType: "application/pdf",
      originalName: `${guide.file}.pdf`,
      uploadedById,
      createdAt,
    });
    this.guides.set(guide.file, asset);
    return asset;
  }
}
