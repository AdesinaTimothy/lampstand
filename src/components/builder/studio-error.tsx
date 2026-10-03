"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Shared error fallback for instructor studio route segments. */
export function StudioError({ error, retry, title = "This page couldn't load" }: { error: Error & { digest?: string }; retry: () => void; title?: string }) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div role="alert" className="flex flex-col items-center rounded-xl border border-border bg-surface px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-danger-soft text-danger" aria-hidden>
        <AlertTriangle className="size-5" />
      </span>
      <h2 className="mt-4 text-base font-semibold tracking-tight">{title}</h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        Something went wrong on our side. Your work is saved — try again, or head back to your courses.
      </p>
      {error.digest && <p className="mt-2 font-mono text-xs text-subtle-foreground">Reference {error.digest}</p>}
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Button onClick={() => retry()}>
          <RotateCcw /> Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/instructor/courses">All courses</Link>
        </Button>
      </div>
    </div>
  );
}
