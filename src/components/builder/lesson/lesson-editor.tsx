import Link from "next/link";
import { ChevronLeft, ChevronRight, ListTree } from "lucide-react";
import type { LessonEditorData } from "@/server/queries/instructor";
import { LessonTypeIcon } from "@/components/course/lesson-type-icon";
import { Button } from "@/components/ui/button";
import { lessonTypeLabel } from "../lesson-type-meta";
import { AssignmentPanel } from "./assignment-panel";
import { LessonBasicsCard } from "./lesson-basics-card";
import { MediaLessonPanel } from "./media-lesson-panel";
import { QuizBuilder } from "./quiz-builder";
import { ResourcesPanel } from "./resources-panel";
import { TextLessonPanel } from "./text-lesson-panel";

/** Lesson editor shell: navigation, shared basics, the type-specific editor and resources. */
export function LessonEditor({ courseId, data, requiresApproval }: { courseId: string; data: LessonEditorData; requiresApproval: boolean }) {
  const { lesson, previous, next, position } = data;
  const base = `/instructor/courses/${courseId}`;

  return (
    <div className="space-y-6">
      <nav aria-label="Lesson navigation" className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`${base}/curriculum`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ListTree className="size-4" aria-hidden /> Back to curriculum
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs tabular-nums text-muted-foreground">
            Lesson {position.index + 1} of {position.total}
          </span>
          {previous ? (
            <Button asChild variant="outline" size="icon-sm">
              <Link href={`${base}/lessons/${previous.id}`} aria-label={`Previous lesson: ${previous.title}`}>
                <ChevronLeft />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="icon-sm" disabled aria-label="No previous lesson">
              <ChevronLeft />
            </Button>
          )}
          {next ? (
            <Button asChild variant="outline" size="icon-sm">
              <Link href={`${base}/lessons/${next.id}`} aria-label={`Next lesson: ${next.title}`}>
                <ChevronRight />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="icon-sm" disabled aria-label="No next lesson">
              <ChevronRight />
            </Button>
          )}
        </div>
      </nav>

      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
          <LessonTypeIcon type={lesson.type} className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-subtle-foreground">
            {lessonTypeLabel(lesson.type)} lesson · {lesson.section.title}
          </p>
          <h2 className="truncate text-lg font-semibold tracking-tight">{lesson.title}</h2>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
        <div className="min-w-0 space-y-6">
          <LessonBasicsCard
            key={`basics-${lesson.id}`}
            lessonId={lesson.id}
            basics={{ title: lesson.title, summary: lesson.summary, isPreview: lesson.isPreview, isRequired: lesson.isRequired }}
          />
          {(lesson.type === "VIDEO" || lesson.type === "AUDIO" || lesson.type === "PDF") && (
            <MediaLessonPanel key={`media-${lesson.id}`} lessonId={lesson.id} type={lesson.type} initialMedia={lesson.media} />
          )}
          {lesson.type === "TEXT" && (
            <TextLessonPanel key={`text-${lesson.id}`} lessonId={lesson.id} initialContent={lesson.content ?? ""} initialDuration={lesson.durationSeconds} />
          )}
          {lesson.type === "QUIZ" && <QuizBuilder key={`quiz-${lesson.id}`} lessonId={lesson.id} quiz={lesson.quiz} />}
          {lesson.type === "ASSIGNMENT" && (
            <AssignmentPanel key={`assignment-${lesson.id}`} lessonId={lesson.id} assignment={lesson.assignment} requiresApproval={requiresApproval} />
          )}
        </div>
        <aside className="space-y-6 xl:sticky xl:top-24">
          <ResourcesPanel lessonId={lesson.id} resources={lesson.resources} />
        </aside>
      </div>
    </div>
  );
}
