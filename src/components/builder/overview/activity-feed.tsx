import type { ActivityType } from "@prisma/client";
import { Activity as ActivityIcon } from "lucide-react";
import type { ActivityItem } from "@/server/queries/instructor";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelative } from "@/lib/format";

const VERBS: Record<ActivityType, (a: ActivityItem) => React.ReactNode> = {
  ENROLLED: (a) => <>enrolled in <Strong>{a.course?.title}</Strong></>,
  LESSON_STARTED: (a) => <>started <Strong>{a.lesson?.title}</Strong></>,
  LEARNING_SESSION: (a) => <>studied <Strong>{a.lesson?.title}</Strong></>,
  LESSON_COMPLETED: (a) => <>completed <Strong>{a.lesson?.title ?? "a lesson"}</Strong></>,
  QUIZ_SUBMITTED: (a) => <>took the quiz <Strong>{a.lesson?.title ?? ""}</Strong></>,
  ASSIGNMENT_SUBMITTED: (a) => <>submitted <Strong>{a.lesson?.title ?? "an assignment"}</Strong></>,
  COURSE_COMPLETED: (a) => <>finished <Strong>{a.course?.title}</Strong></>,
  CERTIFICATE_ISSUED: (a) => <>earned a certificate for <Strong>{a.course?.title}</Strong></>,
  REVIEW_POSTED: (a) => <>reviewed <Strong>{a.course?.title}</Strong></>,
};

function Strong({ children }: { children: React.ReactNode }) {
  return <span className="font-medium text-foreground">{children}</span>;
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        compact
        icon={<ActivityIcon />}
        title="No learner activity yet"
        description="When people enrol and work through your lessons, you'll see it here."
      />
    );
  }
  return (
    <ol className="space-y-4">
      {items.map((a) => (
        <li key={a.id} className="flex items-start gap-3">
          <Avatar name={a.learner.name} src={a.learner.avatarUrl} size="sm" />
          <div className="min-w-0 flex-1 text-sm leading-snug">
            <p className="text-muted-foreground">
              <Strong>{a.learner.name}</Strong> {VERBS[a.type](a)}
            </p>
            <p className="mt-0.5 truncate text-xs text-subtle-foreground">
              {a.type !== "ENROLLED" && a.type !== "COURSE_COMPLETED" && a.course ? `${a.course.title} · ` : ""}
              <time dateTime={a.createdAt.toISOString()}>{formatRelative(a.createdAt)}</time>
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
