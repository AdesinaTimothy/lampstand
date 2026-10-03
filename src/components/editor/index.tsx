"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { RichTextEditorProps } from "./types";

export type { RichTextEditorProps } from "./types";

export function EditorSkeleton({ minHeight = "14rem" }: { minHeight?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-input bg-surface" aria-busy aria-label="Loading editor">
      <div className="flex gap-1.5 border-b border-border px-2 py-2">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="size-8 rounded-md" />
        ))}
      </div>
      <div className="space-y-3 px-5 py-5" style={{ minHeight }}>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

/** Lazily loaded rich text editor: Tiptap is only downloaded on pages that render it. */
export const RichTextField = dynamic<RichTextEditorProps>(() => import("./rich-text-editor"), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});
