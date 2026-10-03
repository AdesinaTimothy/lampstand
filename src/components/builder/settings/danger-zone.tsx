"use client";

import { useRouter } from "next/navigation";
import { Archive, Trash2 } from "lucide-react";
import { archiveCourseAction, deleteCourseAction } from "@/actions/instructor";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { pluralize } from "@/lib/utils";
import { toastResult } from "../toast-result";

export function DangerZone({
  courseId,
  title,
  status,
  enrollmentCount,
  canDeleteAny,
}: {
  courseId: string;
  title: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  enrollmentCount: number;
  canDeleteAny: boolean;
}) {
  const router = useRouter();
  const deletable = canDeleteAny || (status !== "PUBLISHED" && enrollmentCount === 0);

  return (
    <section aria-labelledby="danger-zone" className="max-w-5xl rounded-xl border border-danger/30">
      <h2 id="danger-zone" className="border-b border-danger/20 px-5 py-3.5 text-base font-semibold text-danger sm:px-6">
        Danger zone
      </h2>
      <div className="divide-y divide-border">
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-sm font-medium">Archive this course</p>
            <p className="mt-0.5 text-sm text-muted-foreground">Hides it from the catalogue. Enrolled learners keep their progress and certificates.</p>
          </div>
          <ConfirmDialog
            trigger={
              <Button variant="outline" size="sm" disabled={status === "ARCHIVED"}>
                <Archive /> {status === "ARCHIVED" ? "Archived" : "Archive"}
              </Button>
            }
            title={`Archive “${title}”?`}
            description="It will no longer be listed or open for new enrolments. You can republish it later."
            confirmLabel="Archive course"
            tone="primary"
            onConfirm={async () => {
              if (toastResult(await archiveCourseAction(courseId))) router.refresh();
            }}
          />
        </div>
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-sm font-medium">Delete this course</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {deletable
                ? "Removes the course and its lessons from the studio. This can't be undone from here."
                : `This course has ${pluralize(enrollmentCount, "learner")} or is published, so only an administrator can delete it. Unpublish or archive it instead.`}
            </p>
          </div>
          <ConfirmDialog
            trigger={
              <Button variant="danger" size="sm" disabled={!deletable}>
                <Trash2 /> Delete
              </Button>
            }
            title={`Delete “${title}”?`}
            description="The course, its sections and lessons will be removed. Learner certificates already issued remain valid."
            confirmLabel="Delete course"
            onConfirm={async () => {
              if (toastResult(await deleteCourseAction(courseId))) router.push("/instructor/courses");
            }}
          />
        </div>
      </div>
    </section>
  );
}
