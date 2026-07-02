import {
  createAdminPayloadRequest,
  createCommandErrorResponse,
  createUpdatedStateResponse,
  requireAuthenticatedAdmin,
} from "@/lib/admin-bff/index.ts";
import { getAdminDashboardBffSnapshot } from "@/lib/admin-bff/dashboard.ts";
import { operationalAdminRoles } from "@/lib/payload/roles.ts";

export async function GET(request: Request) {
  const req = await createAdminPayloadRequest(request);

  try {
    const user = requireAuthenticatedAdmin(req, operationalAdminRoles);
    const routePath = new URL(request.url).searchParams.get("path") || "/admin";
    const snapshot = await getAdminDashboardBffSnapshot(req.payload, {
      role: user.role,
      routePath,
      userId: user.id ?? null,
    });

    return createUpdatedStateResponse(req, snapshot);
  } catch (error) {
    return createCommandErrorResponse(error, req, {
      default: "Unable to load admin dashboard.",
      forbidden: "Forbidden.",
      unauthorized: "Unauthorized.",
    });
  }
}
