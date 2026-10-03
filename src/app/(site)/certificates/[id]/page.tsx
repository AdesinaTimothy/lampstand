import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldAlert, ShieldCheck } from "lucide-react";
import { requirePageViewer } from "@/server/auth/guards";
import { env } from "@/server/env";
import { getCertificateForViewer } from "@/server/queries/learner";
import { CertificateDocument } from "@/components/certificates/certificate-document";
import { CertificateActions } from "@/components/certificates/share-actions";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Certificate", robots: { index: false } };

export default async function CertificatePage(props: PageProps<"/certificates/[id]">) {
  const { id } = await props.params;
  const viewer = await requirePageViewer(`/certificates/${id}`);
  const cert = await getCertificateForViewer(viewer, id);
  if (!cert) notFound();
  const verifyUrl = `${env.APP_URL}/verify/${cert.code}`;
  const revoked = Boolean(cert.revokedAt);

  return (
    <div className="container-page max-w-5xl py-8 pb-24 sm:py-12 lg:pb-12">
      <Link href="/certificates" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> All certificates
      </Link>
      <div className="mt-4 flex flex-col gap-1">
        <h1 className="text-display text-[1.75rem] font-medium leading-tight sm:text-[2rem]">{cert.courseTitle}</h1>
        <p className="text-muted-foreground">
          {cert.isOwner ? "Your certificate" : `Awarded to ${cert.recipientName}`} · issued {formatDate(cert.issuedAt)}
        </p>
      </div>

      {revoked && (
        <div role="alert" className="mt-6 flex gap-3 rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm">
          <ShieldAlert className="size-5 shrink-0 text-danger" aria-hidden />
          <div>
            <p className="font-semibold text-danger">This certificate was revoked on {formatDate(cert.revokedAt!)}.</p>
            {cert.revokedReason && <p className="mt-1 text-foreground">{cert.revokedReason}</p>}
          </div>
        </div>
      )}

      <CertificateDocument className="mt-6" {...cert} revoked={revoked} />

      {!revoked && (
        <div className="mt-6 space-y-4">
          <CertificateActions
            pdfHref={`/certificates/${cert.id}/pdf`}
            verifyUrl={verifyUrl}
            courseTitle={cert.courseTitle}
            organizationName={cert.organizationName}
            issuedAt={cert.issuedAt.toISOString()}
            code={cert.code}
          />
          <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 text-sm">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
            <p className="min-w-0 text-muted-foreground">
              Anyone can confirm this certificate is genuine at{" "}
              <Link href={`/verify/${cert.code}`} prefetch={false} className="break-all font-medium text-primary underline-offset-2 hover:underline">
                {verifyUrl.replace(/^https?:\/\//, "")}
              </Link>
              . The verification page shows your name, the course and the completion date. It never shows your email address.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
