"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type FilterSelect = {
  name: string;
  label: string;
  /** Label of the "no filter" option, e.g. "All roles". Omit for required selects (e.g. sort). */
  allLabel?: string;
  options: { value: string; label: string }[];
};

/**
 * URL-driven filters: the search box submits on Enter, selects apply
 * immediately. Every combination is a shareable link; pagination resets.
 */
export function FilterBar({
  values,
  search,
  selects = [],
  className,
}: {
  values: Record<string, string | undefined>;
  search?: { name?: string; placeholder: string; label: string };
  selects?: FilterSelect[];
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = React.useTransition();
  const searchName = search?.name ?? "q";
  const id = React.useId();

  function navigate(next: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...values, ...next })) if (v && k !== "page") params.set(k, v);
    const qs = params.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname));
  }

  const active = Object.entries(values).some(([k, v]) => v && k !== "page" && k !== "sort");

  return (
    <div className={cn("flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center", className)} aria-busy={pending || undefined}>
      {search && (
        <SearchForm
          key={values[searchName] ?? ""}
          id={`${id}-q`}
          initial={values[searchName] ?? ""}
          label={search.label}
          placeholder={search.placeholder}
          onSearch={(q) => navigate({ [searchName]: q || undefined })}
        />
      )}
      {selects.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {selects.map((s) => (
            <div key={s.name} className="min-w-0">
              <label htmlFor={`${id}-${s.name}`} className="sr-only">
                {s.label}
              </label>
              <NativeSelect
                id={`${id}-${s.name}`}
                value={values[s.name] ?? ""}
                onChange={(e) => navigate({ [s.name]: e.target.value || undefined })}
                className="sm:w-auto sm:min-w-36"
              >
                {s.allLabel !== undefined && <option value="">{s.allLabel}</option>}
                {s.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
          ))}
        </div>
      )}
      {active && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-start md:self-auto"
          onClick={() => {
            const sort = values.sort;
            startTransition(() => router.push(sort ? `${pathname}?sort=${encodeURIComponent(sort)}` : pathname));
          }}
        >
          <X aria-hidden />
          Clear filters
        </Button>
      )}
    </div>
  );
}

function SearchForm({
  id,
  initial,
  label,
  placeholder,
  onSearch,
}: {
  id: string;
  initial: string;
  label: string;
  placeholder: string;
  onSearch: (q: string) => void;
}) {
  const [query, setQuery] = React.useState(initial);
  return (
    <form
      role="search"
      className="relative min-w-0 md:max-w-sm md:flex-1"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(query.trim());
      }}
    >
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground" aria-hidden />
      <Input
        id={id}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
        enterKeyHint="search"
      />
    </form>
  );
}
