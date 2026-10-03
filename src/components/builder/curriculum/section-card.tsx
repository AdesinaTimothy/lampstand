"use client";

import * as React from "react";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, GripVertical, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { formatDuration } from "@/lib/format";
import { cn, pluralize } from "@/lib/utils";
import { AddLessonDialog } from "./add-lesson-dialog";
import { sectionDndId, type Lesson, type Section } from "./curriculum-model";
import { LessonRow, type LessonRowActions } from "./lesson-row";

export type SectionActions = {
  onRename: (title: string) => Promise<boolean>;
  onDelete: () => Promise<void>;
  onMove: (delta: -1 | 1) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  lessonActions: (lesson: Lesson) => LessonRowActions;
};

export function SectionCard({
  section,
  index,
  courseId,
  firstLessonNumber,
  actions,
  busy,
}: {
  section: Section;
  index: number;
  courseId: string;
  firstLessonNumber: number;
  actions: SectionActions;
  busy: boolean;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: sectionDndId(section.id),
    data: { type: "section" },
  });
  const [editing, setEditing] = React.useState(false);
  const duration = section.lessons.reduce((n, l) => n + (l.durationSeconds ?? 0), 0);
  const headingId = `section-${section.id}-title`;

  return (
    <section
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      aria-labelledby={headingId}
      className={cn("overflow-hidden rounded-xl border border-border bg-surface shadow-xs", isDragging && "z-10 opacity-50 shadow-lg")}
    >
      <header className="flex items-center gap-2 border-b border-border bg-surface-muted/50 px-2 py-2.5 sm:gap-3 sm:px-3">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Reorder section ${section.title}`}
          aria-roledescription="sortable section"
          className="hidden size-8 shrink-0 cursor-grab touch-none place-items-center rounded-md text-subtle-foreground transition-colors hover:bg-surface-sunken hover:text-foreground active:cursor-grabbing md:grid"
        >
          <GripVertical className="size-4" aria-hidden />
        </button>
        <div className="min-w-0 flex-1">
          {editing ? (
            <RenameForm
              initial={section.title}
              onCancel={() => setEditing(false)}
              onSave={async (title) => {
                if (await actions.onRename(title)) setEditing(false);
              }}
            />
          ) : (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle-foreground">Section {index + 1}</p>
              <h2 id={headingId} className="truncate text-[15px] font-semibold leading-snug">
                {section.title}
              </h2>
            </>
          )}
        </div>
        {!editing && (
          <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
            {pluralize(section.lessons.length, "lesson")}
            {duration > 0 && ` · ${formatDuration(duration)}`}
          </span>
        )}
        <div className="flex shrink-0 items-center md:hidden">
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => actions.onMove(-1)} disabled={!actions.canMoveUp || busy} aria-label={`Move section ${section.title} up`}>
            <ArrowUp />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => actions.onMove(1)} disabled={!actions.canMoveDown || busy} aria-label={`Move section ${section.title} down`}>
            <ArrowDown />
          </Button>
        </div>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon-sm" aria-label={`Actions for section ${section.title}`}>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => setEditing(true)}>
              <Pencil /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => actions.onMove(-1)} disabled={!actions.canMoveUp || busy}>
              <ArrowUp /> Move up
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => actions.onMove(1)} disabled={!actions.canMoveDown || busy}>
              <ArrowDown /> Move down
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <ConfirmDialog
              trigger={
                <DropdownMenuItem tone="danger" onSelect={(e) => e.preventDefault()}>
                  <Trash2 /> Delete section
                </DropdownMenuItem>
              }
              title={`Delete “${section.title}”?`}
              description={
                section.lessons.length > 0
                  ? "Move or delete this section's lessons first — sections can only be deleted when they're empty."
                  : "This empty section will be removed."
              }
              confirmLabel="Delete section"
              onConfirm={actions.onDelete}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <SortableContext items={section.lessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
        {section.lessons.length > 0 ? (
          <ol className="divide-y divide-border">
            {section.lessons.map((lesson, i) => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                sectionId={section.id}
                courseId={courseId}
                number={firstLessonNumber + i}
                actions={actions.lessonActions(lesson)}
                disabled={busy}
              />
            ))}
          </ol>
        ) : (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">No lessons yet. Add one, or drag a lesson here.</p>
        )}
      </SortableContext>

      <div className="border-t border-border px-2 py-1.5 sm:px-3">
        <AddLessonDialog courseId={courseId} sectionId={section.id} sectionTitle={section.title} />
      </div>
    </section>
  );
}

function RenameForm({ initial, onSave, onCancel }: { initial: string; onSave: (title: string) => Promise<void>; onCancel: () => void }) {
  const [value, setValue] = React.useState(initial);
  const [pending, setPending] = React.useState(false);
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (value.trim().length < 2) return;
        setPending(true);
        await onSave(value.trim());
        setPending(false);
      }}
    >
      <Input
        value={value}
        autoFocus
        maxLength={120}
        aria-label="Section title"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && onCancel()}
        className="h-9"
      />
      <Button type="submit" size="sm" loading={pending} disabled={value.trim().length < 2}>
        Save
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
        Cancel
      </Button>
    </form>
  );
}
