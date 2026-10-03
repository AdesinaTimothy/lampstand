import type { LessonType } from "@prisma/client";
import { ClipboardCheck, FileText, Headphones, ListChecks, NotebookPen, PlayCircle } from "lucide-react";

const ICONS: Record<LessonType, React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  VIDEO: PlayCircle,
  AUDIO: Headphones,
  TEXT: NotebookPen,
  PDF: FileText,
  QUIZ: ListChecks,
  ASSIGNMENT: ClipboardCheck,
};

export function LessonTypeIcon({ type, className }: { type: LessonType; className?: string }) {
  const Icon = ICONS[type];
  return <Icon className={className} aria-hidden />;
}
