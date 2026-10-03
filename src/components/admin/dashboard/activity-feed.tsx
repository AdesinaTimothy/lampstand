import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import type { ActivityItem } from "@/server/queries/analytics";
import { TimeAgo } from "../time-ago";

/** Human-readable activity stream ("Ruth completed “Prayer” in Foundations"). */
export function ActivityFeed({ items, showActor = true }: { items: ActivityItem[]; showActor?: boolean }) {
  return (
    <ol className="space-y-4">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-3">
          {showActor ? (
            <Avatar name={item.user.name} src={item.user.avatarUrl} size="sm" />
          ) : (
            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary/60" aria-hidden />
          )}
          <div className="min-w-0 flex-1 text-sm leading-snug">
            <p className="text-pretty">
              {showActor && (
                <Link href={`/admin/learners/${item.user.id}`} className="font-medium hover:underline">
                  {item.user.name}
                </Link>
              )}{" "}
              <span className="text-muted-foreground">{item.verb}</span>{" "}
              {item.object && (
                // Lesson-level events carry the course as context; quote the lesson title.
                <span className="font-medium">{item.context ? `“${item.object}”` : item.object}</span>
              )}
              {item.context && (
                <>
                  <span className="text-muted-foreground"> in </span>
                  <span>{item.context}</span>
                </>
              )}
            </p>
            <p className="mt-0.5 text-xs text-subtle-foreground">
              <TimeAgo date={item.createdAt} />
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
