"use client";

import * as React from "react";
import { toast } from "sonner";
import { resendVerificationAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export function ResendVerificationButton({ email }: { email: string }) {
  const [pending, start] = React.useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      loading={pending}
      onClick={() =>
        start(async () => {
          const res = await resendVerificationAction({ email });
          if (res.ok) toast.success("Check your inbox for a new verification link.");
          else toast.error(res.error);
        })
      }
    >
      Resend verification email
    </Button>
  );
}
