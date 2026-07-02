import Link from "next/link";
import { DacProductCarousel } from "@/components/dac-product-carousel";
import { withLocale } from "@/config/site-routes";
import { getLocaleCopy } from "@/lib/copy/site-copy";
import { getRequestLocale } from "@/lib/request-locale";
import { buildRouteMetadata } from "@/lib/seo/metadata";

export async function generateMetadata() {
  const locale = await getRequestLocale();

  return buildRouteMetadata({
    title: getLocaleCopy(locale, {
      en: "Prism Reference DAC — preview | Montelar",
      de: "Prism Reference DAC — Vorschau | Montelar",
      es: "Prism Reference DAC — vista previa | Montelar",
      fr: "Prism Reference DAC — aperçu | Montelar",
      zh: "Prism Reference DAC — 预览 | Montelar",
      ja: "Prism Reference DAC — プレビュー | Montelar",
      ru: "Prism Reference DAC — превью | Montelar",
    }),
    description: getLocaleCopy(locale, {
      en: "Internal preview of the interactive DAC product scene.",
      de: "Interne Vorschau der interaktiven DAC-Produktszene.",
      es: "Vista previa interna de la escena interactiva del DAC.",
      fr: "Aperçu interne de la scène produit DAC interactive.",
      zh: "交互式 DAC 产品场景的内部预览。",
      ja: "インタラクティブDAC製品シーンの内部プレビュー。",
      ru: "Внутреннее превью интерактивной сцены ЦАП.",
    }),
    path: "/dac-preview",
    locale,
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default async function DacPreviewPage() {
  const locale = await getRequestLocale();

  return (
    <article className="dac-page dac-page--scene-first">
      <h1 className="dac-three-srtitle">Prism Reference DAC</h1>

      <DacProductCarousel locale={locale} />

      <div className="dac-page-cta">
        <Link className="dac-page-action dac-page-action--primary" href={withLocale("/contact", locale)}>
          {getLocaleCopy(locale, {
            en: "Discuss this DAC",
            de: "Diesen DAC besprechen",
            es: "Consultar este DAC",
            fr: "Parler de ce DAC",
            zh: "咨询这台 DAC",
            ja: "このDACについて相談",
            ru: "Обсудить этот ЦАП",
          })}
        </Link>
        <Link className="dac-page-action" href={withLocale("/audio", locale)}>
          {getLocaleCopy(locale, {
            en: "Back to audio",
            de: "Zurück zu Audio",
            es: "Volver a audio",
            fr: "Retour à l'audio",
            zh: "返回音频",
            ja: "オーディオに戻る",
            ru: "Вернуться к аудио",
          })}
        </Link>
      </div>
    </article>
  );
}
