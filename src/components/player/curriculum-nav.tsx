"use client";

import * as React from "react";
import Link from "next/link";
import { Check, ChevronDown, Circle, Lock } from "lucide-react";
import type { PlayerData } from "@/server/queries/player";
import { LessonTypeIcon } from "@/components/course/lesson-type-icon";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Section-grouped lesson list with completion state; current section open by default. */
export function CurriculumNav({
  data,
  onNavigate,
}: {
  data: Pick<PlayerData, "sections" | "lesson" | "course" | "previewMode" | "enrollment">;
  onNavigate?: () => void;
}) {
  const currentSection = data.sections.find((s) => s.lessons.some((l) => l.id === data.lesson.id))?.id;
  const [open, setOpen] = React.useState<Set<string>>(() => new Set(currentSection ? [currentSection] : []));
  const activeRef = React.useRef<HTMLAnchorElement>(null);

  React.useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, []);

  const suffix = data.previewMode ? "?preview=1" : "";
  const locked = !data.enrollment && !data.previewMode;

  return (
    <nav aria-label="Course contents" className="divide-y divide-border">
      {data.sections.map((section, si) => {
        const done = section.lessons.filter((l) => l.status === "COMPLETED").length;
        const isOpen = open.has(section.id);
        const total = section.lessons.reduce((n, l) => n + (l.durationSeconds ?? 0), 0);
        return (
          <div key={section.id}>
            <button
              type="button"
              className="flex w-full items-start gap-3 bg-surface-muted/60 px-4 py-3 text-left transition-colors hover:bg-surface-muted"
              aria-expanded={isOpen}
              onClick={() =>
                setOpen((prev) => {
                  const next = new Set(prev);
                  if (next.has(section.id)) next.delete(section.id);
                  else next.add(section.id);
                  return next;
                })
              }
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug">
                  <span className="text-muted-foreground">Section {si + 1}:</span> {section.title}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {done}/{section.lessons.length} complete{total > 0 && ` · ${formatDuration(total)}`}
                </p>
              </div>
              <ChevronDown className={cn("mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} aria-hidden />
            </button>
            {isOpen && (
              <ol>
                {section.lessons.map((lesson) => {
                  const active = lesson.id === data.lesson.id;
                  const completed = lesson.status === "COMPLETED";
                  const canOpen = !locked || lesson.isPreview;
                  const inner = (
                    <>
                      <span
                        className={cn(
                          "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border",
                          completed ? "border-success bg-success text-white" : "border-border-strong text-transparent",
                        )}
                        aria-hidden
                      >
                        {completed ? <Check className="size-3" strokeWidth={3} /> : lesson.status === "IN_PROGRESS" ? <Circle className="size-2 fill-primary text-primary" /> : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn("block text-sm leading-snug", active && "font-semibold")}>{lesson.title}</span>
                        <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <LessonTypeIcon type={lesson.type} className="size-3.5" />
                          {lesson.durationSeconds ? formatDuration(lesson.durationSeconds) : null}
                          {!lesson.isRequired && <span>· Optional</span>}
                        </span>
                      </span>
                      {!canOpen && <Lock className="mt-0.5 size-3.5 text-subtle-foreground" aria-label="Enrol to unlock" />}
                      <span className="sr-only">{completed ? "(completed)" : lesson.status === "IN_PROGRESS" ? "(in progress)" : ""}</span>
                    </>
                  );
                  return (
                    <li key={lesson.id}>
                      {canOpen ? (
                        <Link
                          ref={active ? activeRef : undefined}
                          href={`/learn/${data.course.slug}/${lesson.id}${suffix}`}
                          onClick={onNavigate}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "relative flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-muted",
                            active && "bg-primary-soft/70 before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-primary hover:bg-primary-soft",
                          )}
                        >
                          {inner}
                        </Link>
                      ) : (
                        <div className="flex items-start gap-3 px-4 py-3 opacity-70">{inner}</div>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        );
      })}
    </nav>
  );
}
