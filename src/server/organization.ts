import "server-only";
import { cache } from "react";
import { db } from "./db";
import { env } from "./env";

/**
 * Resolves the organization this deployment serves. Kept behind one function so
 * host-based multi-tenancy can replace it without touching callers.
 */
export const getCurrentOrganization = cache(async () => {
  const org = await db.organization.findUnique({
    where: { slug: env.APP_ORGANIZATION_SLUG },
    include: { logo: { select: { id: true } } },
  });
  if (!org) {
    throw new Error(
      `Organization "${env.APP_ORGANIZATION_SLUG}" not found. Run \`npm run db:seed\` or set APP_ORGANIZATION_SLUG.`,
    );
  }
  return org;
});

export type CurrentOrganization = Awaited<ReturnType<typeof getCurrentOrganization>>;
