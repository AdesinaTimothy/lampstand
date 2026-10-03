"use client";

import Link from "next/link";
import * as React from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Dialog, DialogTrigger, SheetContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type ConsoleNavItem = { href: string; label: string; icon: React.ReactNode; exact?: boolean; badge?: number };
export type ConsoleNavGroup = { label?: string; items: ConsoleNavItem[] };

function NavList({ groups, onNavigate }: { groups: ConsoleNavGroup[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Console" className="flex flex-col gap-6 px-3 py-4">
      {groups.map((group, gi) => (
        <div key={gi}>
          {group.label && <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle-foreground">{group.label}</p>}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active ? "bg-primary-soft text-primary-soft-foreground" : "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
                    )}
                  >
                    <span className="shrink-0 [&_svg]:size-[18px]" aria-hidden>{item.icon}</span>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge ? (
                      <span className="rounded-full bg-accent px-1.5 text-[11px] font-semibold leading-5 text-white dark:text-background">{item.badge}</span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/**
 * Shared shell for the instructor studio and admin console: persistent sidebar
 * on desktop, slide-over sheet on smaller screens.
 */
export function ConsoleShell({
  title,
  orgName,
  groups,
  headerRight,
  children,
}: {
  title: string;
  orgName: string;
  groups: ConsoleNavGroup[];
  headerRight: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border bg-surface lg:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Link href="/dashboard" aria-label="Back to Lampstand">
            <Logo orgName={orgName} />
          </Link>
        </div>
        <p className="px-6 pt-5 text-xs font-medium text-muted-foreground">{title}</p>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <NavList groups={groups} />
        </div>
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md sm:px-6">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className="grid size-10 place-items-center rounded-lg hover:bg-surface-muted lg:hidden" aria-label="Open navigation">
              <Menu className="size-5" aria-hidden />
            </DialogTrigger>
            <SheetContent side="left" title={title} description={orgName}>
              <NavList groups={groups} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Dialog>
          <span className="truncate text-sm font-semibold lg:hidden">{title}</span>
          <div className="ml-auto flex items-center gap-2">{headerRight}</div>
        </header>
        <main id="main" className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
