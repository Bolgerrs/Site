"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SiteLocale } from "@/config/i18n";
import { withLocale } from "@/config/site-routes";
import { getLocaleCopy } from "@/lib/copy/site-copy";

const privacyNoticeStorageKey = "montelar_privacy_notice_closed_v1";

type PrivacyNoticeProps = {
  locale: SiteLocale;
};

export function PrivacyNotice({ locale }: PrivacyNoticeProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(privacyNoticeStorageKey) !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  const close = () => {
    try {
      window.localStorage.setItem(privacyNoticeStorageKey, "1");
    } catch {
      // The notice may still be closed for this session if storage is blocked.
    }

    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <aside className="privacy-notice" aria-label={getLocaleCopy(locale, {
      en: "Privacy notice",
      ru: "Уведомление о конфиденциальности",
    })}>
      <div className="privacy-notice-copy">
        <p className="privacy-notice-title">
          {getLocaleCopy(locale, {
            en: "Privacy and technical cookies",
            ru: "Конфиденциальность и технические cookies",
          })}
        </p>
        <p>
          {getLocaleCopy(locale, {
            en: "We use necessary technical data to keep the site language, forms and private consultation flow working.",
            ru: "Мы используем необходимые технические данные для работы языка сайта, форм и маршрута частной консультации.",
          })}
        </p>
      </div>
      <div className="privacy-notice-actions">
        <Link className="privacy-notice-link" href={withLocale("/privacy", locale)}>
          {getLocaleCopy(locale, { en: "Policy", ru: "Политика" })}
        </Link>
        <button className="privacy-notice-button" type="button" onClick={close}>
          {getLocaleCopy(locale, { en: "Close", ru: "Закрыть" })}
        </button>
      </div>
    </aside>
  );
}
