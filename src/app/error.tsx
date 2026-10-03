"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { StatusPage } from "@/components/layout/status-page";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main id="main">
      <StatusPage
        code="Something went wrong"
        title="This page didn't load properly"
        description="It's not you — something went wrong on our side. Please try again; if it keeps happening, let your church office know."
      >
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" onClick={() => (window.location.href = "/dashboard")}>
          Go to my dashboard
        </Button>
      </StatusPage>
      {error.digest && <p className="pb-10 text-center font-mono text-xs text-subtle-foreground">Reference: {error.digest}</p>}
    </main>
  );
}
