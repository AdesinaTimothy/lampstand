"use client";

import * as React from "react";
import { Clock, NotebookPen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { addNoteAction, deleteNoteAction } from "@/actions/learning";
import { formatRelative, formatTimestamp } from "@/lib/format";
import { usePlayer } from "./player-context";

type Note = { id: string; body: string; positionSeconds: number | null; createdAt: string };

export function NotesPanel() {
  const { data, tracking, mediaTime, seek } = usePlayer();
  const [notes, setNotes] = React.useState<Note[]>(data.notes);
  const [body, setBody] = React.useState("");
  const [pending, start] = React.useTransition();
  const isMedia = data.lesson.type === "VIDEO" || data.lesson.type === "AUDIO";

  if (!tracking) {
    return <EmptyState compact icon={<NotebookPen />} title="Notes are for enrolled learners" description="Enrol to keep private notes on each lesson." />;
  }

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    const t = isMedia ? mediaTime() : null;
    start(async () => {
      const res = await addNoteAction({ lessonId: data.lesson.id, body, positionSeconds: t === null ? null : Math.floor(t) });
      if (!res.ok) return void toast.error(res.error);
      setNotes((n) => [res.data, ...n]);
      setBody("");
    });
  }

  return (
    <div className="space-y-5">
      <form onSubmit={add} className="space-y-2">
        <label htmlFor="note-body" className="text-sm font-medium">
          Add a private note{isMedia && " at the current moment"}
        </label>
        <Textarea
          id="note-body"
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={5000}
          placeholder="What stood out to you? A question to bring to group?"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) add(e);
          }}
        />
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">Only you can see your notes.</p>
          <Button type="submit" size="sm" loading={pending} disabled={!body.trim()}>
            Save note
          </Button>
        </div>
      </form>
      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notes on this lesson yet.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((n) => (
            <li key={n.id} className="group rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  {n.positionSeconds !== null && (
                    <button
                      type="button"
                      onClick={() => seek(n.positionSeconds!)}
                      className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 font-medium text-primary-soft-foreground hover:bg-primary-soft/70"
                      aria-label={`Jump to ${formatTimestamp(n.positionSeconds)}`}
                    >
                      <Clock className="size-3" aria-hidden /> {formatTimestamp(n.positionSeconds)}
                    </button>
                  )}
                  {formatRelative(n.createdAt)}
                </span>
                <Button
                  variant="danger-ghost"
                  size="icon-sm"
                  aria-label="Delete note"
                  onClick={async () => {
                    const prev = notes;
                    setNotes((all) => all.filter((x) => x.id !== n.id));
                    const res = await deleteNoteAction(n.id);
                    if (!res.ok) {
                      setNotes(prev);
                      toast.error(res.error);
                    }
                  }}
                >
                  <Trash2 aria-hidden />
                </Button>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{n.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
