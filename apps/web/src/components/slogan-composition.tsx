import type { SiteLocale } from "@/config/i18n";
import { getLocaleCopy } from "@/lib/copy/site-copy";

type SloganCompositionProps = {
  className?: string;
  locale: SiteLocale;
};

export function SloganComposition({ className, locale }: SloganCompositionProps) {
  const label = getLocaleCopy(locale, {
    en: "Architecture of image, sound and AI design.",
    de: "Architektur von Bild, Klang und KI-Design.",
    es: "Arquitectura de imagen, sonido y diseño con IA.",
    fr: "Architecture de l'image, du son et du design IA.",
    zh: "图像、声音与 AI 设计的架构。",
    ja: "画像、音、AIデザインのアーキテクチャ。",
    ru: "Архитектура изображения, звука и AI дизайна.",
  });
  const prefix = locale === "zh" || locale === "ja"
    ? null
    : getLocaleCopy(locale, {
      en: "Architecture of",
      de: "Architektur von",
      es: "Arquitectura de",
      fr: "Architecture de",
      zh: "图像、声音与 AI 设计",
      ja: "画像、音、AIデザイン",
      ru: "Архитектура",
    });
  const suffix = locale === "zh" || locale === "ja"
    ? getLocaleCopy(locale, {
      en: "Architecture",
      de: "Architektur",
      es: "Arquitectura",
      fr: "Architecture",
      zh: "的架构",
      ja: "のアーキテクチャ",
      ru: "Архитектура",
    })
    : null;
  const terms = [
    getLocaleCopy(locale, { en: "Image", de: "Bild", es: "Imagen", fr: "Image", zh: "图像", ja: "画像", ru: "Изображение" }),
    getLocaleCopy(locale, { en: "Sound", de: "Klang", es: "Sonido", fr: "Son", zh: "声音", ja: "音", ru: "Звук" }),
    getLocaleCopy(locale, { en: "AI Design", de: "KI-Design", es: "Diseño IA", fr: "Design IA", zh: "AI 设计", ja: "AIデザイン", ru: "AI дизайн" }),
  ];
  const rootClassName = className
    ? `slogan-composition ${className}`
    : "slogan-composition";

  return (
    <div className={rootClassName} role="text" aria-label={label}>
      {prefix ? (
        <span className="slogan-prefix" aria-hidden="true">
          {prefix}
        </span>
      ) : null}
      <span className="slogan-terms" aria-hidden="true">
        {terms.map((term) => (
          <span key={term} className="slogan-term">
            {term}
          </span>
        ))}
      </span>
      {suffix ? (
        <span className="slogan-suffix" aria-hidden="true">
          {suffix}
        </span>
      ) : null}
    </div>
  );
}
