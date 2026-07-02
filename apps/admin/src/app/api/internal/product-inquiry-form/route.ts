import config from "@payload-config";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

import { getInternalProductInquiryForm } from "@/lib/payload/public-cms";
import { adminRuntime } from "@/lib/runtime";

function getLocale(request: Request) {
  const locale = new URL(request.url).searchParams.get("locale")?.trim();
  return locale || "en";
}

function getProductSlug(request: Request) {
  return new URL(request.url).searchParams.get("productSlug")?.trim() ?? "";
}

function isAuthorized(request: Request) {
  const token = request.headers.get("x-montelar-internal-token")?.trim();
  return Boolean(token) && token === adminRuntime.previewSecret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const productSlug = getProductSlug(request);

  if (!productSlug) {
    return NextResponse.json({ error: "productSlug is required." }, { status: 400 });
  }

  const payload = await getPayload({ config, cron: true });
  const locale = getLocale(request);
  const form = await getInternalProductInquiryForm(payload, locale, productSlug);

  if (!form) {
    return NextResponse.json({ error: "Form not found." }, { status: 404 });
  }

  return NextResponse.json(form, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
