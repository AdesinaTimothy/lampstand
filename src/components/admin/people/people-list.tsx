import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ProgressBar } from "@/components/ui/progress";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatDate, formatPercent } from "@/lib/format";
import type { PersonRow } from "@/server/queries/admin";
import { MemberStatusBadge, RoleBadge } from "../badges";
import { TimeAgo } from "../time-ago";

function ProgressSummary({ person }: { person: PersonRow }) {
  if (person.enrolled === 0) return <span className="text-sm text-subtle-foreground">Not enrolled</span>;
  return (
    <div className="min-w-32">
      <div className="flex items-baseline justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {person.completed}/{person.enrolled} completed
        </span>
        <span className="tabular-nums">{formatPercent(person.averageProgress)}</span>
      </div>
      <ProgressBar value={person.averageProgress} size="sm" className="mt-1.5" label={`${person.name}: average progress ${formatPercent(person.averageProgress)}`} />
    </div>
  );
}

/** Table on tablets/desktop, stacked cards on phones. */
export function PeopleList({ people }: { people: PersonRow[] }) {
  return (
    <>
      <ul className="divide-y divide-border md:hidden">
        {people.map((p) => (
          <li key={p.id}>
            <Link href={`/admin/learners/${p.id}`} className="flex items-start gap-3 px-4 py-4 transition-colors hover:bg-surface-muted/50">
              <Avatar name={p.name} src={p.avatarUrl} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="truncate text-sm text-muted-foreground">{p.email}</p>
                  </div>
                  <ChevronRight className="mt-1 size-4 shrink-0 text-subtle-foreground" aria-hidden />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <RoleBadge role={p.role} />
                  {p.status !== "ACTIVE" && <MemberStatusBadge status={p.status} />}
                  <span className="text-xs text-muted-foreground">
                    Active <TimeAgo date={p.lastActiveAt} fallback="never" />
                  </span>
                </div>
                <div className="mt-3">
                  <ProgressSummary person={p} />
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <div className="hidden md:block">
        <Table>
          <THead>
            <tr>
              <TH>Person</TH>
              <TH>Role</TH>
              <TH>Status</TH>
              <TH>Learning</TH>
              <TH>Last active</TH>
              <TH className="hidden lg:table-cell">Joined</TH>
            </tr>
          </THead>
          <TBody>
            {people.map((p) => (
              <TR key={p.id} className="group relative">
                <TD>
                  <div className="flex items-center gap-3">
                    <Avatar name={p.name} src={p.avatarUrl} size="sm" />
                    <div className="min-w-0">
                      {/* The link's pseudo-element makes the whole row clickable while staying one tab stop. */}
                      <Link href={`/admin/learners/${p.id}`} className="block max-w-56 truncate font-medium after:absolute after:inset-0 hover:underline">
                        {p.name}
                      </Link>
                      <p className="max-w-56 truncate text-xs text-muted-foreground">{p.email}</p>
                    </div>
                  </div>
                </TD>
                <TD>
                  <RoleBadge role={p.role} />
                </TD>
                <TD>
                  <MemberStatusBadge status={p.status} />
                </TD>
                <TD>
                  <ProgressSummary person={p} />
                </TD>
                <TD className="whitespace-nowrap text-muted-foreground">
                  <TimeAgo date={p.lastActiveAt} />
                </TD>
                <TD className="hidden whitespace-nowrap text-muted-foreground lg:table-cell">{formatDate(p.joinedAt)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </>
  );
}
