import type { MetadataRoute } from "next";
import { defaultSiteLocale } from "@/config/i18n";
import {
  buildAbsoluteLanguageAlternates,
  buildAbsoluteLocalizedUrl,
} from "@/lib/seo/metadata";
import { getSitemapRouteEntries } from "@/lib/seo/route-inventory";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routeEntries = await getSitemapRouteEntries(defaultSiteLocale);
  const lastModified = new Date();

  return routeEntries.map((routeEntry) => ({
    url: buildAbsoluteLocalizedUrl(routeEntry.path, defaultSiteLocale),
    lastModified,
    changeFrequency: routeEntry.changeFrequency,
    priority: routeEntry.priority,
    alternates: {
      languages: buildAbsoluteLanguageAlternates(routeEntry.path),
    },
  }));
}
