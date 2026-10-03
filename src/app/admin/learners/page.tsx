import type { Metadata } from "next";
import { Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { FilterBar } from "@/components/admin/filter-bar";
import { ResultCount } from "@/components/admin/result-count";
import { PeopleList } from "@/components/admin/people/people-list";
import { ROLE_LABELS } from "@/lib/roles";
import { formatNumber } from "@/lib/format";
import { requirePagePermission } from "@/server/auth/guards";
import { listPeople, parsePeopleFilters } from "@/server/queries/admin";

export const metadata: Metadata = { title: "People" };

const ROLE_ORDER = ["LEARNER", "INSTRUCTOR", "ADMIN", "OWNER"] as const;

export default async function PeoplePage(props: PageProps<"/admin/learners">) {
  const viewer = await requirePagePermission("learner:view", "/admin/learners");
  const filters = parsePeopleFilters(await props.searchParams);
  const result = await listPeople(viewer, filters);
  const values = { q: filters.q, role: filters.role, status: filters.status, activity: filters.activity, sort: filters.sort === "newest" ? undefined : filters.sort };
  const filtered = Boolean(filters.q || filters.role || filters.status || filters.activity);
  const everyone = Object.values(result.roleCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="People"
        description={`${formatNumber(everyone)} members · ${ROLE_ORDER.filter((r) => result.roleCounts[r] > 0)
          .map((r) => `${formatNumber(result.roleCounts[r])} ${ROLE_LABELS[r].toLowerCase()}${result.roleCounts[r] === 1 ? "" : "s"}`)
          .join(", ")}`}
      />
      <FilterBar
        values={values}
        search={{ placeholder: "Search by name or email", label: "Search people" }}
        selects={[
          { name: "role", label: "Role", allLabel: "All roles", options: ROLE_ORDER.map((r) => ({ value: r, label: ROLE_LABELS[r] })) },
          {
            name: "status",
            label: "Status",
            allLabel: "Any status",
            options: [
              { value: "ACTIVE", label: "Active" },
              { value: "SUSPENDED", label: "Suspended" },
            ],
          },
          {
            name: "activity",
            label: "Activity",
            allLabel: "Any activity",
            options: [
              { value: "active", label: "Active in 30 days" },
              { value: "inactive", label: "Inactive 30+ days" },
            ],
          },
          {
            name: "sort",
            label: "Sort by",
            allLabel: "Newest first",
            options: [
              { value: "name", label: "Name A–Z" },
              { value: "last_active", label: "Recently active" },
              { value: "progress", label: "Most progress" },
            ],
          },
        ]}
      />
      <ResultCount total={result.total} noun="person" plural="people" filtered={filtered} />
      {result.people.length ? (
        <Card className="overflow-hidden">
          <PeopleList people={result.people} />
        </Card>
      ) : (
        <EmptyState
          icon={<Users />}
          title={filtered ? "No one matches these filters" : "No members yet"}
          description={filtered ? "Try a different name, or clear the filters." : "People appear here when they register or are invited."}
        />
      )}
      <Pagination page={result.page} pageCount={result.pageCount} basePath="/admin/learners" searchParams={{ ...values }} />
    </div>
  );
}
