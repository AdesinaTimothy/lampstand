"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Sticky footer with the form's save state. Explicit save; dirty state is always visible. */
export function SaveBar({
  dirty,
  saving,
  onDiscard,
  label = "Save changes",
  className,
}: {
  dirty: boolean;
  saving: boolean;
  onDiscard?: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-20 -mx-4 mt-8 flex items-center justify-between gap-3 border-t border-border bg-background/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10",
        className,
      )}
    >
      <p className="flex min-w-0 items-center gap-2 text-sm" aria-live="polite">
        <span className={cn("size-2 shrink-0 rounded-full", dirty ? "bg-warning" : "bg-success")} aria-hidden />
        <span className={cn("truncate", dirty ? "font-medium text-foreground" : "text-muted-foreground")}>
          {dirty ? "Unsaved changes" : "All changes saved"}
        </span>
      </p>
      <div className="flex shrink-0 items-center gap-2">
        {onDiscard && dirty && (
          <Button type="button" variant="ghost" size="sm" onClick={onDiscard} disabled={saving}>
            Discard
          </Button>
        )}
        <Button type="submit" size="sm" loading={saving} disabled={!dirty}>
          {label}
        </Button>
      </div>
    </div>
  );
}
