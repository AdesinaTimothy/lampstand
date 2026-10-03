// Seeds the demo church when the database has no organization yet, or when the
// demo media files are gone (free hosting has no persistent disk, so uploads
// vanish on restart). An existing deployment with its files intact is never wiped.
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const organizations = await prisma.organization.count();
  const asset = await prisma.mediaAsset.findFirst({ select: { storageKey: true } });
  await prisma.$disconnect();

  const storageDir = path.resolve(process.env.STORAGE_LOCAL_DIR ?? "./storage");
  const mediaMissing =
    process.env.STORAGE_DRIVER !== "s3" && asset !== null && !existsSync(path.join(storageDir, asset.storageKey));

  if (organizations > 0 && !mediaMissing) {
    console.log("seed-if-empty: data already present, skipping demo seed");
    return;
  }
  console.log(mediaMissing ? "seed-if-empty: demo media missing, reseeding" : "seed-if-empty: empty database, seeding demo church");
  execSync("npm run db:seed", { stdio: "inherit" });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
