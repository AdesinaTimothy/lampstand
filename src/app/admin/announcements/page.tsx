import type { Metadata } from "next";
import { Mail, Megaphone } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { SectionCard } from "@/components/admin/section-card";
import { TimeAgo } from "@/components/admin/time-ago";
import { AnnouncementForm } from "@/components/admin/announcements/announcement-form";
import { formatNumber } from "@/lib/format";
import { requirePagePermission } from "@/server/auth/guards";
import { listAnnouncements, parsePage } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Announcements" };

export default async function AnnouncementsPage(props: PageProps<"/admin/announcements">) {
  const viewer = await requirePagePermission("announcement:send", "/admin/announcements");
  const page = parsePage(await props.searchParams);
  const result = await listAnnouncements(viewer, page);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Announcements" description={`Share news with all ${formatNumber(result.activeMembers)} active members of your organization.`} />
      <div className="grid gap-6 lg:grid-cols-5">
        <SectionCard title="New announcement" description="Delivered instantly as a notification." className="self-start lg:col-span-2">
          <AnnouncementForm recipients={result.activeMembers} />
        </SectionCard>
        <SectionCard
          title="History"
          description={result.total ? `${formatNumber(result.total)} sent` : undefined}
          className="lg:col-span-3"
        >
          {result.announcements.length === 0 ? (
            <EmptyState compact icon={<Megaphone />} title="No announcements yet" description="Your first announcement will appear here." />
          ) : (
            <ol className="space-y-5">
              {result.announcements.map((a) => (
                <li key={a.id} className="border-b border-border pb-5 last:border-0 last:pb-0">
                  <article>
                    <h3 className="font-semibold">{a.title}</h3>
                    <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{a.body}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                      {a.author && (
                        <span className="inline-flex items-center gap-1.5">
                          <Avatar name={a.author.name} src={a.author.avatarUrl} size="xs" />
                          {a.author.name}
                        </span>
                      )}
                      <TimeAgo date={a.createdAt} />
                      {a.recipients !== null && <span>{formatNumber(a.recipients)} recipients</span>}
                      {a.emailed && (
                        <Badge variant="info">
                          <Mail aria-hidden />
                          Emailed
                        </Badge>
                      )}
                    </div>
                  </article>
                </li>
              ))}
            </ol>
          )}
          <Pagination page={result.page} pageCount={result.pageCount} basePath="/admin/announcements" className="mt-6" />
        </SectionCard>
      </div>
    </div>
  );
}
