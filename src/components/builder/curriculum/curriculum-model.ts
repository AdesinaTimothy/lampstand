import type { EditorLessonItem, EditorSection } from "@/server/queries/instructor";

/*
 * Pure helpers for the curriculum builder. Kept free of React so ordering logic is
 * easy to reason about (and test).
 */

export type Section = EditorSection;
export type Lesson = EditorLessonItem;

const SECTION_PREFIX = "section:";
export const sectionDndId = (id: string) => `${SECTION_PREFIX}${id}`;
export const isSectionDndId = (id: string) => id.startsWith(SECTION_PREFIX);
export const sectionIdFromDnd = (id: string) => id.slice(SECTION_PREFIX.length);

/** The section that contains a lesson, or the section a section-id refers to. */
export function containerOf(sections: Section[], dndId: string): string | null {
  if (isSectionDndId(dndId)) return sectionIdFromDnd(dndId);
  return sections.find((s) => s.lessons.some((l) => l.id === dndId))?.id ?? null;
}

export function findLesson(sections: Section[], lessonId: string): { section: Section; lesson: Lesson; index: number } | null {
  for (const section of sections) {
    const index = section.lessons.findIndex((l) => l.id === lessonId);
    if (index >= 0) return { section, lesson: section.lessons[index]!, index };
  }
  return null;
}

function arrayMove<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
}

/** Moves a lesson to `toSectionId` at `index` (clamped). */
export function moveLesson(sections: Section[], lessonId: string, toSectionId: string, index: number): Section[] {
  const found = findLesson(sections, lessonId);
  if (!found) return sections;
  if (found.section.id === toSectionId) {
    const target = Math.max(0, Math.min(index, found.section.lessons.length - 1));
    if (target === found.index) return sections;
    return sections.map((s) => (s.id === toSectionId ? { ...s, lessons: arrayMove(s.lessons, found.index, target) } : s));
  }
  return sections.map((s) => {
    if (s.id === found.section.id) return { ...s, lessons: s.lessons.filter((l) => l.id !== lessonId) };
    if (s.id === toSectionId) {
      const lessons = [...s.lessons];
      lessons.splice(Math.max(0, Math.min(index, lessons.length)), 0, found.lesson);
      return { ...s, lessons };
    }
    return s;
  });
}

export function moveSection(sections: Section[], sectionId: string, toIndex: number): Section[] {
  const from = sections.findIndex((s) => s.id === sectionId);
  if (from < 0) return sections;
  const target = Math.max(0, Math.min(toIndex, sections.length - 1));
  return target === from ? sections : arrayMove(sections, from, target);
}

/**
 * One step up/down for the button controls. At a section boundary the lesson
 * moves into the neighbouring section (end of the previous / start of the next).
 */
export function stepLesson(sections: Section[], lessonId: string, delta: -1 | 1): Section[] {
  const found = findLesson(sections, lessonId);
  if (!found) return sections;
  const sectionIndex = sections.findIndex((s) => s.id === found.section.id);
  const target = found.index + delta;
  if (target >= 0 && target < found.section.lessons.length) return moveLesson(sections, lessonId, found.section.id, target);
  const neighbour = sections[sectionIndex + delta];
  if (!neighbour) return sections;
  return moveLesson(sections, lessonId, neighbour.id, delta === -1 ? neighbour.lessons.length : 0);
}

export function canStepLesson(sections: Section[], lessonId: string, delta: -1 | 1): boolean {
  return stepLesson(sections, lessonId, delta) !== sections;
}

export function toReorderPayload(courseId: string, sections: Section[]) {
  return { courseId, sections: sections.map((s) => ({ id: s.id, lessonIds: s.lessons.map((l) => l.id) })) };
}

export function orderKey(sections: Section[]): string {
  return sections.map((s) => `${s.id}:${s.lessons.map((l) => l.id).join(",")}`).join("|");
}

/** Human position for screen reader announcements. */
export function describeLessonPosition(sections: Section[], lessonId: string): string {
  const found = findLesson(sections, lessonId);
  if (!found) return "";
  return `position ${found.index + 1} of ${found.section.lessons.length} in section “${found.section.title}”`;
}

export function describeSectionPosition(sections: Section[], sectionId: string): string {
  const index = sections.findIndex((s) => s.id === sectionId);
  return index < 0 ? "" : `position ${index + 1} of ${sections.length}`;
}
