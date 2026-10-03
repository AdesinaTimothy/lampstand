"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Download, ExternalLink, FileText, RotateCcw, SearchX } from "lucide-react";
import { reviewSubmissionAction } from "@/actions/instructor";
import type { SubmissionDetail } from "@/server/queries/instructor";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, describedBy } from "@/components/ui/field";
import { Textarea } from "@/components/ui/input";
import { formatBytes, formatDate, formatRelative } from "@/lib/format";
import { toastResult } from "../toast-result";
import { SubmissionStatusBadge } from "./submission-status-badge";

/** Deep-linkable review panel (`?submission=<id>`). Closing returns to the inbox URL. */
export function ReviewDialog({ submission, open, closeHref }: { submission: SubmissionDetail | null; open: boolean; closeHref: string }) {
  const router = useRouter();
  const close = () => router.push(closeHref, { scroll: false });
  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent size="lg">
        {submission ? (
          <ReviewContent key={submission.id} submission={submission} onDone={close} />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Submission not found</DialogTitle>
              <DialogDescription className="sr-only">This submission doesn&rsquo;t exist or isn&rsquo;t yours to review.</DialogDescription>
            </DialogHeader>
            <DialogBody>
              <EmptyState compact icon={<SearchX />} title="We couldn't find that submission" description="It may have been removed, or it belongs to a course you don't teach." />
            </DialogBody>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReviewContent({ submission, onDone }: { submission: SubmissionDetail; onDone: () => void }) {
  const router = useRouter();
  const [feedback, setFeedback] = React.useState(submission.status === "SUBMITTED" ? "" : (submission.feedback ?? ""));
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState<"APPROVED" | "NEEDS_REVISION" | null>(null);
  const isImage = submission.file?.mimeType.startsWith("image/");

  async function review(status: "APPROVED" | "NEEDS_REVISION") {
    if (status === "NEEDS_REVISION" && !feedback.trim()) {
      setError("Explain what needs revising so the learner can improve their work.");
      document.getElementById("review-feedback")?.focus();
      return;
    }
    setPending(status);
    const result = await reviewSubmissionAction({ submissionId: submission.id, status, feedback });
    setPending(null);
    if (!result.ok) {
      setError(result.fieldErrors?.feedback?.[0] ?? result.error);
      return;
    }
    toastResult(result, status === "APPROVED" ? "Approved." : "Revision requested.");
    onDone();
    router.refresh();
  }

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-3">
          <Avatar name={submission.learner.name} src={submission.learner.avatarUrl} />
          <div className="min-w-0">
            <DialogTitle className="truncate">{submission.learner.name}</DialogTitle>
            <DialogDescription className="truncate">
              {submission.lesson.title} · {submission.course.title}
            </DialogDescription>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <SubmissionStatusBadge status={submission.status} />
          <span>Submitted {formatRelative(submission.submittedAt)}</span>
          {submission.revision > 1 && <span>· Revision {submission.revision}</span>}
        </div>
      </DialogHeader>
      <DialogBody className="space-y-5">
        <details className="group rounded-lg border border-border bg-surface-muted/50 px-4 py-3 text-sm">
          <summary className="cursor-pointer font-medium text-muted-foreground group-open:text-foreground">Assignment instructions</summary>
          <div className="prose-compact mt-3" dangerouslySetInnerHTML={{ __html: submission.instructions }} />
        </details>

        {submission.text && (
          <section aria-labelledby="review-response">
            <h3 id="review-response" className="mb-2 text-sm font-semibold">
              Written response
            </h3>
            <div className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-surface px-4 py-3 text-[15px] leading-relaxed scrollbar-thin">
              {submission.text}
            </div>
          </section>
        )}

        {submission.file && (
          <section aria-labelledby="review-file">
            <h3 id="review-file" className="mb-2 text-sm font-semibold">
              Attached file
            </h3>
            {isImage && (
              // eslint-disable-next-line @next/next/no-img-element -- private, access-checked media
              <img src={submission.file.url} alt={`Attachment from ${submission.learner.name}`} className="mb-2 max-h-72 rounded-lg border border-border object-contain" />
            )}
            <div className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
              <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-sm">{submission.file.originalName}</span>
              <span className="text-xs text-muted-foreground">{formatBytes(submission.file.sizeBytes)}</span>
              <Button asChild variant="ghost" size="icon-sm">
                <a href={submission.file.url} target="_blank" rel="noopener" aria-label={`Open ${submission.file.originalName}`}>
                  <ExternalLink />
                </a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href={submission.file.downloadUrl} download>
                  <Download /> Download
                </a>
              </Button>
            </div>
          </section>
        )}

        {!submission.text && !submission.file && <p className="text-sm text-muted-foreground">This submission is empty.</p>}

        {submission.reviewedAt && submission.status !== "SUBMITTED" && (
          <p className="text-xs text-muted-foreground">
            Reviewed {formatDate(submission.reviewedAt)}
            {submission.reviewerName && ` by ${submission.reviewerName}`}.
          </p>
        )}

        <Field
          label="Feedback for the learner"
          htmlFor="review-feedback"
          error={error ?? undefined}
          description="Required when requesting a revision. The learner gets it by notification and email."
        >
          <Textarea
            id="review-feedback"
            rows={4}
            value={feedback}
            maxLength={5000}
            placeholder="Encourage what's working and be specific about what to improve…"
            onChange={(e) => {
              setFeedback(e.target.value);
              setError(null);
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy("review-feedback", error ?? undefined, true)}
          />
        </Field>
      </DialogBody>
      <DialogFooter className="sm:justify-between">
        <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
          <Link href={`/instructor/courses/${submission.course.id}/lessons/${submission.lesson.id}`}>View assignment</Link>
        </Button>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => review("NEEDS_REVISION")} loading={pending === "NEEDS_REVISION"} disabled={pending !== null}>
            <RotateCcw /> Request revision
          </Button>
          <Button onClick={() => review("APPROVED")} loading={pending === "APPROVED"} disabled={pending !== null}>
            <CheckCircle2 /> Approve
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}
