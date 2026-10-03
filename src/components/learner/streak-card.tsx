import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

/** Last 7 days of activity + current streak. Gentle encouragement, never guilt. */
export function StreakCard({ current, longest, activeToday, days, today }: { current: number; longest: number; activeToday: boolean; days: string[]; today: string }) {
  const active = new Set(days);
  const base = Date.parse(`${today}T00:00:00Z`);
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base - (6 - i) * 86_400_000);
    const iso = d.toISOString().slice(0, 10);
    return { iso, label: d.toLocaleDateString("en-US", { weekday: "narrow", timeZone: "UTC" }), full: d.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" }), on: active.has(iso) };
  });
  return (
    <section aria-labelledby="streak-heading" className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="streak-heading" className="text-sm font-semibold">
            Learning streak
          </h2>
          <p className="mt-1 flex items-baseline gap-1.5">
            <span className="text-3xl font-semibold tabular-nums">{current}</span>
            <span className="text-sm text-muted-foreground">{current === 1 ? "day" : "days"}</span>
          </p>
        </div>
        <span className={cn("grid size-11 place-items-center rounded-full", current > 0 ? "bg-accent-soft text-accent" : "bg-surface-sunken text-subtle-foreground")} aria-hidden>
          <Flame className="size-5" />
        </span>
      </div>
      <ol className="mt-4 grid grid-cols-7 gap-1.5" aria-label="Activity over the last 7 days">
        {week.map((d) => (
          <li key={d.iso} className="flex flex-col items-center gap-1.5">
            <span className={cn("h-8 w-full rounded-md", d.on ? "bg-accent" : "bg-surface-sunken")} aria-hidden />
            <span className="text-[11px] font-medium text-muted-foreground" aria-hidden>
              {d.label}
            </span>
            <span className="sr-only">
              {d.full}: {d.on ? "active" : "no activity"}
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-muted-foreground">
        {activeToday ? "You've learned today. Well done." : current > 0 ? "A short lesson today keeps your streak going." : "Start a lesson today to begin a streak."}
        {longest > 1 && ` Longest: ${longest} days.`}
      </p>
    </section>
  );
}
