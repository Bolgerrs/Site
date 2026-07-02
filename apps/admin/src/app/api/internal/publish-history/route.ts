import { NextResponse } from "next/server";

import { createUpdatedStateResponse, parseCommandJson } from "@/lib/admin-bff/commands.ts";
import {
  executePublishHistoryCommand,
  getPublishHistorySnapshot,
  type PublishHistoryCommandInput,
} from "@/lib/admin-bff/publish-history.ts";
import {
  createAdminApiErrorResponse,
  createAdminPayloadRequest,
  withAdminAuthHeaders,
} from "@/lib/admin-bff/session.ts";

export async function GET(request: Request) {
  const req = await createAdminPayloadRequest(request);

  try {
    const url = new URL(request.url);
    const snapshot = await getPublishHistorySnapshot(req.payload, req, {
      targetId: url.searchParams.get("targetId"),
      targetType: url.searchParams.get("targetType"),
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
      default: "Unable to load publish history.",
      forbidden: "Forbidden.",
      invalidInput: "Publish history request is invalid.",
      unauthorized: "Unauthorized.",
    });
  }
}

export async function POST(request: Request) {
  const req = await createAdminPayloadRequest(request);

  try {
    const body = await parseCommandJson<PublishHistoryCommandInput>(request);
    const snapshot = await executePublishHistoryCommand(req.payload, req, body);

    return createUpdatedStateResponse(req, snapshot);
  } catch (error) {
    return createAdminApiErrorResponse(error, req, {
      default: "Unable to apply publish history command.",
      forbidden: "Forbidden.",
      invalidInput: "Publish history command input is invalid.",
      noOp: "Publish history command did not change anything.",
      unauthorized: "Unauthorized.",
    });
  }
}
