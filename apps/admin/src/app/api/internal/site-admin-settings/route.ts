import { NextResponse } from "next/server";

import { createUpdatedStateResponse, parseCommandJson } from "@/lib/admin-bff/commands.ts";
import {
  createAdminApiErrorResponse,
  createAdminPayloadRequest,
  withAdminAuthHeaders,
} from "@/lib/admin-bff/session.ts";
import {
  executeSiteAdminSettingsCommand,
  getSiteAdminSettingsSnapshot,
  type SiteAdminSettingsCommandInput,
} from "@/lib/admin-bff/site-admin-settings.ts";

export async function GET(request: Request) {
  const req = await createAdminPayloadRequest(request);

  try {
    const url = new URL(request.url);
    const snapshot = await getSiteAdminSettingsSnapshot(req.payload, req, {
      section: url.searchParams.get("section"),
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
      default: "Unable to load site-admin settings.",
      forbidden: "Forbidden.",
      unauthorized: "Unauthorized.",
    });
  }
}

export async function POST(request: Request) {
  const req = await createAdminPayloadRequest(request);

  try {
    const body = await parseCommandJson<SiteAdminSettingsCommandInput>(request);
    const snapshot = await executeSiteAdminSettingsCommand(req.payload, req, body);

    return createUpdatedStateResponse(req, snapshot);
  } catch (error) {
    return createAdminApiErrorResponse(error, req, {
      default: "Unable to apply site-admin settings command.",
      forbidden: "Forbidden.",
      invalidInput: "Site-admin settings command input is invalid.",
      noOp: "Site-admin settings command did not change anything.",
      unauthorized: "Unauthorized.",
    });
  }
}
