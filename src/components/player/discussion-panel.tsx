"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MessagesSquare, Reply, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { addCommentAction, deleteCommentAction } from "@/actions/learning";
import { formatRelative } from "@/lib/format";
import type { PlayerComment } from "@/server/queries/player";
import { usePlayer } from "./player-context";

export function DiscussionPanel() {
  const { data, tracking } = usePlayer();
  const canPost = tracking || data.canManage;
  const count = data.comments.reduce((n, c) => n + 1 + c.replies.length, 0);

  return (
    <div className="space-y-6">
      {canPost ? (
        <CommentForm placeholder="Ask a question or share a reflection with others taking this course" />
      ) : (
        <p className="text-sm text-muted-foreground">Enrol to join the discussion.</p>
      )}
      {data.comments.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <MessagesSquare className="size-8 text-subtle-foreground" aria-hidden />
          <p className="mt-2 font-medium">No discussion yet</p>
          <p className="text-sm text-muted-foreground">Questions are welcome. Start the conversation.</p>
        </div>
      ) : (
        <>
          <p className="text-sm font-medium text-muted-foreground">
            {count} {count === 1 ? "comment" : "comments"}
          </p>
          <ul className="space-y-6">
            {data.comments.map((c) => (
              <li key={c.id}>
                <CommentItem comment={c} canReply={canPost} />
                {c.replies.length > 0 && (
                  <ul className="ml-5 mt-4 space-y-4 border-l-2 border-border pl-4 sm:ml-12">
                    {c.replies.map((r) => (
                      <li key={r.id}>
                        <CommentItem comment={r} />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function CommentItem({ comment, canReply }: { comment: Omit<PlayerComment, "replies">; canReply?: boolean }) {
  const { data } = usePlayer();
  const router = useRouter();
  const [replying, setReplying] = React.useState(false);
  const canDelete = !comment.deleted && (comment.author.id === data.viewerId || data.canManage);

  return (
    <article className="flex gap-3">
      <Avatar name={comment.author.name} src={comment.author.avatarUrl} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-semibold">{comment.deleted ? "Removed" : comment.author.name}</span>
          {comment.author.isInstructor && !comment.deleted && <Badge variant="primary">Instructor</Badge>}
          <time className="text-xs text-muted-foreground" dateTime={comment.createdAt}>
            {formatRelative(comment.createdAt)}
          </time>
        </div>
        <p className={comment.deleted ? "mt-1 text-sm italic text-muted-foreground" : "mt-1 whitespace-pre-wrap text-sm leading-relaxed"}>
          {comment.deleted ? "This comment was removed." : comment.body}
        </p>
        <div className="mt-1 flex items-center gap-1">
          {canReply && !comment.deleted && (
            <Button variant="ghost" size="sm" className="-ml-2 h-8 text-muted-foreground" onClick={() => setReplying((v) => !v)} aria-expanded={replying}>
              <Reply aria-hidden /> Reply
            </Button>
          )}
          {canDelete && (
            <ConfirmDialog
              trigger={
                <Button variant="ghost" size="sm" className="h-8 text-muted-foreground">
                  <Trash2 aria-hidden /> Delete
                </Button>
              }
              title="Delete this comment?"
              description="It will be replaced with “This comment was removed.” Replies stay visible."
              confirmLabel="Delete"
              onConfirm={async () => {
                const res = await deleteCommentAction(comment.id);
                if (!res.ok) toast.error(res.error);
                else router.refresh();
              }}
            />
          )}
        </div>
        {replying && (
          <div className="mt-2">
            <CommentForm parentId={comment.id} placeholder={`Reply to ${comment.author.name}`} autoFocus onDone={() => setReplying(false)} />
          </div>
        )}
      </div>
    </article>
  );
}

function CommentForm({ parentId, placeholder, autoFocus, onDone }: { parentId?: string; placeholder: string; autoFocus?: boolean; onDone?: () => void }) {
  const { data } = usePlayer();
  const router = useRouter();
  const [body, setBody] = React.useState("");
  const [pending, start] = React.useTransition();
  const id = React.useId();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!body.trim()) return;
        start(async () => {
          const res = await addCommentAction({ lessonId: data.lesson.id, body, parentId });
          if (!res.ok) return void toast.error(res.error);
          setBody("");
          onDone?.();
          router.refresh();
        });
      }}
      className="space-y-2"
    >
      <label htmlFor={id} className="sr-only">
        {parentId ? "Your reply" : "Your comment"}
      </label>
      <Textarea id={id} rows={parentId ? 2 : 3} value={body} onChange={(e) => setBody(e.target.value)} placeholder={placeholder} maxLength={3000} autoFocus={autoFocus} />
      <div className="flex justify-end gap-2">
        {onDone && (
          <Button type="button" size="sm" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="sm" loading={pending} disabled={!body.trim()}>
          {parentId ? "Reply" : "Post"}
        </Button>
      </div>
    </form>
  );
}
