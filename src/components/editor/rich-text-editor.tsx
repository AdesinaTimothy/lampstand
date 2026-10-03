"use client";

import * as React from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { cn } from "@/lib/utils";
import { EditorToolbar } from "./editor-toolbar";
import type { RichTextEditorProps } from "./types";

/**
 * Tiptap-based rich text editor. Emits sanitizable HTML (the server sanitizes on
 * write). Loaded lazily through `RichTextField` so Tiptap stays out of other bundles.
 */
export default function RichTextEditor({
  value,
  onChange,
  onBlur,
  placeholder = "Start writing…",
  id,
  labelledBy,
  describedBy,
  invalid,
  minHeight = "14rem",
  className,
  allowImages = true,
}: RichTextEditorProps) {
  const onChangeRef = React.useRef(onChange);
  const onBlurRef = React.useRef(onBlur);
  React.useEffect(() => {
    onChangeRef.current = onChange;
    onBlurRef.current = onBlur;
  });

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, link: false, codeBlock: false }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        protocols: ["https", "mailto"],
        HTMLAttributes: { rel: "noopener noreferrer nofollow" },
      }),
      Image.configure({ HTMLAttributes: { loading: "lazy" } }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "prose-lesson focus:outline-none",
        role: "textbox",
        "aria-multiline": "true",
        ...(id ? { id } : {}),
        ...(labelledBy ? { "aria-labelledby": labelledBy } : {}),
        ...(describedBy ? { "aria-describedby": describedBy } : {}),
        ...(invalid ? { "aria-invalid": "true" } : {}),
      },
    },
    onUpdate: ({ editor }) => onChangeRef.current(editor.isEmpty ? "" : editor.getHTML()),
    onBlur: () => onBlurRef.current?.(),
  });

  // Keep in sync when the value is replaced from outside (e.g. a form reset),
  // but never while the author is typing.
  React.useEffect(() => {
    if (!editor || editor.isFocused) return;
    const current = editor.isEmpty ? "" : editor.getHTML();
    if ((value || "") !== current) editor.commands.setContent(value || "", { emitUpdate: false });
  }, [editor, value]);

  return (
    <div
      className={cn(
        "editor-surface overflow-hidden rounded-xl border border-input bg-surface shadow-xs transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20",
        invalid && "border-danger focus-within:ring-danger/20",
        className,
      )}
    >
      <EditorToolbar editor={editor} allowImages={allowImages} />
      <div className="px-4 py-4 sm:px-5" style={{ ["--editor-min-height" as string]: minHeight }}>
        <EditorContent editor={editor} className="[&_.ProseMirror]:min-h-[var(--editor-min-height)]" />
      </div>
    </div>
  );
}
