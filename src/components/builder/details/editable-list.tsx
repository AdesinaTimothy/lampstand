"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * A short, ordered list of one-line items (objectives, requirements…). Items can
 * be edited in place, reordered with buttons and removed.
 */
export function EditableList({
  id,
  value,
  onChange,
  itemLabel,
  placeholder,
  max,
  describedBy,
  invalid,
}: {
  id: string;
  value: string[];
  onChange: (next: string[]) => void;
  itemLabel: string;
  placeholder: string;
  max: number;
  describedBy?: string;
  invalid?: boolean;
}) {
  const [draft, setDraft] = React.useState("");
  const listRef = React.useRef<HTMLUListElement>(null);
  const full = value.length >= max;

  function add() {
    const text = draft.trim();
    if (!text || full) return;
    onChange([...value, text]);
    setDraft("");
  }

  function move(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target]!, next[index]!];
    onChange(next);
    // Keep focus on the same item's button after it moves.
    requestAnimationFrame(() => {
      listRef.current?.querySelectorAll<HTMLButtonElement>(`[data-move="${delta}"]`)[target]?.focus();
    });
  }

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <ul ref={listRef} className="space-y-2">
          {value.map((item, i) => (
            <li key={i} className="flex items-center gap-1.5">
              <span className="w-5 shrink-0 text-right text-xs tabular-nums text-subtle-foreground" aria-hidden>
                {i + 1}
              </span>
              <Input
                value={item}
                aria-label={`${itemLabel} ${i + 1}`}
                maxLength={160}
                onChange={(e) => onChange(value.map((v, j) => (j === i ? e.target.value : v)))}
                className="h-9"
              />
              <Button type="button" variant="ghost" size="icon-sm" data-move="-1" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${itemLabel.toLowerCase()} ${i + 1} up`}>
                <ArrowUp />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                data-move="1"
                disabled={i === value.length - 1}
                onClick={() => move(i, 1)}
                aria-label={`Move ${itemLabel.toLowerCase()} ${i + 1} down`}
              >
                <ArrowDown />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={`Remove ${itemLabel.toLowerCase()} ${i + 1}`}>
                <X />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Input
          id={id}
          value={draft}
          maxLength={160}
          disabled={full}
          placeholder={full ? `Up to ${max} items` : placeholder}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          className="h-9"
        />
        <Button type="button" variant="outline" size="sm" className="h-9" onClick={add} disabled={!draft.trim() || full}>
          <Plus /> Add
        </Button>
      </div>
    </div>
  );
}
