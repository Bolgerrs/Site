import { NextResponse } from "next/server";

import {
  createAdminApiErrorResponse,
  createAdminPayloadRequest,
  withAdminAuthHeaders,
} from "@/lib/admin-bff/session.ts";
import { createUpdatedStateResponse, parseCommandJson } from "@/lib/admin-bff/commands.ts";
import {
  executeOwnerProductCommand,
  getOwnerProductCommandState,
  type OwnerProductCommandInput,
} from "@/lib/admin-bff/product-commands.ts";

export async function GET(request: Request) {
  const req = await createAdminPayloadRequest(request);

  try {
    const url = new URL(request.url);
    const state = await getOwnerProductCommandState(req.payload, req, {
      selectedProductId: url.searchParams.get("selectedProductId"),
    });

    return withAdminAuthHeaders(
      NextResponse.json(state, {
        headers: {
          "Cache-Control": "no-store",
        },
      }),
      req,
    );
  } catch (error) {
    return createAdminApiErrorResponse(error, req, {
      default: "Unable to load owner product commands.",
      forbidden: "Forbidden.",
      unauthorized: "Unauthorized.",
    });
  }
}

export async function POST(request: Request) {
  const req = await createAdminPayloadRequest(request);

  try {
    const body = await parseCommandJson<OwnerProductCommandInput>(request);
    const result = await executeOwnerProductCommand(req.payload, req, body);
    return createUpdatedStateResponse(req, result);
  } catch (error) {
    return createAdminApiErrorResponse(error, req, {
      default: "Unable to apply owner product command.",
      forbidden: "Forbidden.",
      invalidInput: "Command input is invalid.",
      noOp: "Command did not change anything.",
      unauthorized: "Unauthorized.",
    });
  }
}
