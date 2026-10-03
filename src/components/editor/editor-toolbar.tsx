"use client";

import * as React from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  List,
  ListOrdered,
  Loader2,
  Quote,
  Redo2,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { uploadFile, validateFile } from "@/components/media/upload";
import { UPLOAD_RULES } from "@/lib/upload-rules";
import { cn } from "@/lib/utils";
import { LinkControl } from "./link-control";

type ToolbarState = {
  h2: boolean;
  h3: boolean;
  bold: boolean;
  italic: boolean;
  bullet: boolean;
  ordered: boolean;
  quote: boolean;
  link: boolean;
  canUndo: boolean;
  canRedo: boolean;
};

const EMPTY_STATE: ToolbarState = {
  h2: false,
  h3: false,
  bold: false,
  italic: false,
  bullet: false,
  ordered: false,
  quote: false,
  link: false,
  canUndo: false,
  canRedo: false,
};

export const toolbarButtonClass =
  "grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-40 aria-pressed:bg-primary-soft aria-pressed:text-primary-soft-foreground [&_svg]:size-4";

/**
 * Formatting toolbar. Implements the WAI-ARIA toolbar pattern: one tab stop,
 * arrow keys / Home / End move between controls.
 */
export function EditorToolbar({ editor, allowImages }: { editor: Editor | null; allowImages: boolean }) {
  const state =
    useEditorState({
      editor,
      selector: ({ editor: e }): ToolbarState =>
        e
          ? {
              h2: e.isActive("heading", { level: 2 }),
              h3: e.isActive("heading", { level: 3 }),
              bold: e.isActive("bold"),
              italic: e.isActive("italic"),
              bullet: e.isActive("bulletList"),
              ordered: e.isActive("orderedList"),
              quote: e.isActive("blockquote"),
              link: e.isActive("link"),
              canUndo: e.can().undo(),
              canRedo: e.can().redo(),
            }
          : EMPTY_STATE,
    }) ?? EMPTY_STATE;

  const toolbarRef = React.useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [uploading, setUploading] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  function items() {
    return Array.from(toolbarRef.current?.querySelectorAll<HTMLButtonElement>("[data-toolbar-item]") ?? []);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const list = items();
    const current = list.findIndex((el) => el === document.activeElement);
    if (current === -1) return;
    let next = current;
    if (e.key === "ArrowRight") next = (current + 1) % list.length;
    else if (e.key === "ArrowLeft") next = (current - 1 + list.length) % list.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = list.length - 1;
    else return;
    e.preventDefault();
    setActiveIndex(next);
    list[next]?.focus();
  }

  async function insertImage(file: File) {
    if (!editor) return;
    const problem = validateFile(file, "editor-image");
    if (problem) return toast.error(problem);
    setUploading(true);
    try {
      const asset = await uploadFile(file, "editor-image").promise;
      editor.chain().focus().setImage({ src: `/api/media/${asset.id}`, alt: "" }).run();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setUploading(false);
    }
  }

  const chain = () => editor?.chain().focus();
  let index = -1;
  const button = (
    label: string,
    icon: React.ReactNode,
    onClick: () => void,
    opts: { pressed?: boolean; disabled?: boolean } = {},
  ) => {
    index += 1;
    const myIndex = index;
    return (
      <button
        type="button"
        data-toolbar-item
        tabIndex={myIndex === activeIndex ? 0 : -1}
        aria-label={label}
        title={label}
        aria-pressed={opts.pressed === undefined ? undefined : opts.pressed}
        disabled={!editor || opts.disabled}
        onFocus={() => setActiveIndex(myIndex)}
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClick}
        className={toolbarButtonClass}
      >
        {icon}
      </button>
    );
  };
  const divider = <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden />;

  const headingItems = (
    <>
      {button("Heading", <Heading2 />, () => chain()?.toggleHeading({ level: 2 }).run(), { pressed: state.h2 })}
      {button("Subheading", <Heading3 />, () => chain()?.toggleHeading({ level: 3 }).run(), { pressed: state.h3 })}
    </>
  );
  const markItems = (
    <>
      {button("Bold", <Bold />, () => chain()?.toggleBold().run(), { pressed: state.bold })}
      {button("Italic", <Italic />, () => chain()?.toggleItalic().run(), { pressed: state.italic })}
    </>
  );
  const blockItems = (
    <>
      {button("Bulleted list", <List />, () => chain()?.toggleBulletList().run(), { pressed: state.bullet })}
      {button("Numbered list", <ListOrdered />, () => chain()?.toggleOrderedList().run(), { pressed: state.ordered })}
      {button("Quote", <Quote />, () => chain()?.toggleBlockquote().run(), { pressed: state.quote })}
    </>
  );
  index += 1;
  const linkIndex = index;
  const imageItem = allowImages
    ? button(
        uploading ? "Uploading image…" : "Insert image",
        uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />,
        () => fileRef.current?.click(),
        { disabled: uploading },
      )
    : null;
  const historyItems = (
    <>
      {button("Undo", <Undo2 />, () => chain()?.undo().run(), { disabled: !state.canUndo })}
      {button("Redo", <Redo2 />, () => chain()?.redo().run(), { disabled: !state.canRedo })}
    </>
  );

  return (
    <div
      ref={toolbarRef}
      role="toolbar"
      aria-label="Formatting"
      aria-orientation="horizontal"
      onKeyDown={onKeyDown}
      className="flex items-center gap-0.5 overflow-x-auto border-b border-border bg-surface-muted/50 px-1.5 py-1.5 scrollbar-none"
    >
      {headingItems}
      {divider}
      {markItems}
      {divider}
      {blockItems}
      {divider}
      <LinkControl
        editor={editor}
        active={state.link}
        tabIndex={linkIndex === activeIndex ? 0 : -1}
        onFocus={() => setActiveIndex(linkIndex)}
        className={cn(toolbarButtonClass)}
      />
      {imageItem}
      {divider}
      {historyItems}
      {allowImages && (
        <input
          ref={fileRef}
          type="file"
          accept={UPLOAD_RULES["editor-image"].inputAccept}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void insertImage(file);
          }}
        />
      )}
    </div>
  );
}
