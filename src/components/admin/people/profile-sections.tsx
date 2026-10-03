import Link from "next/link";
import { Award, BookOpen, ExternalLink, FileText, Target } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatPercent } from "@/lib/format";
import type { PersonProfile } from "@/server/queries/admin";
import { EnrollmentStatusBadge, SubmissionStatusBadge } from "../badges";
import { TimeAgo } from "../time-ago";

export function EnrollmentList({ enrollments, emptyText }: { enrollments: PersonProfile["enrollments"]; emptyText: string }) {
  if (!enrollments.length) return <EmptyState compact icon={<BookOpen />} title="No courses" description={emptyText} />;
  return (
    <ul className="divide-y divide-border">
      {enrollments.map((e) => (
        <li key={e.id} className="py-3.5 first:pt-0 last:pb-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <Link href={`/courses/${e.course.slug}`} className="font-medium hover:underline">
                {e.course.title}
              </Link>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Enrolled {formatDate(e.enrolledAt)}
                {e.completedAt ? ` · Completed ${formatDate(e.completedAt)}` : ""}
                {e.lastAccessedAt && !e.completedAt ? (
                  <>
                    {" · Last opened "}
                    <TimeAgo date={e.lastAccessedAt} />
                  </>
                ) : null}
              </p>
              {e.lastLessonTitle && e.status === "ACTIVE" && <p className="mt-0.5 text-xs text-subtle-foreground">Up to: {e.lastLessonTitle}</p>}
            </div>
            <span className="self-start">
              <EnrollmentStatusBadge status={e.status} />
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-3">
            <ProgressBar
              value={e.progressPercent}
              size="sm"
              tone={e.status === "COMPLETED" ? "success" : "primary"}
              label={`${e.course.title}: ${e.progressPercent}% complete`}
            />
            <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{e.progressPercent}%</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function CertificateList({ certificates }: { certificates: PersonProfile["certificates"] }) {
  if (!certificates.length)
    return <EmptyState compact icon={<Award />} title="No certificates yet" description="Certificates are issued when a course is completed." />;
  return (
    <ul className="divide-y divide-border">
      {certificates.map((c) => (
        <li key={c.id} className="flex flex-col gap-2 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="font-medium">{c.courseTitle}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Issued {formatDate(c.issuedAt)} · <span className="font-mono">{c.code}</span>
            </p>
            {c.revokedAt && <p className="mt-1 text-xs text-danger">Revoked {formatDate(c.revokedAt)}{c.revokedReason ? `: ${c.revokedReason}` : ""}</p>}
          </div>
          <div className="flex items-center gap-2">
            {c.revokedAt ? <Badge variant="danger">Revoked</Badge> : <Badge variant="success">Valid</Badge>}
            <Link href={`/verify/${c.code}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline" target="_blank">
              Verify
              <ExternalLink className="size-3.5" aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function QuizAttemptList({ attempts }: { attempts: PersonProfile["quizAttempts"] }) {
  if (!attempts.length) return <EmptyState compact icon={<Target />} title="No quiz attempts" description="Quiz results will appear here." />;
  return (
    <ul className="divide-y divide-border">
      {attempts.map((a) => (
        <li key={a.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{a.quizTitle}</p>
            <p className="truncate text-xs text-muted-foreground">
              {a.courseTitle} · attempt {a.attemptNumber} · <TimeAgo date={a.submittedAt} />
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-sm font-semibold tabular-nums">{formatPercent(a.score)}</span>
            {a.passed ? <Badge variant="success">Passed</Badge> : <Badge variant="warning">Not passed</Badge>}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function SubmissionList({ submissions }: { submissions: PersonProfile["submissions"] }) {
  if (!submissions.length) return <EmptyState compact icon={<FileText />} title="No submissions" description="Assignment submissions will appear here." />;
  return (
    <ul className="divide-y divide-border">
      {submissions.map((s) => (
        <li key={s.id} className="flex flex-col gap-1.5 py-2.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{s.lessonTitle}</p>
            <p className="truncate text-xs text-muted-foreground">
              {s.courseTitle} · revision {s.revision} · submitted <TimeAgo date={s.submittedAt} />
            </p>
          </div>
          <span className="self-start sm:self-center">
            <SubmissionStatusBadge status={s.status} />
          </span>
        </li>
      ))}
    </ul>
  );
}
