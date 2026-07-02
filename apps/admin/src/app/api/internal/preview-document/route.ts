import config from "@payload-config";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

import { getPreviewDocument, type PreviewDocumentType } from "@/lib/payload/preview-documents";
import { adminRuntime } from "@/lib/runtime";

function getText(value: string | null) {
  return value?.trim() ?? "";
}

function getType(request: Request): PreviewDocumentType | null {
  const rawType = getText(new URL(request.url).searchParams.get("type"));

  if (rawType === "direction" || rawType === "form" || rawType === "page" || rawType === "product") {
    return rawType;
  }

  return null;
}

function isAuthorized(request: Request) {
  const token = request.headers.get("x-montelar-internal-token")?.trim();
  return Boolean(token) && token === adminRuntime.previewSecret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const type = getType(request);

  if (!type) {
    return NextResponse.json({ error: "Valid type is required." }, { status: 400 });
  }

  const searchParams = new URL(request.url).searchParams;
  const payload = await getPayload({ config, cron: true });
  const productSlug = getText(searchParams.get("productSlug"));
  const routePath = getText(searchParams.get("routePath"));
  const slug = getText(searchParams.get("slug"));
  const document = await getPreviewDocument(payload, {
    locale: getText(searchParams.get("locale")) || "en",
    ...(productSlug ? { productSlug } : {}),
    ...(routePath ? { routePath } : {}),
    ...(slug ? { slug } : {}),
    type,
  });

  if (!document) {
    return NextResponse.json({ error: "Preview document not found." }, { status: 404 });
  }

  return NextResponse.json(document, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
