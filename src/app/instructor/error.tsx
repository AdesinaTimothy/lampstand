"use client";

import { StudioError } from "@/components/builder/studio-error";

export default function InstructorError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <StudioError error={error} retry={retry} />;
}
