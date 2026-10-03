import "server-only";
import { env } from "../env";
import { LocalStorageDriver } from "./local";
import { S3StorageDriver } from "./s3";
import type { StorageDriver } from "./types";

let driver: StorageDriver | null = null;

export function getStorage(): StorageDriver {
  if (driver) return driver;
  driver =
    env.STORAGE_DRIVER === "s3"
      ? new S3StorageDriver({
          bucket: env.S3_BUCKET!,
          region: env.S3_REGION,
          endpoint: env.S3_ENDPOINT,
          accessKeyId: env.S3_ACCESS_KEY_ID!,
          secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
          forcePathStyle: env.S3_FORCE_PATH_STYLE,
        })
      : new LocalStorageDriver(env.STORAGE_LOCAL_DIR);
  return driver;
}

export type { StorageDriver } from "./types";
