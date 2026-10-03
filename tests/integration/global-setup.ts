import { execSync } from "node:child_process";

/** Brings the test database schema up to date before integration tests run. */
export default function setup() {
  const url = process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/lampstand_test?schema=public";
  execSync("npx prisma migrate deploy", { stdio: "inherit", env: { ...process.env, DATABASE_URL: url } });
}
