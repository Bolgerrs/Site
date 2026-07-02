import Link from "next/link";
import type { Metadata } from "next";
import { productDetailPath, productRequestPath, withLocale } from "@/config/site-routes";
import { RoutePageTemplate } from "@/components/route-page-template";
import { getCmsClient } from "@/lib/cms/client";
import { getLocaleCopy } from "@/lib/copy/site-copy";
import { getRequestLocale } from "@/lib/request-locale";
import { getEditorialSeoKeywords } from "@/lib/seo/locale-seo";
import { buildRouteMetadata } from "@/lib/seo/metadata";

const adjacentEditorialSlugs = ["technology", "journal", "contact", "brand"] as const;
const documentDirectionSlugs = [
  "vision-max",
  "hi-end-audio",
  "living-glass",
  "display-for-exhibition",
] as const;

export async function generateDownloadsRouteMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const downloadsPage = await getCmsClient().getEditorialPageBySlug("downloads", locale);

  return buildRouteMetadata({
    title: downloadsPage?.seo.title ?? "Downloads | Montelar",
    description:
      downloadsPage?.seo.description ??
      getLocaleCopy(locale, {
        en: "Brochures, specifications and project documents for private review.",
        de: "Broschueren, Spezifikationen und Projektdokumente fuer die private Pruefung.",
        es: "Folletos, especificaciones y documentos de proyecto para revision privada.",
        fr: "Brochures, specifications et documents projet pour une revue privee.",
        zh: "供私下审阅的手册、规格与项目文件。",
        ja: "個別確認のための冊子、仕様資料、プロジェクト文書。",
        ru: "Брошюры, спецификации и проектные документы для частного изучения.",
      }),
    path: downloadsPage?.seo.routePath ?? downloadsPage?.routePath ?? "/downloads",
    locale,
    keywords: getEditorialSeoKeywords(
      locale,
      "downloads",
      downloadsPage?.title ?? "Downloads",
    ),
  });
}

