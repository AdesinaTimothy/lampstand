"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { CourseStatus } from "@prisma/client";
import { Rocket, Undo2 } from "lucide-react";
import { getPublishReadinessAction, publishCourseAction, unpublishCourseAction } from "@/actions/instructor";
import type { ReadinessIssue } from "@/server/services/courses";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { FormError } from "@/components/ui/field";
import { toastResult } from "../toast-result";
import { ReadinessList } from "./readiness-list";

type Readiness = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; issues: ReadinessIssue[] };

export function PublishControls({ courseId, status }: { courseId: string; status: CourseStatus }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [readiness, setReadiness] = React.useState<Readiness>({ status: "loading" });
  const [publishing, setPublishing] = React.useState(false);

  async function load() {
    setReadiness({ status: "loading" });
    const result = await getPublishReadinessAction(courseId);
    setReadiness(result.ok ? { status: "ready", issues: result.data } : { status: "error", message: result.error });
  }

  async function publish() {
    setPublishing(true);
    const result = await publishCourseAction(courseId);
    setPublishing(false);
    if (toastResult(result)) {
      setOpen(false);
      router.refresh();
    } else {
      void load();
    }
  }

  if (status === "PUBLISHED") {
    return (
      <ConfirmDialog
        trigger={
          <Button variant="outline" size="sm">
            <Undo2 /> Unpublish
          </Button>
        }
        title="Unpublish this course?"
        description="It will disappear from the catalogue and new learners won't be able to enrol. Enrolled learners keep their progress and can continue when you publish again."
        confirmLabel="Unpublish"
        tone="primary"
        onConfirm={async () => {
          if (toastResult(await unpublishCourseAction(courseId))) router.refresh();
        }}
      />
    );
  }

  const blocking = readiness.status === "ready" ? readiness.issues.filter((i) => i.level === "error").length : 0;
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <Button
        size="sm"
        onClick={() => {
          setOpen(true);
          void load();
        }}
      >
        <Rocket /> {status === "ARCHIVED" ? "Republish" : "Publish"}
      </Button>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Ready to publish?</DialogTitle>
          <DialogDescription>We check a few things so learners get a complete course.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          {readiness.status === "loading" && (
            <div className="space-y-2" aria-busy aria-label="Checking course">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-2/3" />
            </div>
          )}
          {readiness.status === "error" && <FormError message={readiness.message} />}
          {readiness.status === "ready" && (
            <div className="space-y-3">
              {blocking > 0 && (
                <p className="text-sm text-muted-foreground">
                  Fix {blocking === 1 ? "this item" : `these ${blocking} items`} before publishing:
                </p>
              )}
              <ReadinessList issues={readiness.issues} onNavigate={() => setOpen(false)} />
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {blocking > 0 ? "Keep editing" : "Cancel"}
          </Button>
          <Button onClick={publish} loading={publishing} disabled={readiness.status !== "ready" || blocking > 0}>
            <Rocket /> Publish now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
