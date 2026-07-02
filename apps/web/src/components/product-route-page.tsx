import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { productRequestPath, withLocale } from "@/config/site-routes";
import { DacLanding } from "@/components/dac-landing";
import { StreamerLanding } from "@/components/streamer-landing";
import { StreamerRoonLanding } from "@/components/streamer-roon-landing";
import { AcousticsLanding } from "@/components/acoustics-landing";
import { ConductorClockLanding } from "@/components/conductor-clock-landing";
import { ConductorCablesLanding } from "@/components/conductor-cables-landing";
import { ConductorProcessorLanding } from "@/components/conductor-processor-landing";
import { MotionReadyProductStage, type ProductMotionStage } from "@/components/motion-ready-product-stage";
import { RouteLuxMedia } from "@/components/route-lux-media";
import { RoutePageTemplate } from "@/components/route-page-template";
import { getCmsClient } from "@/lib/cms/client";
import { getLocaleCopy, isRussianLocale } from "@/lib/copy/site-copy";
import type { CmsProduct } from "@/lib/cms/types";
import { getRequestLocale } from "@/lib/request-locale";
import { getProductSeoKeywords } from "@/lib/seo/locale-seo";
import { buildRouteMetadata } from "@/lib/seo/metadata";
import type { SiteLocale } from "@/config/i18n";

type ProductRoutePageProps = {
  productSlug: string;
};

