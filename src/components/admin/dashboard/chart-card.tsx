import * as React from "react";
import { BarChart3 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "../section-card";

/** Chart wrapper: title, a one-line takeaway derived from the data, and an empty state. */
export function ChartCard({
  title,
  takeaway,
  emptyTitle,
  emptyDescription,
  children,
  className,
}: {
  title: string;
  takeaway: string | null;
  emptyTitle: string;
  emptyDescription: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <SectionCard title={title} description={takeaway ?? undefined} className={className}>
      {takeaway ? (
        // `relative overflow-hidden` contains the chart's visually-hidden data table, which
        // can't shrink below its content width and would otherwise widen the page on phones.
        <div className="relative overflow-hidden">{children}</div>
      ) : (
        <EmptyState compact icon={<BarChart3 />} title={emptyTitle} description={emptyDescription} />
      )}
    </SectionCard>
  );
}
