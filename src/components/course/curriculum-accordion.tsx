"use client";

import Link from "next/link";
import * as React from "react";
import { CheckCircle2, ChevronDown, Lock, Paperclip } from "lucide-react";
import type { CurriculumSection } from "@/server/queries/course";
import { LESSON_TYPE_LABELS } from "@/lib/course-meta";
import { formatDuration } from "@/lib/format";
import { cn, pluralize } from "@/lib/utils";
import { LessonTypeIcon } from "./lesson-type-icon";

export function CurriculumAccordion({
  sections,
  courseSlug,
  completedIds = [],
  canOpenAll,
}: {
  sections: CurriculumSection[];
  courseSlug: string;
  completedIds?: string[];
  /** Enrolled learners and course managers can open every lesson. */
  canOpenAll: boolean;
}) {
  const [open, setOpen] = React.useState<Set<string>>(() => new Set(sections.slice(0, 1).map((s) => s.id)));
  const completed = React.useMemo(() => new Set(completedIds), [completedIds]);
  const allOpen = open.size === sections.length;
  const totalLessons = sections.reduce((n, s) => n + s.lessons.length, 0);
  const totalSeconds = sections.reduce((n, s) => n + s.lessons.reduce((m, l) => m + (l.durationSeconds ?? 0), 0), 0);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <p>
          {pluralize(sections.length, "section")} · {pluralize(totalLessons, "lesson")} · {formatDuration(totalSeconds)} total
        </p>
        <button
          className="font-medium text-primary hover:underline"
          onClick={() => setOpen(allOpen ? new Set() : new Set(sections.map((s) => s.id)))}
        >
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        {sections.map((section, si) => {
          const isOpen = open.has(section.id);
          const secSeconds = section.lessons.reduce((m, l) => m + (l.durationSeconds ?? 0), 0);
          const done = section.lessons.filter((l) => completed.has(l.id)).length;
          const panelId = `section-panel-${section.id}`;
          return (
            <div key={section.id} className={cn(si > 0 && "border-t border-border")}>
              <h3>
                <button
                  className="flex w-full items-center gap-3 bg-surface-muted/50 px-4 py-3.5 text-left transition-colors hover:bg-surface-muted sm:px-5"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() =>
                    setOpen((prev) => {
                      const next = new Set(prev);
                      if (next.has(section.id)) next.delete(section.id);
                      else next.add(section.id);
                      return next;
                    })
                  }
                >
                  <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} aria-hidden />
                  <span className="min-w-0 flex-1 font-semibold">{section.title}</span>
                  <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                    {completed.size > 0 ? `${done}/${section.lessons.length} done · ` : `${pluralize(section.lessons.length, "lesson")} · `}
                    {formatDuration(secSeconds)}
                  </span>
                </button>
              </h3>
              <div id={panelId} hidden={!isOpen}>
                {section.description && <p className="px-5 pt-3 text-sm text-muted-foreground sm:pl-12">{section.description}</p>}
                <ul className="py-1.5">
                  {section.lessons.map((lesson) => {
                    const isDone = completed.has(lesson.id);
                    const openable = canOpenAll || lesson.isPreview;
                    const row = (
                      <>
                        {isDone ? (
                          <CheckCircle2 className="size-4 shrink-0 text-success" aria-label="Completed" />
                        ) : (
                          <LessonTypeIcon type={lesson.type} className="size-4 shrink-0 text-muted-foreground" />
                        )}
                        <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
                        {lesson.resourceCount > 0 && <Paperclip className="size-3.5 shrink-0 text-subtle-foreground" aria-label="Has resources" />}
                        {lesson.isPreview && !canOpenAll && (
                          <span className="shrink-0 text-xs font-medium text-primary underline-offset-2 group-hover:underline">Preview</span>
                        )}
                        {!openable && <Lock className="size-3.5 shrink-0 text-subtle-foreground" aria-label="Enrol to unlock" />}
                        <span className="w-14 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                          {lesson.durationSeconds ? formatDuration(lesson.durationSeconds) : LESSON_TYPE_LABELS[lesson.type]}
                        </span>
                      </>
                    );
                    return (
                      <li key={lesson.id}>
                        {openable ? (
                          <Link href={`/learn/${courseSlug}/${lesson.id}`} className="group flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface-muted/60 sm:px-5 sm:pl-12">
                            {row}
                          </Link>
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/85 sm:px-5 sm:pl-12">{row}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
