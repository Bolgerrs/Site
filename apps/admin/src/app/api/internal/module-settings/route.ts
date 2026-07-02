import { NextResponse } from "next/server";

import { createUpdatedStateResponse, parseCommandJson } from "@/lib/admin-bff/commands.ts";
import {
  executeModuleSettingsCommand,
  getModuleSettingsSnapshot,
  type ModuleSettingsCommandInput,
} from "@/lib/admin-bff/module-settings-commands.ts";
import {
  createAdminApiErrorResponse,
  createAdminPayloadRequest,
  withAdminAuthHeaders,
} from "@/lib/admin-bff/session.ts";

export async function GET(request: Request) {
  const req = await createAdminPayloadRequest(request);

  try {
    const url = new URL(request.url);
    const snapshot = await getModuleSettingsSnapshot(req.payload, req, {
      locale: url.searchParams.get("locale"),
      moduleId: url.searchParams.get("moduleId"),
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
      default: "Unable to load module settings.",
      forbidden: "Forbidden.",
      unauthorized: "Unauthorized.",
    });
  }
}

export async function POST(request: Request) {
  const req = await createAdminPayloadRequest(request);

  try {
    const body = await parseCommandJson<ModuleSettingsCommandInput>(request);
    const snapshot = await executeModuleSettingsCommand(req.payload, req, body);

    return createUpdatedStateResponse(req, snapshot);
  } catch (error) {
    return createAdminApiErrorResponse(error, req, {
      default: "Unable to apply module settings command.",
      forbidden: "Forbidden.",
      invalidInput: error instanceof Error ? error.message : "Module settings command input is invalid.",
      unauthorized: "Unauthorized.",
    });
  }
}
