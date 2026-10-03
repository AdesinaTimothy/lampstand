"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, ExternalLink, EyeOff, MessageSquare, MoreHorizontal, Pencil, Rocket, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminCourseRow, InstructorOption } from "@/server/queries/admin";
import { changeCourseStatusAction } from "@/actions/admin";
import { ConfirmActionDialog } from "../confirm-action-dialog";
import { runWithToast } from "../run-action";
import { ManageInstructorsDialog } from "./manage-instructors-dialog";
import { ReviewsDialog } from "./reviews-dialog";

type DialogName = "instructors" | "reviews" | "publish" | "unpublish" | "archive";

const CONFIRM = {
  publish: {
    title: "Publish this course?",
    body: "It becomes visible in the catalogue and members are notified the first time it's published. Courses must pass the readiness checks first.",
    label: "Publish",
    tone: "primary",
  },
  unpublish: {
    title: "Unpublish this course?",
    body: "It returns to draft and disappears from the catalogue. Enrolled learners keep their progress and certificates.",
    label: "Unpublish",
    tone: "danger",
  },
  archive: {
    title: "Archive this course?",
    body: "Archived courses are hidden from the catalogue and can't be featured. Learning history and certificates are kept.",
    label: "Archive",
    tone: "danger",
  },
} as const;

export function CourseActions({ course, instructorOptions }: { course: AdminCourseRow; instructorOptions: InstructorOption[] }) {
  const router = useRouter();
  const [dialog, setDialog] = React.useState<DialogName | null>(null);
  const close = (open: boolean) => !open && setDialog(null);
  const confirm = dialog === "publish" || dialog === "unpublish" || dialog === "archive" ? CONFIRM[dialog] : null;

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${course.title}`}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel className="max-w-56 truncate">{course.title}</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href={`/instructor/courses/${course.id}`}>
              <Pencil />
              Open in course builder
            </Link>
          </DropdownMenuItem>
          {course.status === "PUBLISHED" && (
            <DropdownMenuItem asChild>
              <Link href={`/courses/${course.slug}`}>
                <ExternalLink />
                View course page
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => setDialog("instructors")}>
            <Users />
            Manage instructors
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDialog("reviews")}>
            <MessageSquare />
            Reviews ({course.reviewCount})
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {course.status !== "PUBLISHED" && (
            <DropdownMenuItem onSelect={() => setDialog("publish")}>
              <Rocket />
              Publish
            </DropdownMenuItem>
          )}
          {course.status === "PUBLISHED" && (
            <DropdownMenuItem onSelect={() => setDialog("unpublish")}>
              <EyeOff />
              Unpublish
            </DropdownMenuItem>
          )}
          {course.status !== "ARCHIVED" && (
            <DropdownMenuItem tone="danger" onSelect={() => setDialog("archive")}>
              <Archive />
              Archive
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {dialog === "instructors" && (
        <ManageInstructorsDialog
          open
          onOpenChange={close}
          courseId={course.id}
          courseTitle={course.title}
          current={course.instructors.map((i) => i.id)}
          options={instructorOptions}
        />
      )}
      {dialog === "reviews" && <ReviewsDialog open onOpenChange={close} courseId={course.id} courseTitle={course.title} />}
      {confirm && dialog && dialog !== "instructors" && dialog !== "reviews" && (
        <ConfirmActionDialog
          open
          onOpenChange={close}
          title={confirm.title}
          description={
            <>
              <span className="font-medium text-foreground">“{course.title}”</span>. {confirm.body}
            </>
          }
          confirmLabel={confirm.label}
          tone={confirm.tone}
          onConfirm={async () => {
            const result = await runWithToast(changeCourseStatusAction({ courseId: course.id, action: dialog }), (d) => d.message);
            if (result.ok) router.refresh();
          }}
        />
      )}
    </>
  );
}
