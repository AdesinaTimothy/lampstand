import { formatDate, formatRelative } from "@/lib/format";

/** Relative time with the exact date available on hover and to assistive tech. */
export function TimeAgo({ date, fallback = "Never" }: { date: Date | string | null | undefined; fallback?: string }) {
  if (!date) return <span className="text-subtle-foreground">{fallback}</span>;
  const d = typeof date === "string" ? new Date(date) : date;
  return (
    <time dateTime={d.toISOString()} title={formatDate(d, "d MMM yyyy, HH:mm")}>
      {formatRelative(d)}
    </time>
  );
}
