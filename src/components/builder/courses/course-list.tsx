import Link from "next/link";
import { ChevronRight, Star, Users } from "lucide-react";
import type { InstructorCourseRow } from "@/server/queries/instructor";
import { CourseCover } from "@/components/course/course-cover";
import { ProgressBar } from "@/components/ui/progress";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatNumber, formatRelative } from "@/lib/format";
import { pluralize } from "@/lib/utils";
import { CourseStatusBadge } from "../course-status-badge";

const editorHref = (c: InstructorCourseRow) => `/instructor/courses/${c.id}/${c.lessonCount === 0 ? "curriculum" : "details"}`;

function Completion({ value }: { value: number | null }) {
  if (value === null) return <span className="text-subtle-foreground">—</span>;
  return (
    <div className="flex items-center gap-2.5">
      <ProgressBar value={value} size="sm" className="w-16" label="Completion rate" />
      <span className="tabular-nums">{value}%</span>
    </div>
  );
}

function Rating({ c }: { c: InstructorCourseRow }) {
  if (c.ratingCount === 0) return <span className="text-subtle-foreground">—</span>;
  return (
    <span className="inline-flex items-center gap-1 tabular-nums">
      <Star className="size-3.5 text-accent" fill="currentColor" strokeWidth={0} aria-hidden />
      {c.ratingAverage.toFixed(1)}
      <span className="text-muted-foreground">({c.ratingCount})</span>
    </span>
  );
}

/** Cards on phones, a table from `md` up. */
export function CourseList({ courses }: { courses: InstructorCourseRow[] }) {
  return (
    <>
      <ul className="grid gap-3 md:hidden">
        {courses.map((c) => (
          <li key={c.id}>
            <Link href={editorHref(c)} className="flex gap-3 rounded-xl border border-border bg-surface p-3 shadow-xs transition-shadow hover:shadow-md">
              <CourseCover src={c.thumbnailUrl} title={c.title} seed={c.id} sizes="96px" className="w-24 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-2 text-sm font-semibold leading-snug">{c.title}</p>
                  <ChevronRight className="mt-0.5 size-4 shrink-0 text-subtle-foreground" aria-hidden />
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <CourseStatusBadge status={c.status} />
                  <span className="inline-flex items-center gap-1">
                    <Users className="size-3.5" aria-hidden /> {formatNumber(c.learners)}
                  </span>
                  {c.completionRate !== null && <span>{c.completionRate}% complete</span>}
                </div>
                <p className="mt-1 text-xs text-subtle-foreground">Updated {formatRelative(c.updatedAt)}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-hidden rounded-xl border border-border bg-surface shadow-xs md:block">
        <Table>
          <THead>
            <tr>
              <TH>Course</TH>
              <TH>Status</TH>
              <TH className="text-right">Learners</TH>
              <TH>Completion</TH>
              <TH>Rating</TH>
              <TH>Updated</TH>
            </tr>
          </THead>
          <TBody>
            {courses.map((c) => (
              <TR key={c.id} className="group relative">
                <TD className="max-w-[22rem]">
                  <div className="flex items-center gap-3">
                    <CourseCover src={c.thumbnailUrl} title={c.title} seed={c.id} sizes="80px" className="w-20 shrink-0 rounded-md" />
                    <div className="min-w-0">
                      <Link
                        href={editorHref(c)}
                        className="line-clamp-2 font-medium leading-snug after:absolute after:inset-0 focus-visible:outline-none group-focus-within:underline"
                      >
                        {c.title}
                      </Link>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {[c.categoryName, pluralize(c.lessonCount, "lesson")].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>
                </TD>
                <TD>
                  <CourseStatusBadge status={c.status} />
                </TD>
                <TD className="text-right tabular-nums">{formatNumber(c.learners)}</TD>
                <TD>
                  <Completion value={c.completionRate} />
                </TD>
                <TD>
                  <Rating c={c} />
                </TD>
                <TD className="whitespace-nowrap text-muted-foreground">{formatRelative(c.updatedAt)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </>
  );
}
