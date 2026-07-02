import type { Payload, PayloadRequest } from "payload";

import { getAdminUser } from "./access.ts";
import { hasAdminRole, type AdminRole } from "./roles.ts";

const ownerSettingsRoles = ["owner", "admin", "developer"] as const satisfies readonly AdminRole[];

type GenericRecord = Record<string, unknown>;
type SiteSettingsStatus = "archived" | "draft" | "hidden" | "published" | "review";
type LaunchLocaleCode = "de" | "en" | "es" | "fr" | "ja" | "ru" | "zh";

const launchLocaleCodes = new Set<LaunchLocaleCode>(["de", "en", "es", "fr", "ja", "ru", "zh"]);

export type OwnerSettingsLocaleOption = {
  code: string;
  label: string;
  recordId: string;
  status: string;
};

export type OwnerSettingsLinkCard = {
  description: string;
  href: string;
  id: string;
  label: string;
};

export type OwnerSettingsSocialLink = {
  href: string;
  label: string;
};

export type OwnerSettingsEditableFields = {
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
  footerCopyright: string;
  footerLegalName: string;
  showroomCity: string;
  showroomCountry: string;
  showroomLabel: string;
  siteConcept: string;
  siteTagline: string;
  socialLinks: OwnerSettingsSocialLink[];
  visitNote: string;
};

export type OwnerSettingsWorkspaceSnapshot = {
  canPublish: boolean;
  canRead: boolean;
  canUpdate: boolean;
  generatedAt: string;
  localeOptions: OwnerSettingsLocaleOption[];
  previewHref: string;
  secondLayerCards: OwnerSettingsLinkCard[];
  selectedLocale: string;
  selectedRecordHref: string;
  settings: OwnerSettingsEditableFields & {
    internalCode: string;
    locale: string;
    primaryLocale: string;
    recordId: string;
    status: string;
    updatedAt: string;
  };
};

export type OwnerSettingsWorkspaceUpdateInput = {
  fields: OwnerSettingsEditableFields;
  locale: string;
  mode: "publish" | "save";
};

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asArray<T>(value: unknown) {
  return Array.isArray(value) ? (value as T[]) : [];
}

function getRecordId(value: unknown) {
  if (typeof value === "number" || typeof value === "string") {
    return String(value);
  }

  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;

    if (typeof id === "number" || typeof id === "string") {
      return String(id);
    }
  }

  return "";
}

function assertWorkspaceAccess(req: PayloadRequest) {
  const user = getAdminUser(req.user);

  if (!hasAdminRole(user, ownerSettingsRoles)) {
    throw new Error("forbidden");
  }

  return user;
}

function normalizeLocaleLabel(locale: GenericRecord | undefined, code: string) {
  return (
    getText(locale?.nativeLabel) ||
    getText(locale?.englishLabel) ||
    code.toUpperCase()
  );
}

function buildPreviewHref() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/+$/, "");
  return siteUrl ? `${siteUrl}/` : "http://89.150.34.66:8093/";
}

function normalizeSiteSettingsStatus(value: unknown): SiteSettingsStatus {
  switch (getText(value)) {
    case "archived":
    case "hidden":
    case "published":
    case "review":
      return getText(value) as SiteSettingsStatus;
    default:
      return "draft";
  }
}

function normalizeLaunchLocaleCode(value: unknown): LaunchLocaleCode | null {
  const code = getText(value).toLowerCase();
  return launchLocaleCodes.has(code as LaunchLocaleCode) ? (code as LaunchLocaleCode) : null;
}

