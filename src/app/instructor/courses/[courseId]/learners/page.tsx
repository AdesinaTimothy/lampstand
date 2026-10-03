import type { Metadata } from "next";
import Link from "next/link";
import { SearchX, Users } from "lucide-react";
import { SearchForm } from "@/components/builder/courses/search-form";
import { LearnerList } from "@/components/builder/learners/learner-list";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { formatNumber } from "@/lib/format";
import { requireInstructorPage } from "@/server/auth/guards";
import { getCourseEditorHeader, listCourseLearners } from "@/server/queries/instructor";

type Props = PageProps<"/instructor/courses/[courseId]/learners">;

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { courseId } = await props.params;
  const course = await getCourseEditorHeader(await requireInstructorPage(), courseId);
  return { title: `Learners · ${course.title}` };
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function CourseLearnersPage(props: Props) {
  const { courseId } = await props.params;
  const sp = await props.searchParams;
  const viewer = await requireInstructorPage(`/instructor/courses/${courseId}/learners`);
  const q = first(sp.q).slice(0, 100);
  const page = Math.max(1, Number.parseInt(first(sp.page), 10) || 1);
  const data = await listCourseLearners(viewer, courseId, { q, page });
  const base = `/instructor/courses/${courseId}/learners`;
  const everyone = data.summary.active + data.summary.completed + data.summary.dropped;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Learners</h2>
          <p className="text-sm text-muted-foreground">
            {formatNumber(data.summary.active)} in progress · {formatNumber(data.summary.completed)} completed
            {data.summary.dropped > 0 && ` · ${formatNumber(data.summary.dropped)} left`}
          </p>
        </div>
        {everyone > 0 && <SearchForm action={base} defaultValue={q} placeholder="Search by name or email" label="Search learners" />}
      </div>

      {data.learners.length > 0 ? (
        <>
          <LearnerList learners={data.learners} />
          <Pagination page={data.page} pageCount={data.pageCount} basePath={base} searchParams={{ q: q || undefined }} />
        </>
      ) : q ? (
        <EmptyState
          icon={<SearchX />}
          title="No learners match"
          description={`Nobody enrolled matches “${q}”.`}
          action={
            <Button asChild variant="outline">
              <Link href={base}>Clear search</Link>
            </Button>
          }
        />
      ) : (
        <EmptyState icon={<Users />} title="No learners yet" description="Once people enrol, you'll see their progress here — who's moving, who's stuck and who has finished." />
      )}
    </div>
  );
}
