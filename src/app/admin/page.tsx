import type { Metadata } from "next";
import Link from "next/link";
import { Activity, Award, BookCheck, GraduationCap, Percent, Target, UserCheck, Users } from "lucide-react";
import { ColumnChart, TimeSeriesChart } from "@/components/charts/charts";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { KpiTile } from "@/components/admin/kpi-tile";
import { SectionCard } from "@/components/admin/section-card";
import { ChartCard } from "@/components/admin/dashboard/chart-card";
import { ActivityFeed } from "@/components/admin/dashboard/activity-feed";
import { PopularCourses } from "@/components/admin/dashboard/popular-courses";
import { QuizPerformanceList, quizTakeaway } from "@/components/admin/dashboard/quiz-performance";
import { activeTakeaway, certificatesTakeaway, flowTakeaway, growthTakeaway } from "@/components/admin/dashboard/insights";
import { formatNumber, formatPercent } from "@/lib/format";
import { pluralize } from "@/lib/utils";
import { requirePagePermission } from "@/server/auth/guards";
import { getCurrentOrganization } from "@/server/organization";
import { getAdminOverview } from "@/server/queries/analytics";

export const metadata: Metadata = { title: "Overview" };

function greeting(timezone: string) {
  let hour = new Date().getUTCHours();
  try {
    hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: timezone }).format(new Date()));
  } catch {
    // Fall back to UTC for an invalid stored timezone.
  }
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

