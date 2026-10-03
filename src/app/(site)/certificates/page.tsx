import type { Metadata } from "next";
import Link from "next/link";
import { Award, ShieldCheck } from "lucide-react";
import { requirePageViewer } from "@/server/auth/guards";
import { listMyCertificates } from "@/server/queries/learner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Certificates" };

export default async function CertificatesPage() {
  const viewer = await requirePageViewer("/certificates");
  const certificates = await listMyCertificates(viewer);

  return (
    <div className="container-page max-w-5xl py-8 pb-24 sm:py-12 lg:pb-12">
      <PageHeader
        title="Certificates"
        description="Each certificate has a unique ID anyone can verify."
        actions={
          <Button asChild variant="outline">
            <Link href="/verify">
              <ShieldCheck aria-hidden /> Verify a certificate
            </Link>
          </Button>
        }
      />
      {certificates.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<Award />}
          title="No certificates yet"
          description="Complete every required lesson in a course to receive a certificate."
          action={
            <Button asChild>
              <Link href="/my-courses">Continue learning</Link>
            </Button>
          }
        />
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {certificates.map((c) => (
            <li key={c.id}>
              <Link
                href={`/certificates/${c.id}`}
                className="group flex h-full gap-4 rounded-2xl border border-border bg-surface p-5 shadow-xs transition-shadow hover:shadow-md"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent ring-1 ring-accent/20" aria-hidden>
                  <Award className="size-6" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold leading-snug group-hover:underline">{c.courseTitle}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">Issued {formatDate(c.issuedAt)}</span>
                  <span className="mt-3 flex flex-wrap items-center gap-2">
                    <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs">{c.code}</code>
                    {c.revokedAt ? <Badge variant="danger">Revoked</Badge> : <Badge variant="success">Valid</Badge>}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
