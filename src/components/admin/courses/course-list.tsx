import Link from "next/link";
import Image from "next/image";
import { BookOpen, Star } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatDate, formatNumber, formatPercent } from "@/lib/format";
import type { AdminCourseRow, InstructorOption } from "@/server/queries/admin";
import { CourseStatusBadge } from "../badges";
import { CourseActions } from "./course-actions";
import { FeaturedSwitch } from "./featured-switch";

function Thumb({ course }: { course: AdminCourseRow }) {
  return (
    <span className="relative grid aspect-[16/10] w-14 shrink-0 place-items-center overflow-hidden rounded-md bg-primary-soft text-primary">
      {course.thumbnailUrl ? (
        <Image src={course.thumbnailUrl} alt="" fill sizes="56px" className="object-cover" />
      ) : (
        <BookOpen className="size-4" aria-hidden />
      )}
    </span>
  );
}

function Instructors({ course }: { course: AdminCourseRow }) {
  if (course.instructors.length === 0) return <span className="text-sm text-warning">No instructor</span>;
  const [lead, ...rest] = course.instructors;
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Avatar name={lead.name} src={lead.avatarUrl} size="xs" />
      <span className="truncate text-sm">
        {lead.name}
        {rest.length > 0 && <span className="text-muted-foreground"> +{rest.length}</span>}
      </span>
    </span>
  );
}

function Rating({ course }: { course: AdminCourseRow }) {
  if (course.ratingCount === 0) return <span className="text-subtle-foreground">—</span>;
  return (
    <span className="inline-flex items-center gap-1 tabular-nums">
      <Star className="size-3.5 fill-accent text-accent" aria-hidden />
      {course.ratingAverage.toFixed(1)}
      <span className="text-xs text-muted-foreground">({course.ratingCount})</span>
      {course.hiddenReviewCount > 0 && <span className="sr-only">, {course.hiddenReviewCount} hidden</span>}
    </span>
  );
}

export function CourseList({ courses, instructorOptions }: { courses: AdminCourseRow[]; instructorOptions: InstructorOption[] }) {
  return (
    <>
      <ul className="divide-y divide-border xl:hidden">
        {courses.map((c) => (
          <li key={c.id} className="px-4 py-4">
            <div className="flex items-start gap-3">
              <Thumb course={c} />
              <div className="min-w-0 flex-1">
                <Link href={`/instructor/courses/${c.id}`} className="line-clamp-2 font-medium hover:underline">
                  {c.title}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <CourseStatusBadge status={c.status} />
                  {c.category && <span className="text-xs text-muted-foreground">{c.category}</span>}
                </div>
              </div>
              <CourseActions course={c} instructorOptions={instructorOptions} />
            </div>
            <div className="mt-3">
              <Instructors course={c} />
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Learners</dt>
                <dd className="tabular-nums">{formatNumber(c.enrolled)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Completion</dt>
                <dd className="tabular-nums">{c.completionRate === null ? "—" : formatPercent(c.completionRate)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Rating</dt>
                <dd>
                  <Rating course={c} />
                </dd>
              </div>
            </dl>
            <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-surface-muted/60 px-3 py-2">
              <span className="text-sm">Featured on home page</span>
              <FeaturedSwitch courseId={c.id} title={c.title} featured={c.featured} published={c.status === "PUBLISHED"} />
            </div>
          </li>
        ))}
      </ul>
      <div className="hidden xl:block">
        <Table className="[&_td]:px-3 [&_th]:px-3">
          <THead>
            <tr>
              <TH>Course</TH>
              <TH>Instructors</TH>
              <TH className="text-right">Learners</TH>
              <TH>Rating</TH>
              <TH>Featured</TH>
              <TH>
                <span className="sr-only">Actions</span>
              </TH>
            </tr>
          </THead>
          <TBody>
            {courses.map((c) => (
              <TR key={c.id}>
                <TD>
                  <div className="flex items-center gap-3">
                    <Thumb course={c} />
                    <div className="min-w-0">
                      <Link href={`/instructor/courses/${c.id}`} className="block max-w-64 truncate font-medium hover:underline" title={c.title}>
                        {c.title}
                      </Link>
                      <div className="mt-1 flex items-center gap-1.5">
                        <CourseStatusBadge status={c.status} />
                        <span className="max-w-32 truncate text-xs text-muted-foreground xl:max-w-48" title={`Updated ${formatDate(c.updatedAt)}`}>
                          {c.category ?? "Uncategorized"}
                        </span>
                      </div>
                    </div>
                  </div>
                </TD>
                <TD className="max-w-44">
                  <Instructors course={c} />
                </TD>
                <TD className="whitespace-nowrap text-right tabular-nums">
                  {formatNumber(c.enrolled)}
                  <span className="block text-xs text-muted-foreground">
                    {c.completionRate === null ? "no learners" : `${formatPercent(c.completionRate)} completed`}
                  </span>
                </TD>
                <TD className="whitespace-nowrap">
                  <Rating course={c} />
                </TD>
                <TD>
                  <FeaturedSwitch courseId={c.id} title={c.title} featured={c.featured} published={c.status === "PUBLISHED"} />
                </TD>
                <TD className="text-right">
                  <CourseActions course={c} instructorOptions={instructorOptions} />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </>
  );
}
