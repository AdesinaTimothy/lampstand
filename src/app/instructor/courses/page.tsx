import type { Metadata } from "next";
import { BookOpen, SearchX } from "lucide-react";
import { CourseList } from "@/components/builder/courses/course-list";
import { NewCourseDialog } from "@/components/builder/courses/new-course-dialog";
import { SearchForm } from "@/components/builder/courses/search-form";
import { StatusTabs } from "@/components/builder/courses/status-tabs";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { COURSE_STATUS_FILTERS, type CourseStatusFilter } from "@/lib/validation/instructor";
import { requireInstructorPage } from "@/server/auth/guards";
import { can } from "@/server/authz/policies";
import { listCategoryOptions, listInstructorCourses } from "@/server/queries/instructor";
import Link from "next/link";

export const metadata: Metadata = { title: "Courses" };

const TAB_LABELS: Record<CourseStatusFilter, string> = { all: "All", published: "Published", drafts: "Drafts", archived: "Archived" };

function param(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function InstructorCoursesPage(props: PageProps<"/instructor/courses">) {
  const viewer = await requireInstructorPage("/instructor/courses");
  const sp = await props.searchParams;
  const rawStatus = param(sp.status);
  const status: CourseStatusFilter = (COURSE_STATUS_FILTERS as readonly string[]).includes(rawStatus) ? (rawStatus as CourseStatusFilter) : "all";
  const q = param(sp.q).slice(0, 100);

  const [{ courses, counts }, categories] = await Promise.all([listInstructorCourses(viewer, { status, q }), listCategoryOptions(viewer)]);
  const hrefFor = (s: CourseStatusFilter) => {
    const params = new URLSearchParams();
    if (s !== "all") params.set("status", s);
    if (q) params.set("q", q);
    const qs = params.toString();
    return qs ? `/instructor/courses?${qs}` : "/instructor/courses";
  };
  const seesAll = can(viewer, "course:manage_any");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Courses"
        description={seesAll ? "Every course in your organization." : "Courses you teach or co-teach."}
        actions={<NewCourseDialog categories={categories} />}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <StatusTabs
          label="Filter by status"
          active={status}
          hrefFor={hrefFor}
          tabs={COURSE_STATUS_FILTERS.map((key) => ({ key, label: TAB_LABELS[key], count: counts[key] }))}
        />
        <SearchForm action="/instructor/courses" defaultValue={q} placeholder="Search courses" label="Search courses" keep={{ status: status === "all" ? undefined : status }} />
      </div>

      {courses.length > 0 ? (
        <CourseList courses={courses} />
      ) : q || status !== "all" ? (
        <EmptyState
          icon={<SearchX />}
          title="No courses match"
          description={q ? `Nothing found for “${q}”${status !== "all" ? ` in ${TAB_LABELS[status].toLowerCase()}` : ""}.` : `You have no ${TAB_LABELS[status].toLowerCase()} courses.`}
          action={
            <Button asChild variant="outline">
              <Link href="/instructor/courses">Clear filters</Link>
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={<BookOpen />}
          title="No courses yet"
          description="Create a draft, add a few lessons, and publish when it's ready."
          action={<NewCourseDialog categories={categories} label="Create a course" />}
        />
      )}
    </div>
  );
}
