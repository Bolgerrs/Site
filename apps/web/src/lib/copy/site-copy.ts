import type { SiteLocale } from "@/config/i18n";

export function isRussianLocale(locale: SiteLocale) {
  return locale === "ru";
}

type LocaleCopy<T> = {
  en: T;
  zh?: T;
  ja?: T;
  de?: T;
  es?: T;
  fr?: T;
  ru?: T;
};

function normalizeLegacyPublicCopy<T>(value: T): T {
  if (typeof value !== "string") {
    return value;
  }

  return value
    .replaceAll(
      "Product notes give context",
      "Product context gives context",
    )
    .replaceAll(
      "Open the product notes",
      "Open product context",
    )
    .replaceAll("Product notes", "Product context")
    .replaceAll("product notes", "product context")
    .replaceAll(
      "Brand story, positioning and quiet-luxury worldview.",
      "Montelar brand language for image, sound and spatial design.",
    )
    .replaceAll(
      "Editorial updates, launches and cultural notes.",
      "Editorial notes on systems, materials, installations and the culture of quiet luxury.",
    )
    .replaceAll(
      "Dealer, partnership and direct brand contact surface.",
      "Consultation, projects and regional partner contact.",
    ) as T;
}

export function getLocaleCopy<T>(locale: SiteLocale, copy: LocaleCopy<T>) {
  if (locale === "ru" && copy.ru !== undefined) {
    return normalizeLegacyPublicCopy(copy.ru);
  }

  if (locale === "es" && copy.es !== undefined) {
    return normalizeLegacyPublicCopy(copy.es);
  }

  if (locale === "fr" && copy.fr !== undefined) {
    return normalizeLegacyPublicCopy(copy.fr);
  }

  if (locale === "zh" && copy.zh !== undefined) {
    return normalizeLegacyPublicCopy(copy.zh);
  }

  if (locale === "ja" && copy.ja !== undefined) {
    return normalizeLegacyPublicCopy(copy.ja);
  }

  if (locale === "de" && copy.de !== undefined) {
    return normalizeLegacyPublicCopy(copy.de);
  }

  return normalizeLegacyPublicCopy(copy.en);
}

export function localizeStaticCopy(
  locale: SiteLocale,
  english: string,
  russian: string,
  chinese?: string,
  japanese?: string,
  german?: string,
  spanish?: string,
  french?: string,
) {
  return getLocaleCopy(locale, {
    en: english,
    ru: russian,
    ...(chinese ? { zh: chinese } : {}),
    ...(japanese ? { ja: japanese } : {}),
    ...(german ? { de: german } : {}),
    ...(spanish ? { es: spanish } : {}),
    ...(french ? { fr: french } : {}),
  });
}
