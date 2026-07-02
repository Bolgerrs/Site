import type { MetadataRoute } from "next";
import { siteLocales, withLocale } from "@/config/i18n";
import { buildAbsoluteUrl, montelarMetadataBase } from "@/lib/seo/metadata";

function uniquePaths(paths: string[]) {
  return Array.from(new Set(paths));
}

function localeScopedPath(path: string) {
  return uniquePaths([
    path,
    ...siteLocales.map((locale) => withLocale(path, locale)),
  ]);
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: uniquePaths([
        ...localeScopedPath("/admin-preview"),
        ...localeScopedPath("/category-product-film-prototype"),
        ...localeScopedPath("/motion-catalog-prototype"),
        ...localeScopedPath("/home-product-film-prototype"),
        ...localeScopedPath("/product-scene-prototype"),
        ...localeScopedPath("/product-motion-prototype"),
        ...localeScopedPath("/request/"),
      ]),
    },
    sitemap: buildAbsoluteUrl("/sitemap.xml"),
    host: montelarMetadataBase.host,
  };
}
