"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { LessonType } from "@prisma/client";
import { Clock, RefreshCw, Trash2 } from "lucide-react";
import { setLessonMediaAction } from "@/actions/instructor";
import { AssetSummary, FileUpload } from "@/components/media/file-upload";
import type { UploadedAsset } from "@/components/media/upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatTimestamp } from "@/lib/format";
import type { UploadPurpose } from "@/lib/upload-rules";
import { toastResult } from "../toast-result";

export type LessonMedia = { id: string; url: string; originalName: string; sizeBytes: number; mimeType: string; durationSeconds: number | null };

const COPY: Record<"VIDEO" | "AUDIO" | "PDF", { title: string; description: string; purpose: UploadPurpose; noun: string }> = {
  VIDEO: { title: "Video", description: "Learners complete this lesson by watching at least 90% of it.", purpose: "lesson-video", noun: "video" },
  AUDIO: { title: "Audio", description: "Learners complete this lesson by listening to at least 90% of it.", purpose: "lesson-audio", noun: "audio file" },
  PDF: { title: "Document", description: "Shown inline in the lesson. Learners mark it complete when they've read it.", purpose: "lesson-document", noun: "PDF" },
};

/** Primary media for video, audio and PDF lessons: upload, preview, replace and remove. */
export function MediaLessonPanel({ lessonId, type, initialMedia }: { lessonId: string; type: Extract<LessonType, "VIDEO" | "AUDIO" | "PDF">; initialMedia: LessonMedia | null }) {
  const router = useRouter();
  const [media, setMedia] = React.useState(initialMedia);
  const [replacing, setReplacing] = React.useState(false);
  const [detected, setDetected] = React.useState<number | null>(null);
  const copy = COPY[type];

  async function attach(asset: UploadedAsset) {
    const result = await setLessonMediaAction({ lessonId, mediaId: asset.id });
    if (!toastResult(result, `${copy.title} attached.`)) return;
    setMedia({
      id: asset.id,
      url: asset.url,
      originalName: asset.originalName,
      sizeBytes: asset.sizeBytes,
      mimeType: asset.mimeType,
      durationSeconds: result.data.durationSeconds ?? asset.durationSeconds,
    });
    setDetected(null);
    setReplacing(false);
    router.refresh();
  }

  async function remove() {
    const result = await setLessonMediaAction({ lessonId, mediaId: null });
    if (!toastResult(result, `${copy.title} removed.`)) return;
    setMedia(null);
    router.refresh();
  }

  const duration = media?.durationSeconds ?? detected;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {media && (
          <>
            {type === "VIDEO" && (
              <video
                key={media.id}
                src={media.url}
                controls
                preload="metadata"
                playsInline
                className="aspect-video w-full rounded-xl bg-black"
                onLoadedMetadata={(e) => Number.isFinite(e.currentTarget.duration) && setDetected(Math.round(e.currentTarget.duration))}
              >
                <track kind="captions" />
              </video>
            )}
            {type === "AUDIO" && (
              <audio
                key={media.id}
                src={media.url}
                controls
                preload="metadata"
                className="w-full"
                onLoadedMetadata={(e) => Number.isFinite(e.currentTarget.duration) && setDetected(Math.round(e.currentTarget.duration))}
              />
            )}
            {type === "PDF" && (
              <iframe key={media.id} src={media.url} title={`Preview of ${media.originalName}`} className="h-[60vh] min-h-80 w-full rounded-xl border border-border bg-surface-muted" />
            )}
            <AssetSummary name={media.originalName} size={media.sizeBytes} />
            {type !== "PDF" && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="size-4" aria-hidden />
                {duration ? <>Duration {formatTimestamp(duration)}</> : "Duration will be detected when the file loads."}
              </p>
            )}
            {!replacing && (
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setReplacing(true)}>
                  <RefreshCw /> Replace {copy.noun}
                </Button>
                <ConfirmDialog
                  trigger={
                    <Button type="button" variant="danger-ghost" size="sm">
                      <Trash2 /> Remove
                    </Button>
                  }
                  title={`Remove this ${copy.noun}?`}
                  description="The lesson will need a new file before the course can be published."
                  confirmLabel="Remove"
                  onConfirm={remove}
                />
              </div>
            )}
          </>
        )}
        {(!media || replacing) && (
          <div className="space-y-2">
            <FileUpload purpose={copy.purpose} label={media ? `Upload a replacement ${copy.noun}` : `Upload ${copy.noun === "audio file" ? "an audio file" : `a ${copy.noun}`}`} onUploaded={attach} />
            {replacing && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setReplacing(false)}>
                Cancel
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
