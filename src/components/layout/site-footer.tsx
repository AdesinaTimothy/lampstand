import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";

export function SiteFooter({ orgName, tagline }: { orgName: string; tagline?: string | null }) {
  return (
    <footer className="mt-auto border-t border-border bg-surface-muted/40">
      <div className="container-page grid gap-8 py-10 pb-28 sm:grid-cols-[1.5fr_1fr_1fr] md:pb-10">
        <div>
          <div className="flex items-center gap-2.5">
            <LogoMark className="size-7" />
            <span className="text-display text-lg font-semibold">{orgName}</span>
          </div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {tagline ?? "Equipping every member to know Christ and make Him known."}
          </p>
          <p className="mt-6 text-xs text-subtle-foreground">
            “Your word is a lamp to my feet and a light to my path.” — Psalm 119:105
          </p>
        </div>
        <nav aria-label="Learn" className="text-sm">
          <h2 className="font-semibold">Learn</h2>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li><Link className="hover:text-foreground" href="/courses">All courses</Link></li>
            <li><Link className="hover:text-foreground" href="/search">Search</Link></li>
            <li><Link className="hover:text-foreground" href="/dashboard">My dashboard</Link></li>
          </ul>
        </nav>
        <nav aria-label="Certificates" className="text-sm">
          <h2 className="font-semibold">Certificates</h2>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li><Link className="hover:text-foreground" href="/verify">Verify a certificate</Link></li>
            <li><Link className="hover:text-foreground" href="/certificates">My certificates</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-border">
        <p className="container-page py-4 text-xs text-subtle-foreground">
          © {new Date().getFullYear()} {orgName}. Powered by Lampstand.
        </p>
      </div>
    </footer>
  );
}
