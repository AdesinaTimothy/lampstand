import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, MailCheck, MailWarning, Presentation, Trophy } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Stat } from "@/components/ui/stat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MemberStatusBadge, RoleBadge } from "@/components/admin/badges";
import { SectionCard } from "@/components/admin/section-card";
import { TimeAgo } from "@/components/admin/time-ago";
import { ActivityFeed } from "@/components/admin/dashboard/activity-feed";
import { MemberActions } from "@/components/admin/people/member-actions";
import { CertificateList, EnrollmentList, QuizAttemptList, SubmissionList } from "@/components/admin/people/profile-sections";
import { AppError } from "@/lib/errors";
import { formatDate, formatPercent } from "@/lib/format";
import { pluralize } from "@/lib/utils";
import { requirePagePermission } from "@/server/auth/guards";
import { getPersonProfile } from "@/server/queries/admin";

async function load(userId: string) {
  const viewer = await requirePagePermission("learner:view", `/admin/learners/${userId}`);
  try {
    return await getPersonProfile(viewer, userId);
  } catch (error) {
    if (error instanceof AppError && error.code === "NOT_FOUND") notFound();
    throw error;
  }
}

export async function generateMetadata(props: PageProps<"/admin/learners/[userId]">): Promise<Metadata> {
  const { userId } = await props.params;
  const profile = await load(userId);
  return { title: profile.person.name };
}

export default async function PersonPage(props: PageProps<"/admin/learners/[userId]">) {
  const { userId } = await props.params;
  const { person, permissions, summary, enrollments, certificates, quizAttempts, submissions, activity, achievements } = await load(userId);
  const inProgress = enrollments.filter((e) => e.status === "ACTIVE");

  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/admin/learners" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        People
      </Link>

      <Card>
        <CardContent className="grid gap-6 lg:grid-cols-[1fr_minmax(0,22rem)]">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
            <Avatar name={person.name} src={person.avatarUrl} size="lg" />
            <div className="min-w-0">
              <h1 className="text-display text-[1.75rem] font-medium leading-tight">{person.name}</h1>
              <p className="mt-0.5 break-all text-sm text-muted-foreground">{person.email}</p>
              {person.headline && <p className="mt-1 text-sm">{person.headline}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <RoleBadge role={person.role} />
                <MemberStatusBadge status={person.status} />
                {person.accountSuspended && person.status === "ACTIVE" && <MemberStatusBadge status="SUSPENDED" />}
              </div>
              <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm text-muted-foreground sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4 shrink-0" aria-hidden />
                  <dt className="sr-only">Joined</dt>
                  <dd>Joined {formatDate(person.joinedAt)}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="size-4 shrink-0" aria-hidden />
                  <dt className="sr-only">Last active</dt>
                  <dd>
                    Last active <TimeAgo date={person.lastActiveAt} fallback="never" />
                  </dd>
                </div>
                <div className="flex items-center gap-2">
                  {person.emailVerified ? <MailCheck className="size-4 shrink-0" aria-hidden /> : <MailWarning className="size-4 shrink-0 text-warning" aria-hidden />}
                  <dt className="sr-only">Email</dt>
                  <dd>{person.emailVerified ? "Email verified" : "Email not verified"}</dd>
                </div>
                {person.teachingCount > 0 && (
                  <div className="flex items-center gap-2">
                    <Presentation className="size-4 shrink-0" aria-hidden />
                    <dt className="sr-only">Teaching</dt>
                    <dd>
                      <Link href={`/admin/instructors/${person.id}`} className="hover:text-foreground hover:underline">
                        Teaches {person.teachingCount} course{person.teachingCount === 1 ? "" : "s"}
                      </Link>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
          <div className="border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <h2 className="mb-3 text-sm font-semibold">Access</h2>
            <MemberActions
              userId={person.id}
              name={person.name}
              role={person.role}
              status={person.status}
              assignableRoles={permissions.assignableRoles}
              canChangeRole={permissions.canChangeRole}
              canChangeStatus={permissions.canChangeStatus}
              isSelf={permissions.isSelf}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Courses" value={summary.enrolled} hint={`${summary.inProgress} in progress`} />
        <Stat label="Completed" value={summary.completed} hint={summary.enrolled ? `${formatPercent((summary.completed / summary.enrolled) * 100)} of courses` : "—"} />
        <Stat label="Average progress" value={summary.enrolled ? formatPercent(summary.averageProgress) : "—"} hint="Across active courses" />
        <Stat
          label="Quiz average"
          value={summary.quizAverage !== null ? formatPercent(summary.quizAverage) : "—"}
          hint={`${summary.quizPassed}/${summary.quizAttempts} attempts passed`}
        />
      </div>

      <Tabs defaultValue="overview">
        <TabsList aria-label="Profile sections">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="courses">Courses ({enrollments.length})</TabsTrigger>
          <TabsTrigger value="certificates">Certificates ({certificates.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 grid items-start gap-6 lg:grid-cols-2">
          <SectionCard title="In progress" description="Courses they're currently taking.">
            <EnrollmentList enrollments={inProgress} emptyText="Nothing in progress right now." />
          </SectionCard>
          <SectionCard title="Quiz results" description={summary.quizAttempts ? `${pluralize(summary.quizAttempts, "attempt")} in total; latest first.` : undefined}>
            <QuizAttemptList attempts={quizAttempts} />
          </SectionCard>
          <SectionCard title="Assignment submissions">
            <SubmissionList submissions={submissions} />
          </SectionCard>
          <SectionCard title="Achievements">
            {achievements.length ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {achievements.map((a) => (
                  <li key={a.code} className="flex items-start gap-3 rounded-lg border border-border p-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-soft-foreground">
                      <Trophy className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.description}</p>
                      <p className="mt-0.5 text-xs text-subtle-foreground">{formatDate(a.earnedAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState compact icon={<Trophy />} title="No achievements yet" description="Milestones like a first lesson or a learning streak appear here." />
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="courses" className="mt-6">
          <Card>
            <CardContent>
              <EnrollmentList enrollments={enrollments} emptyText="They haven't enrolled in any courses yet." />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificates" className="mt-6">
          <Card>
            <CardContent>
              <CertificateList certificates={certificates} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <Card>
            <CardContent>
              {activity.length ? (
                <ActivityFeed items={activity} showActor={false} />
              ) : (
                <EmptyState compact title="No activity yet" description="Lessons, quizzes and completions will appear here." />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
