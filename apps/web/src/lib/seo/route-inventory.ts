import type { MetadataRoute } from "next";
import { audioCategoryRoutes, lineRoutes } from "@/config/site-routes";
import { defaultSiteLocale } from "@/config/i18n";
import { getCmsClient } from "@/lib/cms/client";

type SitemapRouteEntry = {
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
};

function dedupeRoutes(routes: SitemapRouteEntry[]) {
  return Array.from(
    routes.reduce((accumulator, route) => accumulator.set(route.path, route), new Map<string, SitemapRouteEntry>()).values(),
  );
}

export async function getSitemapRouteEntries(locale = defaultSiteLocale): Promise<SitemapRouteEntry[]> {
  const cmsClient = getCmsClient();
  const directions = await cmsClient.listLaunchDirections(locale);
  const [editorialPages, categoryGroups, productGroups] = await Promise.all([
    cmsClient.listEditorialPages(locale),
    Promise.all(directions.map((direction) => cmsClient.listDirectionCategories(direction.slug, locale))),
    Promise.all(directions.map((direction) => cmsClient.listProductsByDirection(direction.slug, locale))),
  ]);

  const categories = categoryGroups.flat();
  const products = productGroups.flat();

  return dedupeRoutes([
    { path: "/", changeFrequency: "weekly", priority: 1 },
    ...directions.map((direction) => ({
      path: direction.routePath,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...categories.map((category) => ({
      path: category.routePath,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...lineRoutes.map((route) => ({
      path: route.href,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...products.map((product) => ({
      path: product.routePath,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...editorialPages.map((page) => ({
      path: page.routePath,
      changeFrequency: page.slug === "journal" ? ("weekly" as const) : ("monthly" as const),
      priority: page.slug === "contact" ? 0.8 : 0.6,
    })),
    ...audioCategoryRoutes.map((route) => ({
      path: route.href,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ]);
}
