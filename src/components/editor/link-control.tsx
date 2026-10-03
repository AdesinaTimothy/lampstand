"use client";

import * as React from "react";
import type { Editor } from "@tiptap/react";
import { Link2, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** Normalises what an author types into a safe link (https or mailto only). */
function normaliseHref(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (/^mailto:/i.test(value)) return value;
  if (/^https:\/\//i.test(value)) return value;
  if (/^http:\/\//i.test(value)) return value.replace(/^http:/i, "https:");
  if (/^[\w.-]+@[\w-]+\.[\w.-]+$/.test(value)) return `mailto:${value}`;
  if (/^[\w-]+(\.[\w-]+)+/.test(value)) return `https://${value}`;
  return null;
}

export function LinkControl({
  editor,
  active,
  tabIndex,
  onFocus,
  className,
}: {
  editor: Editor | null;
  active: boolean;
  tabIndex: number;
  onFocus: () => void;
  className: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [href, setHref] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const inputId = React.useId();

  function onOpenChange(next: boolean) {
    if (next && editor) {
      setHref((editor.getAttributes("link").href as string | undefined) ?? "");
      setError(null);
    }
    setOpen(next);
  }

  function apply(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!editor) return;
    const normalised = normaliseHref(href);
    if (!normalised) return setError("Enter a web address (https://…) or an email address.");
    const { empty } = editor.state.selection;
    if (empty && !active) {
      editor.chain().focus().insertContent({ type: "text", text: href.trim(), marks: [{ type: "link", attrs: { href: normalised } }] }).run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: normalised }).run();
    }
    setOpen(false);
  }

  function remove() {
    editor?.chain().focus().extendMarkRange("link").unsetLink().run();
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-toolbar-item
          tabIndex={tabIndex}
          onFocus={onFocus}
          onMouseDown={(e) => e.preventDefault()}
          aria-label={active ? "Edit link" : "Insert link"}
          title={active ? "Edit link" : "Insert link"}
          aria-pressed={active}
          disabled={!editor}
          className={className}
        >
          <Link2 />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(22rem,calc(100vw-2rem))] p-3">
        {/* Not a <form>: the editor may itself sit inside a form. */}
        <div
          role="group"
          aria-label="Link"
          onKeyDown={(e) => {
            if (e.key === "Enter") apply(e);
          }}
        >
          <label htmlFor={inputId} className="text-sm font-medium">
            Link address
          </label>
          <Input
            id={inputId}
            value={href}
            autoFocus
            placeholder="https://example.org"
            inputMode="url"
            onChange={(e) => {
              setHref(e.target.value);
              setError(null);
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className="mt-2"
          />
          {error && (
            <p id={`${inputId}-error`} role="alert" className="mt-1.5 text-[13px] text-danger">
              {error}
            </p>
          )}
          <div className="mt-3 flex items-center justify-between gap-2">
            {active ? (
              <Button type="button" variant="danger-ghost" size="sm" onClick={remove}>
                <Unlink /> Remove link
              </Button>
            ) : (
              <span />
            )}
            <Button type="button" size="sm" onClick={apply}>
              {active ? "Update" : "Add link"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
