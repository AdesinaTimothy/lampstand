"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, CheckCircle2, FileText, MessageSquareQuote, RotateCcw, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/input";
import { FileUpload, AssetSummary } from "@/components/media/file-upload";
import type { UploadedAsset } from "@/components/media/upload";
import { submitAssignmentAction } from "@/actions/learning";
import { formatBytes, formatDate, formatRelative } from "@/lib/format";
import type { PlayerAssignment } from "@/server/queries/player";
import { usePlayer } from "./player-context";

const STATUS = {
  SUBMITTED: { label: "Submitted · awaiting review", variant: "info" },
  NEEDS_REVISION: { label: "Revision requested", variant: "warning" },
  APPROVED: { label: "Approved", variant: "success" },
} as const;

export function AssignmentPanel({ assignment }: { assignment: PlayerAssignment }) {
  const { data, tracking, completed, onCompleted } = usePlayer();
  const router = useRouter();
  const sub = assignment.submission;
  const [editing, setEditing] = React.useState(!sub);
  const [text, setText] = React.useState(sub?.text ?? "");
  const [file, setFile] = React.useState<UploadedAsset | null>(null);
  const [keepFile, setKeepFile] = React.useState(Boolean(sub?.file));
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  const overdue = assignment.dueAt && !sub && new Date(assignment.dueAt) < new Date();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const hasFile = Boolean(file) || keepFile;
    if (!text.trim() && !hasFile) return setError("Add a written response or attach a file.");
    start(async () => {
      const res = await submitAssignmentAction({
        lessonId: data.lesson.id,
        text,
        fileId: file?.id ?? (keepFile && sub?.file ? sub.file.id : null),
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.success("Your work has been submitted.");
      setEditing(false);
      if (!completed) onCompleted({ courseCompleted: false, certificateId: null });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-surface p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Your task</h2>
          {assignment.dueAt && (
            <Badge variant={overdue ? "danger" : "neutral"}>
              <CalendarClock aria-hidden /> {overdue ? "Overdue · was due" : "Due"} {formatDate(assignment.dueAt)}
            </Badge>
          )}
        </div>
        <div className="prose-compact mt-3" dangerouslySetInnerHTML={{ __html: assignment.instructions }} />
      </section>

      {data.previewMode ? (
        <p className="rounded-lg bg-info-soft px-4 py-3 text-sm text-info">Preview: learners submit their work here. Submissions appear in your review queue.</p>
      ) : !tracking ? null : sub && !editing ? (
        <section className="rounded-2xl border border-border bg-surface p-5 sm:p-7" aria-labelledby="submission-heading">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="submission-heading" className="text-lg font-semibold">
              Your submission
            </h2>
            <Badge variant={STATUS[sub.status].variant}>{STATUS[sub.status].label}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Submitted {formatRelative(sub.submittedAt)}
            {sub.revision > 1 && ` · revision ${sub.revision}`}
          </p>
          {sub.text && <p className="mt-4 whitespace-pre-wrap rounded-lg bg-surface-muted p-4 text-sm leading-relaxed">{sub.text}</p>}
          {sub.file && (
            <a href={sub.file.url} className="mt-3 flex items-center gap-3 rounded-lg border border-border p-3 text-sm hover:bg-surface-muted">
              <FileText className="size-5 text-muted-foreground" aria-hidden />
              <span className="min-w-0 flex-1 truncate font-medium">{sub.file.name}</span>
              <span className="text-xs text-muted-foreground">{formatBytes(sub.file.size)}</span>
            </a>
          )}
          {sub.feedback && (
            <div className="mt-5 rounded-xl border border-border bg-surface-muted/60 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <MessageSquareQuote className="size-4 text-primary" aria-hidden /> Feedback{sub.reviewedBy && ` from ${sub.reviewedBy}`}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{sub.feedback}</p>
            </div>
          )}
          {sub.status !== "APPROVED" && (
            <Button variant={sub.status === "NEEDS_REVISION" ? "primary" : "outline"} className="mt-5" onClick={() => setEditing(true)}>
              <RotateCcw aria-hidden /> {sub.status === "NEEDS_REVISION" ? "Revise and resubmit" : "Edit submission"}
            </Button>
          )}
          {sub.status === "APPROVED" && (
            <p className="mt-5 flex items-center gap-2 text-sm font-medium text-success">
              <CheckCircle2 className="size-4" aria-hidden /> Approved — nicely done.
            </p>
          )}
        </section>
      ) : (
        <form onSubmit={submit} className="space-y-5 rounded-2xl border border-border bg-surface p-5 sm:p-7" noValidate>
          <h2 className="text-lg font-semibold">{sub ? "Update your submission" : "Submit your work"}</h2>
          {assignment.allowText && (
            <Field label="Written response" htmlFor="assignment-text" description="Plain text. Your instructor will see this along with any file you attach.">
              <Textarea id="assignment-text" rows={8} value={text} onChange={(e) => setText(e.target.value)} maxLength={20000} />
            </Field>
          )}
          {assignment.allowFile && (
            <div>
              <p className="mb-1.5 text-sm font-medium">Attachment</p>
              {file ? (
                <AssetSummary name={file.originalName} size={file.sizeBytes} onRemove={() => setFile(null)} />
              ) : keepFile && sub?.file ? (
                <AssetSummary name={sub.file.name} size={sub.file.size} onRemove={() => setKeepFile(false)} />
              ) : (
                <FileUpload purpose="submission" onUploaded={setFile} label="Attach a file" compact />
              )}
            </div>
          )}
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={pending}>
              <Send aria-hidden /> {sub ? "Resubmit" : "Submit"}
            </Button>
            {sub && (
              <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
