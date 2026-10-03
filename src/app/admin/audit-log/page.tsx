import type { Metadata } from "next";
import Link from "next/link";
import { ScrollText } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { FilterBar } from "@/components/admin/filter-bar";
import { ResultCount } from "@/components/admin/result-count";
import { TimeAgo } from "@/components/admin/time-ago";
import { actionLabel, actionTone } from "@/components/admin/audit/labels";
import { requirePagePermission } from "@/server/auth/guards";
import { listAuditLog, parseAuditFilters } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Audit log" };

type Entry = Awaited<ReturnType<typeof listAuditLog>>["entries"][number];

function Target({ entry }: { entry: Entry }) {
  const name = entry.entityName ?? (entry.entityId ? `${entry.entityType} ${entry.entityId.slice(-6)}` : entry.entityType);
  return entry.entityHref ? (
    <Link href={entry.entityHref} className="font-medium hover:underline">
      {name}
    </Link>
  ) : (
    <span className="font-medium">{name}</span>
  );
}

function Actor({ entry }: { entry: Entry }) {
  if (!entry.actor) return <span className="text-muted-foreground">System</span>;
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <Avatar name={entry.actor.name} src={entry.actor.avatarUrl} size="xs" />
      <span className="truncate">{entry.actor.name}</span>
    </span>
  );
}

export default async function AuditLogPage(props: PageProps<"/admin/audit-log">) {
  const viewer = await requirePagePermission("audit:view", "/admin/audit-log");
  const filters = parseAuditFilters(await props.searchParams);
  const result = await listAuditLog(viewer, filters);
  const values = { action: filters.action, entity: filters.entity };
  const filtered = Boolean(filters.action || filters.entity);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Audit log" description="A permanent record of sensitive administrative actions: role changes, suspensions, publishing and settings." />
      <FilterBar
        values={values}
        selects={[
          {
            name: "action",
            label: "Action",
            allLabel: "All actions",
            options: result.actions.map((a) => ({ value: a.value, label: `${actionLabel(a.value)} (${a.count})` })),
          },
          {
            name: "entity",
            label: "Affected item",
            allLabel: "All items",
            options: result.entities.map((e) => ({ value: e.value, label: `${e.value} (${e.count})` })),
          },
        ]}
      />
      <ResultCount total={result.total} noun="entry" plural="entries" filtered={filtered} />
      {result.entries.length === 0 ? (
        <EmptyState icon={<ScrollText />} title={filtered ? "No entries match" : "Nothing recorded yet"} description="Administrative actions will be listed here as they happen." />
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-border md:hidden">
            {result.entries.map((e) => (
              <li key={e.id} className="px-4 py-3.5 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant={actionTone(e.action)}>{actionLabel(e.action)}</Badge>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    <TimeAgo date={e.createdAt} />
                  </span>
                </div>
                <p className="mt-2">
                  <Target entry={e} />
                </p>
                {e.summary && <p className="mt-0.5 break-words text-xs text-muted-foreground">{e.summary}</p>}
                <div className="mt-2 text-xs text-muted-foreground">
                  <Actor entry={e} />
                </div>
              </li>
            ))}
          </ul>
          <div className="hidden md:block">
            <Table>
              <THead>
                <tr>
                  <TH>When</TH>
                  <TH>Who</TH>
                  <TH>Action</TH>
                  <TH>Affected</TH>
                  <TH>Details</TH>
                </tr>
              </THead>
              <TBody>
                {result.entries.map((e) => (
                  <TR key={e.id}>
                    <TD className="whitespace-nowrap text-muted-foreground">
                      <TimeAgo date={e.createdAt} />
                    </TD>
                    <TD className="max-w-44">
                      <Actor entry={e} />
                    </TD>
                    <TD>
                      <Badge variant={actionTone(e.action)}>{actionLabel(e.action)}</Badge>
                    </TD>
                    <TD className="max-w-56">
                      <span className="block truncate">
                        <Target entry={e} />
                      </span>
                      <span className="text-xs text-muted-foreground">{e.entityType}</span>
                    </TD>
                    <TD className="max-w-72 text-xs text-muted-foreground">
                      <span className="line-clamp-2 break-words">{e.summary ?? "—"}</span>
                      {e.ipAddress && <span className="block font-mono text-[11px] text-subtle-foreground">{e.ipAddress}</span>}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </Card>
      )}
      <Pagination page={result.page} pageCount={result.pageCount} basePath="/admin/audit-log" searchParams={values} />
    </div>
  );
}
