"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { reviewCourseAction } from "@/actions/learning";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const LABELS = ["", "Not helpful", "Could be better", "Good", "Very good", "Excellent"];

export function ReviewForm({ courseId, initial }: { courseId: string; initial?: { rating: number; body: string | null } | null }) {
  const router = useRouter();
  const [rating, setRating] = React.useState(initial?.rating ?? 0);
  const [hover, setHover] = React.useState(0);
  const [body, setBody] = React.useState(initial?.body ?? "");
  const [pending, setPending] = React.useState(false);
  const shown = hover || rating;

  return (
    <form
      className="rounded-xl border border-border bg-surface p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!rating) return toast.error("Choose a star rating first.");
        setPending(true);
        const result = await reviewCourseAction({ courseId, rating, body });
        setPending(false);
        if (!result.ok) return toast.error(result.error);
        toast.success(result.message);
        router.refresh();
      }}
    >
      <h3 className="font-semibold">{initial ? "Update your review" : "How was this course?"}</h3>
      <fieldset className="mt-3">
        <legend className="sr-only">Rating</legend>
        <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer rounded p-0.5 focus-within:outline-2 focus-within:outline-ring" onMouseEnter={() => setHover(n)}>
              <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} className="sr-only" />
              <Star className={cn("size-6 transition-colors", n <= shown ? "text-accent" : "text-border-strong")} fill="currentColor" strokeWidth={0} aria-hidden />
              <span className="sr-only">{n} star{n > 1 ? "s" : ""} — {LABELS[n]}</span>
            </label>
          ))}
          <span className="ml-2 text-sm text-muted-foreground" aria-live="polite">
            {LABELS[shown]}
          </span>
        </div>
      </fieldset>
      <label htmlFor="review-body" className="sr-only">
        Your review
      </label>
      <Textarea
        id="review-body"
        className="mt-3"
        maxLength={2000}
        placeholder="What did you find most helpful? (optional)"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <div className="mt-3 flex justify-end">
        <Button type="submit" loading={pending}>
          {initial ? "Update review" : "Post review"}
        </Button>
      </div>
    </form>
  );
}
