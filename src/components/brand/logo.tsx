import { cn } from "@/lib/utils";

/** Lampstand mark: a single flame on a stand — light for the path (Ps 119:105). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <path
        d="M16 6.5c2.6 2.9 4 5.1 4 7.2a4 4 0 0 1-8 0c0-1.4.6-2.6 1.6-3.9.3 1.2 1 2 1.9 2.2-.5-1.9-.1-3.6.5-5.5Z"
        className="fill-accent-soft"
      />
      <path d="M16 18.5v5.5M11.5 25.5h9M13 21.5h6" className="stroke-primary-foreground" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function Logo({ orgName, className, compact }: { orgName?: string; className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="flex flex-col leading-none max-[379px]:hidden">
        <span className="text-display text-[1.2rem] font-semibold tracking-tight">Lampstand</span>
        {orgName && !compact && (
          <span className="mt-0.5 hidden text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground sm:block">{orgName}</span>
        )}
      </span>
    </span>
  );
}
