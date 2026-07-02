import { NextResponse } from "next/server";

import {
  createAdminApiErrorResponse,
  createAdminPayloadRequest,
  requireAuthenticatedAdmin,
  withAdminAuthHeaders,
} from "@/lib/admin-bff/session.ts";
import { getLeadsInboxSnapshot } from "@/lib/payload/leads-inbox.ts";

export async function GET(request: Request) {
  const req = await createAdminPayloadRequest(request);

  try {
    requireAuthenticatedAdmin(req);
    const filter = new URL(request.url).searchParams.get("filter");
    const snapshot = await getLeadsInboxSnapshot(req.payload, req, filter);
    return withAdminAuthHeaders(
      NextResponse.json(snapshot, {
        headers: {
          "Cache-Control": "no-store",
        },
      }),
      req,
    );
  } catch (error) {
    return createAdminApiErrorResponse(error, req, {
      default: "Unable to load leads inbox.",
      forbidden: "Forbidden.",
      unauthorized: "Unauthorized.",
    });
  }
}
