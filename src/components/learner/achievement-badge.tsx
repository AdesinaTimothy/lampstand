import { Flag, Flame, Footprints, Library, Lock, Mountain, Sprout, Target, type LucideIcon } from "lucide-react";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = { footprints: Footprints, library: Library, flag: Flag, sprout: Sprout, target: Target, flame: Flame, mountain: Mountain };

export function AchievementBadge({
  title,
  description,
  icon,
  earnedAt,
  size = "md",
}: {
  title: string;
  description: string;
  icon: string;
  earnedAt: Date | null;
  size?: "sm" | "md";
}) {
  const Icon = ICONS[icon] ?? Flag;
  const earned = Boolean(earnedAt);
  return (
    <div className={cn("flex items-center gap-3", size === "md" && "rounded-xl border border-border bg-surface p-3", !earned && "opacity-60")}>
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-full",
          size === "md" ? "size-11" : "size-9",
          earned ? "bg-accent-soft text-accent ring-2 ring-accent/30" : "bg-surface-sunken text-subtle-foreground",
        )}
        aria-hidden
      >
        {earned ? <Icon className="size-5" /> : <Lock className="size-4" />}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-tight">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {description}
          {earnedAt && <span className="sr-only">. Earned {formatDate(earnedAt)}</span>}
          {!earned && <span className="sr-only">. Not yet earned</span>}
        </p>
      </div>
    </div>
  );
}
