import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";
import { CurriculumBuilder } from "@/components/builder/curriculum/curriculum-builder";
import { ReadinessList } from "@/components/builder/editor-shell/readiness-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDuration } from "@/lib/format";
import { pluralize } from "@/lib/utils";
import { requireInstructorPage } from "@/server/auth/guards";
import { getCourseEditorHeader, getCurriculumForEditor } from "@/server/queries/instructor";

export async function generateMetadata(props: PageProps<"/instructor/courses/[courseId]/curriculum">): Promise<Metadata> {
  const { courseId } = await props.params;
  const course = await getCourseEditorHeader(await requireInstructorPage(), courseId);
  return { title: `Curriculum · ${course.title}` };
}

export default async function CurriculumPage(props: PageProps<"/instructor/courses/[courseId]/curriculum">) {
  const { courseId } = await props.params;
  const viewer = await requireInstructorPage(`/instructor/courses/${courseId}/curriculum`);
  const { sections, readiness } = await getCurriculumForEditor(viewer, courseId);
  const lessons = sections.flatMap((s) => s.lessons);
  const totalSeconds = lessons.reduce((n, l) => n + (l.durationSeconds ?? 0), 0);
  const blocking = readiness.filter((i) => i.level === "error").length;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Curriculum</h2>
            <p className="text-sm text-muted-foreground">
              {pluralize(sections.length, "section")} · {pluralize(lessons.length, "lesson")}
              {totalSeconds > 0 && ` · ${formatDuration(totalSeconds)}`}
            </p>
          </div>
          <p className="hidden text-xs text-muted-foreground md:block">Drag the handles to reorder lessons and sections.</p>
        </div>
        <div className="mt-2">
          <CurriculumBuilder courseId={courseId} initialSections={sections} />
        </div>
      </div>
      <aside className="lg:sticky lg:top-24">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="size-4 text-primary" aria-hidden /> Publishing checklist
            </CardTitle>
            <CardDescription>
              {blocking === 0 ? "Nothing is blocking publication." : `${pluralize(blocking, "item")} to finish before publishing.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ReadinessList issues={readiness} />
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
