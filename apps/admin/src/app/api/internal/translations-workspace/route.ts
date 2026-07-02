import { NextResponse } from "next/server";

import {
  createAdminApiErrorResponse,
  createAdminPayloadRequest,
  requireAuthenticatedAdmin,
  withAdminAuthHeaders,
} from "@/lib/admin-bff/session.ts";
import {
  createTranslationWorkspaceRecord,
  getTranslationsWorkspaceSnapshot,
} from "@/lib/payload/translations-workspace.ts";

export async function GET(request: Request) {
  const req = await createAdminPayloadRequest(request);

  try {
    requireAuthenticatedAdmin(req);
    const url = new URL(request.url);
    const snapshot = await getTranslationsWorkspaceSnapshot(req.payload, req, {
      filter: url.searchParams.get("filter"),
      locale: url.searchParams.get("locale"),
      ownerCollection: url.searchParams.get("ownerCollection"),
      ownerKey: url.searchParams.get("ownerKey"),
      q: url.searchParams.get("q"),
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
      default: "Unable to load translations workspace.",
      forbidden: "Forbidden.",
      unauthorized: "Unauthorized.",
    });
  }
}

export async function POST(request: Request) {
  const req = await createAdminPayloadRequest(request);

  try {
    requireAuthenticatedAdmin(req);
    const body = (await request.json()) as Record<string, unknown>;
    const record = await createTranslationWorkspaceRecord(req.payload, req, body);

    return withAdminAuthHeaders(
      NextResponse.json(
        { id: record.id, ok: true },
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
      default: "Unable to create translation record.",
      forbidden: "Forbidden.",
      invalidInput: "Invalid translation creation payload.",
      unauthorized: "Unauthorized.",
    });
  }
}
