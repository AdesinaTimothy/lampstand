import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false } };

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-background">{children}</div>;
}
