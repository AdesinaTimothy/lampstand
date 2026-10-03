"use client";

import * as React from "react";
import { saveLessonContentAction } from "@/actions/instructor";
import { RichTextField } from "@/components/editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDuration } from "@/lib/format";
import { stripHtml } from "@/lib/utils";
import { useUnsavedChanges } from "../use-unsaved-changes";
import { AutosaveStatus } from "./autosave-status";
import { useAutosave } from "./use-autosave";

/** Reading lesson body with debounced autosave. */
export function TextLessonPanel({ lessonId, initialContent, initialDuration }: { lessonId: string; initialContent: string; initialDuration: number | null }) {
  const [content, setContent] = React.useState(initialContent);
  const [duration, setDuration] = React.useState(initialDuration);
  const autosave = useAutosave(initialContent, async (html) => {
    const result = await saveLessonContentAction({ lessonId, content: html });
    if (result.ok) setDuration(result.data.durationSeconds);
    return result.ok;
  });
  useUnsavedChanges(autosave.state !== "saved");
  const words = stripHtml(content).split(/\s+/).filter(Boolean).length;

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle id="lesson-content-label">Lesson content</CardTitle>
        <AutosaveStatus state={autosave.state} onRetry={() => void autosave.flush()} />
      </CardHeader>
      <CardContent>
        <RichTextField
          value={content}
          labelledBy="lesson-content-label"
          describedBy="lesson-content-meta"
          placeholder="Write the lesson. Use headings to break it into sections, and quotes for Scripture."
          minHeight="22rem"
          onChange={(html) => {
            setContent(html);
            autosave.change(html);
          }}
          onBlur={() => void autosave.flush()}
        />
        <p id="lesson-content-meta" className="mt-2 text-xs text-muted-foreground">
          {words.toLocaleString("en-US")} words{duration ? ` · about ${formatDuration(duration)} to read` : ""} · Changes save automatically.
        </p>
      </CardContent>
    </Card>
  );
}
