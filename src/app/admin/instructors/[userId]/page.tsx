import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, ExternalLink, Pencil, Star } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress";
import { Stat } from "@/components/ui/stat";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { CourseStatusBadge, MemberStatusBadge, RoleBadge } from "@/components/admin/badges";
import { SectionCard } from "@/components/admin/section-card";
import { TimeAgo } from "@/components/admin/time-ago";
import { QuizPerformanceList, quizTakeaway } from "@/components/admin/dashboard/quiz-performance";
import { AppError } from "@/lib/errors";
import { formatDate, formatNumber, formatPercent } from "@/lib/format";
import { requirePagePermission } from "@/server/auth/guards";
import { getInstructorDetail, type InstructorCourseStat } from "@/server/queries/admin";

async function load(userId: string) {
  const viewer = await requirePagePermission("instructor:manage", `/admin/instructors/${userId}`);
  try {
    return await getInstructorDetail(viewer, userId);
  } catch (error) {
    if (error instanceof AppError && error.code === "NOT_FOUND") notFound();
    throw error;
  }
}

export async function generateMetadata(props: PageProps<"/admin/instructors/[userId]">): Promise<Metadata> {
  const { userId } = await props.params;
  const { instructor } = await load(userId);
  return { title: instructor.name };
}

function CourseLinks({ course }: { course: InstructorCourseStat }) {
  return (
    <div className="flex items-center gap-1">
      <Link href={`/instructor/courses/${course.id}`} className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
        <Pencil aria-hidden />
        <span className="sr-only">Edit {course.title}</span>
      </Link>
      {course.status === "PUBLISHED" && (
        <Link href={`/courses/${course.slug}`} className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
          <ExternalLink aria-hidden />
          <span className="sr-only">View {course.title} in the catalogue</span>
        </Link>
      )}
    </div>
  );
}

