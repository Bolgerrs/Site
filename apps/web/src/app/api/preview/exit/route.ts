import { draftMode } from "next/headers";
import { NextResponse } from "next/server";

import { defaultSiteLocale, isSiteLocale } from "@/config/i18n";
import { normalizePreviewPath } from "@/lib/editor-preview";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const localeParam = url.searchParams.get("locale")?.trim() ?? "";
  const locale = isSiteLocale(localeParam) ? localeParam : defaultSiteLocale;
  const path = url.searchParams.get("path")?.trim() ?? "/";
  const previewState = await draftMode();
  previewState.disable();

  return NextResponse.redirect(new URL(normalizePreviewPath(path, locale), url));
}
