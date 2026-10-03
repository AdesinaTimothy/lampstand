import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { VerifyForm } from "@/components/certificates/verify-form";
import { getCurrentOrganization } from "@/server/organization";

export async function generateMetadata(): Promise<Metadata> {
  const org = await getCurrentOrganization();
  return {
    title: "Verify a certificate",
    description: `Confirm that a certificate issued by ${org.name} is genuine.`,
    alternates: { canonical: "/verify" },
  };
}

export default async function VerifyPage() {
  const org = await getCurrentOrganization();
  return (
    <div className="container-page max-w-2xl py-12 sm:py-20">
      <span className="grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
        <ShieldCheck className="size-7" aria-hidden />
      </span>
      <h1 className="text-display mt-6 text-[2.25rem] font-medium leading-tight sm:text-[2.75rem]">Verify a certificate</h1>
      <p className="mt-3 text-muted-foreground">
        Every certificate from {org.name} carries a unique ID. Enter it below to confirm who it was awarded to, for which course, and when.
      </p>
      <div className="mt-8 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7">
        <VerifyForm autoFocus />
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        For privacy, verification shows only the recipient&apos;s name, the course and the dates. Contact details are never shown.
      </p>
    </div>
  );
}
