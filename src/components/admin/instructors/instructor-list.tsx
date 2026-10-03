import Link from "next/link";
import { ChevronRight, Star } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatNumber, formatPercent } from "@/lib/format";
import type { InstructorRow } from "@/server/queries/admin";
import { MemberStatusBadge, RoleBadge } from "../badges";
import { TimeAgo } from "../time-ago";

function Rating({ value, count }: { value: number | null; count: number }) {
  if (value === null) return <span className="text-subtle-foreground">No ratings</span>;
  return (
    <span className="inline-flex items-center gap-1 tabular-nums">
      <Star className="size-3.5 fill-accent text-accent" aria-hidden />
      {value.toFixed(1)}
      <span className="text-xs text-muted-foreground">({count})</span>
      <span className="sr-only">average rating from {count} reviews</span>
    </span>
  );
}

export function InstructorList({ instructors }: { instructors: InstructorRow[] }) {
  return (
    <>
      <ul className="divide-y divide-border md:hidden">
        {instructors.map((i) => (
          <li key={i.id}>
            <Link href={`/admin/instructors/${i.id}`} className="flex items-start gap-3 px-4 py-4 hover:bg-surface-muted/50">
              <Avatar name={i.name} src={i.avatarUrl} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{i.name}</p>
                    <p className="truncate text-sm text-muted-foreground">{i.email}</p>
                  </div>
                  <ChevronRight className="mt-1 size-4 shrink-0 text-subtle-foreground" aria-hidden />
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <RoleBadge role={i.role} />
                  {i.status !== "ACTIVE" && <MemberStatusBadge status={i.status} />}
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Courses</dt>
                    <dd>
                      {i.courses} <span className="text-xs text-muted-foreground">({i.publishedCourses} live)</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Learners</dt>
                    <dd>{formatNumber(i.learners)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Completion</dt>
                    <dd>{i.completionRate === null ? "—" : formatPercent(i.completionRate)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Rating</dt>
                    <dd>
                      <Rating value={i.ratingAverage} count={i.ratingCount} />
                    </dd>
                  </div>
                </dl>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <div className="hidden md:block">
        <Table>
          <THead>
            <tr>
              <TH>Instructor</TH>
              <TH>Courses</TH>
              <TH className="text-right">Learners</TH>
              <TH className="text-right">Completion</TH>
              <TH>Rating</TH>
              <TH>Last active</TH>
            </tr>
          </THead>
          <TBody>
            {instructors.map((i) => (
              <TR key={i.id} className="relative">
                <TD>
                  <div className="flex items-center gap-3">
                    <Avatar name={i.name} src={i.avatarUrl} size="sm" />
                    <div className="min-w-0">
                      <Link href={`/admin/instructors/${i.id}`} className="block max-w-56 truncate font-medium after:absolute after:inset-0 hover:underline">
                        {i.name}
                      </Link>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <RoleBadge role={i.role} />
                        {i.status !== "ACTIVE" && <MemberStatusBadge status={i.status} />}
                      </div>
                    </div>
                  </div>
                </TD>
                <TD className="whitespace-nowrap">
                  {i.courses} <span className="text-xs text-muted-foreground">({i.publishedCourses} published)</span>
                </TD>
                <TD className="text-right tabular-nums">{formatNumber(i.learners)}</TD>
                <TD className="text-right tabular-nums">{i.completionRate === null ? "—" : formatPercent(i.completionRate)}</TD>
                <TD className="whitespace-nowrap">
                  <Rating value={i.ratingAverage} count={i.ratingCount} />
                </TD>
                <TD className="whitespace-nowrap text-muted-foreground">
                  <TimeAgo date={i.lastActiveAt} />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </>
  );
}

export { Rating as InstructorRating };
