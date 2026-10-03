import { NextResponse } from "next/server";
import { getViewer } from "@/server/auth/viewer";
import { db } from "@/server/db";

export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [items, unread] = await Promise.all([
    db.notification.findMany({
      where: { userId: viewer.id },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { id: true, type: true, title: true, body: true, href: true, readAt: true, createdAt: true },
    }),
    db.notification.count({ where: { userId: viewer.id, readAt: null } }),
  ]);
  return NextResponse.json({ items, unread }, { headers: { "Cache-Control": "private, no-store" } });
}
