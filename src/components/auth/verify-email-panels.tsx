"use client";

import Link from "next/link";
import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, MailCheck, XCircle } from "lucide-react";
import { confirmEmailAction, resendVerificationAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";

/**
 * Verification requires a click on our page (POST) rather than the GET link
 * alone, so email security scanners that pre-fetch links can't consume tokens.
 */
export function ConfirmEmailPanel({ token }: { token: string }) {
  const router = useRouter();
  const [state, setState] = React.useState<{ status: "idle" | "pending" | "error"; message?: string }>({ status: "idle" });
  return (
    <div className="text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary-soft text-primary">
        {state.status === "error" ? <XCircle className="size-5 text-danger" aria-hidden /> : <MailCheck className="size-5" aria-hidden />}
      </div>
      <h1 className="text-display mt-5 text-[1.75rem] font-medium">Confirm your email</h1>
      {state.status === "error" ? (
        <>
          <p role="alert" className="mt-2 text-sm text-danger">{state.message}</p>
          <Button asChild variant="outline" className="mt-6 w-full">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted-foreground">One click and you&apos;re ready to start learning.</p>
          <Button
            size="lg"
            className="mt-6 w-full"
            loading={state.status === "pending"}
            onClick={async () => {
              setState({ status: "pending" });
              const result = await confirmEmailAction(token);
              if (result.ok) {
                router.replace("/dashboard?welcome=1");
                router.refresh();
              } else setState({ status: "error", message: result.error });
            }}
          >
            Confirm my email
          </Button>
        </>
      )}
    </div>
  );
}

export function CheckInboxPanel({ email }: { email: string }) {
  const [sent, setSent] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  return (
    <div className="text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-full bg-success-soft text-success">
        <CheckCircle2 className="size-5" aria-hidden />
      </div>
      <h1 className="text-display mt-5 text-[1.75rem] font-medium">Check your inbox</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>. It expires in 24 hours.
      </p>
      <Button
        variant="outline"
        className="mt-6 w-full"
        loading={pending}
        disabled={sent}
        onClick={async () => {
          setPending(true);
          await resendVerificationAction({ email });
          setPending(false);
          setSent(true);
        }}
      >
        {sent ? "Sent — check your inbox" : "Resend the link"}
      </Button>
      <p className="mt-6 text-sm text-muted-foreground">
        Wrong address?{" "}
        <Link className="font-medium text-primary hover:underline" href="/register">
          Start again
        </Link>
      </p>
    </div>
  );
}
