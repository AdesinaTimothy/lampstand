"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  closestCorners,
  pointerWithin,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteLessonAction,
  deleteSectionAction,
  duplicateLessonAction,
  reorderCurriculumAction,
  updateSectionAction,
} from "@/actions/instructor";
import { AddSectionForm } from "./add-section-form";
import {
  canStepLesson,
  containerOf,
  describeLessonPosition,
  describeSectionPosition,
  findLesson,
  isSectionDndId,
  moveLesson,
  moveSection,
  orderKey,
  sectionDndId,
  sectionIdFromDnd,
  stepLesson,
  toReorderPayload,
  type Lesson,
  type Section,
} from "./curriculum-model";
import { LessonDragPreview } from "./lesson-row";
import { SectionCard } from "./section-card";
import { toastResult } from "../toast-result";

const SCREEN_READER_INSTRUCTIONS =
  "To reorder, press Space or Enter on a drag handle. Use the arrow keys to move, Space or Enter to drop, and Escape to cancel.";

/**
 * Drag-and-drop curriculum editor. Changes apply optimistically and roll back
 * if the server rejects them. Lessons can move between sections; on phones the
 * row buttons replace dragging.
 */
export function CurriculumBuilder({ courseId, initialSections }: { courseId: string; initialSections: Section[] }) {
  const router = useRouter();
  const [sections, setSections] = React.useState(initialSections);
  const [serverSections, setServerSections] = React.useState(initialSections);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [dragStart, setDragStart] = React.useState<Section[] | null>(null);
  const [saving, setSaving] = React.useState(0);
  const queue = React.useRef<Promise<void>>(Promise.resolve());
  // Stable id so dnd-kit's aria-describedby matches between server and client renders.
  const dndId = React.useId();

  // Adopt fresh server data (after adds, renames, deletes) when not mid-drag.
  if (initialSections !== serverSections && !activeId) {
    setServerSections(initialSections);
    setSections(initialSections);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  /** Saves an ordering; requests are serialized so they land in order. */
  function persist(next: Section[], previous: Section[]) {
    setSections(next);
    if (orderKey(next) === orderKey(previous)) return;
    setSaving((n) => n + 1);
    queue.current = queue.current.then(async () => {
      const result = await reorderCurriculumAction(toReorderPayload(courseId, next));
      setSaving((n) => n - 1);
      if (!result.ok) {
        setSections(previous);
        toast.error(result.error);
        router.refresh();
      }
    });
  }

  const collisionDetection: CollisionDetection = (args) => {
    const containers = args.droppableContainers;
    if (args.active.data.current?.type === "section") {
      return closestCenter({ ...args, droppableContainers: containers.filter((c) => c.data.current?.type === "section") });
    }
    const lessonTargets = containers.filter((c) => c.data.current?.type === "lesson");
    if (args.pointerCoordinates) {
      const hitLesson = pointerWithin({ ...args, droppableContainers: lessonTargets });
      if (hitLesson.length) return hitLesson;
      const hitSection = pointerWithin({ ...args, droppableContainers: containers.filter((c) => c.data.current?.type === "section") });
      const sectionHit = hitSection[0];
      if (sectionHit) {
        const sectionId = sectionIdFromDnd(String(sectionHit.id));
        const inside = lessonTargets.filter((c) => c.data.current?.sectionId === sectionId);
        return inside.length ? closestCenter({ ...args, droppableContainers: inside }) : hitSection;
      }
    }
    // Keyboard (or pointer outside any section): lessons, plus empty sections as drop targets.
    const emptySections = new Set(sections.filter((s) => s.lessons.length === 0).map((s) => sectionDndId(s.id)));
    return closestCorners({
      ...args,
      droppableContainers: containers.filter((c) => c.data.current?.type === "lesson" || emptySections.has(String(c.id))),
    });
  };

  function onDragStart({ active }: DragStartEvent) {
    setActiveId(String(active.id));
    setDragStart(sections);
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over || isSectionDndId(String(active.id))) return;
    const activeKey = String(active.id);
    const overKey = String(over.id);
    const from = containerOf(sections, activeKey);
    const to = containerOf(sections, overKey);
    if (!from || !to || from === to) return;
    const target = sections.find((s) => s.id === to)!;
    let index = target.lessons.length;
    if (!isSectionDndId(overKey)) {
      const overIndex = target.lessons.findIndex((l) => l.id === overKey);
      const translated = active.rect.current.translated;
      const below = translated ? translated.top > over.rect.top + over.rect.height / 2 : false;
      index = overIndex + (below ? 1 : 0);
    }
    setSections(moveLesson(sections, activeKey, to, index));
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    const previous = dragStart ?? sections;
    setActiveId(null);
    setDragStart(null);
    if (!over) return setSections(previous);
    const activeKey = String(active.id);
    const overKey = String(over.id);
    let next = sections;
    if (isSectionDndId(activeKey)) {
      const toIndex = sections.findIndex((s) => sectionDndId(s.id) === overKey);
      if (toIndex >= 0) next = moveSection(sections, sectionIdFromDnd(activeKey), toIndex);
    } else {
      const container = containerOf(sections, activeKey);
      const overContainer = containerOf(sections, overKey);
      if (container && container === overContainer && !isSectionDndId(overKey)) {
        const target = sections.find((s) => s.id === container)!;
        next = moveLesson(sections, activeKey, container, target.lessons.findIndex((l) => l.id === overKey));
      }
    }
    persist(next, previous);
  }

  function onDragCancel() {
    if (dragStart) setSections(dragStart);
    setActiveId(null);
    setDragStart(null);
  }

  // Screen reader narration with real titles and positions.
  const nameOf = (id: UniqueIdentifier) => {
    const key = String(id);
    if (isSectionDndId(key)) return `section “${sections.find((s) => s.id === sectionIdFromDnd(key))?.title ?? ""}”`;
    return `lesson “${findLesson(sections, key)?.lesson.title ?? ""}”`;
  };
  const positionOf = (id: UniqueIdentifier) => {
    const key = String(id);
    return isSectionDndId(key) ? describeSectionPosition(sections, sectionIdFromDnd(key)) : describeLessonPosition(sections, key);
  };
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${nameOf(active.id)}, at ${positionOf(active.id)}.`,
    onDragOver: ({ active }) => `${nameOf(active.id)} is now at ${positionOf(active.id)}.`,
    onDragEnd: ({ active, over }) => (over ? `Dropped ${nameOf(active.id)} at ${positionOf(active.id)}.` : `Dropped ${nameOf(active.id)}.`),
    onDragCancel: ({ active }) => `Cancelled. ${nameOf(active.id)} returned to its original position.`,
  };

  const lessonActions = (lesson: Lesson) => ({
    canMoveUp: canStepLesson(sections, lesson.id, -1),
    canMoveDown: canStepLesson(sections, lesson.id, 1),
    onMove: (delta: -1 | 1) => persist(stepLesson(sections, lesson.id, delta), sections),
    onDuplicate: async () => {
      if (toastResult(await duplicateLessonAction(lesson.id))) router.refresh();
    },
    onDelete: async () => {
      const previous = sections;
      setSections(sections.map((s) => ({ ...s, lessons: s.lessons.filter((l) => l.id !== lesson.id) })));
      const result = await deleteLessonAction(lesson.id);
      if (!toastResult(result)) setSections(previous);
      router.refresh();
    },
  });

  const activeLesson = activeId && !isSectionDndId(activeId) ? findLesson(sections, activeId)?.lesson : null;
  const firstNumbers = sections.reduce<number[]>((acc, s, i) => [...acc, i === 0 ? 1 : acc[i - 1]! + sections[i - 1]!.lessons.length], []);

  return (
    <div className="space-y-4">
      <div className="flex min-h-5 items-center justify-end text-xs text-muted-foreground" aria-live="polite">
        {saving > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <Loader2 className="size-3.5 animate-spin" aria-hidden /> Saving order…
          </span>
        )}
      </div>
      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
        accessibility={{ announcements, screenReaderInstructions: { draggable: SCREEN_READER_INSTRUCTIONS } }}
      >
        <SortableContext items={sections.map((s) => sectionDndId(s.id))} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {sections.map((section, index) => {
              return (
                <SectionCard
                  key={section.id}
                  section={section}
                  index={index}
                  courseId={courseId}
                  firstLessonNumber={firstNumbers[index]!}
                  busy={Boolean(activeId)}
                  actions={{
                    canMoveUp: index > 0,
                    canMoveDown: index < sections.length - 1,
                    onMove: (delta) => persist(moveSection(sections, section.id, index + delta), sections),
                    onRename: async (title) => {
                      const ok = toastResult(await updateSectionAction(section.id, { title, description: section.description ?? "" }));
                      if (ok) router.refresh();
                      return ok;
                    },
                    onDelete: async () => {
                      if (toastResult(await deleteSectionAction(section.id))) router.refresh();
                    },
                    lessonActions,
                  }}
                />
              );
            })}
          </div>
        </SortableContext>
        <DragOverlay>{activeLesson ? <LessonDragPreview lesson={activeLesson} /> : null}</DragOverlay>
      </DndContext>
      <AddSectionForm courseId={courseId} />
    </div>
  );
}
