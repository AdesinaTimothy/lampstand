import Link from "next/link";
import { AlertCircle, AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import type { ReadinessIssue } from "@/server/services/courses";
import { cn } from "@/lib/utils";

/** Checklist of what blocks publishing (errors) and what's worth a look (warnings). */
export function ReadinessList({ issues, onNavigate, className }: { issues: ReadinessIssue[]; onNavigate?: () => void; className?: string }) {
  if (issues.length === 0) {
    return (
      <p className={cn("flex items-center gap-2.5 rounded-lg bg-success-soft px-3.5 py-3 text-sm font-medium text-success", className)}>
        <CheckCircle2 className="size-4 shrink-0" aria-hidden />
        Everything learners need is in place.
      </p>
    );
  }
  const sorted = [...issues].sort((a, b) => (a.level === b.level ? 0 : a.level === "error" ? -1 : 1));
  return (
    <ul className={cn("divide-y divide-border overflow-hidden rounded-lg border border-border", className)}>
      {sorted.map((issue, i) => {
        const Icon = issue.level === "error" ? AlertCircle : AlertTriangle;
        const body = (
          <>
            <Icon className={cn("mt-0.5 size-4 shrink-0", issue.level === "error" ? "text-danger" : "text-warning")} aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="sr-only">{issue.level === "error" ? "Required: " : "Suggestion: "}</span>
              {issue.message}
            </span>
            {issue.href && <ArrowRight className="mt-0.5 size-4 shrink-0 text-subtle-foreground" aria-hidden />}
          </>
        );
        return (
          <li key={`${issue.message}-${i}`}>
            {issue.href ? (
              <Link href={issue.href} onClick={onNavigate} className="flex items-start gap-3 bg-surface px-3.5 py-3 text-sm transition-colors hover:bg-surface-muted">
                {body}
              </Link>
            ) : (
              <div className="flex items-start gap-3 bg-surface px-3.5 py-3 text-sm">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
