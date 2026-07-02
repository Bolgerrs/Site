"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  buildLocalePreferenceCookie,
  localizePathname,
  localePreferenceCookiePath,
  localeSuggestionCookieName,
  type SiteLocale,
} from "@/config/i18n";
import { getLocaleCopy } from "@/lib/copy/site-copy";
import styles from "./locale-suggestion.module.css";

type LocaleSuggestionProps = {
  locale: SiteLocale;
  suggestedLocale: SiteLocale;
};

const localeLabels: Record<SiteLocale, string> = {
  ru: "RU",
  en: "EN",
  es: "ES",
  fr: "FR",
  zh: "ZH",
  ja: "JA",
  de: "DE",
};

const localeNames: Record<SiteLocale, Record<SiteLocale, string>> = {
  ru: { ru: "Русский", en: "Английский", es: "Испанский", fr: "Французский", zh: "Китайский", ja: "Японский", de: "Немецкий" },
  en: { ru: "Russian", en: "English", es: "Spanish", fr: "French", zh: "Chinese", ja: "Japanese", de: "German" },
  es: { ru: "Ruso", en: "Inglés", es: "Español", fr: "Francés", zh: "Chino", ja: "Japonés", de: "Alemán" },
  fr: { ru: "Russe", en: "Anglais", es: "Espagnol", fr: "Français", zh: "Chinois", ja: "Japonais", de: "Allemand" },
  zh: { ru: "俄语", en: "英语", es: "西班牙语", fr: "法语", zh: "中文", ja: "日语", de: "德语" },
  ja: { ru: "ロシア語", en: "英語", es: "スペイン語", fr: "フランス語", zh: "中国語", ja: "日本語", de: "ドイツ語" },
  de: { ru: "Russisch", en: "Englisch", es: "Spanisch", fr: "Französisch", zh: "Chinesisch", ja: "Japanisch", de: "Deutsch" },
};

function clearSuggestionCookie() {
  document.cookie = `${localeSuggestionCookieName}=; Max-Age=0; Path=${localePreferenceCookiePath}; SameSite=Lax`;
}

export function LocaleSuggestion({
  locale,
  suggestedLocale,
}: LocaleSuggestionProps) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const suggestionHref = localizePathname(pathname || "/", suggestedLocale);

  useEffect(() => {
    clearSuggestionCookie();
  }, []);

  if (!visible || suggestedLocale === locale) {
    return null;
  }

  return (
    <section
      aria-label={getLocaleCopy(locale, {
        en: "Language suggestion",
        de: "Sprachvorschlag",
        es: "Sugerencia de idioma",
        fr: "Suggestion de langue",
        zh: "语言建议",
        ja: "言語の提案",
        ru: "Подсказка по языку",
      })}
      className={styles.suggestion}
    >
      <div className={styles.copy}>
        <p className={styles.eyebrow}>
          {getLocaleCopy(locale, {
            en: "Locale hint",
            de: "Sprachhinweis",
            es: "Sugerencia regional",
            fr: "Suggestion regionale",
            zh: "区域语言提示",
            ja: "地域の言語ヒント",
            ru: "Подсказка по региону",
          })}
        </p>
        <p className={styles.text}>
          {getLocaleCopy(locale, {
            en: `Prefer ${localeNames[locale][suggestedLocale]} for this visit?`,
            de: `Mochten Sie fur diesen Besuch lieber ${localeNames[locale][suggestedLocale]}?`,
            es: `Prefiere ${localeNames[locale][suggestedLocale]} para esta visita?`,
            fr: `Preferez-vous ${localeNames[locale][suggestedLocale]} pour cette visite ?`,
            zh: `此次访问更适合使用${localeNames[locale][suggestedLocale]}吗？`,
            ja: `この訪問では${localeNames[locale][suggestedLocale]}の方がよろしいですか。`,
            ru: `Предпочитаете ${localeNames[locale][suggestedLocale]} для этого визита?`,
          })}
        </p>
      </div>
      <div className={styles.actions}>
        <Link
          className={styles.accept}
          href={suggestionHref}
          lang={suggestedLocale}
          onClick={() => {
            document.cookie = buildLocalePreferenceCookie(suggestedLocale);
            clearSuggestionCookie();
          }}
        >
          <span>{getLocaleCopy(locale, {
            en: "Switch",
            de: "Wechseln",
            es: "Cambiar",
            fr: "Changer",
            zh: "切换",
            ja: "切り替える",
            ru: "Переключить",
          })}</span>
          <span className={styles.chip}>{localeLabels[suggestedLocale]}</span>
        </Link>
        <button
          className={styles.dismiss}
          onClick={() => {
            clearSuggestionCookie();
            setVisible(false);
          }}
          type="button"
        >
          {getLocaleCopy(locale, {
            en: `Stay in ${localeLabels[locale]}`,
            de: `Bei ${localeLabels[locale]} bleiben`,
            es: `Seguir en ${localeLabels[locale]}`,
            fr: `Rester en ${localeLabels[locale]}`,
            zh: `继续使用 ${localeLabels[locale]}`,
            ja: `${localeLabels[locale]} のままにする`,
            ru: `Остаться на ${localeLabels[locale]}`,
          })}
        </button>
      </div>
    </section>
  );
}
