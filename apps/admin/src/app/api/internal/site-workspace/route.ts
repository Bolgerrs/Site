import { NextResponse } from "next/server";

import {
  createAdminApiErrorResponse,
  createAdminPayloadRequest,
  requireAuthenticatedAdmin,
  withAdminAuthHeaders,
} from "@/lib/admin-bff/session.ts";
import { getSiteWorkspaceSnapshot } from "@/lib/payload/site-workspace.ts";

export async function GET(request: Request) {
  const req = await createAdminPayloadRequest(request);

  try {
    requireAuthenticatedAdmin(req);
    const url = new URL(request.url);
    const snapshot = await getSiteWorkspaceSnapshot(req.payload, req, {
      selected: url.searchParams.get("selected"),
    });

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
      default: "Unable to load site workspace.",
      forbidden: "Forbidden.",
      unauthorized: "Unauthorized.",
    });
  }
}
