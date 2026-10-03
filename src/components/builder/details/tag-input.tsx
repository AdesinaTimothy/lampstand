"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { inputClass } from "@/components/ui/input";

/** Chip input: Enter or comma adds a tag, Backspace on an empty field removes the last. */
export function TagInput({
  id,
  value,
  onChange,
  max = 12,
  describedBy,
  invalid,
}: {
  id: string;
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
  describedBy?: string;
  invalid?: boolean;
}) {
  const [draft, setDraft] = React.useState("");
  const [announcement, setAnnouncement] = React.useState("");

  function commit(raw: string) {
    const tag = raw.trim().replace(/,+$/, "").slice(0, 40);
    if (!tag) return;
    if (value.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      setDraft("");
      return;
    }
    if (value.length >= max) return;
    onChange([...value, tag]);
    setAnnouncement(`Added tag ${tag}`);
    setDraft("");
  }

  function remove(tag: string) {
    onChange(value.filter((t) => t !== tag));
    setAnnouncement(`Removed tag ${tag}`);
  }

  return (
    <div
      className={cn(inputClass, "flex min-h-10 flex-wrap items-center gap-1.5 px-2 py-1.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20")}
      aria-invalid={invalid || undefined}
    >
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-primary-soft py-0.5 pl-2 pr-1 text-sm text-primary-soft-foreground">
          {tag}
          <button
            type="button"
            onClick={() => remove(tag)}
            className="grid size-5 place-items-center rounded hover:bg-primary/10"
            aria-label={`Remove tag ${tag}`}
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        disabled={value.length >= max}
        placeholder={value.length >= max ? `Up to ${max} tags` : value.length ? "Add another…" : "e.g. prayer, discipleship"}
        aria-describedby={describedBy}
        onChange={(e) => {
          const v = e.target.value;
          if (v.endsWith(",")) commit(v);
          else setDraft(v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit(draft);
          } else if (e.key === "Backspace" && !draft && value.length) {
            remove(value[value.length - 1]!);
          }
        }}
        onBlur={() => commit(draft)}
        className="min-w-[8rem] flex-1 bg-transparent px-1 text-[15px] outline-none placeholder:text-subtle-foreground sm:text-sm"
      />
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}
