import Link from "next/link";
import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/password-reset-forms";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage(props: PageProps<"/reset-password">) {
  const sp = await props.searchParams;
  const token = typeof sp.token === "string" ? sp.token : null;
  const invite = sp.invite === "1";
  if (!token) {
    return (
      <div className="text-center">
        <h1 className="text-display text-[1.75rem] font-medium">This link is incomplete</h1>
        <p className="mt-2 text-sm text-muted-foreground">Request a new password reset link to continue.</p>
        <Link href="/forgot-password" className="mt-6 inline-block text-sm font-medium text-primary hover:underline">
          Request a new link
        </Link>
      </div>
    );
  }
  return (
    <>
      <h1 className="text-display text-[2rem] font-medium leading-tight">{invite ? "Set your password" : "Choose a new password"}</h1>
      <p className="mt-2 text-[15px] text-muted-foreground">
        {invite ? "Welcome! Set a password to activate your instructor account." : "For your security, you'll be signed out of other devices."}
      </p>
      <div className="mt-8">
        <ResetPasswordForm token={token} />
      </div>
    </>
  );
}
