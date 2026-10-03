import "server-only";
import nodemailer from "nodemailer";
import { db } from "../db";
import { env } from "../env";
import type { EmailContent } from "./templates";

interface MailTransport {
  send(message: { to: string; subject: string; html: string; text: string }): Promise<void>;
}

const logTransport: MailTransport = {
  async send(message) {
    // Development transport: the outbox row is the source of truth (see /dev/mail).
    console.info(`[mail] → ${message.to}: ${message.subject}`);
  },
};

function smtpTransport(): MailTransport {
  const transporter = nodemailer.createTransport(env.SMTP_URL!);
  return {
    async send(message) {
      await transporter.sendMail({ from: env.MAIL_FROM, ...message });
    },
  };
}

let transport: MailTransport | null = null;
const getTransport = () => (transport ??= env.MAIL_DRIVER === "smtp" ? smtpTransport() : logTransport);

/**
 * Records the email in the outbox, then attempts delivery. Delivery failures never
 * break the user's request; failed rows are retried by `npm run mail:retry`.
 */
export async function sendEmail(to: string, template: string, content: EmailContent): Promise<void> {
  const row = await db.outboundEmail.create({
    data: { to, template, subject: content.subject, html: content.html, text: content.text },
  });
  await deliver(row.id);
}

export async function deliver(emailId: string): Promise<boolean> {
  const row = await db.outboundEmail.findUnique({ where: { id: emailId } });
  if (!row || row.status === "SENT") return true;
  try {
    await getTransport().send({ to: row.to, subject: row.subject, html: row.html, text: row.text });
    await db.outboundEmail.update({
      where: { id: row.id },
      data: { status: "SENT", sentAt: new Date(), attempts: { increment: 1 }, lastError: null },
    });
    return true;
  } catch (error) {
    console.error("[mail] delivery failed", row.id, error);
    await db.outboundEmail.update({
      where: { id: row.id },
      data: { status: "FAILED", attempts: { increment: 1 }, lastError: String(error).slice(0, 500) },
    });
    return false;
  }
}
