import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileTabBar } from "@/components/layout/mobile-nav";
import { getShellData } from "@/server/queries/shell";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { org, viewer } = await getShellData();
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter orgName={org.name} tagline={org.tagline} />
      {viewer && <MobileTabBar />}
    </div>
  );
}
