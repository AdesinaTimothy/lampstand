import Link from "next/link";
import { ArrowRight, CheckCircle2, FileWarning, Inbox } from "lucide-react";
import type { InstructorOverview } from "@/server/queries/instructor";
import { Avatar } from "@/components/ui/avatar";
import { formatRelative } from "@/lib/format";
import { pluralize } from "@/lib/utils";

/** Submissions waiting for review and drafts that still need work. */
export function AttentionList({ pending, pendingCount, drafts }: Pick<InstructorOverview, "pending" | "pendingCount" | "drafts">) {
  const draftsWithIssues = drafts.filter((d) => d.errorCount > 0);
  const readyDrafts = drafts.filter((d) => d.errorCount === 0);
  if (pending.length === 0 && drafts.length === 0) {
    return (
      <p className="flex items-center gap-2.5 rounded-lg bg-success-soft px-4 py-3.5 text-sm font-medium text-success">
        <CheckCircle2 className="size-4 shrink-0" aria-hidden /> You’re all caught up.
      </p>
    );
  }
  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <section aria-labelledby="attention-submissions">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 id="attention-submissions" className="flex items-center gap-2 text-sm font-semibold">
              <Inbox className="size-4 text-accent" aria-hidden /> {pluralize(pendingCount, "submission")} to review
            </h3>
            <Link href="/instructor/submissions" className="text-sm font-medium text-primary hover:underline">
              Open inbox
            </Link>
          </div>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {pending.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/instructor/submissions?submission=${s.id}`}
                  className="flex items-center gap-3 px-3.5 py-3 transition-colors hover:bg-surface-muted"
                >
                  <Avatar name={s.learner.name} src={s.learner.avatarUrl} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.lessonTitle}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.learner.name} · {s.courseTitle} · {formatRelative(s.submittedAt)}
                    </p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-subtle-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {drafts.length > 0 && (
        <section aria-labelledby="attention-drafts">
          <h3 id="attention-drafts" className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <FileWarning className="size-4 text-warning" aria-hidden /> Drafts in progress
          </h3>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {[...draftsWithIssues, ...readyDrafts].map((d) => (
              <li key={d.id}>
                <Link
                  href={d.firstIssue?.href ?? `/instructor/courses/${d.id}/curriculum`}
                  className="flex items-center gap-3 px-3.5 py-3 transition-colors hover:bg-surface-muted"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {d.errorCount > 0 ? (
                        <>
                          <span className="font-medium text-warning">{pluralize(d.errorCount, "item")} to finish</span>
                          {d.firstIssue && <> · {d.firstIssue.message}</>}
                        </>
                      ) : (
                        <span className="font-medium text-success">Ready to publish</span>
                      )}
                    </p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-subtle-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
