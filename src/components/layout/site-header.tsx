import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { getShellData } from "@/server/queries/shell";
import { NavLink } from "./nav-link";
import { NotificationBell } from "./notification-bell";
import { SearchBox } from "./search-box";
import { UserMenu } from "./user-menu";
import { MobileSearchTrigger } from "./mobile-nav";

const navLinkClass =
  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground";

export async function SiteHeader() {
  const { org, viewer, unread } = await getShellData();
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
      <div className="container-page flex h-16 items-center gap-3 sm:gap-6">
        <Link href={viewer ? "/dashboard" : "/"} className="shrink-0 rounded-md" aria-label={`Lampstand — ${org.name}`}>
          <Logo orgName={org.name} />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          <NavLink href="/courses" className={navLinkClass} activeClassName="text-foreground">
            Browse
          </NavLink>
          {viewer && (
            <NavLink href="/my-courses" className={navLinkClass} activeClassName="text-foreground">
              My learning
            </NavLink>
          )}
          {viewer?.canTeach && (
            <NavLink href="/instructor" className={navLinkClass} activeClassName="text-foreground">
              Teach
            </NavLink>
          )}
        </nav>
        <SearchBox className="ml-auto hidden w-full max-w-sm lg:block" />
        <div className="ml-auto flex items-center gap-1 sm:gap-2 lg:ml-0">
          {viewer ? (
            <>
              <div className="hidden md:block lg:hidden">
                <MobileSearchTrigger variant="icon" />
              </div>
              <NotificationBell initialUnread={unread} />
              <UserMenu viewer={viewer} />
            </>
          ) : (
            <>
              <div className="lg:hidden">
                <MobileSearchTrigger variant="icon" />
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
              {org.allowSelfRegistration && (
                <Button asChild size="sm">
                  <Link href="/register">Get started</Link>
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
