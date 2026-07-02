import { draftMode } from "next/headers";

import { defaultSiteLocale, getPathLocale, withLocale } from "@/config/i18n";

function getText(value: string | null) {
  return value?.trim() ?? "";
}

export function getPreviewSecret() {
  return process.env.MONTELAR_PREVIEW_SECRET?.trim() ?? "";
}

export function isValidPreviewSecret(secret: string) {
  const expectedSecret = getPreviewSecret();

  return Boolean(secret) && Boolean(expectedSecret) && secret === expectedSecret;
}

export function normalizePreviewPath(path: string, locale = defaultSiteLocale) {
  const trimmedPath = getText(path);
  const normalizedPath = trimmedPath.startsWith("/") ? trimmedPath : `/${trimmedPath}`;
  const safePath =
    normalizedPath === "/api/preview" || normalizedPath === "/api/preview/exit"
      ? "/"
      : normalizedPath || "/";

  return getPathLocale(safePath) ? safePath : withLocale(safePath, locale);
}

export async function isDraftPreviewEnabled() {
  const previewState = await draftMode();
  return previewState.isEnabled;
}
