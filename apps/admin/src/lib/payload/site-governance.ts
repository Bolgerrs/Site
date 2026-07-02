import type { Payload } from "payload";

import { normalizeCanonicalPath } from "./catalog.ts";

export const seoOwnerTypeOptions = [
  "page",
  "product-direction",
  "product-category",
  "product-line",
  "product",
  "system-route",
] as const;

export type SeoOwnerType = (typeof seoOwnerTypeOptions)[number];

export const navigationMenuKeyOptions = [
  "primary-header",
  "products-mega",
  "footer-primary",
  "footer-legal",
  "contact-surfaces",
] as const;

export type NavigationMenuKey = (typeof navigationMenuKeyOptions)[number];

export const navigationPlacementOptions = [
  "header",
  "products",
  "footer",
  "contact",
  "system",
] as const;

export const navigationItemSourceTypeOptions = [
  "page",
  "product-direction",
  "product-category",
  "product-line",
  "product",
  "custom-url",
] as const;

export type NavigationItemSourceType = (typeof navigationItemSourceTypeOptions)[number];

export const siteSettingsScopeOptions = ["public-site"] as const;

export type SiteSettingsScope = (typeof siteSettingsScopeOptions)[number];

export const seoCanonicalModeOptions = [
  "self",
  "owner-default",
  "custom",
  "none",
] as const;

export const seoIndexingModeOptions = [
  "index,follow",
  "noindex,follow",
  "noindex,nofollow",
] as const;

export const seoPublicationReadinessOptions = [
  "blocked",
  "preview-only",
  "production-ready",
] as const;

export const seoQualityFlagOptions = [
  "missing-og-image",
  "duplicate-title-risk",
  "weak-description",
  "canonical-review-needed",
  "hreflang-gap",
  "sitemap-gap",
] as const;

export const seoSocialCardStyleOptions = [
  "summary_large_image",
  "summary",
  "minimal",
  "auto",
] as const;

const ownerCollectionMap = {
  page: "pages",
  "product-direction": "product-directions",
  "product-category": "product-categories",
  "product-line": "product-lines",
  product: "products",
} as const satisfies Partial<Record<SeoOwnerType | NavigationItemSourceType, string>>;

export function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function getSourceId(value: unknown) {
  if (typeof value === "number" || typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;

    if (typeof id === "number" || typeof id === "string") {
      return id;
    }
  }

  return null;
}

export function isOwnerRecordSourceType(
  value: SeoOwnerType | NavigationItemSourceType,
): value is Exclude<SeoOwnerType | NavigationItemSourceType, "system-route" | "custom-url"> {
  return value in ownerCollectionMap;
}

export function createOwnerKey(ownerType: SeoOwnerType, token: string | number) {
  return `${ownerType}:${String(token)}`;
}

export async function fetchSourceDocument(
  payload: Payload,
  sourceType: Exclude<SeoOwnerType | NavigationItemSourceType, "system-route" | "custom-url">,
  id: string | number,
) {
  return (await payload.findByID({
    collection: ownerCollectionMap[sourceType],
    depth: 0,
    id,
    overrideAccess: true,
  })) as unknown as Record<string, unknown> | null;
}

export function getSourceLabel(
  sourceType: Exclude<SeoOwnerType | NavigationItemSourceType, "system-route" | "custom-url">,
  sourceDocument: Record<string, unknown> | null,
) {
  if (!sourceDocument) {
    return "";
  }

  if (sourceType === "page") {
    return getText(sourceDocument.navigationLabel) || getText(sourceDocument.title);
  }

  return getText(sourceDocument.navigationLabel) || getText(sourceDocument.publicLabel) || getText(sourceDocument.name);
}

export function getSourcePath(
  sourceType: Exclude<SeoOwnerType | NavigationItemSourceType, "system-route" | "custom-url">,
  sourceDocument: Record<string, unknown> | null,
) {
  if (!sourceDocument) {
    return "";
  }

  if (sourceType === "page") {
    return normalizeCanonicalPath(sourceDocument.routePath, getText(sourceDocument.canonicalPath) || "/");
  }

  if (sourceType === "product") {
    return normalizeCanonicalPath(
      sourceDocument.canonicalPath,
      `/products/${getText(sourceDocument.slug) || "product"}`,
    );
  }

  return normalizeCanonicalPath(
    sourceDocument.canonicalPath,
    `/${getText(sourceDocument.routeSegment) || getText(sourceDocument.slug) || "route"}`,
  );
}

export function getSourceStatus(sourceDocument: Record<string, unknown> | null) {
  return getText(sourceDocument?.status);
}

export function normalizePublicPath(value: unknown, fallbackPath = "/") {
  return normalizeCanonicalPath(value, fallbackPath);
}
