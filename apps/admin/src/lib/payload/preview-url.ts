import type { GeneratePreviewURL, PayloadRequest } from "payload";

import { adminRuntime } from "../runtime.ts";

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeSiteOrigin() {
  return (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://89.150.34.66:8093").replace(/\/+$/, "");
}

function normalizeLocale(doc: Record<string, unknown>, fallback: string) {
  return getText(doc.locale) || getText(doc.primaryLocale) || fallback || "en";
}

function normalizePath(path: string, locale: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const localePrefix = `/${locale}`;

  if (normalizedPath === localePrefix || normalizedPath.startsWith(`${localePrefix}/`)) {
    return normalizedPath;
  }

  if (normalizedPath === "/") {
    return localePrefix;
  }

  return `${localePrefix}${normalizedPath}`;
}

function buildPreviewUrl(path: string, locale: string) {
  const previewUrl = new URL(`${normalizeSiteOrigin()}/api/preview`);
  previewUrl.searchParams.set("path", normalizePath(path, locale));
  previewUrl.searchParams.set("secret", adminRuntime.previewSecret);
  return previewUrl.toString();
}

async function resolveRelatedProductSlug(req: PayloadRequest, relation: unknown) {
  if (relation && typeof relation === "object" && "slug" in relation) {
    return getText((relation as { slug?: unknown }).slug);
  }

  if (typeof relation !== "number" && typeof relation !== "string") {
    return "";
  }

  const product = await req.payload.findByID({
    collection: "products",
    depth: 0,
    id: relation,
    overrideAccess: true,
  });

  return getText((product as { slug?: unknown } | null)?.slug);
}

function normalizePagePreviewPath(doc: Record<string, unknown>) {
  const previewPath = getText(doc.previewPath);
  const routePath = getText(doc.routePath);
  const slug = getText(doc.slug);

  if (previewPath === "/preview/admin-preview" || routePath === "/preview/admin-preview") {
    return "/admin-preview";
  }

  return previewPath || routePath || (slug ? `/${slug}` : "/");
}

export const buildDirectionPreviewUrl: GeneratePreviewURL = (doc, { locale }) => {
  const routeSegment = getText(doc.routeSegment);
  const path = getText(doc.canonicalPath) || getText(doc.routePath) || (routeSegment ? `/${routeSegment}` : "/");

  return buildPreviewUrl(path || "/", normalizeLocale(doc, locale));
};

export const buildProductCategoryPreviewUrl: GeneratePreviewURL = (doc, { locale }) => {
  const routeSegment = getText(doc.routeSegment);
  const path = getText(doc.canonicalPath) || (routeSegment ? `/${routeSegment}` : "/");

  return buildPreviewUrl(path || "/", normalizeLocale(doc, locale));
};

export const buildPagePreviewUrl: GeneratePreviewURL = (doc, { locale }) => {
  return buildPreviewUrl(normalizePagePreviewPath(doc), normalizeLocale(doc, locale));
};

export const buildProductPreviewUrl: GeneratePreviewURL = (doc, { locale }) => {
  const slug = getText(doc.slug);
  const path = getText(doc.canonicalPath) || getText(doc.routePath) || (slug ? `/products/${slug}` : "/");

  return buildPreviewUrl(path || "/", normalizeLocale(doc, locale));
};

export const buildProductInquiryFormPreviewUrl: GeneratePreviewURL = async (doc, { locale, req }) => {
  const productSlug = await resolveRelatedProductSlug(req, doc.product);
  const path = productSlug ? `/request/${productSlug}` : "/request/vision-max-premium";

  return buildPreviewUrl(path, normalizeLocale(doc, locale));
};
