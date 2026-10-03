import type { Metadata } from "next";
import { Inbox } from "lucide-react";
import { StatusTabs } from "@/components/builder/courses/status-tabs";
import { CourseFilter } from "@/components/builder/submissions/course-filter";
import { ReviewDialog } from "@/components/builder/submissions/review-dialog";
import { SubmissionList } from "@/components/builder/submissions/submission-list";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SUBMISSION_FILTERS, type SubmissionFilter } from "@/lib/validation/instructor";
import { requireInstructorPage } from "@/server/auth/guards";
import { getSubmissionForReview, listSubmissions } from "@/server/queries/instructor";

export const metadata: Metadata = { title: "Submissions" };

const LABELS: Record<SubmissionFilter, string> = { pending: "To review", revision: "Revision requested", approved: "Approved", all: "All" };
const EMPTY: Record<SubmissionFilter, { title: string; description: string }> = {
  pending: { title: "You're all caught up", description: "New assignment submissions will appear here for review." },
  revision: { title: "No revisions outstanding", description: "Submissions you've sent back for changes will show here until the learner resubmits." },
  approved: { title: "Nothing approved yet", description: "Approved submissions are kept here for reference." },
  all: { title: "No submissions yet", description: "When learners hand in assignments, they'll appear here." },
};

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function SubmissionsPage(props: PageProps<"/instructor/submissions">) {
  const viewer = await requireInstructorPage("/instructor/submissions");
  const sp = await props.searchParams;
  const rawStatus = first(sp.status);
  const status: SubmissionFilter = (SUBMISSION_FILTERS as readonly string[]).includes(rawStatus) ? (rawStatus as SubmissionFilter) : "pending";
  const courseParam = first(sp.course).slice(0, 40) || null;
  const selectedId = first(sp.submission).slice(0, 40) || null;

  const [{ submissions, counts, courses }, selected] = await Promise.all([
    listSubmissions(viewer, { status, courseId: courseParam }),
    selectedId ? getSubmissionForReview(viewer, selectedId) : Promise.resolve(null),
  ]);
  const courseId = courseParam && courses.some((c) => c.id === courseParam) ? courseParam : null;

  const href = (params: { status?: SubmissionFilter; course?: string | null; submission?: string | null }) => {
    const q = new URLSearchParams();
    const s = params.status ?? status;
    const c = params.course === undefined ? courseId : params.course;
    if (s !== "pending") q.set("status", s);
    if (c) q.set("course", c);
    if (params.submission) q.set("submission", params.submission);
    const qs = q.toString();
    return qs ? `/instructor/submissions?${qs}` : "/instructor/submissions";
  };
  const courseHrefs = Object.fromEntries([["__all", href({ course: null })], ...courses.map((c) => [c.id, href({ course: c.id })])]);

  return (
    <div className="space-y-6">
      <PageHeader title="Submissions" description="Review assignments, give feedback and approve your learners' work." />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <StatusTabs
          label="Filter by status"
          active={status}
          hrefFor={(s) => href({ status: s })}
          tabs={SUBMISSION_FILTERS.map((key) => ({ key, label: LABELS[key], count: counts[key] }))}
        />
        {courses.length > 1 && <CourseFilter courses={courses} value={courseId} hrefFor={courseHrefs} />}
      </div>

      {submissions.length > 0 ? (
        <SubmissionList submissions={submissions} selectedId={selectedId} hrefFor={(id) => href({ submission: id })} />
      ) : (
        <EmptyState icon={<Inbox />} title={EMPTY[status].title} description={EMPTY[status].description} />
      )}

      <ReviewDialog open={Boolean(selectedId)} submission={selected} closeHref={href({})} />
    </div>
  );
}
