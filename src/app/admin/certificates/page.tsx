import type { Metadata } from "next";
import Link from "next/link";
import { Award, ExternalLink } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { FilterBar } from "@/components/admin/filter-bar";
import { ResultCount } from "@/components/admin/result-count";
import { RevokeCertificateDialog } from "@/components/admin/certificates/revoke-dialog";
import { formatDate, formatNumber } from "@/lib/format";
import { requirePagePermission } from "@/server/auth/guards";
import { listCertificates, parseCertificateFilters } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Certificates" };

type Cert = Awaited<ReturnType<typeof listCertificates>>["certificates"][number];

function Status({ cert }: { cert: Cert }) {
  return cert.revokedAt ? (
    <span className="grid gap-0.5">
      <Badge variant="danger" className="justify-self-start">
        Revoked
      </Badge>
      {cert.revokedReason && <span className="max-w-56 truncate text-xs text-muted-foreground" title={cert.revokedReason}>{cert.revokedReason}</span>}
    </span>
  ) : (
    <Badge variant="success">Valid</Badge>
  );
}

function VerifyLink({ code }: { code: string }) {
  return (
    <Link href={`/verify/${code}`} target="_blank" className="inline-flex items-center gap-1 font-mono text-[13px] hover:text-primary hover:underline">
      {code}
      <ExternalLink className="size-3" aria-hidden />
      <span className="sr-only">(verify, opens in a new tab)</span>
    </Link>
  );
}

export default async function CertificatesPage(props: PageProps<"/admin/certificates">) {
  const viewer = await requirePagePermission("certificate:manage", "/admin/certificates");
  const filters = parseCertificateFilters(await props.searchParams);
  const result = await listCertificates(viewer, filters);
  const values = { q: filters.q, status: filters.status };
  const filtered = Boolean(filters.q || filters.status);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Certificates"
        description={`Every certificate issued by your organization. Revoked certificates show as invalid on the public verification page.${
          result.revokedTotal ? ` ${formatNumber(result.revokedTotal)} revoked so far.` : ""
        }`}
      />
      <FilterBar
        values={values}
        search={{ placeholder: "Search name, code or course", label: "Search certificates" }}
        selects={[
          {
            name: "status",
            label: "Status",
            allLabel: "All certificates",
            options: [
              { value: "valid", label: "Valid" },
              { value: "revoked", label: "Revoked" },
            ],
          },
        ]}
      />
      <ResultCount total={result.total} noun="certificate" filtered={filtered} />
      {result.certificates.length === 0 ? (
        <EmptyState
          icon={<Award />}
          title={filtered ? "No certificates match" : "No certificates yet"}
          description={filtered ? "Check the code or try another name." : "Certificates are issued automatically when learners complete a course."}
        />
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-border md:hidden">
            {result.certificates.map((c) => (
              <li key={c.id} className="px-4 py-4">
                <div className="flex items-start gap-3">
                  <Avatar name={c.recipientName} src={c.avatarUrl} size="sm" />
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/learners/${c.recipientId}`} className="font-medium hover:underline">
                      {c.recipientName}
                    </Link>
                    <p className="text-sm text-muted-foreground">{c.courseTitle}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Issued {formatDate(c.issuedAt)} · verified {c.verifications}×
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <VerifyLink code={c.code} />
                      <Status cert={c} />
                    </div>
                  </div>
                </div>
                {!c.revokedAt && (
                  <div className="mt-2 flex justify-end">
                    <RevokeCertificateDialog certificateId={c.id} code={c.code} recipientName={c.recipientName} courseTitle={c.courseTitle} />
                  </div>
                )}
              </li>
            ))}
          </ul>
          <div className="hidden md:block">
            <Table>
              <THead>
                <tr>
                  <TH>Recipient</TH>
                  <TH>Course</TH>
                  <TH>Code</TH>
                  <TH>Issued</TH>
                  <TH>Status</TH>
                  <TH>
                    <span className="sr-only">Actions</span>
                  </TH>
                </tr>
              </THead>
              <TBody>
                {result.certificates.map((c) => (
                  <TR key={c.id}>
                    <TD>
                      <div className="flex items-center gap-3">
                        <Avatar name={c.recipientName} src={c.avatarUrl} size="sm" />
                        <Link href={`/admin/learners/${c.recipientId}`} className="max-w-48 truncate font-medium hover:underline">
                          {c.recipientName}
                        </Link>
                      </div>
                    </TD>
                    <TD className="max-w-64">
                      <span className="line-clamp-2">{c.courseTitle}</span>
                    </TD>
                    <TD className="whitespace-nowrap">
                      <VerifyLink code={c.code} />
                      <p className="text-xs text-muted-foreground">verified {c.verifications}×</p>
                    </TD>
                    <TD className="whitespace-nowrap text-muted-foreground">{formatDate(c.issuedAt)}</TD>
                    <TD>
                      <Status cert={c} />
                    </TD>
                    <TD className="text-right">
                      {!c.revokedAt && (
                        <RevokeCertificateDialog certificateId={c.id} code={c.code} recipientName={c.recipientName} courseTitle={c.courseTitle} />
                      )}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </Card>
      )}
      <Pagination page={result.page} pageCount={result.pageCount} basePath="/admin/certificates" searchParams={values} />
    </div>
  );
}
