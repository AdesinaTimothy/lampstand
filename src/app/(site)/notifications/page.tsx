import type { Metadata } from "next";
import Link from "next/link";
import { Bell } from "lucide-react";
import { requirePageViewer } from "@/server/auth/guards";
import { listNotifications } from "@/server/queries/learner";
import { MarkAllReadButton, NotificationsList } from "@/components/learner/notifications-list";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { pageParam, param, toRecord } from "@/lib/search-params";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage(props: PageProps<"/notifications">) {
  const viewer = await requirePageViewer("/notifications");
  const sp = await props.searchParams;
  const unreadOnly = param(sp, "show") === "unread";
  const page = pageParam(sp);
  const result = await listNotifications(viewer, { page, unreadOnly });

  return (
    <div className="container-page max-w-3xl py-8 pb-24 sm:py-12 lg:pb-12">
      <PageHeader title="Notifications" description="Course updates, feedback and milestones." actions={<MarkAllReadButton disabled={result.unread === 0} />} />
      <nav aria-label="Filter notifications" className="mt-6 flex gap-2">
        {[
          { href: "/notifications", label: "All", active: !unreadOnly },
          { href: "/notifications?show=unread", label: `Unread (${result.unread})`, active: unreadOnly },
        ].map((t) => (
          <Link
            key={t.href}
            href={t.href}
            aria-current={t.active ? "page" : undefined}
            className={cn(
              "inline-flex h-9 items-center rounded-full px-4 text-sm font-medium transition-colors",
              t.active ? "bg-foreground text-background" : "border border-border bg-surface text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {result.items.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={<Bell />}
          title={unreadOnly ? "You're all caught up" : "No notifications yet"}
          description="We'll let you know about feedback on your work, new courses and milestones."
        />
      ) : (
        <div className="mt-6">
          <NotificationsList
            items={result.items.map((n) => ({ ...n, readAt: n.readAt?.toISOString() ?? null, createdAt: n.createdAt.toISOString() }))}
          />
          <Pagination className="mt-8" page={page} pageCount={result.pageCount} basePath="/notifications" searchParams={toRecord(sp)} />
        </div>
      )}
    </div>
  );
}
