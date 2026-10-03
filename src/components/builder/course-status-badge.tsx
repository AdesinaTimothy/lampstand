import type { CourseStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

const STATUS: Record<CourseStatus, { label: string; variant: "success" | "warning" | "neutral" }> = {
  PUBLISHED: { label: "Published", variant: "success" },
  DRAFT: { label: "Draft", variant: "warning" },
  ARCHIVED: { label: "Archived", variant: "neutral" },
};

export function CourseStatusBadge({ status, className }: { status: CourseStatus; className?: string }) {
  const s = STATUS[status];
  return (
    <Badge variant={s.variant} className={className}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {s.label}
    </Badge>
  );
}
