import "server-only";
import { Readable } from "node:stream";
import { DeleteObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { ByteRange, StorageDriver, StoredObject } from "./types";

type S3Config = {
  bucket: string;
  region: string;
  endpoint?: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
};

/** Works with AWS S3, Cloudflare R2, Backblaze B2, MinIO and other S3-compatible stores. */
export class S3StorageDriver implements StorageDriver {
  readonly name = "s3" as const;
  private readonly client: S3Client;

  constructor(private readonly config: S3Config) {
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint || undefined,
      forcePathStyle: config.forcePathStyle,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
    });
  }

  async put(key: string, body: Buffer | Readable, opts: { contentType: string }) {
    let size = 0;
    const counted = Buffer.isBuffer(body)
      ? ((size = body.length), body)
      : body.on("data", (chunk: Buffer) => {
          size += chunk.length;
        });
    // Multipart upload streams large files without buffering them in memory.
    await new Upload({
      client: this.client,
      params: { Bucket: this.config.bucket, Key: key, Body: counted, ContentType: opts.contentType },
    }).done();
    return { size };
  }

  async get(key: string, range?: ByteRange): Promise<StoredObject | null> {
    try {
      const res = await this.client.send(
        new GetObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
          Range: range ? `bytes=${range.start}-${range.end}` : undefined,
        }),
      );
      if (!res.Body) return null;
      const contentLength = res.ContentLength ?? 0;
      const total = res.ContentRange ? Number(res.ContentRange.split("/")[1]) : contentLength;
      return {
        body: res.Body as Readable,
        size: total,
        contentLength,
        range: range ? { start: range.start, end: range.start + contentLength - 1 } : undefined,
      };
    } catch (error) {
      if ((error as { name?: string }).name === "NoSuchKey") return null;
      throw error;
    }
  }

  async delete(key: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key }));
  }

  async signedUrl(key: string, opts: { expiresInSeconds: number; contentType: string; downloadName?: string }) {
    const disposition = opts.downloadName
      ? `attachment; filename*=UTF-8''${encodeURIComponent(opts.downloadName)}`
      : "inline";
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        ResponseContentType: opts.contentType,
        ResponseContentDisposition: disposition,
      }),
      { expiresIn: opts.expiresInSeconds },
    );
  }
}