function extractEditableFields(record: GenericRecord): OwnerSettingsEditableFields {
  return {
    addressShort: getText(record.addressShort),
    brandName: getText(record.brandName),
    brandShortName: getText(record.brandShortName),
    contactEmail: getText(record.contactEmail),
    contactFallbackLocale: getText(record.contactFallbackLocale),
    contactHeadline: getText(record.contactHeadline),
    contactPhoneDisplay: getText(record.contactPhoneDisplay),
    contactPhoneE164: getText(record.contactPhoneE164),
    contactPrimaryHref: getText(record.contactPrimaryHref),
    contactPrimaryLabel: getText(record.contactPrimaryLabel),
    contactTelegramUrl: getText(record.contactTelegramUrl),
    contactWhatsappLabel: getText(record.contactWhatsappLabel),
    contactWhatsappUrl: getText(record.contactWhatsappUrl),
    footerCopyright: getText(record.footerCopyright),
    footerLegalName: getText(record.footerLegalName),
    showroomCity: getText(record.showroomCity),
    showroomCountry: getText(record.showroomCountry),
    showroomLabel: getText(record.showroomLabel),
    siteConcept: getText(record.siteConcept),
    siteTagline: getText(record.siteTagline),
    socialLinks: asArray<GenericRecord>(record.socialLinks)
      .map((entry) => ({
        href: getText(entry.href),
        label: getText(entry.label),
      }))
      .filter((entry) => entry.label || entry.href),
    visitNote: getText(record.visitNote),
  };
}

function normalizeInputFields(input: OwnerSettingsEditableFields): OwnerSettingsEditableFields {
  return {
    addressShort: getText(input.addressShort),
    brandName: getText(input.brandName),
    brandShortName: getText(input.brandShortName),
    contactEmail: getText(input.contactEmail),
    contactFallbackLocale: normalizeLaunchLocaleCode(input.contactFallbackLocale) ?? "",
    contactHeadline: getText(input.contactHeadline),
    contactPhoneDisplay: getText(input.contactPhoneDisplay),
    contactPhoneE164: getText(input.contactPhoneE164),
    contactPrimaryHref: getText(input.contactPrimaryHref) || "/contact",
    contactPrimaryLabel: getText(input.contactPrimaryLabel),
    contactTelegramUrl: getText(input.contactTelegramUrl),
    contactWhatsappLabel: getText(input.contactWhatsappLabel),
    contactWhatsappUrl: getText(input.contactWhatsappUrl),
    footerCopyright: getText(input.footerCopyright),
    footerLegalName: getText(input.footerLegalName),
    showroomCity: getText(input.showroomCity),
    showroomCountry: getText(input.showroomCountry),
    showroomLabel: getText(input.showroomLabel),
    siteConcept: getText(input.siteConcept),
    siteTagline: getText(input.siteTagline),
    socialLinks: asArray<OwnerSettingsSocialLink>(input.socialLinks)
      .map((entry) => ({
        href: getText(entry.href),
        label: getText(entry.label),
      }))
      .filter((entry) => entry.label && entry.href),
    visitNote: getText(input.visitNote),
  };
}

async function loadSettingsContext(payload: Payload) {
  const [settingsResult, localesResult, pagesResult] = await Promise.all([
    payload.find({
      collection: "site-settings",
      depth: 0,
      limit: 100,
      overrideAccess: true,
      pagination: false,
      sort: "locale",
    }),
    payload.find({
      collection: "locales",
      depth: 0,
      limit: 50,
      overrideAccess: true,
      pagination: false,
      sort: "code",
    }),
    payload.find({
      collection: "pages",
      depth: 0,
      limit: 10,
      overrideAccess: true,
      pagination: false,
      sort: "routePath",
      where: {
        routePath: {
          equals: "/",
        },
      },
    }),
  ]);

  return {
    homePageId: getRecordId(((pagesResult.docs as unknown) as GenericRecord[])[0]),
    locales: ((localesResult.docs as unknown) as GenericRecord[]) ?? [],
    settings: ((settingsResult.docs as unknown) as GenericRecord[]) ?? [],
  };
}

