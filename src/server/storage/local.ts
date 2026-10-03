import "server-only";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ByteRange, StorageDriver, StoredObject } from "./types";

/** Filesystem driver for development and single-server deployments. */
export class LocalStorageDriver implements StorageDriver {
  readonly name = "local" as const;
  private readonly root: string;

  constructor(root: string) {
    this.root = path.resolve(root);
  }

  private resolve(key: string): string {
    // Keys are generated server-side, but never trust them to stay inside root.
    const full = path.resolve(this.root, key);
    if (!full.startsWith(this.root + path.sep)) throw new Error("Invalid storage key");
    return full;
  }

  async put(key: string, body: Buffer | Readable, _opts: { contentType: string }) {
    const full = this.resolve(key);
    await mkdir(path.dirname(full), { recursive: true });
    const source = Buffer.isBuffer(body) ? Readable.from(body) : body;
    await pipeline(source, createWriteStream(full, { flags: "wx" }));
    const info = await stat(full);
    return { size: info.size };
  }

  async get(key: string, range?: ByteRange): Promise<StoredObject | null> {
    const full = this.resolve(key);
    let size: number;
    try {
      size = (await stat(full)).size;
    } catch {
      return null;
    }
    if (range) {
      const end = Math.min(range.end, size - 1);
      return {
        body: createReadStream(full, { start: range.start, end }),
        size,
        contentLength: end - range.start + 1,
        range: { start: range.start, end },
      };
    }
    return { body: createReadStream(full), size, contentLength: size };
  }

  async delete(key: string) {
    await rm(this.resolve(key), { force: true });
  }

  async signedUrl() {
    return null;
  }
}
