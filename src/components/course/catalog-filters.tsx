"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, SheetContent } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/input";
import { LEVEL_LABELS } from "@/lib/course-meta";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string };

const LEVELS: Option[] = Object.entries(LEVEL_LABELS).map(([value, label]) => ({ value, label }));
const DURATIONS: Option[] = [
  { value: "short", label: "Under 1 hour" },
  { value: "medium", label: "1–4 hours" },
  { value: "long", label: "4+ hours" },
];

export function CatalogFilters({ categories, showRelevance }: { categories: Option[]; showRelevance?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = React.useTransition();
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const sorts: Option[] = [
    ...(showRelevance ? [{ value: "relevance", label: "Most relevant" }] : []),
    { value: "popular", label: "Most popular" },
    { value: "newest", label: "Newest" },
    { value: "rating", label: "Highest rated" },
    { value: "title", label: "A–Z" },
  ];

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    startTransition(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
  }

  const active = ["category", "level", "duration"].filter((k) => params.get(k));
  const controls = (
    <>
      <FilterSelect id="f-category" label="Topic" value={params.get("category") ?? ""} onChange={(v) => update("category", v)} options={categories} all="All topics" />
      <FilterSelect id="f-level" label="Level" value={params.get("level") ?? ""} onChange={(v) => update("level", v)} options={LEVELS} all="Any level" />
      <FilterSelect id="f-duration" label="Length" value={params.get("duration") ?? ""} onChange={(v) => update("duration", v)} options={DURATIONS} all="Any length" />
    </>
  );

  return (
    <div className={cn("flex flex-wrap items-end gap-3 transition-opacity", isPending && "opacity-60")} aria-busy={isPending}>
      <div className="hidden flex-wrap items-end gap-3 md:flex">{controls}</div>
      <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="md:hidden">
            <SlidersHorizontal aria-hidden /> Filters
            {active.length > 0 && <span className="rounded-full bg-primary px-1.5 text-[11px] text-primary-foreground">{active.length}</span>}
          </Button>
        </DialogTrigger>
        <SheetContent side="bottom" title="Filter courses">
          <div className="grid gap-4 p-4">
            {controls}
            <Button onClick={() => setSheetOpen(false)} className="mt-2">
              Show results
            </Button>
          </div>
        </SheetContent>
      </Dialog>
      <div className="ml-auto">
        <FilterSelect
          id="f-sort"
          label="Sort by"
          value={params.get("sort") ?? (showRelevance ? "relevance" : "popular")}
          onChange={(v) => update("sort", v)}
          options={sorts}
        />
      </div>
      {active.length > 0 && (
        <div className="flex w-full flex-wrap gap-2">
          {active.map((k) => {
            const value = params.get(k)!;
            const label =
              (k === "category" ? categories : k === "level" ? LEVELS : DURATIONS).find((o) => o.value === value)?.label ?? value;
            return (
              <button
                key={k}
                onClick={() => update(k, "")}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium hover:bg-surface-muted"
              >
                {label} <X className="size-3" aria-hidden />
                <span className="sr-only">Remove filter</span>
              </button>
            );
          })}
          <button
            onClick={() => {
              const next = new URLSearchParams();
              const q = params.get("q");
              if (q) next.set("q", q);
              router.push(`${pathname}?${next}`, { scroll: false });
            }}
            className="px-1 text-xs font-medium text-primary hover:underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

function FilterSelect({ id, label, value, onChange, options, all }: { id: string; label: string; value: string; onChange: (v: string) => void; options: Option[]; all?: string }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <NativeSelect id={id} value={value} onChange={(e) => onChange(e.target.value)} className="min-w-40">
        {all && <option value="">{all}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}
