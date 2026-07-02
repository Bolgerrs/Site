import { NextResponse } from "next/server";

import {
  createAdminApiErrorResponse,
  createAdminPayloadRequest,
  requireAuthenticatedAdmin,
  withAdminAuthHeaders,
} from "@/lib/admin-bff/session.ts";
import { getEditableSurfaceRegistry } from "@/lib/admin-bff/surface-registry.ts";

export async function GET(request: Request) {
  const req = await createAdminPayloadRequest(request);

  try {
    requireAuthenticatedAdmin(req);
    const url = new URL(request.url);
    const routePaths = url.searchParams.getAll("routePath");
    const registry = await getEditableSurfaceRegistry(req.payload, {
      routePath: url.searchParams.get("route"),
      routePaths,
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
      default: "Unable to load site surface registry.",
      forbidden: "Forbidden.",
      unauthorized: "Unauthorized.",
    });
  }
}
