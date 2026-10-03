"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { enrollAction } from "@/actions/learning";
import { Button, type ButtonProps } from "@/components/ui/button";

export function EnrollButton({
  courseId,
  courseSlug,
  signedIn,
  children = "Enrol now — it's free",
  ...props
}: { courseId: string; courseSlug: string; signedIn: boolean } & Omit<ButtonProps, "onClick">) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  return (
    <Button
      {...props}
      loading={pending}
      onClick={async () => {
        if (!signedIn) {
          router.push(`/login?next=${encodeURIComponent(`/courses/${courseSlug}`)}`);
          return;
        }
        setPending(true);
        const result = await enrollAction(courseId);
        if (!result.ok) {
          setPending(false);
          toast.error(result.error);
          return;
        }
        toast.success(result.message ?? "You're enrolled.");
        router.push(`/learn/${courseSlug}`);
      }}
    >
      {children}
    </Button>
  );
}
