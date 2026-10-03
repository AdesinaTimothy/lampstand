import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";
import { EmptyState } from "@/components/ui/empty-state";
import { getViewer } from "@/server/auth/viewer";
import { getCurrentOrganization } from "@/server/organization";
import { Lock } from "lucide-react";

export const metadata: Metadata = { title: "Create your account" };

export default async function RegisterPage() {
  if (await getViewer()) redirect("/dashboard");
  const org = await getCurrentOrganization();
  if (!org.allowSelfRegistration) {
    return (
      <EmptyState
        icon={<Lock />}
        title="Registration is by invitation"
        description={`Please contact ${org.name} to request access.`}
        action={<Link href="/login" className="text-sm font-medium text-primary hover:underline">Sign in instead</Link>}
      />
    );
  }
  return (
    <>
      <h1 className="text-display text-[2rem] font-medium leading-tight">Start learning</h1>
      <p className="mt-2 text-[15px] text-muted-foreground">
        Create a free account to join courses from {org.name} and track your growth.
      </p>
      <div className="mt-8">
        <RegisterForm />
      </div>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
