import { NextResponse } from "next/server";

import {
  createAdminApiErrorResponse,
  createAdminPayloadRequest,
  requireAuthenticatedAdmin,
  withAdminAuthHeaders,
} from "@/lib/admin-bff/session.ts";
import {
  getOwnerSiteBlockSnapshot,
  updateOwnerSiteBlock,
} from "@/lib/payload/owner-site-block.ts";

type Args = {
  params: Promise<{
    blockId: string;
  }>;
};

export async function GET(request: Request, { params }: Args) {
  const req = await createAdminPayloadRequest(request);

  try {
    requireAuthenticatedAdmin(req);
    const { blockId } = await params;
    const url = new URL(request.url);
    const pageId = url.searchParams.get("pageId") ?? undefined;
    const snapshot = await getOwnerSiteBlockSnapshot(
      req.payload,
      req,
      pageId ? { id: blockId, pageId } : { id: blockId },
    );

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
      default: "Unable to load block editor.",
      forbidden: "Forbidden.",
      unauthorized: "Unauthorized.",
    });
  }
}

export async function PATCH(request: Request, { params }: Args) {
  const req = await createAdminPayloadRequest(request);

  try {
    requireAuthenticatedAdmin(req);
    const { blockId } = await params;
    const input = (await request.json()) as Parameters<typeof updateOwnerSiteBlock>[2];
    const snapshot = await updateOwnerSiteBlock(
      req.payload,
      req,
      input.pageId || typeof input.visibleOnPage === "boolean"
        ? {
            fields: input.fields,
            id: blockId,
            ...(input.pageId ? { pageId: input.pageId } : {}),
            ...(typeof input.visibleOnPage === "boolean" ? { visibleOnPage: input.visibleOnPage } : {}),
          }
        : {
            fields: input.fields,
            id: blockId,
        },
    );

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
      default: "Unable to update block editor.",
      forbidden: "Forbidden.",
      unauthorized: "Unauthorized.",
    });
  }
}
