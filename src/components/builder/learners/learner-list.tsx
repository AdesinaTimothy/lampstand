import type { EnrollmentStatus } from "@prisma/client";
import type { CourseLearnerRow } from "@/server/queries/instructor";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatDate, formatRelative } from "@/lib/format";

const STATUS: Record<EnrollmentStatus, { label: string; variant: "primary" | "success" | "neutral" }> = {
  ACTIVE: { label: "In progress", variant: "primary" },
  COMPLETED: { label: "Completed", variant: "success" },
  DROPPED: { label: "Left course", variant: "neutral" },
};

function StatusBadge({ status }: { status: EnrollmentStatus }) {
  return <Badge variant={STATUS[status].variant}>{STATUS[status].label}</Badge>;
}

function Progress({ l }: { l: CourseLearnerRow }) {
  return (
    <div className="flex items-center gap-2.5">
      <ProgressBar value={l.progressPercent} size="sm" tone={l.status === "COMPLETED" ? "success" : "primary"} label={`${l.name}'s progress`} className="w-24" />
      <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{l.progressPercent}%</span>
    </div>
  );
}

export function LearnerList({ learners }: { learners: CourseLearnerRow[] }) {
  return (
    <>
      <ul className="divide-y divide-border rounded-xl border border-border bg-surface md:hidden">
        {learners.map((l) => (
          <li key={l.id} className="space-y-3 p-4">
            <div className="flex items-center gap-3">
              <Avatar name={l.name} src={l.avatarUrl} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{l.name}</p>
                <p className="truncate text-xs text-muted-foreground">{l.email}</p>
              </div>
              <StatusBadge status={l.status} />
            </div>
            <Progress l={l} />
            <p className="text-xs text-muted-foreground">
              Enrolled {formatDate(l.enrolledAt)} · {l.lastActiveAt ? `active ${formatRelative(l.lastActiveAt)}` : "not started"}
              {l.completedAt && ` · finished ${formatDate(l.completedAt)}`}
            </p>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-hidden rounded-xl border border-border bg-surface shadow-xs md:block">
        <Table>
          <THead>
            <tr>
              <TH>Learner</TH>
              <TH>Status</TH>
              <TH>Progress</TH>
              <TH>Enrolled</TH>
              <TH>Last active</TH>
              <TH>Completed</TH>
            </tr>
          </THead>
          <TBody>
            {learners.map((l) => (
              <TR key={l.id}>
                <TD>
                  <div className="flex items-center gap-3">
                    <Avatar name={l.name} src={l.avatarUrl} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{l.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{l.email}</p>
                    </div>
                  </div>
                </TD>
                <TD>
                  <StatusBadge status={l.status} />
                </TD>
                <TD>
                  <Progress l={l} />
                </TD>
                <TD className="whitespace-nowrap text-muted-foreground">{formatDate(l.enrolledAt)}</TD>
                <TD className="whitespace-nowrap text-muted-foreground">{l.lastActiveAt ? formatRelative(l.lastActiveAt) : "—"}</TD>
                <TD className="whitespace-nowrap text-muted-foreground">{l.completedAt ? formatDate(l.completedAt) : "—"}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </>
  );
}
