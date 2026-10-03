"use client";

import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, Copy, GripVertical, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { LessonTypeIcon } from "@/components/course/lesson-type-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip } from "@/components/ui/tooltip";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import { lessonTypeLabel } from "../lesson-type-meta";
import type { Lesson } from "./curriculum-model";

export type LessonRowActions = {
  onMove: (delta: -1 | 1) => void;
  onDuplicate: () => Promise<void>;
  onDelete: () => Promise<void>;
  canMoveUp: boolean;
  canMoveDown: boolean;
};

export function LessonRow({
  lesson,
  sectionId,
  courseId,
  number,
  actions,
  disabled,
}: {
  lesson: Lesson;
  sectionId: string;
  courseId: string;
  number: number;
  actions: LessonRowActions;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: lesson.id,
    data: { type: "lesson", sectionId },
    disabled,
  });
  const href = `/instructor/courses/${courseId}/lessons/${lesson.id}`;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "group relative flex items-center gap-2 bg-surface px-2 py-2.5 sm:gap-3 sm:px-3",
        isDragging && "z-10 opacity-40",
      )}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${lesson.title}`}
        aria-roledescription="sortable lesson"
        className="hidden size-8 shrink-0 cursor-grab touch-none place-items-center rounded-md text-subtle-foreground transition-colors hover:bg-surface-muted hover:text-foreground active:cursor-grabbing md:grid"
      >
        <GripVertical className="size-4" aria-hidden />
      </button>

      <span className="relative grid size-9 shrink-0 place-items-center rounded-lg bg-surface-muted text-muted-foreground">
        <LessonTypeIcon type={lesson.type} className="size-[18px]" />
        {lesson.issue && (
          <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-surface bg-warning" aria-hidden />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <Link href={href} className="line-clamp-2 text-sm font-medium leading-snug hover:underline sm:line-clamp-1">
          <span className="sr-only">Lesson {number}: </span>
          {lesson.title}
        </Link>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span>{lessonTypeLabel(lesson.type)}</span>
          {lesson.durationSeconds ? <span>· {formatDuration(lesson.durationSeconds)}</span> : null}
          {lesson.isPreview && <Badge variant="info" className="px-2 py-0 leading-4">Preview</Badge>}
          {!lesson.isRequired && <Badge variant="outline" className="px-2 py-0 leading-4">Optional</Badge>}
          {lesson.issue && (
            <Tooltip content={lesson.issue}>
              <span className="inline-flex items-center gap-1 font-medium text-warning" tabIndex={0}>
                <span className="size-1.5 rounded-full bg-warning" aria-hidden />
                <span className="max-w-[12rem] truncate">{lesson.issue}</span>
              </span>
            </Tooltip>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center md:hidden">
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => actions.onMove(-1)} disabled={!actions.canMoveUp || disabled} aria-label={`Move ${lesson.title} up`}>
          <ArrowUp />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => actions.onMove(1)} disabled={!actions.canMoveDown || disabled} aria-label={`Move ${lesson.title} down`}>
          <ArrowDown />
        </Button>
      </div>

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="icon-sm" aria-label={`Actions for ${lesson.title}`}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem asChild>
            <Link href={href}>
              <Pencil /> Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void actions.onDuplicate()}>
            <Copy /> Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => actions.onMove(-1)} disabled={!actions.canMoveUp || disabled}>
            <ArrowUp /> Move up
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => actions.onMove(1)} disabled={!actions.canMoveDown || disabled}>
            <ArrowDown /> Move down
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <ConfirmDialog
            trigger={
              <DropdownMenuItem tone="danger" onSelect={(e) => e.preventDefault()}>
                <Trash2 /> Delete
              </DropdownMenuItem>
            }
            title={`Delete “${lesson.title}”?`}
            description="It will be removed from the course. Learners' past progress on it is kept for their records."
            confirmLabel="Delete lesson"
            onConfirm={actions.onDelete}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

/** Static copy shown under the pointer while dragging. */
export function LessonDragPreview({ lesson }: { lesson: Lesson }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border-strong bg-surface px-3 py-2.5 shadow-lg">
      <GripVertical className="size-4 text-subtle-foreground" aria-hidden />
      <span className="grid size-9 place-items-center rounded-lg bg-surface-muted text-muted-foreground">
        <LessonTypeIcon type={lesson.type} className="size-[18px]" />
      </span>
      <span className="truncate text-sm font-medium">{lesson.title}</span>
    </div>
  );
}
