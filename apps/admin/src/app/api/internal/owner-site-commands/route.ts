import { NextResponse } from "next/server";

import {
  createAdminApiErrorResponse,
  createAdminPayloadRequest,
  withAdminAuthHeaders,
} from "@/lib/admin-bff/session.ts";
import { createUpdatedStateResponse, parseCommandJson } from "@/lib/admin-bff/commands.ts";
import {
  executeOwnerSiteCommand,
  getOwnerSitePageTree,
  type OwnerSiteCommandInput,
} from "@/lib/admin-bff/page-commands.ts";

export async function GET(request: Request) {
  const req = await createAdminPayloadRequest(request);

  try {
    const url = new URL(request.url);
    const tree = await getOwnerSitePageTree(req.payload, req, {
      selected: url.searchParams.get("selected"),
    });

    return withAdminAuthHeaders(
      NextResponse.json(tree, {
        headers: {
          "Cache-Control": "no-store",
        },
      }),
      req,
    );
  } catch (error) {
    return createAdminApiErrorResponse(error, req, {
      default: "Unable to load owner page tree.",
      forbidden: "Forbidden.",
      unauthorized: "Unauthorized.",
    });
  }
}

export async function POST(request: Request) {
  const req = await createAdminPayloadRequest(request);

  try {
    const body = await parseCommandJson<OwnerSiteCommandInput>(request);
    const result = await executeOwnerSiteCommand(req.payload, req, body);
    return createUpdatedStateResponse(req, result);
  } catch (error) {
    return createAdminApiErrorResponse(error, req, {
      default: "Unable to apply owner site command.",
      forbidden: "Forbidden.",
      invalidInput: "Command input is invalid.",
      noOp: "Command did not change anything.",
      unauthorized: "Unauthorized.",
    });
  }
}
