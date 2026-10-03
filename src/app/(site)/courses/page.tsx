import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { CatalogFilters } from "@/components/course/catalog-filters";
import { CourseGrid } from "@/components/course/course-card";
import { CategoryIcon } from "@/components/course/category-icon";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { COURSE_LEVELS } from "@/lib/validation/course";
import { enumParam, pageParam, param, toRecord } from "@/lib/search-params";
import { pluralize } from "@/lib/utils";
import { getViewer } from "@/server/auth/viewer";
import { getCurrentOrganization } from "@/server/organization";
import { CATALOG_SORTS, DURATION_BUCKETS, getCategoriesWithCounts, listCatalog, type DurationBucket } from "@/server/queries/catalog";

export const metadata: Metadata = {
  title: "Courses",
  description: "Browse Bible studies, discipleship courses, leadership and ministry training.",
  alternates: { canonical: "/courses" },
};

export default async function CoursesPage(props: PageProps<"/courses">) {
  const sp = await props.searchParams;
  const [org, viewer] = await Promise.all([getCurrentOrganization(), getViewer()]);
  const categories = await getCategoriesWithCounts(org.id);
  const categorySlug = param(sp, "category");
  const category = categories.find((c) => c.slug === categorySlug);
  const result = await listCatalog({
    organizationId: org.id,
    viewerId: viewer?.id,
    category: category?.slug,
    level: enumParam(sp, "level", COURSE_LEVELS),
    duration: enumParam(sp, "duration", Object.keys(DURATION_BUCKETS) as DurationBucket[]),
    sort: enumParam(sp, "sort", CATALOG_SORTS),
    page: pageParam(sp),
  });

  return (
    <div className="container-page py-10 sm:py-14">
      <header className="max-w-2xl">
        {category ? (
          <p className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-primary">
            <CategoryIcon name={category.icon} className="size-4" /> Topic
          </p>
        ) : null}
        <h1 className="text-display text-[2.25rem] font-medium leading-tight sm:text-[2.75rem]">{category?.name ?? "All courses"}</h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          {category?.description ?? "Studies, pathways and trainings to help you grow in faith and serve with confidence."}
        </p>
      </header>

      <nav aria-label="Topics" className="-mx-4 mt-8 overflow-x-auto px-4 scrollbar-none">
        <ul className="flex gap-2">
          <li>
            <TopicChip href="/courses" active={!category} label="All" />
          </li>
          {categories
            .filter((c) => c.courseCount > 0)
            .map((c) => (
              <li key={c.id}>
                <TopicChip href={`/courses?category=${c.slug}`} active={c.slug === category?.slug} label={c.name} />
              </li>
            ))}
        </ul>
      </nav>

      <div className="mt-6 border-b border-border pb-5">
        <CatalogFilters categories={categories.map((c) => ({ value: c.slug, label: c.name }))} />
      </div>

      <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
        {pluralize(result.total, "course")}
      </p>

      {result.items.length > 0 ? (
        <>
          <CourseGrid courses={result.items} className="mt-5" preloadFirst={4} />
          <Pagination className="mt-12" page={result.page} pageCount={result.pageCount} basePath="/courses" searchParams={toRecord(sp)} />
        </>
      ) : (
        <EmptyState
          className="mt-6"
          icon={<SearchX />}
          title="No courses match those filters"
          description="Try a different topic or level, or clear the filters to see everything."
          action={
            <Button asChild variant="outline">
              <Link href="/courses">Clear filters</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}

function TopicChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "inline-flex h-9 items-center whitespace-nowrap rounded-full bg-foreground px-4 text-sm font-medium text-background"
          : "inline-flex h-9 items-center whitespace-nowrap rounded-full border border-border bg-surface px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
      }
    >
      {label}
    </Link>
  );
}
