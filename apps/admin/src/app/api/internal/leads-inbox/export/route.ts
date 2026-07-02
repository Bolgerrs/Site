import { NextResponse } from "next/server";

import {
  createAdminApiErrorResponse,
  createAdminPayloadRequest,
  requireAuthenticatedAdmin,
  withAdminAuthHeaders,
} from "@/lib/admin-bff/session.ts";
import { exportLeadsInboxCsv } from "@/lib/payload/leads-inbox.ts";

export async function GET(request: Request) {
  const req = await createAdminPayloadRequest(request);

  try {
    requireAuthenticatedAdmin(req);
    const url = new URL(request.url);
    const exported = await exportLeadsInboxCsv(req.payload, req, url.searchParams.get("filter"));

    return withAdminAuthHeaders(
      new NextResponse(exported.csv, {
        headers: {
          "Cache-Control": "no-store",
          "Content-Disposition": `attachment; filename="montelar-leads-${exported.activeFilter}.csv"`,
          "Content-Type": "text/csv; charset=utf-8",
        },
        status: 200,
      }),
      req,
    );
  } catch (error) {
    return createAdminApiErrorResponse(error, req, {
      default: "Unable to export leads.",
      forbidden: "Forbidden.",
      unauthorized: "Unauthorized.",
    });
  }
}
