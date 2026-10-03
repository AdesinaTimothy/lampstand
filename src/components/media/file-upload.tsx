"use client";

import * as React from "react";
import { FileUp, Loader2, RefreshCw, X } from "lucide-react";
import { UPLOAD_RULES, type UploadPurpose } from "@/lib/upload-rules";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress";
import { probeDuration, uploadFile, validateFile, type UploadedAsset } from "./upload";

type State =
  | { status: "idle" }
  | { status: "uploading"; name: string; progress: number }
  | { status: "error"; message: string; file?: File };

/**
 * Drag-and-drop uploader with progress, cancel and retry. Validates type/size
 * client-side for fast feedback; the server re-validates everything.
 */
export function FileUpload({
  purpose,
  onUploaded,
  label = "Upload a file",
  hint,
  className,
  compact,
  id,
}: {
  purpose: UploadPurpose;
  onUploaded: (asset: UploadedAsset) => void;
  label?: string;
  hint?: string;
  className?: string;
  compact?: boolean;
  id?: string;
}) {
  const rules = UPLOAD_RULES[purpose];
  const inputRef = React.useRef<HTMLInputElement>(null);
  const abortRef = React.useRef<(() => void) | null>(null);
  const [state, setState] = React.useState<State>({ status: "idle" });
  const [dragging, setDragging] = React.useState(false);
  const inputId = React.useId();

  async function start(file: File) {
    const problem = validateFile(file, purpose);
    if (problem) return setState({ status: "error", message: problem });
    setState({ status: "uploading", name: file.name, progress: 0 });
    const durationSeconds = await probeDuration(file);
    const { promise, abort } = uploadFile(file, purpose, {
      durationSeconds,
      onProgress: (p) => setState({ status: "uploading", name: file.name, progress: p }),
    });
    abortRef.current = abort;
    try {
      const asset = await promise;
      setState({ status: "idle" });
      onUploaded(asset);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return setState({ status: "idle" });
      setState({ status: "error", message: (error as Error).message, file });
    } finally {
      abortRef.current = null;
    }
  }

  return (
    <div className={className} id={id}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={rules.inputAccept}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void start(file);
        }}
      />
      {state.status === "uploading" ? (
        <div className="rounded-xl border border-border bg-surface p-4" aria-live="polite">
          <div className="flex items-center gap-3">
            <Loader2 className="size-4 shrink-0 animate-spin text-primary" aria-hidden />
            <p className="min-w-0 flex-1 truncate text-sm font-medium">{state.name}</p>
            <span className="text-xs tabular-nums text-muted-foreground">{Math.round(state.progress * 100)}%</span>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => abortRef.current?.()} aria-label="Cancel upload">
              <X />
            </Button>
          </div>
          <ProgressBar value={state.progress * 100} size="sm" className="mt-3" label="Upload progress" />
        </div>
      ) : (
        <label
          htmlFor={inputId}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) void start(file);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong bg-surface-muted/40 text-center transition-colors hover:border-primary/60 hover:bg-primary-soft/40 focus-within:outline-2 focus-within:outline-ring",
            compact ? "px-4 py-4" : "px-6 py-8",
            dragging && "border-primary bg-primary-soft/60",
          )}
        >
          <span className="grid size-10 place-items-center rounded-full bg-surface text-primary shadow-xs">
            <FileUp className="size-5" aria-hidden />
          </span>
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs text-muted-foreground">{hint ?? `Drag and drop or click to browse · ${rules.label}`}</span>
        </label>
      )}
      {state.status === "error" && (
        <div role="alert" className="mt-2 flex items-start justify-between gap-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          <span>{state.message}</span>
          {state.file && (
            <button type="button" className="inline-flex shrink-0 items-center gap-1 font-medium underline-offset-2 hover:underline" onClick={() => start(state.file!)}>
              <RefreshCw className="size-3.5" aria-hidden /> Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function AssetSummary({ name, size, onRemove }: { name: string; size?: number; onRemove?: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm">
      <FileUp className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="min-w-0 flex-1 truncate">{name}</span>
      {size !== undefined && <span className="text-xs text-muted-foreground">{formatBytes(size)}</span>}
      {onRemove && (
        <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove} aria-label={`Remove ${name}`}>
          <X />
        </Button>
      )}
    </div>
  );
}
