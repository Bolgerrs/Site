import { NextResponse } from "next/server";

import {
  createAdminApiErrorResponse,
  createAdminPayloadRequest,
  requireAuthenticatedAdmin,
  withAdminAuthHeaders,
} from "@/lib/admin-bff/session.ts";
import { getSiteModuleRegistry } from "@/lib/admin-bff/site-module-registry.ts";

export async function GET(request: Request) {
  const req = await createAdminPayloadRequest(request);

  try {
    requireAuthenticatedAdmin(req);
    const url = new URL(request.url);
    const registry = await getSiteModuleRegistry(req.payload, {
      moduleId: url.searchParams.get("module"),
      routePath: url.searchParams.get("route"),
    });

    return withAdminAuthHeaders(
      NextResponse.json(registry, {
        headers: {
          "Cache-Control": "no-store",
        },
      }),
      req,
    );
  } catch (error) {
    return createAdminApiErrorResponse(error, req, {
      default: "Unable to load site module registry.",
      forbidden: "Forbidden.",
      unauthorized: "Unauthorized.",
    });
  }
}
