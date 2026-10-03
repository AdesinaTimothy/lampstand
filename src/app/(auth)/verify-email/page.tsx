import Link from "next/link";
import type { Metadata } from "next";
import { CheckInboxPanel, ConfirmEmailPanel } from "@/components/auth/verify-email-panels";

export const metadata: Metadata = { title: "Confirm your email" };

export default async function VerifyEmailPage(props: PageProps<"/verify-email">) {
  const sp = await props.searchParams;
  if (typeof sp.token === "string") return <ConfirmEmailPanel token={sp.token} />;
  if (typeof sp.sent === "string") return <CheckInboxPanel email={sp.sent} />;
  return (
    <div className="text-center">
      <h1 className="text-display text-[1.75rem] font-medium">Confirm your email</h1>
      <p className="mt-2 text-sm text-muted-foreground">Open the link we emailed you to confirm your address.</p>
      <Link href="/login" className="mt-6 inline-block text-sm font-medium text-primary hover:underline">
        Back to sign in
      </Link>
    </div>
  );
}
