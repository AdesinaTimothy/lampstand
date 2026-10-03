"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, MessageSquare, Star } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FormError } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AdminReview } from "@/server/queries/admin";
import { listCourseReviewsAction, setReviewHiddenAction } from "@/actions/admin";
import { runWithToast } from "../run-action";

type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; reviews: AdminReview[] };

/** Moderation: hidden reviews disappear from the course page and from its rating. */
export function ReviewsDialog({
  open,
  onOpenChange,
  courseId,
  courseTitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseTitle: string;
}) {
  const router = useRouter();
  const [state, setState] = React.useState<State>({ status: "loading" });
  const [busy, setBusy] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    listCourseReviewsAction(courseId).then(
      (result) => {
        if (cancelled) return;
        setState(result.ok ? { status: "ready", reviews: result.data.reviews } : { status: "error", message: result.error });
      },
      () => !cancelled && setState({ status: "error", message: "We couldn't load reviews. Please try again." }),
    );
    return () => {
      cancelled = true;
    };
  }, [open, courseId]);

  async function toggle(review: AdminReview) {
    setBusy(review.id);
    const result = await runWithToast(
      setReviewHiddenAction({ reviewId: review.id, hidden: !review.hidden }),
      review.hidden ? "Review is visible again." : "Review hidden from the course page.",
    );
    setBusy(null);
    if (result.ok && state.status === "ready") {
      setState({ status: "ready", reviews: state.reviews.map((r) => (r.id === review.id ? { ...r, hidden: !r.hidden } : r)) });
      router.refresh();
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o) setState({ status: "loading" });
        onOpenChange(o);
      }}
    >
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Reviews</DialogTitle>
          <DialogDescription>
            “{courseTitle}”. Hidden reviews are removed from the public course page and its average rating.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="pb-6">
          {state.status === "loading" && (
            <div className="space-y-4" aria-busy aria-label="Loading reviews">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="size-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {state.status === "error" && <FormError message={state.message} />}
          {state.status === "ready" &&
            (state.reviews.length === 0 ? (
              <EmptyState compact icon={<MessageSquare />} title="No reviews yet" description="Learners can review a course once they've made progress." />
            ) : (
              <ul className="divide-y divide-border">
                {state.reviews.map((r) => (
                  <li key={r.id} className={cn("flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start", r.hidden && "opacity-70")}>
                    <Avatar name={r.user.name} src={r.user.avatarUrl} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{r.user.name}</span>
                        <span className="inline-flex items-center gap-0.5" aria-label={`${r.rating} out of 5 stars`}>
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star key={i} className={cn("size-3.5", i < r.rating ? "fill-accent text-accent" : "text-border-strong")} aria-hidden />
                          ))}
                        </span>
                        {r.hidden && <Badge variant="warning">Hidden</Badge>}
                      </div>
                      {r.body ? <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{r.body}</p> : <p className="mt-1 text-sm italic text-subtle-foreground">Rating only</p>}
                      <p className="mt-1 text-xs text-subtle-foreground">{formatDate(r.createdAt)}</p>
                    </div>
                    <Button type="button" variant={r.hidden ? "soft" : "outline"} size="sm" loading={busy === r.id} onClick={() => toggle(r)} className="self-start">
                      {r.hidden ? <Eye aria-hidden /> : <EyeOff aria-hidden />}
                      {r.hidden ? "Show" : "Hide"}
                      <span className="sr-only"> review by {r.user.name}</span>
                    </Button>
                  </li>
                ))}
              </ul>
            ))}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
