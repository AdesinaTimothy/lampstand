import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { requirePageViewer } from "@/server/auth/guards";
import { listMyCourses } from "@/server/queries/learner";
import { LearnerCourseCard } from "@/components/learner/learner-course-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { enumParam } from "@/lib/search-params";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "My courses" };

const FILTERS = ["all", "in-progress", "completed"] as const;

export default async function MyCoursesPage(props: PageProps<"/my-courses">) {
  const viewer = await requirePageViewer("/my-courses");
  const filter = enumParam(await props.searchParams, "filter", FILTERS) ?? "all";
  const { courses, counts } = await listMyCourses(viewer, filter);
  const tabs = [
    { value: "all", label: "All", count: counts.all },
    { value: "in-progress", label: "In progress", count: counts.inProgress },
    { value: "completed", label: "Completed", count: counts.completed },
  ] as const;

  return (
    <div className="container-page py-8 pb-24 sm:py-12 lg:pb-12">
      <PageHeader
        title="My courses"
        description="Everything you're enrolled in. Pick up right where you left off."
        actions={
          <Button asChild variant="outline">
            <Link href="/courses">Find a course</Link>
          </Button>
        }
      />
      <nav aria-label="Filter courses" className="mt-6 border-b border-border">
        <ul className="-mb-px flex gap-1 overflow-x-auto scrollbar-none">
          {tabs.map((t) => {
            const active = t.value === filter;
            return (
              <li key={t.value}>
                <Link
                  href={t.value === "all" ? "/my-courses" : `/my-courses?filter=${t.value}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                    active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.label}
                  <span className="rounded-full bg-surface-sunken px-1.5 text-xs tabular-nums">{t.count}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {courses.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<BookOpen />}
          title={filter === "completed" ? "No completed courses yet" : filter === "in-progress" ? "Nothing in progress" : "You haven't enrolled in a course yet"}
          description={filter === "completed" ? "Finish all the lessons in a course to complete it and earn a certificate." : "Browse the catalogue and enrol in something that will help you grow."}
          action={
            <Button asChild>
              <Link href="/courses">Browse courses</Link>
            </Button>
          }
        />
      ) : (
        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          {courses.map((c) => (
            <LearnerCourseCard key={c.enrollmentId} item={c} />
          ))}
        </div>
      )}
    </div>
  );
}
