import Link from "next/link";
import { ChevronRight, Paperclip } from "lucide-react";
import type { SubmissionListItem } from "@/server/queries/instructor";
import { Avatar } from "@/components/ui/avatar";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SubmissionStatusBadge } from "./submission-status-badge";

export function SubmissionList({ submissions, hrefFor, selectedId }: { submissions: SubmissionListItem[]; hrefFor: (id: string) => string; selectedId: string | null }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
      {submissions.map((s) => (
        <li key={s.id}>
          <Link
            href={hrefFor(s.id)}
            scroll={false}
            aria-current={s.id === selectedId ? "true" : undefined}
            className={cn("flex items-start gap-3 px-4 py-4 transition-colors hover:bg-surface-muted sm:px-5", s.id === selectedId && "bg-primary-soft/40")}
          >
            <Avatar name={s.learner.name} src={s.learner.avatarUrl} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="text-sm font-semibold">{s.learner.name}</p>
                <SubmissionStatusBadge status={s.status} />
                {s.revision > 1 && <span className="text-xs text-muted-foreground">Revision {s.revision}</span>}
              </div>
              <p className="mt-0.5 truncate text-sm">
                {s.lessonTitle} <span className="text-muted-foreground">· {s.course.title}</span>
              </p>
              {s.excerpt && <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{s.excerpt}</p>}
              <p className="mt-1.5 flex items-center gap-2 text-xs text-subtle-foreground">
                <time dateTime={s.submittedAt.toISOString()}>Submitted {formatRelative(s.submittedAt)}</time>
                {s.hasFile && (
                  <span className="inline-flex items-center gap-1">
                    <Paperclip className="size-3" aria-hidden /> File attached
                  </span>
                )}
              </p>
            </div>
            <ChevronRight className="mt-1 size-4 shrink-0 text-subtle-foreground" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
