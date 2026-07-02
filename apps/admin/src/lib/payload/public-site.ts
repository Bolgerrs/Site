import type { Payload } from "payload";

import type { AdminLocale } from "./locales.ts";
import { getText } from "./site-governance.ts";

export type PublicSiteSettings = {
  addressShort: string;
  brandName: string;
  brandShortName: string;
  contactEmail: string;
  contactFallbackLocale: string;
  contactHeadline: string;
  contactPhoneDisplay: string;
  contactPhoneE164: string;
  contactPrimaryHref: string;
  contactPrimaryLabel: string;
  contactTelegramUrl: string;
  contactWhatsappLabel: string;
  contactWhatsappUrl: string;
  defaultSeoImageId: number | string | null;
  footerCopyright: string;
  footerLegalName: string;
  locale: string;
  showroomCity: string;
  showroomCountry: string;
  showroomLabel: string;
  siteConcept: string;
  siteTagline: string;
  socialLinks: Array<{ href: string; label: string }>;
  visitNote: string;
};

export type PublicNavigationItem = {
  children: PublicNavigationItem[];
  href: string;
  id: string;
  label: string;
  opensInNewTab: boolean;
  summary: string;
};

export type PublicNavigationMenu = {
  items: PublicNavigationItem[];
  locale: string;
  menuKey: string;
  title: string;
};

export type PublicSeoEntry = {
  alternates: Partial<Record<AdminLocale, string>>;
  canonicalUrl: string;
  description: string;
  includeInSitemap: boolean;
  locale: string;
  ownerKey: string;
  path: string;
  robots: string;
  shareDescription: string;
  shareTitle: string;
  title: string;
};

function asArray<T>(value: unknown) {
  return Array.isArray(value) ? (value as T[]) : [];
}

function getRelationshipId(value: unknown) {
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

function mapPublicNavigationItem(item: Record<string, unknown>): PublicNavigationItem | null {
  if (item.visible === false) {
    return null;
  }

  const label = getText(item.resolvedLabel);
  const href = getText(item.resolvedHref);

  if (!label || !href) {
    return null;
  }

  return {
    children: asArray<Record<string, unknown>>(item.children)
      .map(mapPublicNavigationItem)
      .filter((child): child is PublicNavigationItem => child !== null),
    href,
    id: getText(item.itemKey) || `${label}-${href}`,
    label,
    opensInNewTab: item.opensInNewTab === true,
    summary: getText(item.summary),
  };
}

export async function getPublicSiteSettings(
  payload: Payload,
  locale: string,
  settingsScope = "public-site",
): Promise<PublicSiteSettings | null> {
  const result = await payload.find({
    collection: "site-settings",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        {
          status: {
            equals: "published",
          },
        },
        {
          locale: {
            equals: locale,
          },
        },
        {
          settingsScope: {
            equals: settingsScope,
          },
        },
      ],
    },
  });

  const doc = result.docs[0] as Record<string, unknown> | undefined;

  if (!doc) {
    return null;
  }

  return {
    addressShort: getText(doc.addressShort),
    brandName: getText(doc.brandName),
    brandShortName: getText(doc.brandShortName),
    contactEmail: getText(doc.contactEmail),
    contactFallbackLocale: getText(doc.contactFallbackLocale),
    contactHeadline: getText(doc.contactHeadline),
    contactPhoneDisplay: getText(doc.contactPhoneDisplay),
    contactPhoneE164: getText(doc.contactPhoneE164),
    contactPrimaryHref: getText(doc.contactPrimaryHref),
    contactPrimaryLabel: getText(doc.contactPrimaryLabel),
    contactTelegramUrl: getText(doc.contactTelegramUrl),
    contactWhatsappLabel: getText(doc.contactWhatsappLabel),
    contactWhatsappUrl: getText(doc.contactWhatsappUrl),
    defaultSeoImageId: getRelationshipId(doc.defaultSeoImage),
    footerCopyright: getText(doc.footerCopyright),
    footerLegalName: getText(doc.footerLegalName),
    locale: getText(doc.locale),
    showroomCity: getText(doc.showroomCity),
    showroomCountry: getText(doc.showroomCountry),
    showroomLabel: getText(doc.showroomLabel),
    siteConcept: getText(doc.siteConcept),
    siteTagline: getText(doc.siteTagline),
    socialLinks: asArray<Record<string, unknown>>(doc.socialLinks).map((link) => ({
      href: getText(link.href),
      label: getText(link.label),
    })),
    visitNote: getText(doc.visitNote),
  };
}

