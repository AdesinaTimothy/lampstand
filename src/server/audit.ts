import "server-only";
import type { Prisma } from "@prisma/client";
import { db, type DbClient } from "./db";
import { getRequestMeta } from "./request";
import type { Viewer } from "./auth/viewer";

/** Records a sensitive administrative action. Call inside the same transaction when possible. */
export async function audit(
  actor: Pick<Viewer, "id" | "organizationId"> | null,
  action: string,
  entity: { type: string; id?: string | null },
  metadata?: Prisma.InputJsonValue,
  client: DbClient = db,
): Promise<void> {
  let ipAddress: string | null = null;
  try {
    ipAddress = (await getRequestMeta()).ipAddress;
  } catch {
    // Outside a request (scripts/tests).
  }
  await client.auditLog.create({
    data: {
      organizationId: actor?.organizationId ?? null,
      actorId: actor?.id ?? null,
      action,
      entityType: entity.type,
      entityId: entity.id ?? null,
      metadata,
      ipAddress,
    },
  });
}
