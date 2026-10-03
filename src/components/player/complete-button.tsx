"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { completeLessonAction } from "@/actions/learning";
import { usePlayer } from "./player-context";

/** Explicit completion for reading/document lessons — opening a lesson never completes it. */
export function CompleteButton({ label = "Mark as complete" }: { label?: string }) {
  const { data, tracking, completed, onCompleted } = usePlayer();
  const [pending, start] = React.useTransition();

  if (data.previewMode) return <p className="text-sm text-muted-foreground">Learners mark this lesson complete here.</p>;
  if (!tracking) return null;
  if (completed)
    return (
      <p className="inline-flex items-center gap-2 text-sm font-medium text-success">
        <CheckCircle2 className="size-5" aria-hidden /> Completed
      </p>
    );
  return (
    <Button
      loading={pending}
      onClick={() =>
        start(async () => {
          const res = await completeLessonAction(data.lesson.id);
          if (!res.ok) toast.error(res.error);
          else onCompleted(res.data);
        })
      }
    >
      <CheckCircle2 aria-hidden /> {label}
    </Button>
  );
}
