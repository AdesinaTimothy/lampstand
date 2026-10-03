import Link from "next/link";
import { cn } from "@/lib/utils";

export type StatusTab<K extends string> = { key: K; label: string; count?: number };

/** Link-based filter tabs driven by a search param, so filtered views are shareable. */
export function StatusTabs<K extends string>({
  tabs,
  active,
  hrefFor,
  label,
}: {
  tabs: StatusTab<K>[];
  active: K;
  hrefFor: (key: K) => string;
  label: string;
}) {
  return (
    <nav aria-label={label} className="-mx-4 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-1 rounded-xl bg-surface-muted p-1">
        {tabs.map((t) => {
          const current = t.key === active;
          return (
            <li key={t.key}>
              <Link
                href={hrefFor(t.key)}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-sm font-medium transition-colors",
                  current ? "bg-surface text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
                {t.count !== undefined && (
                  <span className={cn("rounded-full px-1.5 text-xs tabular-nums", current ? "bg-primary-soft text-primary-soft-foreground" : "bg-surface-sunken")}>
                    {t.count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
