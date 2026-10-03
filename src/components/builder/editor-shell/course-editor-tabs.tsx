"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FileText, ListTree, Settings2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { segment: "details", label: "Details", icon: FileText, also: [] as string[] },
  { segment: "curriculum", label: "Curriculum", icon: ListTree, also: ["lessons"] },
  { segment: "settings", label: "Settings", icon: Settings2, also: [] },
  { segment: "learners", label: "Learners", icon: Users, also: [] },
  { segment: "analytics", label: "Analytics", icon: BarChart3, also: [] },
];

/** Link-based tabs (each tab is its own route), horizontally scrollable on phones. */
export function CourseEditorTabs({ courseId }: { courseId: string }) {
  const pathname = usePathname();
  const base = `/instructor/courses/${courseId}`;
  return (
    <nav aria-label="Course editor" className="-mx-4 border-b border-border sm:mx-0">
      <ul className="flex gap-1 overflow-x-auto px-4 scrollbar-none sm:px-0">
        {TABS.map((tab) => {
          const active = [tab.segment, ...tab.also].some((s) => pathname === `${base}/${s}` || pathname.startsWith(`${base}/${s}/`));
          const Icon = tab.icon;
          return (
            <li key={tab.segment} className="shrink-0">
              <Link
                href={`${base}/${tab.segment}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative -mb-px inline-flex h-11 items-center gap-2 whitespace-nowrap border-b-2 px-3 text-sm font-medium transition-colors",
                  active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
