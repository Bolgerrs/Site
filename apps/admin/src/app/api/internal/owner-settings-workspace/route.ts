import { NextResponse } from "next/server";

import {
  createAdminApiErrorResponse,
  createAdminPayloadRequest,
  requireAuthenticatedAdmin,
  withAdminAuthHeaders,
} from "@/lib/admin-bff/session.ts";
import {
  getOwnerSettingsWorkspaceSnapshot,
  updateOwnerSettingsWorkspace,
} from "@/lib/payload/owner-settings-workspace.ts";

export async function GET(request: Request) {
  const req = await createAdminPayloadRequest(request);

  try {
    requireAuthenticatedAdmin(req);
    const url = new URL(request.url);
    const snapshot = await getOwnerSettingsWorkspaceSnapshot(req.payload, req, {
      locale: url.searchParams.get("locale"),
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
      default: "Unable to load owner settings workspace.",
      forbidden: "Forbidden.",
      unauthorized: "Unauthorized.",
    });
  }
}

export async function POST(request: Request) {
  const req = await createAdminPayloadRequest(request);

  try {
    requireAuthenticatedAdmin(req);
    const input = (await request.json()) as Parameters<typeof updateOwnerSettingsWorkspace>[2];
    const snapshot = await updateOwnerSettingsWorkspace(req.payload, req, input);

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
      default: "Unable to update owner settings workspace.",
      forbidden: "Forbidden.",
      unauthorized: "Unauthorized.",
    });
  }
}
