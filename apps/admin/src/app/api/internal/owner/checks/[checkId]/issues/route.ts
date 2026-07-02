import { NextResponse } from "next/server";

import {
  createAdminApiErrorResponse,
  createAdminPayloadRequest,
  requireAuthenticatedAdmin,
  withAdminAuthHeaders,
} from "@/lib/admin-bff/session.ts";
import { getChecksWorkspaceIssues } from "@/lib/payload/checks-workspace.ts";

type Args = {
  params: Promise<{
    checkId: string;
  }>;
};

export async function GET(request: Request, { params }: Args) {
  const req = await createAdminPayloadRequest(request);

  try {
    requireAuthenticatedAdmin(req);
    const { checkId } = await params;
    const issuesState = await getChecksWorkspaceIssues(req.payload, req, {
      check: checkId,
    });

    return withAdminAuthHeaders(
      NextResponse.json(issuesState, {
        headers: {
          "Cache-Control": "no-store",
        },
      }),
      req,
    );
  } catch (error) {
    return createAdminApiErrorResponse(error, req, {
      default: "Unable to load check issues.",
      forbidden: "Forbidden.",
      invalidInput: "Check is unknown.",
      unauthorized: "Unauthorized.",
    });
  }
}
