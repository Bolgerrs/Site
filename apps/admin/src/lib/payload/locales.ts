import type { Payload } from "payload";

import type { Locale } from "../../payload-types.ts";

export const adminLocaleOptions = [
  {
    bcp47Tag: "ru",
    code: "ru",
    direction: "ltr",
    englishLabel: "Russian",
    nativeLabel: "Русский",
  },
  {
    bcp47Tag: "en",
    code: "en",
    direction: "ltr",
    englishLabel: "English",
    nativeLabel: "English",
  },
  {
    bcp47Tag: "es",
    code: "es",
    direction: "ltr",
    englishLabel: "Spanish",
    nativeLabel: "Español",
  },
  {
    bcp47Tag: "fr",
    code: "fr",
    direction: "ltr",
    englishLabel: "French",
    nativeLabel: "Français",
  },
  {
    bcp47Tag: "zh-CN",
    code: "zh",
    direction: "ltr",
    englishLabel: "Chinese",
    nativeLabel: "中文",
  },
  {
    bcp47Tag: "ja",
    code: "ja",
    direction: "ltr",
    englishLabel: "Japanese",
    nativeLabel: "日本語",
  },
  {
    bcp47Tag: "de",
    code: "de",
    direction: "ltr",
    englishLabel: "German",
    nativeLabel: "Deutsch",
  },
] as const;

export type AdminLocale = (typeof adminLocaleOptions)[number]["code"];
export type AdminLocaleSeed = (typeof launchLocaleSeeds)[number];

export const defaultAdminLocale: AdminLocale = "en";

export const payloadLocalizationLocales = adminLocaleOptions.map((locale) => ({
  code: locale.code,
  label: locale.englishLabel,
}));

export const launchLocaleSeeds: Array<
  Pick<
    Locale,
    | "bcp47Tag"
    | "code"
    | "direction"
    | "documentsEnabled"
    | "englishLabel"
    | "formsEnabled"
    | "hiddenFromSwitcher"
    | "isDefaultAdminLocale"
    | "isDefaultPublicLocale"
    | "isSourceLocale"
    | "labelLengthRisk"
    | "launchOrder"
    | "nativeLabel"
    | "publicSiteEnabled"
    | "routePrefix"
    | "samePageSwitchEnabled"
    | "seoEnabled"
    | "sourceLocale"
    | "status"
    | "switcherShortLabel"
    | "translationReadiness"
    | "xDefaultEligible"
  >
> = adminLocaleOptions.map((locale, index) => ({
  bcp47Tag: locale.bcp47Tag,
  code: locale.code,
  direction: locale.direction,
  documentsEnabled: true,
  englishLabel: locale.englishLabel,
  formsEnabled: true,
  hiddenFromSwitcher: false,
  isDefaultAdminLocale: locale.code === defaultAdminLocale,
  isDefaultPublicLocale: locale.code === defaultAdminLocale,
  isSourceLocale: locale.code === defaultAdminLocale,
  labelLengthRisk: ["zh", "ja"].includes(locale.code) ? "medium" : "low",
  launchOrder: index + 1,
  nativeLabel: locale.nativeLabel,
  publicSiteEnabled: true,
  routePrefix: `/${locale.code}`,
  samePageSwitchEnabled: true,
  seoEnabled: true,
  sourceLocale: null,
  status: "active",
  switcherShortLabel: locale.code.toUpperCase(),
  translationReadiness: locale.code === defaultAdminLocale ? "ready" : "partial",
  xDefaultEligible: locale.code === defaultAdminLocale,
}));

export async function syncLaunchLocales(payload: Payload) {
  const summaries: Array<{ code: AdminLocale; id: number | string; operation: "created" | "updated" }> = [];

  for (const seed of launchLocaleSeeds) {
    const existing = await payload.find({
      collection: "locales",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        code: {
          equals: seed.code,
        },
      },
    });

    if (existing.docs[0]) {
      const updated = await payload.update({
        collection: "locales",
        data: seed,
        overrideAccess: true,
        where: {
          id: {
            equals: existing.docs[0].id,
          },
        },
      });

      summaries.push({
        code: seed.code,
        id: updated.docs[0]?.id ?? existing.docs[0].id,
        operation: "updated",
      });
      continue;
    }

    const created = await payload.create({
      collection: "locales",
      data: seed,
      overrideAccess: true,
    });

    summaries.push({
      code: seed.code,
      id: created.id,
      operation: "created",
    });
  }

  return summaries;
}
