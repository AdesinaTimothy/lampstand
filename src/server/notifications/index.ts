import "server-only";
import type { NotificationType } from "@prisma/client";
import { db } from "../db";
import { env } from "../env";
import { sendEmail } from "../mail";
import { emailTemplates } from "../mail/templates";
import { getCurrentOrganization } from "../organization";

type NotifyInput = {
  type: NotificationType;
  title: string;
  body?: string;
  href?: string;
  /** Also email the user (respects their email preference unless `force`). */
  email?: boolean | { cta?: string; force?: boolean };
};

/**
 * Single entry point for user-facing notifications. In-app notifications are
 * always created; email fan-out is opt-in per event and per user preference.
 */
export async function notify(userId: string, input: NotifyInput): Promise<void> {
  await db.notification.create({
    data: { userId, type: input.type, title: input.title, body: input.body, href: input.href },
  });
  if (!input.email) return;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, emailNotifications: true, deletedAt: true },
  });
  if (!user || user.deletedAt) return;
  const options = typeof input.email === "object" ? input.email : {};
  if (!user.emailNotifications && !options.force) return;

  const org = await getCurrentOrganization();
  await sendEmail(
    user.email,
    `notification.${input.type.toLowerCase()}`,
    emailTemplates.notification({
      org: org.name,
      title: input.title,
      body: input.body,
      url: input.href ? new URL(input.href, env.APP_URL).toString() : null,
      cta: options.cta,
    }),
  );
}

/** Fan-out to many users (announcements, new course). Batched insert, no email storm. */
export async function notifyMany(userIds: string[], input: Omit<NotifyInput, "email">): Promise<number> {
  if (userIds.length === 0) return 0;
  const result = await db.notification.createMany({
    data: userIds.map((userId) => ({ userId, type: input.type, title: input.title, body: input.body, href: input.href })),
  });
  return result.count;
}
