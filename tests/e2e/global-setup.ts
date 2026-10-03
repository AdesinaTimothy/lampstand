import { PrismaClient } from "@prisma/client";

/** Every test signs in from 127.0.0.1; start each run with fresh rate-limit windows. */
export default async function globalSetup() {
  const db = new PrismaClient();
  try {
    await db.rateLimit.deleteMany({});
  } finally {
    await db.$disconnect();
  }
}
