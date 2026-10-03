import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { ActivityFeed } from "@/components/builder/overview/activity-feed";
import { AttentionList } from "@/components/builder/overview/attention-list";
import { EnrolmentTrend, enrolmentTakeaway } from "@/components/builder/overview/enrolment-trend";
import { OverviewStats } from "@/components/builder/overview/overview-stats";
import { NewCourseDialog } from "@/components/builder/courses/new-course-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireInstructorPage } from "@/server/auth/guards";
import { getCurrentOrganization } from "@/server/organization";
import { getInstructorOverview, listCategoryOptions } from "@/server/queries/instructor";

export const metadata: Metadata = { title: "Overview" };

function greeting(timezone: string) {
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: timezone }).format(new Date()));
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function InstructorOverviewPage() {
  const viewer = await requireInstructorPage("/instructor");
  const [data, categories, org] = await Promise.all([
    getInstructorOverview(viewer),
    listCategoryOptions(viewer),
    getCurrentOrganization(),
  ]);
  const firstName = viewer.name.split(" ")[0] ?? viewer.name;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={data.scope === "organization" ? `${org.name} · all courses` : "Your teaching"}
        title={`${greeting(org.timezone)}, ${firstName}`}
        description="Here's how your learners are doing and what needs you next."
        actions={<NewCourseDialog categories={categories} />}
      />

      {data.courses.total === 0 ? (
        <EmptyState
          icon={<BookOpen />}
          title="Create your first course"
          description="Start with a title. You'll add sections, lessons, videos and quizzes in the course builder — nothing is visible to learners until you publish."
          action={<NewCourseDialog categories={categories} label="Create a course" />}
        />
      ) : (
        <>
          <OverviewStats data={data} />

          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="min-w-0 lg:col-span-3">
              <CardHeader>
                <CardTitle>Enrolments</CardTitle>
                <CardDescription>{enrolmentTakeaway(data.weekly)}</CardDescription>
              </CardHeader>
              <CardContent>
                <EnrolmentTrend weekly={data.weekly} />
              </CardContent>
            </Card>
            <Card className="min-w-0 lg:col-span-2">
              <CardHeader>
                <CardTitle>Needs your attention</CardTitle>
                <CardDescription>Reviews to give and drafts to finish.</CardDescription>
              </CardHeader>
              <CardContent>
                <AttentionList pending={data.pending} pendingCount={data.pendingCount} drafts={data.drafts} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex-row items-center justify-between gap-3">
              <div>
                <CardTitle>Recent learner activity</CardTitle>
                <CardDescription>The latest across your courses.</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/instructor/courses">All courses</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <ActivityFeed items={data.activity} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
