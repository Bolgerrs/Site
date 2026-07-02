import { NextResponse } from "next/server";

import {
  createAdminApiErrorResponse,
  createAdminPayloadRequest,
  requireAuthenticatedAdmin,
  withAdminAuthHeaders,
} from "@/lib/admin-bff/session.ts";
import { getChecksWorkspaceSnapshot } from "@/lib/payload/checks-workspace.ts";

export async function GET(request: Request) {
  const req = await createAdminPayloadRequest(request);

  try {
    requireAuthenticatedAdmin(req);
    const url = new URL(request.url);
    const snapshot = await getChecksWorkspaceSnapshot(req.payload, req, {
      check: url.searchParams.get("check"),
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
      default: "Unable to load checks workspace.",
      forbidden: "Forbidden.",
      unauthorized: "Unauthorized.",
    });
  }
}
