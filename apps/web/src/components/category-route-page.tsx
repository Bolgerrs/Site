import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { withLocale } from "@/config/site-routes";
import { MotionReadyProductStage, type ProductMotionStage } from "@/components/motion-ready-product-stage";
import { RouteLuxMedia } from "@/components/route-lux-media";
import { RoutePageTemplate } from "@/components/route-page-template";
import { getCmsClient } from "@/lib/cms/client";
import { getLocaleCopy, isRussianLocale } from "@/lib/copy/site-copy";
import { getRequestLocale } from "@/lib/request-locale";
import { getCategorySeoKeywords } from "@/lib/seo/locale-seo";
import { buildRouteMetadata } from "@/lib/seo/metadata";

type CategoryRoutePageProps = {
  directionSlug: string;
  categorySlug: string;
  fallbackTitle: string;
  fallbackDescription: string;
  intro: string;
  notes: string[];
};

function formatLineLabel(lineSlug: string) {
  return lineSlug
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function pluralizeProducts(count: number, locale: Awaited<ReturnType<typeof getRequestLocale>>) {
  return getLocaleCopy(locale, {
    en: `${count} product option${count === 1 ? "" : "s"} are available from this family.`,
    de: `${count} Produktoption${count === 1 ? "" : "en"} sind in dieser Familie verfügbar.`,
    es: `${count} opción${count === 1 ? "" : "es"} de producto disponibles en esta familia.`,
    fr: `${count} option${count === 1 ? "" : "s"} produit disponibles dans cette famille.`,
    zh: `这个产品家族已有 ${count} 个产品入口。`,
    ja: `このファミリーには ${count} 件の製品入口があります。`,
    ru: `${count} продукт${count === 1 ? "" : "ов"} доступны для перехода из этой семьи.`,
  });
}

function pluralizeLines(count: number, locale: Awaited<ReturnType<typeof getRequestLocale>>) {
  return getLocaleCopy(locale, {
    en: `${count} series option${count === 1 ? "" : "s"} can make the system match more precise.`,
    de: `${count} Serienoption${count === 1 ? "" : "en"} verfeinern die Systemauswahl.`,
    es: `${count} opción${count === 1 ? "" : "es"} de serie ayudan a precisar el sistema.`,
    fr: `${count} option${count === 1 ? "" : "s"} de série affinent le choix système.`,
    zh: `${count} 个系列入口可进一步细化系统匹配。`,
    ja: `${count} 件のシリーズ入口がシステム選定をさらに絞ります。`,
    ru: `${count} серия${count === 1 ? "" : "й"} помогает точнее подобрать систему.`,
  });
}

function getCategoryMotionStage(
  directionSlug: string,
  categorySlug: string,
  locale: Awaited<ReturnType<typeof getRequestLocale>>,
): {
  stage: ProductMotionStage;
  eyebrow: string;
  title: string;
  body: string;
  steps: string[];
} | null {
  if (directionSlug !== "hi-end-audio" || categorySlug !== "speakers") {
    return null;
  }

  return {
    stage: {
      id: "audio-speakers-motion-ready",
      mode: "frame-sequence",
      productFamily: "hi-end-audio",
      posterSrc: "/images/standalone-approved/hi-end-audio-engineered-disassembly-poster.webp",
      frameBasePath: "/images/scroll-sequence/speaker-engineered-disassembly-webp-72",
      frameCount: 72,
      objectFit: "contain",
      desktopFocalPoint: { x: 52, y: 50 },
      mobileFocalPoint: { x: 50, y: 44 },
      copySafeZone: "left",
      reducedMotionSrc: "/images/standalone-approved/hi-end-audio-engineered-disassembly-poster.webp",
    },
    eyebrow: getLocaleCopy(locale, {
      en: "Speaker architecture",
      de: "Lautsprecherarchitektur",
      es: "Arquitectura del altavoz",
      fr: "Architecture de l'enceinte",
      zh: "扬声器架构",
      ja: "スピーカー構成",
      ru: "Архитектура акустики",
    }),
    title: getLocaleCopy(locale, {
      en: "Speaker architecture can become a scroll-controlled product film.",
      de: "Die Lautsprecherarchitektur kann zu einem scrollgeführten Produktfilm werden.",
      es: "La arquitectura del altavoz puede convertirse en una película de producto guiada por scroll.",
      fr: "L'architecture de l'enceinte peut devenir un film produit piloté au scroll.",
      zh: "扬声器架构可成为滚动控制的产品影片。",
      ja: "スピーカー構成はスクロール制御の製品フィルムへ展開できます。",
      ru: "Акустика может раскрываться как вертикальный product-film при прокрутке.",
    }),
    body: getLocaleCopy(locale, {
      en: "Scroll carries the existing 72-frame speaker sequence: cabinet, driver geometry and finish stay readable while the inquiry path remains in the same calm stage.",
      de: "Der Scroll führt die vorhandene 72-Frame-Lautsprechersequenz: Gehäuse, Treibergeometrie und Finish bleiben lesbar, während die Anfrage im selben ruhigen Bühnenbild bleibt.",
      es: "El scroll mueve la secuencia existente de 72 fotogramas: caja, geometría de drivers y acabado siguen legibles mientras la consulta queda en el mismo escenario sereno.",
      fr: "Le scroll porte la séquence enceinte existante en 72 images : coffret, géométrie des haut-parleurs et finition restent lisibles, avec la demande dans la même scène calme.",
      zh: "滚动驱动现有 72 帧扬声器序列：箱体、单元几何与饰面保持清晰，咨询入口留在同一个克制舞台中。",
      ja: "スクロールが既存の72フレームのスピーカーシーケンスを動かします。キャビネット、ドライバー形状、仕上げを読み取れるまま、相談導線を同じ静かなステージに保ちます。",
      ru: "Прокрутка ведет существующую 72-кадровую сцену акустики: корпус, геометрия излучателей и отделка остаются читаемыми, а заявка остается в том же спокойном кадре.",
    }),
    steps: [
      getLocaleCopy(locale, { en: "Stable product view", de: "Ruhige Produktansicht", es: "Vista estable del producto", fr: "Vue produit stable", zh: "稳定产品视图", ja: "安定した製品表示", ru: "Спокойный вид продукта" }),
      getLocaleCopy(locale, { en: "Cabinet and driver logic", de: "Gehäuse- und Treiberlogik", es: "Caja y lógica de drivers", fr: "Coffret et logique des haut-parleurs", zh: "箱体与单元逻辑", ja: "キャビネットとドライバーの構造", ru: "Корпус и излучатели" }),
      getLocaleCopy(locale, { en: "Request path stays visible", de: "Anfrage bleibt sichtbar", es: "La consulta sigue visible", fr: "La demande reste visible", zh: "咨询入口保持可见", ja: "相談導線を維持", ru: "Заявка остается рядом" }),
    ],
  };
}

export async function generateCategoryRouteMetadata(
  directionSlug: string,
  categorySlug: string,
  fallbackTitle: string,
  fallbackDescription: string,
): Promise<Metadata> {
  const locale = await getRequestLocale();
  const isRu = isRussianLocale(locale);
  const cmsClient = getCmsClient();
  const [category, direction] = await Promise.all([
    cmsClient.getCategoryBySlug(directionSlug, categorySlug, locale),
    cmsClient.getDirectionBySlug(directionSlug, locale),
  ]);

  return buildRouteMetadata({
    title: category
      ? `${category.label} | ${direction?.name ?? "Montelar"} | Montelar`
      : `${fallbackTitle} | Montelar`,
    description:
      category?.description ??
      (isRu ? "Категория Montelar Hi-end Audio с понятным сравнением продуктовых семей." : fallbackDescription),
    path: category?.routePath ?? `/audio/${categorySlug}`,
    locale,
    keywords: getCategorySeoKeywords(
      locale,
      category?.label ?? fallbackTitle,
      direction?.name,
    ),
  });
}

export async function CategoryRoutePage({
  directionSlug,
  categorySlug,
  fallbackTitle,
  fallbackDescription,
  intro,
  notes,
}: CategoryRoutePageProps) {
  const locale = await getRequestLocale();
  const cmsClient = getCmsClient();
  const [category, products] = await Promise.all([
    cmsClient.getCategoryBySlug(directionSlug, categorySlug, locale),
    cmsClient.listProductsByCategory(directionSlug, categorySlug, locale),
  ]);

  if (!category) {
    notFound();
  }

  const lineLinks = Array.from(
    new Map(
      products
        .filter((product) => Boolean(product.lineSlug))
        .map((product) => [
          product.lineSlug as string,
          {
            href: `/audio/${category.slug}/${product.lineSlug}`,
            label: formatLineLabel(product.lineSlug as string),
            description: getLocaleCopy(locale, {
              en: `${category.label} series for a more precise audio-system match.`,
              de: `${category.label} Serie für eine präzisere Abstimmung im Audiosystem.`,
              es: `Serie ${category.label} para una correspondencia de audio más precisa.`,
              fr: `Série ${category.label} pour un accord audio plus précis.`,
              zh: `${category.label} 系列，用于更精确的音响系统匹配。`,
              ja: `${category.label} シリーズはオーディオシステムの選定をさらに精密にします。`,
              ru: `Серия ${category.label} для более точного подбора внутри аудиосистемы.`,
            }),
          },
        ]),
    ).values(),
  );

  const productLinks = products.map((product) => ({
    href: product.routePath,
    label: product.name,
    description: product.shortDescription,
  }));
  const motionStage = getCategoryMotionStage(directionSlug, categorySlug, locale);

  const catEyebrow = getLocaleCopy(locale, { en: "Audio category", de: "Audiokategorie", es: "Categoria de audio", fr: "Categorie audio", zh: "音响分类", ja: "オーディオカテゴリ", ru: "Аудиокатегория" });
  const productsLabel = getLocaleCopy(locale, { en: "Products in this family", de: "Produkte", es: "Productos", fr: "Produits", zh: "产品", ja: "製品", ru: "Продукты этой семьи" });
  const seriesLabel = getLocaleCopy(locale, { en: "Series", de: "Serien", es: "Series", fr: "Series", zh: "系列", ja: "シリーズ", ru: "Серии" });
  const openLabel = getLocaleCopy(locale, { en: "Open product", de: "Produkt offnen", es: "Abrir producto", fr: "Ouvrir le produit", zh: "查看产品", ja: "製品を見る", ru: "Открыть продукт" });
  const seriesOpenLabel = getLocaleCopy(locale, { en: "Open series", de: "Serie offnen", es: "Abrir serie", fr: "Ouvrir la serie", zh: "查看系列", ja: "シリーズを見る", ru: "Открыть серию" });
  const requestLabel = getLocaleCopy(locale, { en: "Request consultation", de: "Beratung anfragen", es: "Solicitar consulta", fr: "Demander une consultation", zh: "请求咨询", ja: "相談を依頼", ru: "Запросить консультацию" });
  const catStatement = category.description ?? getLocaleCopy(locale, { en: "Montelar narrows hi-end audio to one family so products are compared within the listening-room context.", ru: "Montelar сужает hi-end audio до одной семьи, чтобы продукты сравнивались в контексте комнаты прослушивания." });
  const ctaTitle = getLocaleCopy(locale, { en: "Shape this family around one room.", ru: "Соберём эту семью под вашу комнату.", de: "Diese Familie um einen Raum herum gestalten.", es: "Componer esta familia en torno a una sala.", fr: "Composer cette famille autour d'une piece.", zh: "围绕一个空间构建这个家族。", ja: "一つの空間を軸にこのファミリーを構成する。" });

  return (
    <main className="dir-page">
      <section className="dir-hero">
        <img className="dir-hero-img" src="/images/site-vis-021a/hi-end-audio/web-context.webp" alt={category.label ?? fallbackTitle} data-atomic-media="" decoding="async" fetchPriority="high" loading="eager" draggable={false} />
        <span className="dir-hero-scrim" aria-hidden="true" />
        <div className="dir-hero-copy">
          <p className="dir-eyebrow">{catEyebrow}</p>
          <h1 className="dir-title">{category.label ?? fallbackTitle}</h1>
          {intro ? <p className="dir-lead">{intro}</p> : null}
        </div>
      </section>

      <section className="dir-statement">
        <div className="dir-wrap">
          <p className="dir-eyebrow">{getLocaleCopy(locale, { en: "Listening-room family", de: "Horraumfamilie", es: "Familia de sala", fr: "Famille d'ecoute", zh: "听音室家族", ja: "リスニングルーム系統", ru: "Семья комнаты прослушивания" })}</p>
          <h2 className="dir-statement-title">{catStatement}</h2>
        </div>
      </section>

      {motionStage ? (
        <section className="dir-motion">
          <MotionReadyProductStage
            body={motionStage.body}
            eyebrow={motionStage.eyebrow}
            primaryHref={withLocale(productLinks[0]?.href ?? `/audio/${category.slug}`, locale)}
            primaryLabel={openLabel}
            secondaryHref={withLocale(`/audio`, locale)}
            secondaryLabel={category.label ?? "Montelar"}
            stage={motionStage.stage}
            steps={motionStage.steps}
            title={motionStage.title}
          />
        </section>
      ) : null}

      {productLinks.length ? (
        <section className="dir-line">
          <div className="dir-wrap"><p className="dir-eyebrow">{productsLabel}</p></div>
          <ol className="dir-products">
            {productLinks.map((product, index) => (
              <li className="dir-product" key={product.href}>
                <span className="dir-product-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <div className="dir-product-body">
                  <h3 className="dir-product-name">{product.label}</h3>
                  {product.description ? <p className="dir-product-desc">{product.description}</p> : null}
                  <div className="dir-product-actions"><Link className="dir-link" href={withLocale(product.href, locale)}>{openLabel}</Link></div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {lineLinks.length ? (
        <section className="dir-line">
          <div className="dir-wrap"><p className="dir-eyebrow">{seriesLabel}</p></div>
          <ol className="dir-products">
            {lineLinks.map((line, index) => (
              <li className="dir-product" key={line.href}>
                <span className="dir-product-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <div className="dir-product-body">
                  <h3 className="dir-product-name">{line.label}</h3>
                  {line.description ? <p className="dir-product-desc">{line.description}</p> : null}
                  <div className="dir-product-actions"><Link className="dir-link" href={withLocale(line.href, locale)}>{seriesOpenLabel}</Link></div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section className="dir-cta">
        <div className="dir-wrap">
          <h2 className="dir-cta-title">{ctaTitle}</h2>
          <Link className="dir-link dir-link--lg" href={withLocale("/contact", locale)}>{requestLabel}</Link>
        </div>
      </section>
    </main>
  );
}
