import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";

/**
 * Server-rendered pagination driven by the `page` search param, so every page
 * is linkable and works without JavaScript.
 */
export function Pagination({
  page,
  pageCount,
  basePath,
  searchParams,
  className,
}: {
  page: number;
  pageCount: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
  className?: string;
}) {
  if (pageCount <= 1) return null;
  const href = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams ?? {})) if (v && k !== "page") params.set(k, v);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const pages = paginationRange(page, pageCount);
  return (
    <nav aria-label="Pagination" className={cn("flex items-center justify-between gap-2", className)}>
      <p className="text-sm text-muted-foreground">
        Page <span className="font-medium text-foreground">{page}</span> of {pageCount}
      </p>
      <div className="flex items-center gap-1">
        <PageLink href={href(page - 1)} disabled={page <= 1} label="Previous page">
          <ChevronLeft />
        </PageLink>
        <div className="hidden items-center gap-1 sm:flex">
          {pages.map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} className="px-1.5 text-sm text-subtle-foreground">
                …
              </span>
            ) : (
              <Link
                key={p}
                href={href(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(buttonVariants({ variant: p === page ? "soft" : "ghost", size: "icon-sm" }), "text-sm")}
              >
                {p}
              </Link>
            ),
          )}
        </div>
        <PageLink href={href(page + 1)} disabled={page >= pageCount} label="Next page">
          <ChevronRight />
        </PageLink>
      </div>
    </nav>
  );
}

function PageLink({ href, disabled, label, children }: { href: string; disabled: boolean; label: string; children: React.ReactNode }) {
  if (disabled) {
    return (
      <span aria-disabled className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }), "opacity-40")}>
        {children}
        <span className="sr-only">{label}</span>
      </span>
    );
  }
  return (
    <Link href={href} className={buttonVariants({ variant: "outline", size: "icon-sm" })}>
      {children}
      <span className="sr-only">{label}</span>
    </Link>
  );
}

export function paginationRange(page: number, count: number): (number | "…")[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const result: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(count - 1, page + 1);
  if (start > 2) result.push("…");
  for (let i = start; i <= end; i++) result.push(i);
  if (end < count - 1) result.push("…");
  result.push(count);
  return result;
}
