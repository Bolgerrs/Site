import type { ReactNode } from "react";
import { cookies } from "next/headers";
import {
  isSiteLocale,
  localeSuggestionCookieName,
  type SiteLocale,
} from "@/config/i18n";
import { EditorPreviewIndicator } from "@/components/editor-preview-indicator";
import { LocaleSuggestion } from "@/components/locale-suggestion";
// import { PrivacyNotice } from "@/components/privacy-notice"; // disabled temporarily
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SmoothWheelScroll } from "@/components/smooth-wheel-scroll";
import { ScrollReveal } from "@/components/scroll-reveal";
import { getLocaleCopy } from "@/lib/copy/site-copy";
import { getCmsClient } from "@/lib/cms/client";
import { isDraftPreviewEnabled } from "@/lib/editor-preview";

type SiteShellProps = {
  children: ReactNode;
  locale: SiteLocale;
};

export async function SiteShell({ children, locale }: SiteShellProps) {
  const cmsClient = getCmsClient();
  const cookieStore = await cookies();
  const previewEnabled = await isDraftPreviewEnabled();
  const localeSuggestionValue = cookieStore.get(localeSuggestionCookieName)?.value;
  const suggestedLocale =
    isSiteLocale(localeSuggestionValue) && localeSuggestionValue !== locale
      ? localeSuggestionValue
      : null;
  const [audioCategories, editorialPages, featuredProducts, launchDirections] = await Promise.all([
    cmsClient.listDirectionCategories("hi-end-audio", locale),
    cmsClient.listEditorialPages(locale),
    cmsClient.listFeaturedProducts(locale),
    cmsClient.listLaunchDirections(locale),
  ]);

  return (
    <div className="site-stage">
      <SmoothWheelScroll />
      <ScrollReveal />
      <a className="skip-link" href="#main-content">
        {getLocaleCopy(locale, {
          en: "Skip to content",
          de: "Zum Inhalt springen",
          es: "Saltar al contenido",
          fr: "Aller au contenu",
          zh: "跳转到内容",
          ja: "コンテンツへ移動",
          ru: "Перейти к содержанию",
        })}
      </a>

      <div className="site-shell">
        <div className="shell-topline">
          <p className="shell-topline-copy">{getLocaleCopy(locale, {
            en: "Architecture of image, sound and AI design",
            de: "Architektur von Bild, Klang und KI-Design",
            es: "Arquitectura de imagen, sonido y diseño con IA",
            fr: "Architecture de l'image, du son et du design IA",
            zh: "图像、声音与 AI 设计的架构",
            ja: "映像、音、AIデザインの建築",
            ru: "Архитектура изображения, звука и AI дизайна",
          })}</p>
          <div className="shell-chip-row">
            <span className="shell-chip">{getLocaleCopy(locale, {
              en: "Locale",
              de: "Sprache",
              es: "Idioma",
              fr: "Langue",
              zh: "语言",
              ja: "言語",
              ru: "Язык",
            })} {locale.toUpperCase()}</span>
            <span className="shell-chip">{getLocaleCopy(locale, {
              en: "Image. Sound. AI Design.",
              de: "Bild. Klang. Design.",
              es: "Imagen. Sonido. Diseño.",
              fr: "Image. Son. Design.",
              zh: "图像。声音。设计。",
              ja: "映像。音。デザイン。",
              ru: "Изображение. Звук. AI дизайн.",
            })}</span>
          </div>
        </div>

        {suggestedLocale ? (
          <LocaleSuggestion locale={locale} suggestedLocale={suggestedLocale} />
        ) : null}

        {previewEnabled ? <EditorPreviewIndicator locale={locale} /> : null}

        <SiteHeader
          audioCategories={audioCategories}
          editorialPages={editorialPages}
          featuredProducts={featuredProducts}
          launchDirections={launchDirections}
          locale={locale}
        />

        <main className="shell-main" id="main-content">
          {children}
        </main>

        <SiteFooter
          editorialPages={editorialPages}
          locale={locale}
        />

        {/* <PrivacyNotice locale={locale} /> */}
      </div>
    </div>
  );
}