function formatAvailabilityMode(mode: string, locale: SiteLocale) {
  if (mode === "by-request") {
    return getLocaleCopy(locale, {
      en: "By request",
      de: "Auf Anfrage",
      es: "Bajo consulta",
      fr: "Sur demande",
      zh: "按咨询提供",
      ja: "相談に応じて提供",
      ru: "По запросу",
    });
  }

  return mode
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function formatSectionLabel(sectionKey: string) {
  return sectionKey
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function getSectionLabel(sectionKey: string, locale: SiteLocale) {
  const sectionLabels: Record<string, Record<SiteLocale, string>> = {
    hero: {
      en: "First impression",
      de: "Erster Eindruck",
      es: "Primera impresión",
      fr: "Première impression",
      zh: "第一印象",
      ja: "第一印象",
      ru: "Первое впечатление",
    },
    "architectural-integration": {
      en: "Architectural fit",
      de: "Architektonische Einbindung",
      es: "Encaje arquitectónico",
      fr: "Intégration architecturale",
      zh: "建筑适配",
      ja: "建築との調和",
      ru: "Архитектурная интеграция",
    },
    "content-mode": {
      en: "Presentation behavior",
      de: "Präsentationsverhalten",
      es: "Comportamiento de presentación",
      fr: "Comportement de présentation",
      zh: "呈现方式",
      ja: "プレゼンテーションの振る舞い",
      ru: "Поведение презентации",
    },
    inquiry: {
      en: "Private consultation",
      de: "Private Beratung",
      es: "Consulta privada",
      fr: "Consultation privée",
      zh: "私人咨询",
      ja: "プライベート相談",
      ru: "Частная консультация",
    },
    "object-stage": {
      en: "Object and showcase",
      de: "Objekt und Vitrine",
      es: "Objeto y vitrina",
      fr: "Objet et vitrine",
      zh: "物件与展柜",
      ja: "オブジェクトとショーケース",
      ru: "Объект и витрина",
    },
    "use-cases": {
      en: "Project scenarios",
      de: "Projektszenarien",
      es: "Escenarios de proyecto",
      fr: "Scénarios de projet",
      zh: "项目场景",
      ja: "プロジェクトシナリオ",
      ru: "Сценарии проекта",
    },
  };

  return sectionLabels[sectionKey]?.[locale] ?? formatSectionLabel(sectionKey);
}

function getSectionDescription(sectionKey: string, locale: SiteLocale) {
  const sectionDescriptions: Record<string, Record<SiteLocale, string>> = {
    hero: {
      en: "First-screen identity, category context and private advisory entry.",
      de: "Erster Eindruck, Kategoriekontext und Zugang zur privaten Beratung.",
      es: "Identidad inicial, contexto de categoría y acceso privado a consulta.",
      fr: "Identité du premier écran, contexte de catégorie et entrée en conseil privé.",
      zh: "首屏身份、分类语境与私人咨询入口。",
      ja: "ファーストビューの個性、カテゴリ文脈、プライベート相談の入口。",
      ru: "Идентичность первого экрана, контекст категории и вход в частную консультацию.",
    },
    inquiry: {
      en: "Dedicated consultation with product-specific context.",
      de: "Eigene Beratung mit produktspezifischem Kontext.",
      es: "Consulta dedicada con contexto específico del producto.",
      fr: "Consultation dédiée avec contexte propre au produit.",
      zh: "带有产品语境的专属咨询。",
      ja: "製品固有の文脈を持つ専用相談。",
      ru: "Отдельная консультация с продуктовым контекстом.",
    },
    "room-fit": {
      en: "Room, placement and architectural constraints for the advisory brief.",
      de: "Raum, Platzierung und architektonische Grenzen für den Beratungsbrief.",
      es: "Sala, ubicación y límites arquitectónicos para el brief de consulta.",
      fr: "Pièce, placement et contraintes architecturales pour le brief conseil.",
      zh: "房间、摆放与建筑限制，用于咨询 brief。",
      ja: "相談ブリーフのための部屋、配置、建築上の制約。",
      ru: "Комната, размещение и архитектурные ограничения для консультационного брифа.",
    },
    "system-fit": {
      en: "System pairing, source chain and installation compatibility notes.",
      de: "Systemabstimmung, Quellkette und Hinweise zur Installationskompatibilität.",
      es: "Correspondencia del sistema, cadena de fuente y compatibilidad de instalación.",
      fr: "Accord système, chaîne source et compatibilité d'installation.",
      zh: "系统匹配、音源链路与安装兼容性。",
      ja: "システムの組み合わせ、ソースチェーン、設置互換性。",
      ru: "Системные пары, тракт источника и заметки по совместимости инсталляции.",
    },
    "finish-language": {
      en: "Material, finish and interior integration language.",
      de: "Material, Oberfläche und Sprache der Integration in den Innenraum.",
      es: "Material, acabado y lenguaje de integración interior.",
      fr: "Matière, finition et langage d'intégration intérieure.",
      zh: "材质、饰面与室内整合语言。",
      ja: "素材、仕上げ、インテリア統合の言語。",
      ru: "Материалы, отделка и язык интеграции в интерьер.",
    },
    "content-mode": {
      en: "Content states, presentation behavior and operating mode.",
      de: "Content-Zustände, Präsentationsverhalten und Betriebsmodus.",
      es: "Estados de contenido, comportamiento de presentación y modo operativo.",
      fr: "États de contenu, comportement de présentation et mode d'exploitation.",
      zh: "内容状态、呈现方式与运行模式。",
      ja: "コンテンツ状態、プレゼンテーションの振る舞い、運用モード。",
      ru: "Состояния контента, поведение презентации и рабочий режим.",
    },
    "use-cases": {
      en: "Residential, gallery, retail and project scenarios.",
      de: "Szenarien für Residenzen, Galerien, Retail und Projekte.",
      es: "Escenarios residenciales, de galería, retail y proyecto.",
      fr: "Scénarios résidentiels, galerie, retail et projet.",
      zh: "住宅、画廊、零售与项目场景。",
      ja: "住宅、ギャラリー、リテール、プロジェクトのシナリオ。",
      ru: "Сценарии для резиденций, галерей, ритейла и проектов.",
    },
  };

  return sectionDescriptions[sectionKey]?.[locale] ??
    getLocaleCopy(locale, {
      en: "This topic connects the product to room, material and consultation context.",
      de: "Dieses Thema verbindet das Produkt mit Raum, Material und Beratungskontext.",
      es: "Este tema conecta el producto con espacio, material y consulta.",
      fr: "Ce thème relie le produit à la pièce, à la matière et au conseil.",
      zh: "这个主题把产品与空间、材质和咨询语境连接起来。",
      ja: "このテーマは製品を空間、素材、相談文脈につなげます。",
      ru: "Блок связывает продукт с пространством, материалом и консультационным сценарием.",
    });
}

function getLineRoutePath(product: CmsProduct, categoryRoutePath?: string) {
  if (!product.lineSlug || !categoryRoutePath) {
    return null;
  }

  return `${categoryRoutePath}/${product.lineSlug}`;
}

function getProductObjectClass(product: CmsProduct) {
  if (product.categorySlug === "speakers") {
    return "is-speaker";
  }

  if (product.categorySlug === "perfect-conductors") {
    return "is-cable";
  }

  if (product.directionSlug === "vision-max") {
    return "is-cinema";
  }

  if (product.directionSlug === "living-glass") {
    return "is-glass";
  }

  if (product.directionSlug === "hologram") {
    return "is-vitrine";
  }

  if (product.directionSlug === "pictorial-art-display") {
    return "is-frame";
  }

  if (product.directionSlug === "display-for-exhibition") {
    return "is-display";
  }

  return "is-component";
}

function getProductLuxMediaSource(product: CmsProduct) {
  if (product.slug === "vision-max-premium" || product.directionSlug === "vision-max") {
    return {
      src: "/images/production-visual-sprint/homepage/vision-max-screen-vm-021-keyed.webp",
      variant: "cinema" as const,
    };
  }

  if (product.slug === "monolith-reference" || product.categorySlug === "speakers") {
    return {
      src: "/images/production-visual-sprint/homepage/hi-end-audio-rack-ha-013.webp",
      variant: "audio" as const,
    };
  }

  if (product.directionSlug === "living-glass") {
    return {
      src: "/images/production-visual-sprint/homepage/living-glass-architecture-lg-076.webp",
      variant: "display" as const,
    };
  }

  return null;
}

function getProductMotionStage(
  product: CmsProduct,
  locale: SiteLocale,
): {
  stage: ProductMotionStage;
  eyebrow: string;
  title: string;
  body: string;
  steps: string[];
} | null {
  if (product.slug !== "monolith-reference") {
    return null;
  }

  return {
    stage: {
      id: "monolith-reference-motion-ready",
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
      en: "The cabinet opens into a measured product film.",
      de: "Das Gehäuse öffnet sich zu einem ruhigen Produktfilm.",
      es: "La caja se abre como una película de producto medida.",
      fr: "Le coffret s'ouvre en film produit maîtrisé.",
      zh: "箱体展开为克制的产品影片。",
      ja: "キャビネットが静かな製品フィルムとして展開します。",
      ru: "Корпус раскрывается как выверенный product-film.",
    }),
    body: getLocaleCopy(locale, {
      en: "The PDP uses the same 72-frame source-truth sequence as the category page: drivers, cabinet depth and finish remain legible while the consultation path stays close.",
      de: "Die PDP nutzt dieselbe 72-Frame-Sequenz wie die Kategorie: Treiber, Gehäusetiefe und Finish bleiben lesbar, die Beratung bleibt nah.",
      es: "La PDP usa la misma secuencia fuente de 72 fotogramas que la categoría: drivers, profundidad de caja y acabado siguen legibles, con consulta cercana.",
      fr: "La fiche utilise la même séquence source en 72 images que la catégorie : haut-parleurs, profondeur du coffret et finition restent lisibles, avec le conseil à proximité.",
      zh: "产品页使用与分类页相同的 72 帧真实序列：单元、箱体深度与饰面保持清晰，咨询路径就在近处。",
      ja: "PDP はカテゴリと同じ72フレームのソースシーケンスを使い、ドライバー、奥行き、仕上げを読み取れるまま相談導線を近くに置きます。",
      ru: "PDP использует ту же 72-кадровую source-truth сцену, что и категория: излучатели, глубина корпуса и отделка остаются читаемыми, а консультация находится рядом.",
    }),
    steps: [
      getLocaleCopy(locale, { en: "Cabinet geometry", de: "Gehäusegeometrie", es: "Geometría de caja", fr: "Géométrie du coffret", zh: "箱体几何", ja: "キャビネット形状", ru: "Геометрия корпуса" }),
      getLocaleCopy(locale, { en: "Driver hierarchy", de: "Treiberhierarchie", es: "Jerarquía de drivers", fr: "Hiérarchie des haut-parleurs", zh: "单元层级", ja: "ドライバー階層", ru: "Иерархия излучателей" }),
      getLocaleCopy(locale, { en: "Room consultation", de: "Raumberatung", es: "Consulta de sala", fr: "Conseil pour la pièce", zh: "空间咨询", ja: "空間相談", ru: "Консультация по комнате" }),
    ],
  };
}

export async function generateProductRouteMetadata(
  productSlug: string,
): Promise<Metadata> {
  const locale = await getRequestLocale();
  const product = await getCmsClient().getProductBySlug(productSlug, locale);

  return buildRouteMetadata({
    title: product?.seo.title ?? `${productSlug} | Product Detail | Montelar`,
    description:
      product?.seo.description ??
      getLocaleCopy(locale, {
        en: "Montelar product with room context and private consultation.",
        de: "Montelar Produkt mit Raumkontext und privater Beratung.",
        es: "Producto Montelar con contexto espacial y consulta privada.",
        fr: "Produit Montelar avec contexte de pièce et conseil privé.",
        zh: "结合空间语境与私人咨询的 Montelar 产品。",
        ja: "空間文脈とプライベート相談を備えた Montelar 製品。",
        ru: "Продукт Montelar с пространственным контекстом и частной консультацией.",
      }),
    path: product?.seo.routePath ?? product?.routePath ?? `/products/${productSlug}`,
    locale,
    keywords: getProductSeoKeywords(locale, product?.name ?? productSlug),
  });
}

export async function ProductRoutePage({ productSlug }: ProductRoutePageProps) {
  const locale = await getRequestLocale();
  const isRu = isRussianLocale(locale);
  const cmsClient = getCmsClient();
  const product = await cmsClient.getProductBySlug(productSlug, locale);

  if (!product) {
    notFound();
  }

  // Bespoke super-landing for the Montelar Reference DAC (slug "dac")
  if (product.slug === "dac") {
    return (
      <DacLanding
        locale={locale}
        requestPath={productRequestPath(product.slug, locale)}
        categoryPath={withLocale("/audio/dac", locale)}
      />
    );
  }

  // Bespoke super-landing for the Montelar Extremo Stream streamer
  if (product.slug === "streamer-montelar-aurender") {
    return (
      <StreamerLanding
        locale={locale}
        requestPath={productRequestPath(product.slug, locale)}
        categoryPath={withLocale("/audio/streamers", locale)}
      />
    );
  }

  // Bespoke super-landing for the AUDIO DATA SCIENCE Extremo Source streamer
  if (product.slug === "streamer-ads-ex-roon") {
    return (
      <StreamerRoonLanding
        locale={locale}
        requestPath={productRequestPath(product.slug, locale)}
        categoryPath={withLocale("/audio/streamers", locale)}
      />
    );
  }

  // Bespoke super-landing for the Montelar Loudspeaker System (slug "acoustics")
  if (product.slug === "acoustics") {
    return (
      <AcousticsLanding
        locale={locale}
        requestPath={productRequestPath(product.slug, locale)}
        categoryPath={withLocale("/audio/speakers", locale)}
      />
    );
  }

  // Bespoke super-landing for the Montelar Reference Digital BNC cable (slug "conductor-clock")
  if (product.slug === "conductor-clock") {
    return (
      <ConductorClockLanding
        locale={locale}
        requestPath={productRequestPath(product.slug, locale)}
        categoryPath={withLocale("/audio/perfect-conductors", locale)}
      />
    );
  }

  // Bespoke super-landing for the Montelar Reference AC Architecture power cables (slug "conductor-cables")
  if (product.slug === "conductor-cables") {
    return (
      <ConductorCablesLanding
        locale={locale}
        requestPath={productRequestPath(product.slug, locale)}
        categoryPath={withLocale("/audio/perfect-conductors", locale)}
      />
    );
  }

  // Bespoke super-landing for the Montelar Audio Signal Processor (slug "conductor-processor")
  if (product.slug === "conductor-processor") {
    return (
      <ConductorProcessorLanding
        locale={locale}
        requestPath={productRequestPath(product.slug, locale)}
        categoryPath={withLocale("/audio/perfect-conductors", locale)}
      />
    );
  }

  const [direction, category, inquiryForm, siblingPool] = await Promise.all([
    cmsClient.getDirectionBySlug(product.directionSlug, locale),
    product.categorySlug
      ? cmsClient.getCategoryBySlug(product.directionSlug, product.categorySlug, locale)
      : Promise.resolve(null),
    cmsClient.getProductInquiryFormByProductSlug(product.slug, locale),
    product.categorySlug
      ? cmsClient.listProductsByCategory(product.directionSlug, product.categorySlug, locale)
      : cmsClient.listProductsByDirection(product.directionSlug, locale),
  ]);

  const siblingProducts = siblingPool.filter((candidate) => candidate.slug !== product.slug);
  const lineRoutePath = getLineRoutePath(product, category?.routePath);
  const requestPath = productRequestPath(product.slug, locale);
  const heroStats = [
    {
      label: getLocaleCopy(locale, {
        en: "Direction",
        de: "Richtung",
        es: "Dirección",
        fr: "Direction",
        zh: "方向",
        ja: "領域",
        ru: "Направление",
      }),
      value: direction?.name ?? product.directionSlug,
    },
    {
      label: getLocaleCopy(locale, {
        en: "Category",
        de: "Kategorie",
        es: "Categoría",
        fr: "Catégorie",
        zh: "分类",
        ja: "カテゴリ",
        ru: "Категория",
      }),
      value: category?.label ?? getLocaleCopy(locale, {
        en: "Direct collection",
        de: "Direkte Kollektion",
        es: "Colección directa",
        fr: "Collection directe",
        zh: "直接系列",
        ja: "ダイレクトコレクション",
        ru: "Прямая коллекция",
      }),
    },
    {
      label: getLocaleCopy(locale, {
        en: "Availability",
        de: "Verfügbarkeit",
        es: "Disponibilidad",
        fr: "Disponibilité",
        zh: "供应方式",
        ja: "提供形態",
        ru: "Доступность",
      }),
      value: formatAvailabilityMode(product.availabilityMode, locale),
    },
    {
      label: getLocaleCopy(locale, {
        en: "Brief inputs",
        de: "Brief-Punkte",
        es: "Campos",
        fr: "Champs",
        zh: "brief 项目",
        ja: "項目",
        ru: "Бриф",
      }),
      value: inquiryForm
        ? getLocaleCopy(locale, {
            en: "Prepared",
            de: "Vorbereitet",
            es: "Preparado",
            fr: "Préparé",
            zh: "已准备",
            ja: "準備済み",
            ru: "Подготовлен",
          })
        : getLocaleCopy(locale, {
            en: "Consultation",
            de: "Beratung",
            es: "Consulta",
            fr: "Conseil",
            zh: "咨询",
            ja: "相談",
            ru: "Консультация",
          }),
    },
  ];
  const primaryRoute = category
    ? withLocale(category.routePath, locale)
    : direction
      ? withLocale(direction.routePath, locale)
      : withLocale("/", locale);
  const motionStage = getProductMotionStage(product, locale);
  const luxMediaSource = getProductLuxMediaSource(product);

  const eyebrowFallback = getLocaleCopy(locale, { en: "Montelar product", de: "Montelar Produkt", es: "Producto Montelar", fr: "Produit Montelar", zh: "Montelar 产品", ja: "Montelar 製品", ru: "Продукт Montelar" });
  const detailEyebrow = getLocaleCopy(locale, { en: "Detail architecture", de: "Detailarchitektur", es: "Arquitectura del detalle", fr: "Architecture du detail", zh: "细节架构", ja: "詳細設計", ru: "Архитектура детали" });
  const positioningFallback = getLocaleCopy(locale, { en: "The product is reviewed through room fit, material presence and integration, with enough context to move forward without technical noise.", ru: "Подача удерживает баланс между продуктовой точностью и спокойной интонацией: достаточно контекста для выбора, без технического шума." });
  const requestLabel = getLocaleCopy(locale, { en: "Request consultation", de: "Beratung anfragen", es: "Solicitar consulta", fr: "Demander une consultation", zh: "请求咨询", ja: "相談を依頼", ru: "Запросить консультацию" });
  const openLabel = getLocaleCopy(locale, { en: "Open product", de: "Produkt offnen", es: "Abrir producto", fr: "Ouvrir le produit", zh: "查看产品", ja: "製品を見る", ru: "Открыть продукт" });
  const clarifyEyebrow = getLocaleCopy(locale, { en: "What to clarify", de: "Was zu klaren ist", es: "Que aclarar", fr: "A preciser", zh: "需要确认", ja: "確認すること", ru: "Что важно уточнить" });
  const relatedLabel = getLocaleCopy(locale, { en: "Related products", de: "Verwandte Produkte", es: "Productos relacionados", fr: "Produits lies", zh: "相关产品", ja: "関連製品", ru: "Связанные продукты" });
  const ctaTitle = getLocaleCopy(locale, { en: "Shape this product around one room.", ru: "Соберём продукт под вашу комнату.", de: "Dieses Produkt um einen Raum herum gestalten.", es: "Componer este producto en torno a una sala.", fr: "Composer ce produit autour d'une piece.", zh: "围绕一个空间构建这件产品。", ja: "一つの空間を軸にこの製品を構成する。" });

  return (
    <main className="dir-page">
      <section className="dir-hero">
        {luxMediaSource ? (
          <img className="dir-hero-img" src={luxMediaSource.src} alt={product.name} data-atomic-media="" decoding="async" fetchPriority="high" loading="eager" draggable={false} />
        ) : null}
        <span className="dir-hero-scrim" aria-hidden="true" />
        <div className="dir-hero-copy">
          <p className="dir-eyebrow">{product.tagline ?? eyebrowFallback}</p>
          <h1 className="dir-title">{product.name}</h1>
          {(product.subtitle ?? product.shortDescription) ? (
            <p className="dir-lead">{product.subtitle ?? product.shortDescription}</p>
          ) : null}
        </div>
      </section>

      <section className="dir-statement">
        <div className="dir-wrap">
          <p className="dir-eyebrow">{detailEyebrow}</p>
          <h2 className="dir-statement-title">{product.subtitle ?? product.shortDescription}</h2>
          <p className="dir-statement-body">{product.positioningStatement ?? positioningFallback}</p>
          <dl className="dir-meta dir-meta--wide">
            {heroStats.map((stat) => (
              <div key={stat.label}>
                <dt>{stat.label}</dt>
                <dd>{stat.value}</dd>
              </div>
            ))}
          </dl>
          <div className="dir-product-actions">
            <Link className="dir-link" href={requestPath}>{requestLabel}</Link>
            <Link className="dir-link dir-link--soft" href={primaryRoute}>{category?.label ?? direction?.name ?? "Montelar"}</Link>
          </div>
        </div>
      </section>

      {motionStage ? (
        <section className="dir-motion">
            <MotionReadyProductStage
              body={motionStage.body}
              eyebrow={motionStage.eyebrow}
              primaryHref={requestPath}
              primaryLabel={requestLabel}
              secondaryHref={primaryRoute}
              secondaryLabel={category?.label ?? direction?.name ?? "Montelar"}
              stage={motionStage.stage}
              steps={motionStage.steps}
              title={motionStage.title}
            />
        </section>
      ) : null}

      {product.pdpSectionPlan.length ? (
        <section className="dir-line">
          <div className="dir-wrap"><p className="dir-eyebrow">{clarifyEyebrow}</p></div>
          <ol className="dir-products">
            {product.pdpSectionPlan.map((sectionKey, index) => (
              <li className="dir-product" key={sectionKey}>
                <span className="dir-product-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <div className="dir-product-body">
                  <h3 className="dir-product-name">{getSectionLabel(sectionKey, locale)}</h3>
                  <p className="dir-product-desc">{getSectionDescription(sectionKey, locale)}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {siblingProducts.length ? (
        <section className="dir-line">
          <div className="dir-wrap"><p className="dir-eyebrow">{relatedLabel}</p></div>
          <ol className="dir-products">
            {siblingProducts.map((candidate, index) => (
              <li className="dir-product" key={candidate.slug}>
                <span className="dir-product-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <div className="dir-product-body">
                  <h3 className="dir-product-name">{candidate.name}</h3>
                  {candidate.shortDescription ? <p className="dir-product-desc">{candidate.shortDescription}</p> : null}
                  <div className="dir-product-actions">
                    <Link className="dir-link" href={withLocale(candidate.routePath, locale)}>{openLabel}</Link>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section className="dir-cta">
        <div className="dir-wrap">
          <h2 className="dir-cta-title">{ctaTitle}</h2>
          <Link className="dir-link dir-link--lg" href={requestPath}>{requestLabel}</Link>
        </div>
      </section>
    </main>
  );
}
