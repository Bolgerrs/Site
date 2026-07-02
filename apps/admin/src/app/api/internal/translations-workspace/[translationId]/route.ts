import { NextResponse } from "next/server";

import {
  createAdminApiErrorResponse,
  createAdminPayloadRequest,
  requireAuthenticatedAdmin,
  withAdminAuthHeaders,
} from "@/lib/admin-bff/session.ts";
import { applyTranslationWorkspaceUpdate } from "@/lib/payload/translations-workspace.ts";

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{
      translationId: string;
    }>;
  },
) {
  const req = await createAdminPayloadRequest(request);

  try {
    requireAuthenticatedAdmin(req);
    const { translationId } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    await applyTranslationWorkspaceUpdate(req.payload, req, translationId, body);

    return withAdminAuthHeaders(
      NextResponse.json(
        { id: translationId, ok: true },
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
      default: "Unable to update translation workflow.",
      forbidden: "Forbidden.",
      noOp: "No translation workflow changes were submitted.",
      unauthorized: "Unauthorized.",
    });
  }
}
