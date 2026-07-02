import { NextResponse } from "next/server";

import {
  createAdminApiErrorResponse,
  createAdminPayloadRequest,
  requireAuthenticatedAdmin,
  withAdminAuthHeaders,
} from "@/lib/admin-bff/session.ts";
import {
  applyMediaWorkspaceUpdate,
  getMediaWorkspaceSnapshot,
} from "@/lib/payload/media-workspace.ts";

export async function GET(request: Request) {
  const req = await createAdminPayloadRequest(request);

  try {
    requireAuthenticatedAdmin(req);
    const url = new URL(request.url);
    const snapshot = await getMediaWorkspaceSnapshot(req.payload, req, {
      approvalStatus: url.searchParams.get("approvalStatus"),
      assetType: url.searchParams.get("assetType"),
      context: url.searchParams.get("context"),
      filter: url.searchParams.get("filter"),
      library: url.searchParams.get("library"),
      locale: url.searchParams.get("locale"),
      pageId: url.searchParams.get("pageId"),
      q: url.searchParams.get("q"),
      referenceOnly: url.searchParams.get("referenceOnly"),
      rightsStatus: url.searchParams.get("rightsStatus"),
      selected: url.searchParams.get("selected"),
      sourceCategory: url.searchParams.get("sourceCategory"),
      usage: url.searchParams.get("usage"),
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
      default: "Не удалось загрузить медиатеку.",
      forbidden: "Недостаточно прав.",
      unauthorized: "Нужно войти в админку.",
    });
  }
}

export async function PATCH(request: Request) {
  const req = await createAdminPayloadRequest(request);

  try {
    requireAuthenticatedAdmin(req);
    const body = (await request.json()) as Record<string, unknown>;
    await applyMediaWorkspaceUpdate(req.payload, req, body);

    return withAdminAuthHeaders(
      NextResponse.json(
        { ok: true },
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
      default: "Не удалось обновить медиа.",
      forbidden: "Недостаточно прав.",
      invalidInput: "Проверьте поля медиа.",
      noOp: "Нет изменений для сохранения.",
      unauthorized: "Нужно войти в админку.",
    });
  }
}
