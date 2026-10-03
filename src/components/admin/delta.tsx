import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Period-over-period change. `mode: "percent"` compares counts (relative change);
 * `mode: "points"` compares rates (absolute difference in percentage points).
 */
export function Delta({
  value,
  previous,
  mode = "percent",
  invert = false,
  period = "previous 30 days",
}: {
  value: number;
  previous: number | null;
  mode?: "percent" | "points";
  /** When a decrease is good news. */
  invert?: boolean;
  period?: string;
}) {
  if (previous === null) return <span className="text-xs text-subtle-foreground">No earlier data</span>;

  let diff: number;
  let text: string;
  if (mode === "points") {
    diff = Math.round(value - previous);
    text = `${Math.abs(diff)} pt${Math.abs(diff) === 1 ? "" : "s"}`;
  } else if (previous === 0) {
    diff = value > 0 ? 1 : 0;
    text = value > 0 ? "new" : "0%";
  } else {
    diff = Math.round(((value - previous) / previous) * 100);
    text = `${Math.abs(diff)}%`;
  }

  const direction = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
  const good = direction === "flat" ? null : (direction === "up") !== invert;
  const Icon = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Minus;
  const spoken =
    direction === "flat" ? `No change from the ${period}` : `${direction === "up" ? "Up" : "Down"} ${text} from the ${period}`;

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 text-xs">
      <span
        className={cn(
          "inline-flex items-center gap-0.5 rounded-full px-1.5 py-px font-medium tabular-nums",
          good === null ? "bg-surface-muted text-muted-foreground" : good ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
        )}
      >
        <Icon className="size-3" aria-hidden />
        <span aria-hidden>{direction === "flat" ? (mode === "points" ? "0 pts" : "0%") : text}</span>
        <span className="sr-only">{spoken}</span>
      </span>
      <span className="text-subtle-foreground" aria-hidden>
        vs {period}
      </span>
    </span>
  );
}
