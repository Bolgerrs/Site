import { draftMode } from "next/headers";
import { NextResponse } from "next/server";

import { defaultSiteLocale, isSiteLocale } from "@/config/i18n";
import { isValidPreviewSecret, normalizePreviewPath } from "@/lib/editor-preview";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret")?.trim() ?? "";
  const localeParam = url.searchParams.get("locale")?.trim() ?? "";
  const locale = isSiteLocale(localeParam) ? localeParam : defaultSiteLocale;
  const path = url.searchParams.get("path")?.trim() ?? "/";

  if (!isValidPreviewSecret(secret)) {
    return NextResponse.json({ error: "Unauthorized preview request." }, { status: 401 });
  }

  const previewState = await draftMode();
  previewState.enable();

  return NextResponse.redirect(new URL(normalizePreviewPath(path, locale), url));
}