export async function getPublicNavigationMenu(
  payload: Payload,
  locale: string,
  menuKey: string,
): Promise<PublicNavigationMenu | null> {
  const result = await payload.find({
    collection: "navigation-menus",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        {
          status: {
            equals: "published",
          },
        },
        {
          locale: {
            equals: locale,
          },
        },
        {
          menuKey: {
            equals: menuKey,
          },
        },
      ],
    },
  });

  const doc = result.docs[0] as Record<string, unknown> | undefined;

  if (!doc) {
    return null;
  }

  return {
    items: asArray<Record<string, unknown>>(doc.items)
      .map(mapPublicNavigationItem)
      .filter((item): item is PublicNavigationItem => item !== null),
    locale: getText(doc.locale),
    menuKey: getText(doc.menuKey),
    title: getText(doc.title),
  };
}

export async function listPublicSeoEntries(
  payload: Payload,
  locale?: string,
): Promise<PublicSeoEntry[]> {
  const localeDocs = await payload.find({
    collection: "locales",
    depth: 0,
    limit: 100,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        {
          status: {
            equals: "active",
          },
        },
        {
          publicSiteEnabled: {
            equals: true,
          },
        },
        {
          seoEnabled: {
            equals: true,
          },
        },
      ],
    },
  });

  const enabledLocales = new Set(
    localeDocs.docs
      .map((doc) => getText((doc as unknown as Record<string, unknown>).code))
      .filter(Boolean),
  );

  const seoDocs = await payload.find({
    collection: "seo-entries",
    depth: 0,
    limit: 500,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        {
          status: {
            equals: "published",
          },
        },
        {
          publicationReadiness: {
            equals: "production-ready",
          },
        },
      ],
    },
  });

  const normalizedDocs = seoDocs.docs
    .map((doc) => doc as unknown as Record<string, unknown>)
    .filter((doc) => enabledLocales.has(getText(doc.locale)));

  const alternatesByOwner = new Map<string, Partial<Record<AdminLocale, string>>>();

  for (const doc of normalizedDocs) {
    if (doc.hreflangEnabled === false) {
      continue;
    }

    const ownerKey = getText(doc.ownerKey);
    const docLocale = getText(doc.locale) as AdminLocale;

    if (!ownerKey || !docLocale) {
      continue;
    }

    const current = alternatesByOwner.get(ownerKey) ?? {};

    current[docLocale] = getText(doc.routePath);
    alternatesByOwner.set(ownerKey, current);
  }

  return normalizedDocs
    .filter((doc) => !locale || getText(doc.locale) === locale)
    .map((doc) => {
    const ownerKey = getText(doc.ownerKey);
    const title = getText(doc.metaTitle);
    const description = getText(doc.metaDescription);
    const shareTitle = getText(doc.shareTitle) || title;
    const shareDescription = getText(doc.shareDescription) || description;
    const path = getText(doc.routePath);

    return {
      alternates: alternatesByOwner.get(ownerKey) ?? {},
      canonicalUrl: getText(doc.canonicalUrl) || path,
      description,
      includeInSitemap: doc.includeInSitemap !== false && doc.previewOnly !== true,
      locale: getText(doc.locale),
      ownerKey,
      path,
      robots: getText(doc.indexingMode) || "index,follow",
      shareDescription,
      shareTitle,
      title,
    };
  });
}
