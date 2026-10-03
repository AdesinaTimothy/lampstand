import { NextResponse } from "next/server";
import { getCurrentOrganization } from "@/server/organization";
import { getSuggestions } from "@/server/queries/search";
import { rateLimit } from "@/server/rate-limit";
import { getRequestMeta } from "@/server/request";
import { errorResponse } from "@/server/http";

export async function GET(request: Request) {
  try {
    const { ipAddress } = await getRequestMeta();
    const limit = await rateLimit(`suggest:${ipAddress ?? "unknown"}`, 120, 60);
    if (!limit.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    const q = new URL(request.url).searchParams.get("q") ?? "";
    const org = await getCurrentOrganization();
    const data = await getSuggestions(org.id, q);
    return NextResponse.json(data, { headers: { "Cache-Control": "private, max-age=30" } });
  } catch (error) {
    return errorResponse(error);
  }
}