export async function DownloadsRoutePage() {
  const locale = await getRequestLocale();
  const cmsClient = getCmsClient();
  const [downloadsPage, directions, editorialPages, featuredProducts] = await Promise.all([
    cmsClient.getEditorialPageBySlug("downloads", locale),
    cmsClient.listLaunchDirections(locale),
    cmsClient.listEditorialPages(locale),
    cmsClient.listFeaturedProducts(locale),
  ]);

  const resolvedTitle = downloadsPage?.title ?? "Downloads";
  const resolvedSummary =
    downloadsPage?.heroSummary ??
    getLocaleCopy(locale, {
      en: "Brochures, specifications and project documents for private review.",
      de: "Broschüren, Spezifikationen und Projektdokumente für private Prüfung.",
      es: "Folletos, especificaciones y documentos de proyecto para revisión privada.",
      fr: "Brochures, spécifications et documents projet pour une revue privée.",
      zh: "用于私人审阅的手册、规格资料与项目文件。",
      ja: "個別検討のための冊子、仕様資料、プロジェクト文書。",
      ru: "Брошюры, спецификации и проектные документы для частного изучения.",
    });
  const adjacentPages = adjacentEditorialSlugs
    .map((slug) => editorialPages.find((page) => page.slug === slug))
    .filter((page): page is NonNullable<typeof page> => Boolean(page));
  const documentDirections = documentDirectionSlugs
    .map((slug) => directions.find((direction) => direction.slug === slug))
    .filter((direction): direction is NonNullable<typeof direction> => Boolean(direction));
  const documentReadyProducts = featuredProducts.filter((product) =>
    documentDirectionSlugs.includes(product.directionSlug as (typeof documentDirectionSlugs)[number]),
  );

  return (
    <RoutePageTemplate
      eyebrow={getLocaleCopy(locale, { en: "Downloads", de: "Downloads", es: "Descargas", fr: "Téléchargements", zh: "资料下载", ja: "ダウンロード", ru: "Материалы" })}
      title={resolvedTitle}
      intro={resolvedSummary}
      status={getLocaleCopy(locale, { en: "For conversations that need brochures, specifications or project documents before a private review.", de: "Für Gespräche, die vor einer privaten Prüfung Broschüren, Spezifikationen oder Projektdokumente brauchen.", es: "Para conversaciones que necesitan folletos, especificaciones o documentos de proyecto antes de una revisión privada.", fr: "Pour les échanges qui nécessitent brochures, spécifications ou documents projet avant une revue privée.", zh: "用于在私人评审前需要手册、规格或项目文件的对话。", ja: "プライベートレビューの前に冊子、仕様資料、プロジェクト文書が必要な会話のための領域です。", ru: "Для разговоров, где до частного разбора нужны брошюры, спецификации или проектные документы." })}
      nextTask={getLocaleCopy(locale, { en: "The relevant direction or product gives context before the exact document request.", de: "Die passende Richtung oder das Produkt liefert Kontext vor der konkreten Dokumentanfrage.", es: "La dirección o el producto relevante aporta contexto antes de pedir documentos concretos.", fr: "La direction ou le produit concerné donne le contexte avant la demande de documents.", zh: "相关方向或产品会在具体资料请求前提供语境。", ja: "関連するディレクションまたは製品が、具体的な資料依頼の前に文脈を与えます。", ru: "Подходящее направление или продукт задают контекст до запроса конкретных материалов." })}
      notes={[
        getLocaleCopy(locale, {
          en: "Downloads supports conversations that need a brochure, specification sheet or document pack.",
          de: "Downloads unterstützt Gespräche, die Broschüre, Spezifikation oder Dokumentenpaket brauchen.",
          es: "Descargas apoya conversaciones que necesitan folleto, ficha técnica o paquete documental.",
          fr: "Téléchargements soutient les échanges qui nécessitent brochure, fiche ou dossier documentaire.",
          zh: "资料下载支持需要手册、规格表或文件包的对话。",
          ja: "ダウンロードは冊子、仕様書、資料パックが必要な会話を支えます。",
          ru: "Материалы поддерживают разговоры, где нужны брошюра, спецификация или пакет документов.",
        }),
        getLocaleCopy(locale, {
          en: "Direction pages below help you decide which family of materials is relevant before requesting files.",
          de: "Die Richtungen helfen, vor der Dateianfrage die richtige Dokumentenfamilie zu bestimmen.",
          es: "Las direcciones ayudan a decidir qué familia de materiales corresponde antes de solicitar archivos.",
          fr: "Les directions aident à choisir la famille de documents avant la demande de fichiers.",
          zh: "下方方向可帮助在请求文件前确定相关资料家族。",
          ja: "下のディレクションは、ファイル依頼の前に必要な資料群を見極める助けになります。",
          ru: "Направления ниже помогают выбрать нужную семью материалов до запроса файлов.",
        }),
        getLocaleCopy(locale, {
          en: "If you already know the product, open its detail or request documents directly.",
          de: "Wenn das Produkt klar ist, führt der direkte Weg zu Detailseite oder Anfrage.",
          es: "Si ya conoce el producto, vaya directamente a su detalle o solicitud.",
          fr: "Si le produit est déjà clair, le détail ou la demande liée conviennent.",
          zh: "如果已经知道产品，可直接进入详情或咨询路径。",
          ja: "製品が分かっている場合は、詳細または依頼へ直接進めます。",
          ru: "Если продукт уже понятен, переходите прямо в карточку или заявку.",
        }),
      ]}
      links={adjacentPages.map((page) => ({
        href: page.routePath,
        label: page.navigationLabel ?? page.title,
        description: page.heroSummary ?? page.title,
      }))}
      linksTitle={getLocaleCopy(locale, { en: "Related reading", de: "Verwandte Kapitel", es: "Lectura relacionada", fr: "Lecture associee", zh: "相关章节", ja: "関連する章", ru: "Связанные разделы" })}
      locale={locale}
    >
      <div className="route-grid">
        <div className="route-panel">
          <p className="eyebrow">{getLocaleCopy(locale, { en: "Document library", de: "Dokumentbibliothek", es: "Biblioteca documental", fr: "Bibliotheque documentaire", zh: "资料库", ja: "ドキュメントライブラリ", ru: "Библиотека документов" })}</p>
          <p className="route-intro compact">
            {getLocaleCopy(locale, {
              en: "Downloads gathers brochures, specification packs and project collateral in one practical place.",
              de: "Downloads bündelt Broschüren, Spezifikationspakete und Projektunterlagen an einem praktischen Ort.",
              es: "Descargas reune folletos, paquetes de especificaciones y materiales de proyecto en un lugar practico.",
              fr: "Telechargements rassemble brochures, packs de specifications et documents projet dans un lieu pratique.",
              zh: "资料下载把手册、规格包和项目资料集中到一个实用入口。",
              ja: "ダウンロードは冊子、仕様資料、プロジェクト資料を一つの実用的な場所にまとめます。",
              ru: "Раздел материалов собирает брошюры, пакеты спецификаций и проектные документы в одной практичной точке входа.",
            })}
          </p>
          <ul className="status-list">
            <li>{getLocaleCopy(locale, { en: "Documents matter once the conversation needs more than inspiration.", de: "Dokumente werden wichtig, sobald das Gespräch mehr als Inspiration braucht.", es: "Los documentos importan cuando la conversación necesita algo más que inspiración.", fr: "Les documents comptent lorsque l'échange demande plus que de l'inspiration.", zh: "当对话不再只是灵感而需要依据时，文件变得重要。", ja: "会話がインスピレーション以上の根拠を必要とするとき、資料が重要になります。", ru: "Документы важны, когда разговору нужно больше, чем вдохновение." })}</li>
            <li>{getLocaleCopy(locale, { en: "Direction pages help choose the right family of materials first.", de: "Richtungsseiten helfen zuerst, die richtige Materialfamilie zu wählen.", es: "Las direcciones ayudan a elegir primero la familia correcta de materiales.", fr: "Les directions aident d'abord à choisir la bonne famille de documents.", zh: "方向页面先帮助选择正确的资料家族。", ja: "ディレクションページは、まず適切な資料群を選ぶ助けになります。", ru: "Направления помогают сначала выбрать нужную семью материалов." })}</li>
            <li>{getLocaleCopy(locale, { en: "Product context helps orient the request; document requests are useful when the target is already clear.", de: "Produktkontext hilft bei der Orientierung; Dokumentanfragen helfen, wenn das Ziel klar ist.", es: "El contexto del producto orienta la solicitud; pedir documentos sirve cuando el objetivo ya está claro.", fr: "Le contexte produit oriente la demande ; les documents conviennent lorsque la cible est claire.", zh: "产品语境帮助定位请求；目标明确时可直接请求资料。", ja: "製品文脈が依頼の方向を示し、対象が明確な場合は資料依頼が有効です。", ru: "Контекст продукта помогает сориентировать запрос; материалы полезны, когда цель уже понятна." })}</li>
          </ul>
        </div>

        <div className="route-panel">
          <p className="eyebrow">{getLocaleCopy(locale, { en: "Document-bearing directions", de: "Richtungen mit Dokumenten", es: "Direcciones con documentos", fr: "Directions avec documents", zh: "带资料的方向", ja: "資料を持つ方向", ru: "Направления с документами" })}</p>
          <div className="route-link-list">
            {documentDirections.map((direction) => (
              <Link
                key={direction.slug}
                className="route-link-card"
                href={withLocale(direction.routePath, locale)}
              >
                <span className="route-link-label">
                  {direction.navigationLabel ?? direction.name}
                </span>
                <span className="route-link-description">{direction.shortDescription}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="route-panel product-blueprint-panel">
        <p className="eyebrow">{getLocaleCopy(locale, { en: "Document requests", de: "Dokumentanfragen", es: "Solicitudes de documentos", fr: "Demandes de documents", zh: "资料请求", ja: "資料依頼", ru: "Запросы документов" })}</p>
        <p className="product-route-summary">
          {getLocaleCopy(locale, {
            en: "Open product context first, or request documents directly when you already know what to ask for.",
            de: "Produktdetails geben Kontext; Dokumente können direkt angefragt werden, wenn der Bedarf klar ist.",
            es: "Abra el detalle de producto para obtener contexto, o solicite documentos directamente si ya sabe qué pedir.",
            fr: "Ouvrez la fiche produit pour le contexte, ou demandez directement les documents si vous savez déjà ce qu'il vous faut.",
            zh: "可先打开产品详情了解语境；如果已知道所需内容，可直接请求资料。",
            ja: "文脈を確認するには製品詳細を開き、必要な資料が分かっている場合は直接依頼できます。",
            ru: "Откройте карточку продукта для контекста или запрашивайте материалы сразу, если уже понимаете, что именно нужно.",
          })}
        </p>
        <div className="product-section-grid">
          {documentReadyProducts.slice(0, 4).map((product) => (
            <div key={product.slug} className="route-link-card compact product-section-card">
              <span className="route-link-label">{product.name}</span>
              <span className="route-link-description">{product.shortDescription}</span>
              <div className="route-link-list compact">
                <Link
                  className="route-link-card compact"
                  href={productDetailPath(product.slug, locale)}
                >
                <span className="route-link-label">{getLocaleCopy(locale, { en: "Product context", de: "Produktkontext", es: "Contexto del producto", fr: "Contexte produit", zh: "产品语境", ja: "製品文脈", ru: "Контекст продукта" })}</span>
                </Link>
                <Link
                  className="route-link-card compact"
                  href={productRequestPath(product.slug, locale)}
                >
                  <span className="route-link-label">{getLocaleCopy(locale, { en: "Request documents", de: "Dokumente anfragen", es: "Solicitar documentos", fr: "Demander des documents", zh: "请求资料", ja: "資料を依頼", ru: "Запросить документы" })}</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </RoutePageTemplate>
  );
}
