import { NextResponse } from "next/server";

import { createSessionWorkbenchState } from "@/lib/admin-bff/workbench.ts";
import {
  createAdminApiErrorResponse,
  createAdminPayloadRequest,
  requireAuthenticatedAdmin,
  withAdminAuthHeaders,
} from "@/lib/admin-bff/session.ts";
import { getAdminLayerFromPath } from "@/lib/admin-bff/raw-layer.ts";
import { hasAdminRole, type AdminRole } from "@/lib/payload/roles.ts";

const siteAdminRoles = ["owner", "admin", "developer"] as const satisfies readonly AdminRole[];
const advancedRoles = ["owner", "developer"] as const satisfies readonly AdminRole[];

export async function GET(request: Request) {
  const req = await createAdminPayloadRequest(request);

  try {
    const user = requireAuthenticatedAdmin(req);
    const routePath = new URL(request.url).searchParams.get("path") || "/admin";

    return withAdminAuthHeaders(
      NextResponse.json(
        {
          authenticated: true,
          boundaries: {
            currentLayer: getAdminLayerFromPath(routePath),
            owner: true,
            siteAdmin: hasAdminRole(user, siteAdminRoles),
            advanced: hasAdminRole(user, advancedRoles),
          },
          user: {
            id: user.id ?? null,
            role: user.role,
          },
          workbench: createSessionWorkbenchState({
            routePath,
            role: user.role,
            userId: user.id ?? null,
          }),
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
      default: "Unable to load owner session.",
      forbidden: "Forbidden.",
      unauthorized: "Unauthorized.",
    });
  }
}
