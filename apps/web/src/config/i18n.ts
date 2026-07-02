export const siteLocales = ["ru", "en", "es", "fr", "zh", "ja", "de"] as const;

export type SiteLocale = (typeof siteLocales)[number];

export const defaultSiteLocale: SiteLocale = "ru";

export const localeHeaderName = "x-montelar-locale";
export const localePreferenceCookieName = "montelar_locale";
export const localePreferenceCookiePath = "/";
export const localePreferenceCookieMaxAge = 60 * 60 * 24 * 365;
export const localeSuggestionCookieName = "montelar_locale_suggestion";
export const localeSuggestionCookieMaxAge = 60 * 10;
export const geoCountryHeaderNames = [
  "x-vercel-ip-country",
  "cf-ipcountry",
  "cloudfront-viewer-country",
  "x-country-code",
] as const;

export function isSiteLocale(value: string | null | undefined): value is SiteLocale {
  return siteLocales.includes(value as SiteLocale);
}

export function getPathLocale(pathname: string): SiteLocale | null {
  const [, segment] = pathname.split("/");

  return isSiteLocale(segment) ? segment : null;
}

export function stripLocaleFromPathname(pathname: string): string {
  const locale = getPathLocale(pathname);

  if (!locale) {
    return pathname;
  }

  const strippedPathname = pathname.slice(locale.length + 1);

  return strippedPathname.length > 0 ? strippedPathname : "/";
}

export function stripLeadingLocalesFromPathname(pathname: string): string {
  const normalizedPathname = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const segments = normalizedPathname.split("/");

  while (isSiteLocale(segments[1])) {
    segments.splice(1, 1);
  }

  const strippedPathname = segments.join("/");

  return strippedPathname.length > 0 ? strippedPathname : "/";
}

export function hasMultipleLeadingLocales(pathname: string) {
  const [, firstSegment, secondSegment] = pathname.split("/");

  return isSiteLocale(firstSegment) && isSiteLocale(secondSegment);
}

export function withLocale(pathname: string, _locale: SiteLocale = defaultSiteLocale) {
  // URLs are locale-prefix-free: language is driven by the montelar_locale cookie
  // (resolved in proxy.ts), so every link points to the unprefixed path.
  void _locale;
  const normalizedPathname = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return stripLeadingLocalesFromPathname(normalizedPathname);
}

export function localizePathname(pathname: string, locale: SiteLocale = defaultSiteLocale) {
  return withLocale(pathname, locale);
}

export function buildLocalePreferenceCookie(locale: SiteLocale) {
  return [
    `${localePreferenceCookieName}=${encodeURIComponent(locale)}`,
    `Max-Age=${localePreferenceCookieMaxAge}`,
    `Path=${localePreferenceCookiePath}`,
    "SameSite=Lax",
  ].join("; ");
}

type AcceptLanguageMatch = {
  locale: SiteLocale;
  quality: number;
  order: number;
};

function parseAcceptLanguageQuality(value: string | undefined) {
  if (!value) {
    return 1;
  }

  const quality = Number.parseFloat(value);

  if (!Number.isFinite(quality)) {
    return 0;
  }

  return Math.min(Math.max(quality, 0), 1);
}

function matchAcceptedLanguageTag(tag: string): SiteLocale | null {
  const normalizedTag = tag.trim().toLowerCase().replace(/_/g, "-");

  if (!normalizedTag || normalizedTag === "*") {
    return null;
  }

  if (isSiteLocale(normalizedTag)) {
    return normalizedTag;
  }

  const [baseLanguage = ""] = normalizedTag.split("-");

  return isSiteLocale(baseLanguage) ? baseLanguage : null;
}

export function resolveAcceptLanguageLocale(headerValue: string | null | undefined): SiteLocale | null {
  if (!headerValue) {
    return null;
  }

  const matches: AcceptLanguageMatch[] = [];

  for (const [order, languageRange] of headerValue.split(",").entries()) {
    const [tag = "", ...params] = languageRange.split(";");
    const locale = matchAcceptedLanguageTag(tag);

    if (!locale) {
      continue;
    }

    const qualityParam = params.find((param) => param.trim().startsWith("q="));
    const quality = parseAcceptLanguageQuality(qualityParam?.split("=")[1]);

    if (quality <= 0) {
      continue;
    }

    matches.push({ locale, quality, order });
  }

  matches.sort((left, right) => {
    if (right.quality !== left.quality) {
      return right.quality - left.quality;
    }

    return left.order - right.order;
  });

  return matches[0]?.locale ?? null;
}

function normalizeCountryCode(value: string | null | undefined) {
  return value?.trim().toUpperCase() ?? "";
}

const geoCountryLocaleMap: Partial<Record<string, SiteLocale>> = {
  AR: "es",
  AT: "de",
  AU: "en",
  CL: "es",
  CN: "zh",
  CO: "es",
  DE: "de",
  EC: "es",
  ES: "es",
  FR: "fr",
  GB: "en",
  HK: "zh",
  IE: "en",
  JP: "ja",
  MX: "es",
  MO: "zh",
  NZ: "en",
  PE: "es",
  RU: "ru",
  TW: "zh",
  US: "en",
  UY: "es",
};

export function resolveGeoIpCountryCode(headers: Pick<Headers, "get">): string | null {
  for (const headerName of geoCountryHeaderNames) {
    const countryCode = normalizeCountryCode(headers.get(headerName));

    if (countryCode.length === 2) {
      return countryCode;
    }
  }

  return null;
}

export function resolveGeoIpLocale(countryCode: string | null | undefined): SiteLocale | null {
  const normalizedCountryCode = normalizeCountryCode(countryCode);

  return geoCountryLocaleMap[normalizedCountryCode] ?? null;
}

type LocaleSuggestionInput = {
  cookieLocale: string | null | undefined;
  acceptLanguageLocale: SiteLocale | null;
  geoLocale: SiteLocale | null;
  preferredLocale: SiteLocale;
};

export function resolveLocaleSuggestion({
  cookieLocale,
  acceptLanguageLocale,
  geoLocale,
  preferredLocale,
}: LocaleSuggestionInput): SiteLocale | null {
  if (isSiteLocale(cookieLocale)) {
    return null;
  }

  if (!acceptLanguageLocale || !geoLocale) {
    return null;
  }

  if (acceptLanguageLocale === geoLocale) {
    return null;
  }

  return preferredLocale === acceptLanguageLocale ? geoLocale : null;
}

export function isCrawlerUserAgent(userAgent: string | null | undefined) {
  return /bot|crawler|spider|crawling|google-inspectiontool|adsbot|mediapartners-google/i.test(
    userAgent ?? "",
  );
}