function todayLabel(timezone: string) {
  try {
    return new Intl.DateTimeFormat("en-US", { weekday: "long", day: "numeric", month: "long", timeZone: timezone }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat("en-US", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  }
}

export default async function AdminOverviewPage() {
  const viewer = await requirePagePermission("analytics:view_org", "/admin");
  const [org, data] = await Promise.all([getCurrentOrganization(), getAdminOverview(viewer)]);
  const { kpis } = data;
  const firstName = viewer.name.split(/\s+/)[0];
  const quizNote = quizTakeaway(data.quizzes);

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{todayLabel(org.timezone)}</p>
          <h1 className="text-display mt-1 text-[1.75rem] font-medium leading-tight sm:text-[2rem]">
            {greeting(org.timezone)}, {firstName}
          </h1>
          <p className="mt-1.5 text-[15px] text-muted-foreground">
            Here&apos;s how {org.name} is learning · {pluralize(kpis.courses.published, "published course")}
            {kpis.courses.drafts > 0 ? `, ${kpis.courses.drafts} in draft` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/learners" className={buttonVariants({ variant: "outline", size: "sm" })}>
            View people
          </Link>
          <Link href="/admin/announcements" className={buttonVariants({ variant: "primary", size: "sm" })}>
            Send announcement
          </Link>
        </div>
      </header>

      <section aria-labelledby="kpi-heading">
        <h2 id="kpi-heading" className="sr-only">
          Key metrics for the last 30 days
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiTile
            label="Learners"
            icon={<Users />}
            value={formatNumber(kpis.members.value)}
            delta={{ value: kpis.members.value, previous: kpis.members.previous, period: "30 days ago" }}
            hint={`${formatNumber(kpis.members.newThisPeriod)} joined in 30 days`}
          />
          <KpiTile
            label="Active learners"
            icon={<UserCheck />}
            value={formatNumber(kpis.activeLearners.value)}
            delta={{ value: kpis.activeLearners.value, previous: kpis.activeLearners.previous }}
            hint={kpis.members.value > 0 ? `${formatPercent((kpis.activeLearners.value / kpis.members.value) * 100)} of members, last 30 days` : undefined}
          />
          <KpiTile
            label="Enrolments"
            icon={<GraduationCap />}
            value={formatNumber(kpis.enrollments.value)}
            delta={{ value: kpis.enrollments.value, previous: kpis.enrollments.previous }}
            hint={`${formatNumber(kpis.enrollments.total)} all time`}
          />
          <KpiTile
            label="Course completions"
            icon={<BookCheck />}
            value={formatNumber(kpis.completions.value)}
            delta={{ value: kpis.completions.value, previous: kpis.completions.previous }}
            hint={`${formatNumber(kpis.completions.total)} all time`}
          />
          <KpiTile
            label="Completion rate"
            icon={<Percent />}
            value={formatPercent(kpis.completionRate.value)}
            delta={{ value: kpis.completionRate.value, previous: kpis.completionRate.previous, mode: "points", period: "30 days ago" }}
            hint="Completed ÷ active enrolments"
          />
          <KpiTile
            label="Average quiz score"
            icon={<Target />}
            value={kpis.quizScore.attempts > 0 ? formatPercent(kpis.quizScore.value) : "—"}
            delta={kpis.quizScore.attempts > 0 ? { value: kpis.quizScore.value, previous: kpis.quizScore.previous, mode: "points" } : undefined}
            hint={`${pluralize(kpis.quizScore.attempts, "attempt")} in 30 days`}
          />
          <KpiTile
            label="Quiz pass rate"
            icon={<Activity />}
            value={kpis.quizScore.attempts > 0 ? formatPercent(kpis.quizPassRate.value) : "—"}
            delta={kpis.quizScore.attempts > 0 ? { value: kpis.quizPassRate.value, previous: kpis.quizPassRate.previous, mode: "points" } : undefined}
            hint={kpis.quizScore.attempts > 0 ? undefined : "No attempts in 30 days"}
          />
          <KpiTile
            label="Certificates issued"
            icon={<Award />}
            value={formatNumber(kpis.certificates.value)}
            delta={{ value: kpis.certificates.value, previous: kpis.certificates.previous }}
            hint={`${formatNumber(kpis.certificates.total)} valid certificates`}
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Learner growth"
          takeaway={growthTakeaway(data.growth)}
          emptyTitle="No members yet"
          emptyDescription="Growth appears here as people join your organization."
        >
          <TimeSeriesChart
            data={data.growth}
            xKey="label"
            series={[{ key: "members", label: "Members", color: 1 }]}
            ariaLabel="Total members at the end of each week, last 26 weeks"
          />
        </ChartCard>
        <ChartCard
          title="Weekly active learners"
          takeaway={activeTakeaway(data.weeklyActive)}
          emptyTitle="No learning activity yet"
          emptyDescription="Once people start lessons, weekly activity shows up here."
        >
          <TimeSeriesChart
            data={data.weeklyActive}
            xKey="label"
            series={[{ key: "active", label: "Active learners", color: 3 }]}
            ariaLabel="Distinct learners active each week, last 26 weeks"
          />
        </ChartCard>
        <ChartCard
          title="Enrolments vs completions"
          takeaway={flowTakeaway(data.enrollmentFlow)}
          emptyTitle="No enrolments in the last 12 weeks"
          emptyDescription="Publish a course and invite people to enrol to see momentum here."
        >
          <ColumnChart
            data={data.enrollmentFlow}
            xKey="label"
            series={[
              { key: "enrolments", label: "Enrolments", color: 1 },
              { key: "completions", label: "Completions", color: 2 },
            ]}
            ariaLabel="Enrolments and course completions per week, last 12 weeks"
          />
        </ChartCard>
        <ChartCard
          title="Certificates per month"
          takeaway={certificatesTakeaway(data.certificatesByMonth)}
          emptyTitle="No certificates issued yet"
          emptyDescription="Certificates are issued automatically when learners complete a course."
        >
          <ColumnChart
            data={data.certificatesByMonth}
            xKey="label"
            series={[{ key: "certificates", label: "Certificates", color: 2 }]}
            ariaLabel="Certificates issued per month, last 12 months"
          />
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <SectionCard
          title="Popular courses"
          description="By active enrolments, with completion rate and rating."
          className="lg:col-span-3"
          action={
            <Link href="/admin/courses" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              All courses
            </Link>
          }
        >
          {data.popularCourses.length ? (
            <PopularCourses courses={data.popularCourses} />
          ) : (
            <EmptyState compact title="No enrolments yet" description="Courses appear here once learners enrol." />
          )}
        </SectionCard>
        <SectionCard title="Recent activity" description="The latest learning milestones." className="lg:col-span-2">
          {data.recentActivity.length ? (
            <ActivityFeed items={data.recentActivity} />
          ) : (
            <EmptyState compact title="Nothing yet" description="Enrolments, completions and quiz results will appear here." />
          )}
        </SectionCard>
      </div>

      <SectionCard title="Quiz performance" description={quizNote ?? "Pass rates and average scores across all quiz attempts."}>
        {data.quizzes.length ? (
          <QuizPerformanceList quizzes={data.quizzes} />
        ) : (
          <EmptyState compact title="No quiz attempts yet" description="Results appear here once learners take quizzes." />
        )}
      </SectionCard>
    </div>
  );
}
