import Link from "next/link";
import { ChevronLeft, ExternalLink, Eye } from "lucide-react";
import type { CourseEditorHeader as HeaderData } from "@/server/queries/instructor";
import { Button } from "@/components/ui/button";
import { formatRelative } from "@/lib/format";
import { CourseStatusBadge } from "../course-status-badge";
import { PublishControls } from "./publish-controls";

export function CourseEditorHeader({ course }: { course: HeaderData }) {
  const previewHref = course.firstLessonId ? `/learn/${course.slug}/${course.firstLessonId}?preview=1` : null;
  return (
    <header className="space-y-4">
      <Link
        href="/instructor/courses"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden /> All courses
      </Link>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <CourseStatusBadge status={course.status} />
            <span className="text-xs text-muted-foreground">Updated {formatRelative(course.updatedAt)}</span>
          </div>
          <h1 className="text-display mt-2 text-[1.6rem] font-medium leading-tight sm:text-[2rem]">{course.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {previewHref ? (
            <Button asChild variant="outline" size="sm">
              <Link href={previewHref} target="_blank" rel="noopener">
                <Eye /> Preview
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled title="Add a lesson to preview the course">
              <Eye /> Preview
            </Button>
          )}
          {course.status === "PUBLISHED" && (
            <Button asChild variant="ghost" size="sm">
              <Link href={`/courses/${course.slug}`} target="_blank" rel="noopener">
                <ExternalLink /> View public page
              </Link>
            </Button>
          )}
          <PublishControls courseId={course.id} status={course.status} />
        </div>
      </div>
    </header>
  );
}
