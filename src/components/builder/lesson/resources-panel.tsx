"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Download, FileText, Link2, Paperclip, X } from "lucide-react";
import { addResourceAction, removeResourceAction } from "@/actions/instructor";
import { FileUpload } from "@/components/media/file-upload";
import type { UploadedAsset } from "@/components/media/upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, describedBy } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatBytes } from "@/lib/format";
import { toastResult } from "../toast-result";

export type LessonResourceItem = {
  id: string;
  title: string;
  url: string | null;
  asset: { id: string; originalName: string; sizeBytes: number; url: string } | null;
};

/** Downloadable files and links attached to a lesson. */
export function ResourcesPanel({ lessonId, resources }: { lessonId: string; resources: LessonResourceItem[] }) {
  const router = useRouter();
  const [removing, setRemoving] = React.useState<string | null>(null);

  async function remove(id: string) {
    setRemoving(id);
    const result = await removeResourceAction(id);
    setRemoving(null);
    if (toastResult(result)) router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="size-4 text-primary" aria-hidden /> Resources
        </CardTitle>
        <CardDescription>Handouts, slides or links learners can use alongside this lesson.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {resources.length > 0 ? (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {resources.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-3 py-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-md bg-surface-muted text-muted-foreground">
                  {r.asset ? <FileText className="size-4" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.asset ? `${r.asset.originalName} · ${formatBytes(r.asset.sizeBytes)}` : r.url}
                  </p>
                </div>
                {r.asset && (
                  <Button asChild variant="ghost" size="icon-sm">
                    <a href={r.asset.url} download aria-label={`Download ${r.title}`}>
                      <Download />
                    </a>
                  </Button>
                )}
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(r.id)} loading={removing === r.id} aria-label={`Remove ${r.title}`}>
                  {removing === r.id ? null : <X />}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg bg-surface-muted/60 px-3.5 py-3 text-sm text-muted-foreground">No resources yet.</p>
        )}
        {resources.length < 20 && <AddResource lessonId={lessonId} onAdded={() => router.refresh()} />}
      </CardContent>
    </Card>
  );
}

function AddResource({ lessonId, onAdded }: { lessonId: string; onAdded: () => void }) {
  const [title, setTitle] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [errors, setErrors] = React.useState<{ title?: string; url?: string }>({});
  const [pending, setPending] = React.useState(false);

  async function add(input: { title: string; assetId?: string; url?: string }) {
    setPending(true);
    const result = await addResourceAction(lessonId, input);
    setPending(false);
    if (!result.ok) {
      setErrors({ title: result.fieldErrors?.title?.[0], url: result.fieldErrors?.url?.[0] ?? (result.fieldErrors ? undefined : result.error) });
      return false;
    }
    toastResult(result);
    setTitle("");
    setUrl("");
    setErrors({});
    onAdded();
    return true;
  }

  return (
    <Tabs defaultValue="file">
      <TabsList aria-label="Add a resource">
        <TabsTrigger value="file">Upload a file</TabsTrigger>
        <TabsTrigger value="link">Add a link</TabsTrigger>
      </TabsList>
      <TabsContent value="file" className="space-y-3 pt-4">
        <Field label="Title" htmlFor="resource-file-title" optional description="Defaults to the file name.">
          <Input id="resource-file-title" value={title} maxLength={140} onChange={(e) => setTitle(e.target.value)} aria-describedby="resource-file-title-description" />
        </Field>
        <FileUpload
          purpose="lesson-resource"
          compact
          label="Upload a resource"
          onUploaded={(asset: UploadedAsset) => void add({ title: title.trim() || asset.originalName.replace(/\.[^.]+$/, ""), assetId: asset.id })}
        />
      </TabsContent>
      <TabsContent value="link" className="pt-4">
        <form
          className="space-y-3"
          noValidate
          onSubmit={async (e) => {
            e.preventDefault();
            const next: typeof errors = {};
            if (!title.trim()) next.title = "Give the resource a title";
            if (!/^https:\/\//i.test(url.trim())) next.url = "Links must start with https://";
            setErrors(next);
            if (next.title || next.url) return;
            await add({ title: title.trim(), url: url.trim() });
          }}
        >
          <Field label="Title" htmlFor="resource-link-title" error={errors.title} required>
            <Input
              id="resource-link-title"
              value={title}
              maxLength={140}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={describedBy("resource-link-title", errors.title)}
            />
          </Field>
          <Field label="Link" htmlFor="resource-link-url" error={errors.url} required>
            <Input
              id="resource-link-url"
              type="url"
              inputMode="url"
              placeholder="https://"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              aria-invalid={Boolean(errors.url)}
              aria-describedby={describedBy("resource-link-url", errors.url)}
            />
          </Field>
          <Button type="submit" variant="outline" size="sm" loading={pending}>
            Add link
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );
}
