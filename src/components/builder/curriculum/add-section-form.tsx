"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FolderPlus } from "lucide-react";
import { createSectionAction } from "@/actions/instructor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toastResult } from "../toast-result";

/** Inline "add section" control at the end of the curriculum. */
export function AddSectionForm({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const inputId = React.useId();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong px-4 py-4 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/60 hover:bg-primary-soft/40 hover:text-primary"
      >
        <FolderPlus className="size-4" aria-hidden /> Add section
      </button>
    );
  }

  return (
    <form
      noValidate
      className="rounded-xl border border-border bg-surface p-4 shadow-xs"
      onSubmit={async (e) => {
        e.preventDefault();
        if (title.trim().length < 2) return setError("Give the section a title");
        setPending(true);
        const result = await createSectionAction(courseId, { title: title.trim(), description: "" });
        setPending(false);
        if (!result.ok) return setError(result.fieldErrors?.title?.[0] ?? result.error);
        toastResult(result);
        setTitle("");
        setOpen(false);
        router.refresh();
      }}
    >
      <label htmlFor={inputId} className="text-sm font-medium">
        New section title
      </label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <Input
          id={inputId}
          value={title}
          autoFocus
          maxLength={120}
          placeholder="e.g. Week 2 — Prayer in the Psalms"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          onChange={(e) => {
            setTitle(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        />
        <div className="flex gap-2">
          <Button type="submit" loading={pending}>
            Add section
          </Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </div>
      {error && (
        <p id={`${inputId}-error`} role="alert" className="mt-2 text-[13px] text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
