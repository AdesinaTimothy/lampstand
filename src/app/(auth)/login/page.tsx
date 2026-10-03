import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getViewer } from "@/server/auth/viewer";
import { getCurrentOrganization } from "@/server/organization";
import { safeRedirectPath } from "@/lib/validation/auth";

export const metadata: Metadata = { title: "Sign in" };

const NOTICES: Record<string, string> = {
  reset: "Your password has been updated. Sign in with your new password.",
  verified: "Your email is confirmed. Welcome!",
};

export default async function LoginPage(props: PageProps<"/login">) {
  const sp = await props.searchParams;
  const next = typeof sp.next === "string" ? safeRedirectPath(sp.next) : undefined;
  if (await getViewer()) redirect(next ?? "/dashboard");
  const org = await getCurrentOrganization();
  const notice = typeof sp.notice === "string" ? NOTICES[sp.notice] : undefined;
  return (
    <>
      <h1 className="text-display text-[2rem] font-medium leading-tight">Welcome back</h1>
      <p className="mt-2 text-[15px] text-muted-foreground">Sign in to continue learning with {org.name}.</p>
      <div className="mt-8">
        <LoginForm next={next} notice={notice} />
      </div>
      {org.allowSelfRegistration && (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
      )}
    </>
  );
}
