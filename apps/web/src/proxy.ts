import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  defaultSiteLocale,
  getPathLocale,
  isCrawlerUserAgent,
  isSiteLocale,
  localeHeaderName,
  localePreferenceCookieMaxAge,
  localePreferenceCookieName,
  localePreferenceCookiePath,
  localeSuggestionCookieMaxAge,
  localeSuggestionCookieName,
  resolveAcceptLanguageLocale,
  resolveGeoIpCountryCode,
  resolveGeoIpLocale,
  resolveLocaleSuggestion,
  hasMultipleLeadingLocales,
  stripLocaleFromPathname,
  withLocale,
} from "./config/i18n";

function getInternalRewriteUrl(request: NextRequest, pathname: string) {
  const rewrittenUrl = request.nextUrl.clone();
  rewrittenUrl.pathname = pathname;

  if (process.env.MONTELAR_PREVIEW_EXTERNAL_MODE === "nginx-proxy") {
    rewrittenUrl.protocol = "http:";
    rewrittenUrl.hostname = "127.0.0.1";
    rewrittenUrl.port = process.env.MONTELAR_PREVIEW_PORT || "8093";
  }

  return rewrittenUrl;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathnameLocale = getPathLocale(pathname);
  const rewrittenLocale = request.headers.get(localeHeaderName);
  const acceptLanguageLocale = resolveAcceptLanguageLocale(request.headers.get("accept-language"));
  const geoCountryCode = isCrawlerUserAgent(request.headers.get("user-agent"))
    ? null
    : resolveGeoIpCountryCode(request.headers);
  const geoLocale = resolveGeoIpLocale(geoCountryCode);
  const suggestedLocale = resolveLocaleSuggestion({
    cookieLocale: request.cookies.get(localePreferenceCookieName)?.value,
    acceptLanguageLocale,
    geoLocale,
    preferredLocale: defaultSiteLocale,
  });

  if (!pathnameLocale) {
    if (isSiteLocale(rewrittenLocale)) {
      return NextResponse.next();
    }

    // Language is cookie-driven, NOT URL-prefixed: render the resolved locale
    // (cookie -> accept-language -> geo -> default) on the unprefixed URL and
    // persist that choice. Do not force/reset to the default locale.
    const cookieLocaleValue = request.cookies.get(localePreferenceCookieName)?.value;
    const effectiveLocale =
      (isSiteLocale(cookieLocaleValue) ? cookieLocaleValue : null) ??
      acceptLanguageLocale ??
      geoLocale ??
      defaultSiteLocale;
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(localeHeaderName, effectiveLocale);

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    response.cookies.set({
      name: localePreferenceCookieName,
      value: effectiveLocale,
      maxAge: localePreferenceCookieMaxAge,
      path: localePreferenceCookiePath,
      sameSite: "lax",
    });

    if (suggestedLocale) {
      response.cookies.set({
        name: localeSuggestionCookieName,
        value: suggestedLocale,
        maxAge: localeSuggestionCookieMaxAge,
        path: localePreferenceCookiePath,
        sameSite: "lax",
      });
    } else {
      response.cookies.delete(localeSuggestionCookieName);
    }

    return response;
  }

  const canonicalPathname = withLocale(pathname, pathnameLocale);

  if (hasMultipleLeadingLocales(pathname) || canonicalPathname !== pathname) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = canonicalPathname;
    const response = NextResponse.redirect(redirectUrl, 308);

    response.cookies.set({
      name: localePreferenceCookieName,
      value: pathnameLocale,
      maxAge: localePreferenceCookieMaxAge,
      path: localePreferenceCookiePath,
      sameSite: "lax",
    });

    return response;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(localeHeaderName, pathnameLocale);

  const rewrittenUrl = getInternalRewriteUrl(request, stripLocaleFromPathname(pathname));

  const response = NextResponse.rewrite(rewrittenUrl, {
    request: {
      headers: requestHeaders,
    },
  });

  response.cookies.set({
    name: localePreferenceCookieName,
    value: pathnameLocale,
    maxAge: localePreferenceCookieMaxAge,
    path: localePreferenceCookiePath,
    sameSite: "lax",
  });

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
