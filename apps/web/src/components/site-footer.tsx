import Link from "next/link";
import type { SiteLocale } from "@/config/i18n";
import { withLocale } from "@/config/site-routes";
import { getLocaleCopy } from "@/lib/copy/site-copy";
import type { CmsPage } from "@/lib/cms/types";

type SiteFooterProps = {
  editorialPages: CmsPage[];
  locale: SiteLocale;
};

export function SiteFooter({ editorialPages, locale }: SiteFooterProps) {
  const footerPages = editorialPages
    .filter((page) => page.showInFooter)
    .sort((left, right) => left.navigationOrder - right.navigationOrder);
  const atelierPages = footerPages.filter((page) =>
    ["brand", "technology", "craftsmanship", "projects"].includes(page.slug),
  );
  const supportPages = footerPages.filter((page) =>
    ["journal", "downloads", "contact"].includes(page.slug),
  );
  const getFooterPageLabel = (page: CmsPage) => {
    switch (page.slug) {
      case "brand":
        return getLocaleCopy(locale, { en: "Brand", de: "Marke", es: "Marca", fr: "Marque", zh: "品牌", ja: "ブランド", ru: "Бренд" });
      case "technology":
        return getLocaleCopy(locale, { en: "Technology", de: "Technologie", es: "Tecnología", fr: "Technologie", zh: "技术", ja: "テクノロジー", ru: "Технологии" });
      case "craftsmanship":
        return getLocaleCopy(locale, { en: "Craftsmanship", de: "Handwerk", es: "Maestría", fr: "Savoir-faire", zh: "工艺", ja: "クラフト", ru: "Мастерство" });
      case "projects":
        return getLocaleCopy(locale, { en: "Projects", de: "Projekte", es: "Proyectos", fr: "Projets", zh: "项目", ja: "プロジェクト", ru: "Проекты" });
      case "journal":
        return getLocaleCopy(locale, { en: "Journal", de: "Journal", es: "Diario", fr: "Journal", zh: "期刊", ja: "ジャーナル", ru: "Журнал" });
      case "downloads":
        return getLocaleCopy(locale, { en: "Materials", de: "Materialien", es: "Materiales", fr: "Documents", zh: "资料下载", ja: "資料", ru: "Материалы" });
      case "contact":
        return getLocaleCopy(locale, { en: "Contact", de: "Kontakt", es: "Contacto", fr: "Contact", zh: "联系", ja: "連絡先", ru: "Контакты" });
      default:
        return page.navigationLabel ?? page.title;
    }
  };

  return (
    <footer className="shell-footer mf" data-qa="site-footer">
      <div className="mf-top">
        <div className="mf-brand">
          <Link className="mf-logo-link" href={withLocale("/", locale)} aria-label="Montelar">
            <img
              className="mf-logo-symbol"
              src="/images/brand/montelar-symbol-gold-20260515.webp"
              alt=""
              width={64}
              height={64}
              decoding="async"
              loading="lazy"
            />
            <img
              className="mf-logo-wordmark"
              src="/images/brand/montelar-wordmark-gold-20260515.webp"
              alt="Montelar"
              width={250}
              height={58}
              decoding="async"
              loading="lazy"
            />
          </Link>
          <p className="mf-tag">
            {getLocaleCopy(locale, {
              en: "Architecture of image, sound and AI design. Private cinema, hi-end audio and image systems composed for any space.",
              de: "Architektur von Bild, Klang und KI-Design. Private Kinos, Hi-end-Audio und Bildsysteme für jeden Raum.",
              es: "Arquitectura de imagen, sonido y diseño con IA. Cine privado, hi-end audio y sistemas de imagen para cualquier espacio.",
              fr: "Architecture de l'image, du son et du design IA. Cinéma privé, audio hi-end et systèmes d'image pour tout espace.",
              zh: "图像、声音与 AI 设计的架构。为各种空间打造私人影院、Hi-end 音频与影像系统。",
              ja: "画像、音、AIデザインのアーキテクチャ。あらゆる空間のためのプライベートシネマ、Hi-endオーディオ、映像システム。",
              ru: "Архитектура изображения, звука и AI дизайна. Частный кинотеатр, hi-end аудио и системы изображения для любого пространства.",
            })}
          </p>
        </div>

        <section className="mf-col" aria-labelledby="footer-atelier">
          <h4 className="mf-col-head" id="footer-atelier">
            {getLocaleCopy(locale, {
              en: "Atelier",
              de: "Atelier",
              es: "Estudio",
              fr: "Atelier",
              zh: "工坊",
              ja: "アトリエ",
              ru: "Ателье",
            })}
          </h4>
          {atelierPages.map((page) => (
            <Link className="mf-link" href={withLocale(page.routePath, locale)} key={page.id}>
              {getFooterPageLabel(page)}
            </Link>
          ))}
        </section>

        <section className="mf-col" aria-labelledby="footer-inquiries">
          <h4 className="mf-col-head" id="footer-inquiries">
            {getLocaleCopy(locale, {
              en: "Inquiries",
              de: "Anfragen",
              es: "Consultas",
              fr: "Demandes",
              zh: "咨询",
              ja: "ご相談",
              ru: "Запросы",
            })}
          </h4>
          {supportPages.map((page) => (
            <Link className="mf-link" href={withLocale(page.routePath, locale)} key={page.id}>
              {getFooterPageLabel(page)}
            </Link>
          ))}
          <Link className="mf-link" href={withLocale("/contact", locale)}>
            {getLocaleCopy(locale, {
              en: "Request consultation",
              de: "Beratung anfragen",
              es: "Solicitar consulta",
              fr: "Demander une consultation",
              zh: "预约咨询",
              ja: "相談を依頼",
              ru: "Запросить консультацию",
            })}
          </Link>
        </section>
      </div>

      <div className="mf-bot">
        <span>
          {getLocaleCopy(locale, {
            en: "© Montelar — Quiet luxury",
            de: "© Montelar — Stiller Luxus",
            es: "© Montelar — Lujo silencioso",
            fr: "© Montelar — Luxe discret",
            zh: "© Montelar — 静奢",
            ja: "© Montelar — 静かなラグジュアリー",
            ru: "© Montelar — Тихая роскошь",
          })}
        </span>
        <Link className="mf-legal-link" href={withLocale("/privacy", locale)}>
          {getLocaleCopy(locale, {
            en: "Privacy policy",
            de: "Datenschutzerklärung",
            es: "Política de privacidad",
            fr: "Politique de confidentialité",
            zh: "隐私政策",
            ja: "プライバシーポリシー",
            ru: "Политика конфиденциальности",
          })}
        </Link>
      </div>
    </footer>
  );
}