function buildSecondLayerCards(selectedLocale: string, homePageId: string): OwnerSettingsLinkCard[] {
  const localeQuery = encodeURIComponent(selectedLocale);
  const formsHref = `/admin/site-admin?section=forms&locale=${localeQuery}`;
  const homepageMediaHref = homePageId
    ? `/admin/site?selected=${encodeURIComponent(homePageId)}&focus=media`
    : "/admin/site?focus=media";

  return [
    {
      id: "site-admin",
      label: "Открыть слой Сайт-админ",
      description:
        "Второй слой собирает структуру сайта, меню, SEO, формы, языки, пользователей и сервисные страницы в одном понятном меню.",
      href: "/admin/site-admin",
    },
    {
      id: "brand-assets",
      label: "Логотип и favicon",
      description:
        "Брендовые файлы и иконки ведутся через понятные настройки шапки, низа сайта и медиатеки, без таблиц данных.",
      href: "/admin/site-admin?section=header-footer",
    },
    {
      id: "homepage-video",
      label: "Видео и hero главной",
      description:
        "Видео, постер и главный визуал меняются в редакторе главной, где сразу виден контекст размещения.",
      href: homepageMediaHref,
    },
    {
      id: "popup-thank-you",
      label: "Popup и thank-you сценарии",
      description:
        "Тексты popup, success-сценарии и привязка формы живут в редакторе заявок, а не в глобальных настройках.",
      href: formsHref,
    },
    {
      id: "notifications",
      label: "Уведомления по заявкам",
      description:
        "Email и уведомления редактируются в формах заявок, чтобы не смешивать контактные поля и рабочие правила.",
      href: formsHref,
    },
    {
      id: "navigation-seo",
      label: "Меню и SEO-правила",
      description:
        "Навигация и SEO теперь собраны в site-admin слое. Отсюда можно перейти уже в нужный рабочий раздел.",
      href: "/admin/site-admin",
    },
  ];
}

export async function getOwnerSettingsWorkspaceSnapshot(
  payload: Payload,
  req: PayloadRequest,
  options: { locale?: string | null } = {},
): Promise<OwnerSettingsWorkspaceSnapshot> {
  assertWorkspaceAccess(req);

  const { homePageId, locales, settings } = await loadSettingsContext(payload);
  const selectedCode = getText(options.locale) || "ru";
  const selectedRecord =
    settings.find((record) => getText(record.locale) === selectedCode) ??
    settings.find((record) => getText(record.locale) === "ru") ??
    settings[0];

  if (!selectedRecord) {
    throw new Error("no-settings");
  }

  const selectedLocale = getText(selectedRecord.locale) || selectedCode;
  const localeByCode = new Map(locales.map((locale) => [getText(locale.code), locale]));
  const localeOptions = settings.map((record) => {
    const code = getText(record.locale);
    const locale = localeByCode.get(code);

    return {
      code,
      label: normalizeLocaleLabel(locale, code),
      recordId: getRecordId(record.id),
      status: normalizeSiteSettingsStatus(record.status),
    } satisfies OwnerSettingsLocaleOption;
  });

  const recordId = getRecordId(selectedRecord.id);
  const settingsFields = extractEditableFields(selectedRecord);

  return {
    canPublish: true,
    canRead: true,
    canUpdate: true,
    generatedAt: new Date().toISOString(),
    localeOptions,
    previewHref: buildPreviewHref(),
    secondLayerCards: buildSecondLayerCards(selectedLocale, homePageId),
    selectedLocale,
    selectedRecordHref: "/admin/advanced",
    settings: {
      ...settingsFields,
      internalCode: getText(selectedRecord.internalCode),
      locale: selectedLocale,
      primaryLocale: getText(selectedRecord.primaryLocale) || "en",
      recordId,
      status: normalizeSiteSettingsStatus(selectedRecord.status),
      updatedAt: getText(selectedRecord.updatedAt) || "",
    },
  };
}

export async function updateOwnerSettingsWorkspace(
  payload: Payload,
  req: PayloadRequest,
  input: OwnerSettingsWorkspaceUpdateInput,
) {
  assertWorkspaceAccess(req);

  const locale = getText(input.locale);

  if (!locale) {
    throw new Error("invalid-locale");
  }

  const existing = await payload.find({
    collection: "site-settings",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      locale: {
        equals: locale,
      },
    },
  });

  const record = ((existing.docs as unknown) as GenericRecord[])[0];

  if (!record) {
    throw new Error("settings-not-found");
  }

  const nextFields = normalizeInputFields(input.fields);

  await payload.update({
    collection: "site-settings",
    data: {
      ...nextFields,
      contactFallbackLocale: normalizeLaunchLocaleCode(nextFields.contactFallbackLocale),
      status: input.mode === "publish" ? "published" : normalizeSiteSettingsStatus(record.status),
    },
    id: getRecordId(record.id),
    overrideAccess: true,
    showHiddenFields: true,
  });

  return getOwnerSettingsWorkspaceSnapshot(payload, req, { locale });
}
