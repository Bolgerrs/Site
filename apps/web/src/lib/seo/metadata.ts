import type { Metadata } from "next";
import {
  defaultSiteLocale,
  siteLocales,
  type SiteLocale,
  withLocale,
} from "@/config/i18n";
import {
  getDefaultSeoDescription,
  getHomeSeoKeywords,
} from "@/lib/seo/locale-seo";

const montelarPublicUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://montelar.ru";

const ogLocaleBySiteLocale: Record<SiteLocale, string> = {
  ru: "ru_RU",
  en: "en_US",
  es: "es_ES",
  fr: "fr_FR",
  zh: "zh_CN",
  ja: "ja_JP",
  de: "de_DE",
};

export const montelarMetadataBase = new URL(montelarPublicUrl);

function normalizePath(path: string) {
  if (!path || path === "/") {
    return "/";
  }

  return path.startsWith("/") ? path : `/${path}`;
}

function localizedPath(path: string, locale: SiteLocale) {
  return withLocale(normalizePath(path), locale);
}

function buildLanguageAlternates(
  path: string,
  pathBuilder: (routePath: string, locale: SiteLocale) => string,
) {
  const languages = Object.fromEntries(siteLocales.map((locale) => [locale, pathBuilder(path, locale)]));

  return {
    ...languages,
    "x-default": pathBuilder(path, defaultSiteLocale),
  };
}

export function buildAbsoluteUrl(path: string) {
  return new URL(normalizePath(path), montelarMetadataBase).toString();
}

export function buildAbsoluteLocalizedUrl(path: string, locale: SiteLocale) {
  return buildAbsoluteUrl(localizedPath(path, locale));
}

export function buildAbsoluteLanguageAlternates(path: string) {
  return buildLanguageAlternates(path, buildAbsoluteLocalizedUrl);
}

type BuildRouteMetadataInput = {
  title: string;
  description: string;
  path: string;
  canonicalPath?: string;
  locale?: SiteLocale;
  type?: "website" | "article";
  keywords?: string[];
  robots?: Metadata["robots"];
};

export function buildRouteMetadata({
  title,
  description,
  path,
  canonicalPath,
  locale = defaultSiteLocale,
  type = "website",
  keywords,
  robots,
}: BuildRouteMetadataInput): Metadata {
  const resolvedCanonicalPath = localizedPath(canonicalPath ?? path, locale);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: resolvedCanonicalPath,
      languages: buildLanguageAlternates(path, localizedPath),
    },
    openGraph: {
      type,
      url: resolvedCanonicalPath,
      siteName: "Montelar",
      title,
      description,
      locale: ogLocaleBySiteLocale[locale],
      alternateLocale: siteLocales
        .filter((siteLocale) => siteLocale !== locale)
        .map((siteLocale) => ogLocaleBySiteLocale[siteLocale]),
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    robots,
  };
}

export function buildRootMetadata(): Metadata {
  return {
    metadataBase: montelarMetadataBase,
    applicationName: "Montelar",
    icons: {
      icon: "/icon.svg",
      shortcut: "/icon.svg",
      apple: "/icon.svg",
    },
    ...buildRouteMetadata({
      title: "Montelar",
      description: getDefaultSeoDescription(defaultSiteLocale),
      path: "/",
      locale: defaultSiteLocale,
      keywords: getHomeSeoKeywords(defaultSiteLocale),
    }),
  };
}