export default async function InstructorDetailPage(props: PageProps<"/admin/instructors/[userId]">) {
  const { userId } = await props.params;
  const { instructor, totals, courses, quizzes, recentReviews } = await load(userId);
  const quizNote = quizTakeaway(quizzes);

  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/admin/instructors" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        Instructors
      </Link>

      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
            <Avatar name={instructor.name} src={instructor.avatarUrl} size="lg" />
            <div className="min-w-0">
              <h1 className="text-display text-[1.75rem] font-medium leading-tight">{instructor.name}</h1>
              <p className="mt-0.5 break-all text-sm text-muted-foreground">{instructor.email}</p>
              {instructor.headline && <p className="mt-1 text-sm">{instructor.headline}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <RoleBadge role={instructor.role} />
                <MemberStatusBadge status={instructor.status} />
                <span className="text-xs text-muted-foreground">
                  Member since {formatDate(instructor.joinedAt)} · last signed in <TimeAgo date={instructor.lastActiveAt} fallback="never" />
                </span>
              </div>
            </div>
          </div>
          <Link href={`/admin/learners/${instructor.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            Manage access
          </Link>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Courses" value={totals.courses} hint={`${totals.published} published`} />
        <Stat label="Learners" value={formatNumber(totals.learners)} hint={`${formatNumber(totals.enrolled)} enrolments`} />
        <Stat
          label="Completion rate"
          value={totals.completionRate === null ? "—" : formatPercent(totals.completionRate)}
          hint={`${formatNumber(totals.completed)} completed`}
        />
        <Stat
          label="Average rating"
          value={totals.ratingAverage === null ? "—" : totals.ratingAverage.toFixed(1)}
          hint={totals.ratingCount ? `${formatNumber(totals.ratingCount)} reviews` : "No reviews yet"}
        />
      </div>

      <SectionCard title="Courses" description="Performance of every course they teach." contentClassName="px-0 sm:px-0">
        {courses.length === 0 ? (
          <div className="px-5 sm:px-6">
            <EmptyState
              compact
              icon={<BookOpen />}
              title="Not teaching any courses yet"
              description="Assign them to a course from the Courses page, or they can create their own."
              action={
                <Link href="/admin/courses" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Go to courses
                </Link>
              }
            />
          </div>
        ) : (
          <>
            <ul className="divide-y divide-border border-t border-border md:hidden">
              {courses.map((c) => (
                <li key={c.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium">{c.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <CourseStatusBadge status={c.status} />
                        {c.role === "OWNER" && <span className="text-xs text-muted-foreground">Lead instructor</span>}
                      </div>
                    </div>
                    <CourseLinks course={c} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {formatNumber(c.enrolled)} learners · {c.completionRate === null ? "no completions yet" : `${formatPercent(c.completionRate)} completed`}
                    {c.ratingCount > 0 ? ` · ★ ${c.ratingAverage.toFixed(1)}` : ""}
                  </p>
                  <ProgressBar value={c.averageProgress} size="sm" className="mt-2" label={`${c.title}: average progress ${formatPercent(c.averageProgress)}`} />
                </li>
              ))}
            </ul>
            <div className="hidden border-t border-border md:block">
              <Table>
                <THead>
                  <tr>
                    <TH>Course</TH>
                    <TH>Status</TH>
                    <TH className="text-right">Learners</TH>
                    <TH>Avg. progress</TH>
                    <TH className="text-right">Completion</TH>
                    <TH>Rating</TH>
                    <TH>
                      <span className="sr-only">Links</span>
                    </TH>
                  </tr>
                </THead>
                <TBody>
                  {courses.map((c) => (
                    <TR key={c.id}>
                      <TD>
                        <p className="max-w-64 truncate font-medium">{c.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.role === "OWNER" ? "Lead instructor" : "Co-instructor"} · updated {formatDate(c.updatedAt)}
                        </p>
                      </TD>
                      <TD>
                        <CourseStatusBadge status={c.status} />
                      </TD>
                      <TD className="text-right tabular-nums">{formatNumber(c.enrolled)}</TD>
                      <TD>
                        <div className="flex min-w-28 items-center gap-2">
                          <ProgressBar value={c.averageProgress} size="sm" label={`${c.title}: average progress`} />
                          <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{formatPercent(c.averageProgress)}</span>
                        </div>
                      </TD>
                      <TD className="text-right tabular-nums">{c.completionRate === null ? "—" : formatPercent(c.completionRate)}</TD>
                      <TD className="whitespace-nowrap">
                        {c.ratingCount > 0 ? (
                          <span className="inline-flex items-center gap-1 tabular-nums">
                            <Star className="size-3.5 fill-accent text-accent" aria-hidden />
                            {c.ratingAverage.toFixed(1)} <span className="text-xs text-muted-foreground">({c.ratingCount})</span>
                          </span>
                        ) : (
                          <span className="text-subtle-foreground">—</span>
                        )}
                      </TD>
                      <TD>
                        <CourseLinks course={c} />
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          </>
        )}
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-5">
        <SectionCard title="Quiz performance" description={quizNote ?? undefined} className="lg:col-span-3">
          {quizzes.length ? (
            <QuizPerformanceList quizzes={quizzes} size={3} />
          ) : (
            <EmptyState compact title="No quiz attempts yet" description="Results from quizzes in their courses will appear here." />
          )}
        </SectionCard>
        <SectionCard title="Recent reviews" className="lg:col-span-2">
          {recentReviews.length ? (
            <ul className="space-y-4">
              {recentReviews.map((r) => (
                <li key={r.id} className="text-sm">
                  <p className="flex items-center gap-1.5 font-medium">
                    <span className="inline-flex items-center gap-0.5 text-accent" aria-label={`${r.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className={i < r.rating ? "size-3.5 fill-accent" : "size-3.5 text-border-strong"} aria-hidden />
                      ))}
                    </span>
                    <span className="truncate">{r.course.title}</span>
                  </p>
                  {r.body && <p className="mt-1 line-clamp-3 text-muted-foreground">{r.body}</p>}
                  <p className="mt-1 text-xs text-subtle-foreground">
                    {r.user.name} · <TimeAgo date={r.createdAt} />
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState compact title="No reviews yet" description="Learner reviews of their courses will appear here." />
          )}
        </SectionCard>
      </div>
    </div>
  );
}
