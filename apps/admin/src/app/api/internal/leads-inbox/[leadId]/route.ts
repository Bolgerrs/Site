import { NextResponse } from "next/server";

import {
  createAdminApiErrorResponse,
  createAdminPayloadRequest,
  requireAuthenticatedAdmin,
  withAdminAuthHeaders,
} from "@/lib/admin-bff/session.ts";
import { applyLeadInboxUpdate } from "@/lib/payload/leads-inbox.ts";

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{
      leadId: string;
    }>;
  },
) {
  const req = await createAdminPayloadRequest(request);

  try {
    requireAuthenticatedAdmin(req);
    const { leadId } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    await applyLeadInboxUpdate(req.payload, req, leadId, body);

    return withAdminAuthHeaders(
      NextResponse.json(
        {
          id: leadId,
          ok: true,
        },
        {
          headers: {
            "Cache-Control": "no-store",
          },
        },
      ),
      req,
    );
  } catch (error) {
    return createAdminApiErrorResponse(error, req, {
      default: "Unable to update lead workflow.",
      forbidden: "Forbidden.",
      noOp: "No lead changes were submitted.",
      unauthorized: "Unauthorized.",
    });
  }
}
