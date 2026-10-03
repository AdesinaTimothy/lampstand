"use client";

import * as React from "react";
import Image from "next/image";
import { ImageOff, Trash2 } from "lucide-react";
import { FileUpload } from "@/components/media/file-upload";
import { Button } from "@/components/ui/button";

/** Course thumbnail with live preview, replace and remove. */
export function ThumbnailField({
  url,
  onChange,
  describedBy,
}: {
  url: string | null;
  onChange: (asset: { id: string; url: string } | null) => void;
  describedBy?: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-[minmax(0,16rem)_1fr] sm:items-start" aria-describedby={describedBy}>
      <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-surface-sunken">
        {url ? (
          <Image src={url} alt="Course thumbnail preview" fill sizes="16rem" className="object-cover" />
        ) : (
          <div className="grid size-full place-items-center text-center text-xs text-muted-foreground">
            <span className="flex flex-col items-center gap-1.5">
              <ImageOff className="size-5" aria-hidden /> No thumbnail yet
            </span>
          </div>
        )}
      </div>
      <div className="space-y-2">
        <FileUpload
          purpose="course-thumbnail"
          compact
          label={url ? "Replace image" : "Upload an image"}
          hint="16:9 works best · JPG, PNG or WebP up to 10 MB"
          onUploaded={(asset) => onChange({ id: asset.id, url: asset.url })}
        />
        {url && (
          <Button type="button" variant="danger-ghost" size="sm" onClick={() => onChange(null)}>
            <Trash2 /> Remove thumbnail
          </Button>
        )}
      </div>
    </div>
  );
}
