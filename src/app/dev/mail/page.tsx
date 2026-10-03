import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { env } from "@/server/env";
import { formatRelative } from "@/lib/format";
import { param } from "@/lib/search-params";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dev mailbox", robots: { index: false } };

/**
 * Local development only: browse emails written to the outbox by the "log"
 * mail driver (verification links, password resets, notifications).
 */
export default async function DevMailPage(props: PageProps<"/dev/mail">) {
  if (process.env.NODE_ENV === "production" || env.MAIL_DRIVER !== "log") notFound();
  const sp = await props.searchParams;
  const to = param(sp, "to");
  const emails = await db.outboundEmail.findMany({
    where: to ? { to: { contains: to, mode: "insensitive" } } : {},
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, to: true, subject: true, template: true, createdAt: true },
  });
  const selectedId = param(sp, "id") ?? emails[0]?.id;
  const selected = selectedId ? await db.outboundEmail.findUnique({ where: { id: selectedId } }) : null;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
        <p className="font-semibold">
          Dev mailbox <span className="ml-2 rounded bg-warning-soft px-1.5 py-0.5 text-xs text-warning">development only</span>
        </p>
        <form className="flex gap-2">
          <label htmlFor="to" className="sr-only">
            Filter by recipient
          </label>
          <input id="to" name="to" defaultValue={to} placeholder="Filter by recipient" className="h-9 rounded-md border border-input bg-surface px-3 text-sm" />
        </form>
      </header>
      <div className="grid flex-1 md:grid-cols-[22rem_1fr]">
        <ul className="max-h-[40dvh] overflow-y-auto border-b border-border md:max-h-none md:border-b-0 md:border-r" data-testid="mail-list">
          {emails.length === 0 && <li className="p-4 text-sm text-muted-foreground">No emails yet.</li>}
          {emails.map((e) => (
            <li key={e.id}>
              <Link
                href={`/dev/mail?id=${e.id}${to ? `&to=${encodeURIComponent(to)}` : ""}`}
                className={cn("block border-b border-border px-4 py-3 hover:bg-surface-muted", e.id === selectedId && "bg-primary-soft")}
              >
                <p className="truncate text-sm font-medium">{e.subject}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {e.to} · {formatRelative(e.createdAt)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
        <div className="min-h-[60dvh] bg-surface-muted p-4">
          {selected ? (
            <>
              <div className="mb-3 text-sm">
                <p>
                  <strong>To:</strong> {selected.to}
                </p>
                <p>
                  <strong>Subject:</strong> {selected.subject}
                </p>
              </div>
              <iframe title="Email preview" srcDoc={selected.html} sandbox="allow-popups allow-top-navigation-by-user-activation" className="h-[75dvh] w-full rounded-lg border border-border bg-white" />
              <details className="mt-3">
                <summary className="cursor-pointer text-sm text-muted-foreground">Plain text</summary>
                <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-surface p-3 text-xs" data-testid="mail-text">
                  {selected.text}
                </pre>
              </details>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Select an email.</p>
          )}
        </div>
      </div>
    </div>
  );
}
