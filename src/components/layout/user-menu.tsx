"use client";

import Link from "next/link";
import * as React from "react";
import {
  Award,
  Bookmark,
  BookOpen,
  LayoutDashboard,
  LogOut,
  Monitor,
  Moon,
  Presentation,
  Settings,
  Shield,
  Sun,
  User,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_LABELS } from "@/lib/roles";
import type { MemberRole } from "@prisma/client";

export type MenuViewer = {
  name: string;
  email: string;
  avatarUrl: string | null;
  role: MemberRole;
  canTeach: boolean;
  isStaff: boolean;
};

export function useTheme() {
  const [theme, setThemeState] = React.useState<"light" | "dark" | "system">("system");
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync with storage after hydration
      if (saved === "light" || saved === "dark") setThemeState(saved);
    } catch {}
  }, []);
  const setTheme = React.useCallback((t: "light" | "dark" | "system") => {
    setThemeState(t);
    try {
      if (t === "system") localStorage.removeItem("theme");
      else localStorage.setItem("theme", t);
    } catch {}
    const dark = t === "dark" || (t === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  }, []);
  return { theme, setTheme };
}

export function UserMenu({ viewer }: { viewer: MenuViewer }) {
  const { theme, setTheme } = useTheme();
  const formRef = React.useRef<HTMLFormElement>(null);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-offset-2 transition-opacity hover:opacity-90" aria-label="Account menu">
        <Avatar name={viewer.name} src={viewer.avatarUrl} size="sm" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <div className="flex items-center gap-3 px-2.5 py-2">
          <Avatar name={viewer.name} src={viewer.avatarUrl} size="md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{viewer.name}</p>
            <p className="truncate text-xs text-muted-foreground">{viewer.email}</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard"><LayoutDashboard aria-hidden />Dashboard</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/my-courses"><BookOpen aria-hidden />My courses</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/certificates"><Award aria-hidden />Certificates</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/bookmarks"><Bookmark aria-hidden />Bookmarks</Link>
        </DropdownMenuItem>
        {(viewer.canTeach || viewer.isStaff) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>{ROLE_LABELS[viewer.role]}</DropdownMenuLabel>
            {viewer.canTeach && (
              <DropdownMenuItem asChild>
                <Link href="/instructor"><Presentation aria-hidden />Instructor studio</Link>
              </DropdownMenuItem>
            )}
            {viewer.isStaff && (
              <DropdownMenuItem asChild>
                <Link href="/admin"><Shield aria-hidden />Administration</Link>
              </DropdownMenuItem>
            )}
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile"><User aria-hidden />Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings"><Settings aria-hidden />Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as "light" | "dark" | "system")}>
          <DropdownMenuRadioItem value="light"><Sun className="mr-1 size-4 text-muted-foreground" aria-hidden />Light</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark"><Moon className="mr-1 size-4 text-muted-foreground" aria-hidden />Dark</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system"><Monitor className="mr-1 size-4 text-muted-foreground" aria-hidden />System</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <form ref={formRef} action={logoutAction}>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              formRef.current?.requestSubmit();
            }}
          >
            <LogOut aria-hidden />
            Sign out
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
