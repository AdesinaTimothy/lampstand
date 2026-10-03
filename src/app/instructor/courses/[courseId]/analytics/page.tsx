import type { Metadata } from "next";
import { BarChart3, ListChecks, Star, TrendingDown } from "lucide-react";
import { BarListChart } from "@/components/charts/charts";
import { QuizPerformance, QuizPerformanceHeader } from "@/components/builder/analytics/quiz-performance";
import { RatingSummary } from "@/components/builder/analytics/rating-summary";
import { funnelTakeaway, quizTakeaway, ratingTakeaway, weeklyTakeaway } from "@/components/builder/analytics/takeaways";
import { EnrolmentTrend } from "@/components/builder/overview/enrolment-trend";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireInstructorPage } from "@/server/auth/guards";
import { getCourseAnalytics, getCourseEditorHeader } from "@/server/queries/instructor";

type Props = PageProps<"/instructor/courses/[courseId]/analytics">;

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { courseId } = await props.params;
  const course = await getCourseEditorHeader(await requireInstructorPage(), courseId);
  return { title: `Analytics · ${course.title}` };
}

function ChartCard({
  title,
  takeaway,
  icon,
  children,
}: {
  title: string;
  takeaway: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 [&_svg]:size-4 [&_svg]:text-primary">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{takeaway}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default async function CourseAnalyticsPage(props: Props) {
  const { courseId } = await props.params;
  const viewer = await requireInstructorPage(`/instructor/courses/${courseId}/analytics`);
  const data = await getCourseAnalytics(viewer, courseId);
  const hasWeekly = data.weekly.some((w) => w.enrolments > 0 || w.completions > 0);
  const hasFunnel = data.learners > 0 && data.funnel.length > 0;
  const attemptedQuizzes = data.quizzes.some((q) => q.attempts > 0);

  return (
    <div className="space-y-6">
      <ChartCard title="Enrolments and completions" icon={<BarChart3 />} takeaway={weeklyTakeaway(data.weekly)}>
        {hasWeekly ? (
          <EnrolmentTrend weekly={data.weekly} />
        ) : (
          <EmptyState
            compact
            title="Nothing to chart yet"
            description="Weekly enrolments and completions will appear once people join the course."
          />
        )}
      </ChartCard>

      <ChartCard title="Where learners stop" icon={<TrendingDown />} takeaway={funnelTakeaway(data.funnel, data.learners)}>
        {hasFunnel ? (
          <>
            <p className="mb-3 text-xs text-muted-foreground">
              Learners who completed each lesson, in course order, out of {data.learners} enrolled.
            </p>
            <div className="relative overflow-hidden">
              <BarListChart
                data={data.funnel.map((f) => ({ label: f.label, completed: f.completed }))}
                labelKey="label"
                valueKey="completed"
                valueLabel="Learners completed"
                max={data.learners}
                ariaLabel="Number of learners who completed each lesson, in course order"
              />
            </div>
          </>
        ) : (
          <EmptyState
            compact
            title="No progress to show yet"
            description="When learners complete lessons you'll see where they slow down or stop."
          />
        )}
      </ChartCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Quiz performance" icon={<ListChecks />} takeaway={quizTakeaway(data.quizzes)}>
          {attemptedQuizzes ? (
            <>
              <QuizPerformanceHeader />
              <QuizPerformance quizzes={data.quizzes} />
            </>
          ) : (
            <EmptyState
              compact
              title={data.quizzes.length ? "No attempts yet" : "No quizzes"}
              description={
                data.quizzes.length
                  ? "Scores and pass rates appear after learners take a quiz."
                  : "Add a quiz lesson to check understanding."
              }
            />
          )}
        </ChartCard>
        <ChartCard title="Ratings" icon={<Star />} takeaway={ratingTakeaway(data.rating)}>
          {data.rating.count > 0 ? (
            <RatingSummary rating={data.rating} />
          ) : (
            <EmptyState compact title="No reviews yet" description="Ratings from learners will show here." />
          )}
        </ChartCard>
      </div>
    </div>
  );
}
