"use client";

import Link from "next/link";
import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Award, Bell, BookOpen, CheckCheck, FileCheck, Megaphone, PartyPopper, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import type { NotificationType } from "@prisma/client";
import { markNotificationsReadAction } from "@/actions/learning";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

export type NotificationDTO = {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

export const NOTIFICATION_ICONS: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  ENROLLED: BookOpen,
  COURSE_COMPLETED: PartyPopper,
  CERTIFICATE_ISSUED: Award,
  ASSIGNMENT_SUBMITTED: FileCheck,
  ASSIGNMENT_REVIEWED: FileCheck,
  COURSE_PUBLISHED: Sparkles,
  ANNOUNCEMENT: Megaphone,
  ACHIEVEMENT_EARNED: Trophy,
  SECURITY: ShieldCheck,
};

async function fetchNotifications(): Promise<{ items: NotificationDTO[]; unread: number }> {
  const res = await fetch("/api/notifications", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load notifications");
  return res.json();
}

export function NotificationBell({ initialUnread }: { initialUnread: number }) {
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    enabled: open,
  });
  const unread = data?.unread ?? initialUnread;

  async function markAllRead() {
    queryClient.setQueryData<{ items: NotificationDTO[]; unread: number }>(["notifications"], (prev) =>
      prev ? { unread: 0, items: prev.items.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })) } : prev,
    );
    await markNotificationsReadAction();
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}>
          <Bell />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-4 text-white ring-2 ring-background dark:text-background">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(24rem,calc(100vw-1.5rem))] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Notifications</h2>
          {unread > 0 && (
            <button onClick={markAllRead} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              <CheckCheck className="size-3.5" aria-hidden /> Mark all read
            </button>
          )}
        </div>
        <div className="max-h-[min(26rem,60dvh)] overflow-y-auto scrollbar-thin">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="size-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Couldn&apos;t load notifications.{" "}
              <button className="font-medium text-primary hover:underline" onClick={() => refetch()}>
                Try again
              </button>
            </div>
          ) : !data?.items.length ? (
            <div className="px-6 py-10 text-center">
              <Bell className="mx-auto size-5 text-subtle-foreground" aria-hidden />
              <p className="mt-2 text-sm font-medium">You&apos;re all caught up</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Updates about your courses will appear here.</p>
            </div>
          ) : (
            <ul>
              {data.items.map((n) => (
                <NotificationRow key={n.id} n={n} onNavigate={() => setOpen(false)} />
              ))}
            </ul>
          )}
        </div>
        <div className="border-t border-border p-2">
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block rounded-md py-2 text-center text-sm font-medium text-primary hover:bg-surface-muted"
          >
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function NotificationRow({ n, onNavigate }: { n: NotificationDTO; onNavigate?: () => void }) {
  const Icon = NOTIFICATION_ICONS[n.type];
  const content = (
    <div className={cn("flex gap-3 px-4 py-3 transition-colors hover:bg-surface-muted", !n.readAt && "bg-primary-soft/40")}>
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-surface-muted text-primary">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug">{n.title}</p>
        {n.body && <p className="mt-0.5 line-clamp-2 text-[13px] text-muted-foreground">{n.body}</p>}
        <p className="mt-1 text-xs text-subtle-foreground">{formatRelative(n.createdAt)}</p>
      </div>
      {!n.readAt && <span className="mt-2 size-2 shrink-0 rounded-full bg-accent" aria-label="Unread" />}
    </div>
  );
  return (
    <li className="border-b border-border last:border-0">
      {n.href ? (
        <Link href={n.href} onClick={onNavigate} className="block">
          {content}
        </Link>
      ) : (
        content
      )}
    </li>
  );
}
