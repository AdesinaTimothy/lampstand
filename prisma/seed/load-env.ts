// Loads .env when the seed is run directly with tsx (`prisma db seed` already does).
// Must be the first import of prisma/seed.ts: src/server/env.ts validates at import time.
import { existsSync } from "node:fs";
import path from "node:path";

const file = path.resolve(process.cwd(), ".env");
if (!process.env.DATABASE_URL && existsSync(file)) {
  process.loadEnvFile(file);
}
