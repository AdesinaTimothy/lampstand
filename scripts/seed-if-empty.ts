// Seeds the demo church only when the database has no organization yet, so a
// fresh hosted demo boots with content and an existing deployment is never wiped.
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const organizations = await prisma.organization.count();
  await prisma.$disconnect();
  if (organizations > 0) {
    console.log("seed-if-empty: data already present, skipping demo seed");
    return;
  }
  console.log("seed-if-empty: empty database, seeding demo church");
  execSync("npm run db:seed", { stdio: "inherit" });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
