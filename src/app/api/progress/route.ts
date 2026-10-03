import { NextResponse } from "next/server";
import { progressUpdateSchema } from "@/lib/validation/course";
import { parse } from "@/server/action";
import { requireViewer } from "@/server/auth/guards";
import { assertSameOrigin, errorResponse } from "@/server/http";
import { saveMediaProgress } from "@/server/services/progress";

export const runtime = "nodejs";

/**
 * Media progress heartbeat. Accepts JSON from fetch() and from
 * navigator.sendBeacon() (text/plain body) so progress survives tab closes.
 */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const viewer = await requireViewer();
    const body = parse(progressUpdateSchema, JSON.parse(await request.text()));
    const result = await saveMediaProgress(viewer, body);
    return NextResponse.json({
      watchedSeconds: result.watchedSeconds,
      completed: result.completed,
      justCompleted: Boolean(result.events?.lessonCompleted),
      courseCompleted: Boolean(result.events?.courseCompleted),
      certificateId: result.events?.certificate?.id ?? null,
    });
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    return errorResponse(error);
  }
}
