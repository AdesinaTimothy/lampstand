import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/brand/logo";
import { getCurrentOrganization } from "@/server/organization";

export const metadata: Metadata = { robots: { index: false } };

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const org = await getCurrentOrganization();
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_minmax(0,0.9fr)]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <Link href="/" className="w-fit rounded-md">
          <Logo orgName={org.name} />
        </Link>
        <main id="main" className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[400px] animate-fade-up">{children}</div>
        </main>
        <p className="text-center text-xs text-subtle-foreground">
          © {new Date().getFullYear()} {org.name}
        </p>
      </div>
      <aside className="relative hidden overflow-hidden bg-primary lg:block" aria-hidden>
        <svg className="absolute inset-0 size-full" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice">
          <circle cx="470" cy="160" r="90" fill="var(--accent-soft)" opacity="0.9" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <circle key={i} cx="470" cy="160" r={140 + i * 70} fill="none" stroke="#fff" strokeOpacity={0.09 - i * 0.012} strokeWidth="1.5" />
          ))}
          <path d="M0 640 Q 260 540 600 610 L600 800 L0 800Z" fill="#000" opacity="0.12" />
          <path d="M0 700 Q 300 620 600 690 L600 800 L0 800Z" fill="#000" opacity="0.1" />
        </svg>
        <div className="absolute inset-x-0 bottom-0 p-12 text-primary-foreground">
          <blockquote className="text-display max-w-md text-[1.75rem] leading-snug">
            “Your word is a lamp to my feet and a light to my path.”
          </blockquote>
          <p className="mt-4 text-sm opacity-75">Psalm 119:105</p>
        </div>
      </aside>
    </div>
  );
}
