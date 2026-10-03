import type { Metadata } from "next";
import Link from "next/link";
import { Search, SearchX } from "lucide-react";
import { CourseGrid } from "@/components/course/course-card";
import { LessonTypeIcon } from "@/components/course/lesson-type-icon";
import { SearchBox } from "@/components/layout/search-box";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { LESSON_TYPE_LABELS } from "@/lib/course-meta";
import { formatDuration } from "@/lib/format";
import { pageParam, param, toRecord } from "@/lib/search-params";
import { pluralize } from "@/lib/utils";
import { getViewer } from "@/server/auth/viewer";
import { getCurrentOrganization } from "@/server/organization";
import { getPopularCourses, listCatalog } from "@/server/queries/catalog";
import { searchLessonsAndInstructors } from "@/server/queries/search";

export async function generateMetadata(props: PageProps<"/search">): Promise<Metadata> {
  const q = param(await props.searchParams, "q");
  return { title: q ? `Search: ${q}` : "Search", robots: { index: false } };
}

export default async function SearchPage(props: PageProps<"/search">) {
  const sp = await props.searchParams;
  const q = (param(sp, "q") ?? "").trim().slice(0, 100);
  const page = pageParam(sp);
  const [org, viewer] = await Promise.all([getCurrentOrganization(), getViewer()]);

  if (!q) {
    const popular = await getPopularCourses(org.id, viewer?.id, 4);
    return (
      <div className="container-page py-10 sm:py-14">
        <h1 className="text-display text-[2.25rem] font-medium">Search</h1>
        <SearchBox className="mt-6 max-w-2xl" autoFocus />
        <p className="mt-3 text-sm text-muted-foreground">Search courses, lessons, topics and teachers.</p>
        {popular.length > 0 && (
          <section className="mt-14" aria-labelledby="popular-heading">
            <h2 id="popular-heading" className="text-lg font-semibold">
              Popular right now
            </h2>
            <CourseGrid courses={popular} className="mt-5" />
          </section>
        )}
      </div>
    );
  }

  const [courses, extra] = await Promise.all([
    listCatalog({ organizationId: org.id, viewerId: viewer?.id, q, sort: "relevance", page }),
    page === 1 ? searchLessonsAndInstructors(org.id, q) : Promise.resolve({ lessons: [], instructors: [] }),
  ]);
  const nothing = courses.total === 0 && extra.lessons.length === 0 && extra.instructors.length === 0;

  return (
    <div className="container-page py-10 sm:py-14">
      <SearchBox className="max-w-2xl" defaultValue={q} />
      <h1 className="mt-8 text-2xl font-semibold tracking-tight" aria-live="polite">
        {nothing ? "No results" : pluralize(courses.total, "course")} for <span className="text-display font-medium italic">“{q}”</span>
      </h1>

      {nothing ? (
        <EmptyState
          className="mt-8"
          icon={<SearchX />}
          title="Nothing matched your search"
          description="Check the spelling, try a broader word like “prayer” or “leadership”, or browse all courses."
          action={
            <Button asChild variant="outline">
              <Link href="/courses">Browse all courses</Link>
            </Button>
          }
        />
      ) : (
        <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_18rem]">
          <section aria-label="Courses" className="min-w-0">
            {courses.items.length > 0 ? (
              <>
                <CourseGrid courses={courses.items} className="sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3" />
                <Pagination className="mt-10" page={courses.page} pageCount={courses.pageCount} basePath="/search" searchParams={toRecord(sp)} />
              </>
            ) : (
              <p className="rounded-xl border border-dashed border-border-strong p-6 text-sm text-muted-foreground">
                <Search className="mr-1 inline size-4" aria-hidden /> No courses matched, but we found related lessons or teachers.
              </p>
            )}
          </section>

          {(extra.lessons.length > 0 || extra.instructors.length > 0) && (
            <aside className="space-y-10">
              {extra.lessons.length > 0 && (
                <section aria-labelledby="lessons-heading">
                  <h2 id="lessons-heading" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Lessons
                  </h2>
                  <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-surface">
                    {extra.lessons.map((l) => (
                      <li key={l.id}>
                        <Link href={`/courses/${l.course.slug}#curriculum`} className="flex gap-3 p-3 transition-colors hover:bg-surface-muted">
                          <LessonTypeIcon type={l.type} className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                          <span className="min-w-0">
                            <span className="block text-sm font-medium leading-snug">{l.title}</span>
                            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                              {LESSON_TYPE_LABELS[l.type]}
                              {l.durationSeconds ? ` · ${formatDuration(l.durationSeconds)}` : ""} · {l.course.title}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {extra.instructors.length > 0 && (
                <section aria-labelledby="teachers-heading">
                  <h2 id="teachers-heading" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Teachers
                  </h2>
                  <ul className="mt-3 space-y-2">
                    {extra.instructors.map((i) => (
                      <li key={i.id}>
                        <Link href={`/instructors/${i.id}`} className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-surface-muted">
                          <Avatar name={i.name} src={i.avatarUrl} size="md" />
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold">{i.name}</span>
                            <span className="block truncate text-xs text-muted-foreground">{i.headline ?? pluralize(i.courseCount, "course")}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
