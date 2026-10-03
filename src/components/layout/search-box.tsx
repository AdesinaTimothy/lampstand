"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, FolderOpen, Loader2, PlayCircle, Search, User, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Suggestion = {
  courses: { slug: string; title: string; category: string | null }[];
  lessons: { id: string; title: string; courseSlug: string; courseTitle: string }[];
  instructors: { id: string; name: string }[];
  categories: { slug: string; name: string }[];
};

function useDebounced<T>(value: T, delay = 200) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/**
 * Combobox-style search with live suggestions (WAI-ARIA combobox pattern).
 * Enter submits to the full search page.
 */
export function SearchBox({ className, autoFocus, onNavigate, defaultValue = "" }: { className?: string; autoFocus?: boolean; onNavigate?: () => void; defaultValue?: string }) {
  const router = useRouter();
  const [query, setQuery] = React.useState(defaultValue);
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(-1);
  const debounced = useDebounced(query.trim());
  const listId = React.useId();

  const { data, isFetching } = useQuery({
    queryKey: ["suggest", debounced],
    queryFn: async ({ signal }): Promise<Suggestion> => {
      const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(debounced)}`, { signal });
      if (!res.ok) throw new Error("search failed");
      return res.json();
    },
    enabled: debounced.length >= 2,
    staleTime: 60_000,
  });

  const items = React.useMemo(() => {
    if (!data || debounced.length < 2) return [];
    return [
      ...data.courses.map((c) => ({ key: `c-${c.slug}`, href: `/courses/${c.slug}`, label: c.title, meta: c.category ?? "Course", icon: BookOpen })),
      ...data.lessons.map((l) => ({ key: `l-${l.id}`, href: `/courses/${l.courseSlug}#curriculum`, label: l.title, meta: `Lesson · ${l.courseTitle}`, icon: PlayCircle })),
      ...data.categories.map((c) => ({ key: `k-${c.slug}`, href: `/courses?category=${c.slug}`, label: c.name, meta: "Category", icon: FolderOpen })),
      ...data.instructors.map((i) => ({ key: `i-${i.id}`, href: `/instructors/${i.id}`, label: i.name, meta: "Instructor", icon: User })),
    ];
  }, [data, debounced]);

  function go(href: string) {
    setOpen(false);
    onNavigate?.();
    router.push(href);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (active >= 0 && items[active]) return go(items[active].href);
    if (query.trim()) go(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  const showPanel = open && debounced.length >= 2;

  return (
    <form role="search" onSubmit={submit} className={cn("relative", className)}>
      <label htmlFor={`${listId}-input`} className="sr-only">
        Search courses, lessons and teachers
      </label>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground" aria-hidden />
      <input
        id={`${listId}-input`}
        type="search"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        autoFocus={autoFocus}
        value={query}
        placeholder="Search courses, lessons, teachers…"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(items.length - 1, a + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(-1, a - 1));
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className="h-10 w-full rounded-full border border-border bg-surface-muted pl-9 pr-9 text-sm text-foreground transition-[background-color,border-color,box-shadow] placeholder:text-subtle-foreground hover:border-border-strong focus-visible:border-ring focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/15 [&::-webkit-search-cancel-button]:hidden"
      />
      {isFetching ? (
        <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-subtle-foreground" aria-hidden />
      ) : query ? (
        <button
          type="button"
          onClick={() => setQuery("")}
          className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-subtle-foreground hover:bg-surface-sunken hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
      {showPanel && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-surface shadow-lg animate-scale-in">
          <ul id={listId} role="listbox" aria-label="Suggestions" className="max-h-80 overflow-y-auto p-1.5 scrollbar-thin">
            {items.length === 0 && !isFetching && (
              <li className="px-3 py-4 text-center text-sm text-muted-foreground" role="presentation">
                No quick matches — press Enter to search everything.
              </li>
            )}
            {items.map((item, i) => (
              <li key={item.key} id={`${listId}-${i}`} role="option" aria-selected={active === i}>
                <Link
                  href={item.href}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.preventDefault();
                    go(item.href);
                  }}
                  className={cn("flex items-center gap-3 rounded-md px-2.5 py-2 text-sm", active === i ? "bg-surface-muted" : "hover:bg-surface-muted")}
                >
                  <item.icon className="size-4 shrink-0 text-subtle-foreground" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  <span className="hidden max-w-[40%] truncate text-xs text-muted-foreground sm:block">{item.meta}</span>
                </Link>
              </li>
            ))}
          </ul>
          {query.trim() && (
            <button
              type="submit"
              onMouseDown={(e) => e.preventDefault()}
              className="flex w-full items-center gap-2 border-t border-border px-4 py-2.5 text-left text-sm font-medium text-primary hover:bg-surface-muted"
            >
              <Search className="size-4" aria-hidden /> See all results for “{query.trim()}”
            </button>
          )}
        </div>
      )}
    </form>
  );
}
