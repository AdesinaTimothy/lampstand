import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark, CheckCircle2 } from "lucide-react";
import { requirePageViewer } from "@/server/auth/guards";
import { listBookmarks } from "@/server/queries/learner";
import { LessonTypeIcon } from "@/components/course/lesson-type-icon";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { LESSON_TYPE_LABELS } from "@/lib/course-meta";
import { formatDuration, formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "Bookmarks" };

export default async function BookmarksPage() {
  const viewer = await requirePageViewer("/bookmarks");
  const bookmarks = await listBookmarks(viewer);
  // Group by course so related lessons sit together.
  const groups = new Map<string, { course: (typeof bookmarks)[number]["course"]; items: typeof bookmarks }>();
  for (const b of bookmarks) {
    const g = groups.get(b.course.slug) ?? { course: b.course, items: [] };
    g.items.push(b);
    groups.set(b.course.slug, g);
  }

  return (
    <div className="container-page max-w-4xl py-8 pb-24 sm:py-12 lg:pb-12">
      <PageHeader title="Bookmarks" description="Lessons you've saved to come back to." />
      {bookmarks.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<Bookmark />}
          title="No bookmarks yet"
          description="Use the bookmark button on any lesson to save it here."
          action={
            <Button asChild variant="outline">
              <Link href="/my-courses">Go to my courses</Link>
            </Button>
          }
        />
      ) : (
        <div className="mt-8 space-y-8">
          {[...groups.values()].map((g) => (
            <section key={g.course.slug} aria-label={g.course.title}>
              <h2 className="text-sm font-semibold">
                <Link href={`/courses/${g.course.slug}`} className="hover:underline">
                  {g.course.title}
                </Link>
              </h2>
              <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-surface">
                {g.items.map((b) => (
                  <li key={b.id}>
                    <Link href={`/learn/${b.course.slug}/${b.lesson.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-muted">
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                        <LessonTypeIcon type={b.lesson.type} className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{b.lesson.title}</span>
                        <span className="block text-xs text-muted-foreground">
                          {LESSON_TYPE_LABELS[b.lesson.type]}
                          {b.lesson.durationSeconds ? ` · ${formatDuration(b.lesson.durationSeconds)}` : ""} · saved {formatRelative(b.createdAt)}
                        </span>
                      </span>
                      {b.lesson.completed && <CheckCircle2 className="size-5 shrink-0 text-success" aria-label="Completed" />}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
