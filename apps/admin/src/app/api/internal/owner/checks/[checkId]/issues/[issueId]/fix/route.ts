import { NextResponse } from "next/server";

import {
  createAdminApiErrorResponse,
  createAdminPayloadRequest,
  withAdminAuthHeaders,
} from "@/lib/admin-bff/session.ts";
import { parseCommandJson, requireCommandRole } from "@/lib/admin-bff/commands.ts";
import { checksWorkspaceRepairCommandRoles, executeChecksRepairAction } from "@/lib/payload/checks-workspace.ts";

type Args = {
  params: Promise<{
    checkId: string;
    issueId: string;
  }>;
};

export async function POST(request: Request, { params }: Args) {
  const req = await createAdminPayloadRequest(request);

  try {
    requireCommandRole(req, checksWorkspaceRepairCommandRoles);
    const { checkId, issueId } = await params;
    const body = await parseCommandJson<{ actionId?: string | null }>(request);
    const result = await executeChecksRepairAction(req.payload, req, {
      checkId,
      issueId,
      ...(body.actionId === undefined ? {} : { actionId: body.actionId }),
    });

    return withAdminAuthHeaders(
      NextResponse.json(result, {
        headers: {
          "Cache-Control": "no-store",
        },
      }),
      req,
    );
  } catch (error) {
    return createAdminApiErrorResponse(error, req, {
      default: "Unable to start repair action.",
      forbidden: "Forbidden.",
      invalidInput: "Repair action is unknown.",
      noOp: "Issue has no repair action.",
      unauthorized: "Unauthorized.",
    });
  }
}
