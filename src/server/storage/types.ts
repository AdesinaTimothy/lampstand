import type { Readable } from "node:stream";

export type ByteRange = { start: number; end: number };

export type StoredObject = {
  body: Readable;
  size: number; // total object size
  contentLength: number; // bytes in this response (range-aware)
  range?: ByteRange;
};

export interface StorageDriver {
  readonly name: "local" | "s3";
  put(key: string, body: Buffer | Readable, opts: { contentType: string }): Promise<{ size: number }>;
  get(key: string, range?: ByteRange): Promise<StoredObject | null>;
  delete(key: string): Promise<void>;
  /**
   * A short-lived direct URL for the object when the provider supports it
   * (lets the CDN/provider serve large media instead of the app). Null = stream via app.
   */
  signedUrl(key: string, opts: { expiresInSeconds: number; contentType: string; downloadName?: string }): Promise<string | null>;
}
