"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { LessonType } from "@prisma/client";
import { RadioGroup as R } from "radix-ui";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createLessonAction } from "@/actions/instructor";
import { LessonTypeIcon } from "@/components/course/lesson-type-icon";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FormError, describedBy } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { LESSON_TYPE_DEFAULT_TITLES, LESSON_TYPE_DESCRIPTIONS, LESSON_TYPE_ORDER, lessonTypeLabel } from "../lesson-type-meta";

export function AddLessonDialog({ courseId, sectionId, sectionTitle }: { courseId: string; sectionId: string; sectionTitle: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [type, setType] = React.useState<LessonType>("VIDEO");
  const [title, setTitle] = React.useState("");
  const [titleError, setTitleError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const titleId = React.useId();

  function reset() {
    setType("VIDEO");
    setTitle("");
    setTitleError(null);
    setFormError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const finalTitle = title.trim() || LESSON_TYPE_DEFAULT_TITLES[type];
    if (finalTitle.length < 2) return setTitleError("Lesson title is required");
    setPending(true);
    const result = await createLessonAction({ sectionId, title: finalTitle, type });
    setPending(false);
    if (!result.ok) {
      if (result.fieldErrors?.title) setTitleError(result.fieldErrors.title[0] ?? result.error);
      else setFormError(result.error);
      return;
    }
    const lessonId = result.data.id;
    setOpen(false);
    reset();
    toast.success(`${lessonTypeLabel(type)} lesson added`, {
      action: { label: "Edit lesson", onClick: () => router.push(`/instructor/courses/${courseId}/lessons/${lessonId}`) },
    });
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-primary">
          <Plus /> Add lesson
        </Button>
      </DialogTrigger>
      <DialogContent size="lg">
        <form onSubmit={submit} noValidate className="flex min-h-0 flex-col">
          <DialogHeader>
            <DialogTitle>Add a lesson</DialogTitle>
            <DialogDescription>To “{sectionTitle}”. Choose what kind of lesson it is — you’ll add the content next.</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-5">
            <FormError message={formError} />
            <fieldset>
              <legend className="mb-2.5 text-sm font-medium">Lesson type</legend>
              <R.Root value={type} onValueChange={(v) => setType(v as LessonType)} className="grid gap-2 sm:grid-cols-2" aria-label="Lesson type">
                {LESSON_TYPE_ORDER.map((t) => (
                  <R.Item
                    key={t}
                    value={t}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border border-border bg-surface p-3 text-left transition-colors hover:border-border-strong hover:bg-surface-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                      "data-[state=checked]:border-primary data-[state=checked]:bg-primary-soft/50 data-[state=checked]:ring-1 data-[state=checked]:ring-primary",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-lg",
                        type === t ? "bg-primary text-primary-foreground" : "bg-surface-muted text-muted-foreground",
                      )}
                    >
                      <LessonTypeIcon type={t} className="size-[18px]" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{lessonTypeLabel(t)}</span>
                      <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{LESSON_TYPE_DESCRIPTIONS[t]}</span>
                    </span>
                  </R.Item>
                ))}
              </R.Root>
            </fieldset>
            <Field label="Title" htmlFor={titleId} error={titleError ?? undefined} description="You can change it any time.">
              <Input
                id={titleId}
                value={title}
                maxLength={140}
                placeholder={LESSON_TYPE_DEFAULT_TITLES[type]}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setTitleError(null);
                }}
                aria-invalid={Boolean(titleError)}
                aria-describedby={describedBy(titleId, titleError ?? undefined, true)}
              />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              Add {lessonTypeLabel(type).toLowerCase()} lesson
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
