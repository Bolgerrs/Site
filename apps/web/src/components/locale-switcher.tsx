"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import {
  buildLocalePreferenceCookie,
  defaultSiteLocale,
  localizePathname,
  siteLocales,
  type SiteLocale,
} from "@/config/i18n";
import { getLocaleCopy } from "@/lib/copy/site-copy";

type LocaleSwitcherProps = {
  className?: string;
  locale: SiteLocale;
  mode?: "dropdown" | "inline";
  onNavigate?: () => void;
  preserveMobileNavOpen?: boolean;
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

export function LocaleSwitcher({
  className,
  locale,
  mode = "dropdown",
  onNavigate,
  preserveMobileNavOpen = false,
}: LocaleSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const currentPath = pathname || localizePathname("/", locale);
  const reactId = useId().replace(/:/g, "");
  const [open, setOpen] = useState(false);
  const [pendingLocale, setPendingLocale] = useState<SiteLocale | null>(null);
  const [pressedLocale, setPressedLocale] = useState<SiteLocale | null>(null);
  const switcherRef = useRef<HTMLDivElement>(null);
  const refreshTimeoutRef = useRef<number | null>(null);
  const pointerNavigationRef = useRef(false);
  const visibleLocale = pendingLocale ?? locale;
  const activeLocale = pendingLocale ?? locale;
  const switcherId = `locale-switcher-${visibleLocale}-${reactId}`;
  const orderedLocales = [
    activeLocale,
    ...siteLocales.filter((targetLocale) => targetLocale !== activeLocale),
  ];

  function clearRefreshTimeout() {
    if (refreshTimeoutRef.current) {
      window.clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  }

  function navigateToLocale(
    targetLocale: SiteLocale,
    targetHref: string,
    options: { closeDropdown?: boolean } = {},
  ) {
    if (targetLocale === locale && pendingLocale === null) {
      if (options.closeDropdown) {
        setOpen(false);
      }
      return;
    }

    clearRefreshTimeout();
    setPressedLocale(null);
    if (preserveMobileNavOpen) {
      window.sessionStorage.setItem("montelar-mobile-nav-open-after-locale", "true");
    }
    setPendingLocale(targetLocale);
    if (options.closeDropdown) {
      setOpen(false);
    }
    onNavigate?.();
    router.push(targetHref, { scroll: false });
    refreshTimeoutRef.current = window.setTimeout(() => {
      refreshTimeoutRef.current = null;
      router.refresh();
    }, 120);
  }

  useEffect(() => {
    if (pendingLocale) {
      document.cookie = buildLocalePreferenceCookie(pendingLocale);
    }
  }, [pendingLocale]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!switcherRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      clearRefreshTimeout();
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  if (mode === "inline") {
    return (
      <nav
        aria-label={getLocaleCopy(locale, {
          en: "Locale switcher",
          de: "Sprachumschalter",
          es: "Selector de idioma",
          fr: "Sélecteur de langue",
          zh: "语言切换",
          ja: "言語切替",
          ru: "Переключатель языка",
        })}
        className={`${className ?? ""} locale-switcher locale-switcher--inline`}
      >
        {siteLocales.map((targetLocale) => {
          const isCurrent = targetLocale === activeLocale;
          const isPressed = targetLocale === pressedLocale;
          const targetHref = localizePathname(currentPath, defaultSiteLocale);

          return (
            <Link
              aria-current={isCurrent ? "page" : undefined}
              aria-label={localeNames[locale][targetLocale]}
              className={`locale-switcher-pill${isCurrent ? " is-current" : ""}${isPressed ? " is-pressed" : ""}`}
              href={targetHref}
              key={targetLocale}
              lang={targetLocale}
              prefetch
              title={localeNames[locale][targetLocale]}
              onPointerDown={(event) => {
                event.stopPropagation();
                pointerNavigationRef.current = false;
                setPressedLocale(targetLocale);
              }}
              onPointerCancel={() => {
                setPressedLocale(null);
              }}
              onPointerLeave={() => {
                setPressedLocale(null);
              }}
              onPointerUp={(event) => {
                event.stopPropagation();
                pointerNavigationRef.current = true;
                navigateToLocale(targetLocale, targetHref);
              }}
              onClick={(event) => {
                event.stopPropagation();
                event.preventDefault();
                if (pointerNavigationRef.current) {
                  pointerNavigationRef.current = false;
                  return;
                }
                navigateToLocale(targetLocale, targetHref);
              }}
            >
              <span>{localeLabels[targetLocale]}</span>
              <span className="sr-only">{localeNames[locale][targetLocale]}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <div
      className={`${className ?? ""} locale-switcher${open ? " is-open" : ""}`}
      ref={switcherRef}
    >
      <p className="locale-switcher-label">
        {getLocaleCopy(locale, {
          en: "Language",
          de: "Sprache",
          es: "Idioma",
          fr: "Langue",
          zh: "语言",
          ja: "言語",
          ru: "Язык",
        })}
      </p>
      <button
        aria-label={localeNames[locale][visibleLocale]}
        aria-controls={switcherId}
        aria-expanded={open}
        className="locale-switcher-trigger"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span>{localeLabels[visibleLocale]}</span>
        <span aria-hidden="true" className="locale-switcher-chevron">v</span>
      </button>
      <div
        aria-label={getLocaleCopy(locale, {
          en: "Locale switcher",
          de: "Sprachumschalter",
          es: "Selector de idioma",
          fr: "Sélecteur de langue",
          zh: "语言切换",
          ja: "言語切替",
          ru: "Переключатель языка",
        })}
        className="locale-switcher-list"
        id={switcherId}
        role="list"
      >
        {orderedLocales.map((targetLocale) => {
          const isCurrent = targetLocale === activeLocale;
          const isPressed = targetLocale === pressedLocale;
          const targetHref = localizePathname(currentPath, defaultSiteLocale);

          return (
            <Link
              aria-current={isCurrent ? "page" : undefined}
              className={`locale-switcher-pill${isCurrent ? " is-current" : ""}${isPressed ? " is-pressed" : ""}`}
              href={targetHref}
              key={targetLocale}
              lang={targetLocale}
              prefetch
              aria-label={localeNames[locale][targetLocale]}
              title={localeNames[locale][targetLocale]}
              onPointerDown={(event) => {
                event.stopPropagation();
                pointerNavigationRef.current = false;
                setPressedLocale(targetLocale);
              }}
              onPointerCancel={() => {
                setPressedLocale(null);
              }}
              onPointerLeave={() => {
                setPressedLocale(null);
              }}
              onPointerUp={(event) => {
                event.stopPropagation();
                pointerNavigationRef.current = true;
                navigateToLocale(targetLocale, targetHref, { closeDropdown: true });
              }}
              onClick={(event) => {
                event.stopPropagation();
                event.preventDefault();
                if (pointerNavigationRef.current) {
                  pointerNavigationRef.current = false;
                  return;
                }
                navigateToLocale(targetLocale, targetHref, { closeDropdown: true });
              }}
            >
              <span>{localeLabels[targetLocale]}</span>
              <span className="sr-only">{localeNames[locale][targetLocale]}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
