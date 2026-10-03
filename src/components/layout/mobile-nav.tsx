"use client";

import Link from "next/link";
import * as React from "react";
import { usePathname } from "next/navigation";
import { Compass, Home, LibraryBig, Search, UserRound } from "lucide-react";
import { Dialog, SheetContent, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { SearchBox } from "./search-box";

const TABS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/courses", label: "Browse", icon: Compass },
  { href: "/my-courses", label: "Learning", icon: LibraryBig },
  { href: "/profile", label: "Profile", icon: UserRound },
];

/** Bottom tab bar for signed-in learners on phones — thumb-reachable primary navigation. */
export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {TABS.slice(0, 2).map((t) => (
          <Tab key={t.href} {...t} active={pathname === t.href || pathname.startsWith(`${t.href}/`)} />
        ))}
        <li>
          <MobileSearchTrigger />
        </li>
        {TABS.slice(2).map((t) => (
          <Tab key={t.href} {...t} active={pathname === t.href || pathname.startsWith(`${t.href}/`)} />
        ))}
      </ul>
    </nav>
  );
}

function Tab({ href, label, icon: Icon, active }: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; active: boolean }) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
          active ? "text-primary" : "text-muted-foreground",
        )}
      >
        <Icon className="size-5" aria-hidden />
        {label}
      </Link>
    </li>
  );
}

export function MobileSearchTrigger({ variant = "tab" }: { variant?: "tab" | "icon" }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(
          variant === "tab"
            ? "flex h-14 w-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground"
            : "grid size-10 place-items-center rounded-lg text-foreground hover:bg-surface-muted",
        )}
        aria-label="Search"
      >
        <Search className="size-5" aria-hidden />
        {variant === "tab" && "Search"}
      </DialogTrigger>
      <SheetContent side="bottom" title="Search" className="h-[85dvh]">
        <div className="p-4">
          <SearchBox autoFocus onNavigate={() => setOpen(false)} />
          <p className="mt-4 text-sm text-muted-foreground">Try “prayer”, “Romans”, “leadership” or a teacher’s name.</p>
        </div>
      </SheetContent>
    </Dialog>
  );
}
