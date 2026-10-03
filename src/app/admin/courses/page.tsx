import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { FilterBar } from "@/components/admin/filter-bar";
import { ResultCount } from "@/components/admin/result-count";
import { CourseList } from "@/components/admin/courses/course-list";
import { requirePagePermission } from "@/server/auth/guards";
import { listAdminCourses, listAssignableInstructors, parseCourseFilters } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Courses" };

export default async function AdminCoursesPage(props: PageProps<"/admin/courses">) {
  const viewer = await requirePagePermission("course:manage_any", "/admin/courses");
  const filters = parseCourseFilters(await props.searchParams);
  const [result, instructorOptions] = await Promise.all([listAdminCourses(viewer, filters), listAssignableInstructors(viewer)]);
  const values = { q: filters.q, status: filters.status };
  const filtered = Boolean(filters.q || filters.status);
  const { statusCounts } = result;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Courses"
        description={`Every course in your organization, including drafts · ${statusCounts.PUBLISHED} published, ${statusCounts.DRAFT} draft, ${statusCounts.ARCHIVED} archived`}
      />
      <FilterBar
        values={values}
        search={{ placeholder: "Search by title or instructor", label: "Search courses" }}
        selects={[
          {
            name: "status",
            label: "Status",
            allLabel: "All statuses",
            options: [
              { value: "PUBLISHED", label: `Published (${statusCounts.PUBLISHED})` },
              { value: "DRAFT", label: `Draft (${statusCounts.DRAFT})` },
              { value: "ARCHIVED", label: `Archived (${statusCounts.ARCHIVED})` },
            ],
          },
        ]}
      />
      <ResultCount total={result.total} noun="course" filtered={filtered} />
      {result.courses.length ? (
        <Card className="overflow-hidden">
          <CourseList courses={result.courses} instructorOptions={instructorOptions} />
        </Card>
      ) : (
        <EmptyState
          icon={<BookOpen />}
          title={filtered ? "No courses match" : "No courses yet"}
          description={filtered ? "Try another search or status." : "Instructors create courses from the instructor studio."}
        />
      )}
      <Pagination page={result.page} pageCount={result.pageCount} basePath="/admin/courses" searchParams={values} />
    </div>
  );
}
