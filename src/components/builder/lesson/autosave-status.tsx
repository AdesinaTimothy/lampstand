import { AlertCircle, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type AutosaveState = "saved" | "pending" | "saving" | "error";

export function AutosaveStatus({ state, onRetry, className }: { state: AutosaveState; onRetry: () => void; className?: string }) {
  return (
    <p className={cn("flex items-center gap-1.5 text-xs", className)} role="status" aria-live="polite">
      {state === "saving" && (
        <>
          <Loader2 className="size-3.5 animate-spin text-muted-foreground" aria-hidden />
          <span className="text-muted-foreground">Saving…</span>
        </>
      )}
      {state === "pending" && (
        <>
          <span className="size-1.5 rounded-full bg-warning" aria-hidden />
          <span className="text-muted-foreground">Unsaved changes</span>
        </>
      )}
      {state === "saved" && (
        <>
          <Check className="size-3.5 text-success" aria-hidden />
          <span className="text-muted-foreground">Saved</span>
        </>
      )}
      {state === "error" && (
        <>
          <AlertCircle className="size-3.5 text-danger" aria-hidden />
          <span className="text-danger">Couldn&rsquo;t save.</span>
          <button type="button" onClick={onRetry} className="font-medium text-danger underline underline-offset-2">
            Retry
          </button>
        </>
      )}
    </p>
  );
}
