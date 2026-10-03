import { getViewer } from "@/server/auth/viewer";
import { env } from "@/server/env";
import { errorResponse } from "@/server/http";
import { getCertificateForViewer } from "@/server/queries/learner";
import { renderCertificatePdf } from "@/server/certificates/pdf";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(_request: Request, ctx: RouteContext<"/certificates/[id]/pdf">) {
  try {
    const viewer = await getViewer();
    if (!viewer) return new Response("Sign in to download this certificate.", { status: 401 });
    const { id } = await ctx.params;
    const cert = await getCertificateForViewer(viewer, id);
    if (!cert) return new Response("Not found", { status: 404 });
    if (cert.revokedAt) return new Response("This certificate has been revoked.", { status: 410 });
    const pdf = await renderCertificatePdf({
      ...cert,
      verifyUrl: `${env.APP_URL.replace(/^https?:\/\//, "")}/verify/${cert.code}`,
    });
    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="certificate-${slugify(cert.courseTitle).slice(0, 60)}-${cert.code}.pdf"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
