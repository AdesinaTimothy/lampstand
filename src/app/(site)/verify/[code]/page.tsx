import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ShieldAlert, ShieldX } from "lucide-react";
import { CertificateDocument } from "@/components/certificates/certificate-document";
import { VerifyForm } from "@/components/certificates/verify-form";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { findPublicCertificate, logVerification, normalizeCertificateCode } from "@/server/services/certificates";
import { rateLimit } from "@/server/rate-limit";
import { getRequestMeta } from "@/server/request";

export async function generateMetadata(props: PageProps<"/verify/[code]">): Promise<Metadata> {
  const { code } = await props.params;
  const cert = await findPublicCertificate(decodeURIComponent(code));
  // Never indexed: certificate holders choose where to share their link.
  return {
    title: cert ? `Certificate ${cert.code}` : "Certificate not found",
    description: cert ? `${cert.courseTitle}, completed with ${cert.organizationName}.` : undefined,
    robots: { index: false, follow: false },
  };
}

export default async function VerifyCodePage(props: PageProps<"/verify/[code]">) {
  const raw = decodeURIComponent((await props.params).code).slice(0, 40);
  const meta = await getRequestMeta();
  const limit = await rateLimit(`verify:${meta.ipAddress ?? "unknown"}`, 60, 10 * 60);

  if (!limit.ok) {
    return (
      <Shell>
        <Result tone="warning" icon={<ShieldAlert />} title="Too many lookups" body="Please wait a few minutes before verifying more certificates." />
      </Shell>
    );
  }

  const cert = await findPublicCertificate(raw);
  if (cert) await logVerification(cert.code, meta);

  if (!cert) {
    return (
      <Shell>
        <Result
          tone="danger"
          icon={<ShieldX />}
          title="No certificate found"
          body={
            <>
              We couldn&apos;t find a certificate with the ID <code className="rounded bg-surface-muted px-1.5 font-mono">{normalizeCertificateCode(raw)}</code>. Check
              the ID for typos and try again.
            </>
          }
        />
        <div className="mt-8 rounded-2xl border border-border bg-surface p-5 sm:p-7">
          <VerifyForm defaultValue={raw} />
        </div>
      </Shell>
    );
  }

  const revoked = cert.status === "REVOKED";
  return (
    <Shell wide>
      {revoked ? (
        <Result
          tone="danger"
          icon={<ShieldX />}
          title="This certificate has been revoked"
          body={`It was issued by ${cert.organizationName} but revoked on ${formatDate(cert.revokedAt!)}. It should not be treated as valid.`}
        />
      ) : (
        <Result
          tone="success"
          icon={<CheckCircle2 />}
          title="Valid certificate"
          body={`This certificate was issued by ${cert.organizationName} and is authentic.`}
        />
      )}

      <dl className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
        {[
          { label: "Awarded to", value: cert.recipientName },
          { label: "Course", value: cert.courseTitle },
          { label: "Completed", value: formatDate(cert.completedAt, "d MMMM yyyy") },
          { label: "Issued by", value: cert.organizationName },
          ...(cert.instructorName ? [{ label: "Instructor", value: cert.instructorName }] : []),
          { label: "Certificate ID", value: cert.code, mono: true },
        ].map((row) => (
          <div key={row.label} className="bg-surface p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{row.label}</dt>
            <dd className={row.mono ? "mt-1 font-mono text-sm" : "mt-1 font-medium"}>{row.value}</dd>
          </div>
        ))}
      </dl>

      <CertificateDocument className="mt-8" {...cert} revoked={revoked} />

      {cert.courseSlug && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface-muted/60 p-5">
          <p className="text-sm text-muted-foreground">Curious about this course?</p>
          <Button asChild variant="outline">
            <Link href={`/courses/${cert.courseSlug}`}>View course</Link>
          </Button>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return <div className={`container-page py-10 sm:py-16 ${wide ? "max-w-4xl" : "max-w-2xl"}`}>{children}</div>;
}

function Result({ tone, icon, title, body }: { tone: "success" | "danger" | "warning"; icon: React.ReactNode; title: string; body: React.ReactNode }) {
  const styles = {
    success: "border-success/30 bg-success-soft text-success",
    danger: "border-danger/30 bg-danger-soft text-danger",
    warning: "border-warning/30 bg-warning-soft text-warning",
  }[tone];
  return (
    <div role="status" className={`flex gap-4 rounded-2xl border p-5 sm:p-6 ${styles}`}>
      <span className="shrink-0 [&_svg]:size-8" aria-hidden>
        {icon}
      </span>
      <div>
        <h1 className="text-xl font-semibold sm:text-2xl">{title}</h1>
        <p className="mt-1 text-sm text-foreground">{body}</p>
      </div>
    </div>
  );
}
