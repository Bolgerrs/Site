import Link from "next/link";
import type { Metadata } from "next";
import { productRequestPath, withLocale } from "@/config/site-routes";
import { RoutePageTemplate } from "@/components/route-page-template";
import { getCmsClient } from "@/lib/cms/client";
import { getLocaleCopy } from "@/lib/copy/site-copy";
import { getRequestLocale } from "@/lib/request-locale";
import { getEditorialSeoKeywords } from "@/lib/seo/locale-seo";
import { buildRouteMetadata } from "@/lib/seo/metadata";

const adjacentEditorialSlugs = ["brand", "craftsmanship", "downloads", "contact"] as const;
const technologyDirectionSlugs = ["vision-max", "hi-end-audio", "living-glass", "hologram"] as const;

export async function generateTechnologyRouteMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const technologyPage = await getCmsClient().getEditorialPageBySlug("technology", locale);

  return buildRouteMetadata({
    title: technologyPage?.seo.title ?? "Technology | Montelar",
    description:
      technologyPage?.seo.description ??
      getLocaleCopy(locale, {
        en: "Signal, control, display and integration principles behind Montelar rooms.",
        de: "Signal, Steuerung, Display und Integration als Grundlage der Montelar Raeume.",
        es: "Principios de señal, control, display e integracion detras de los espacios Montelar.",
        fr: "Signal, controle, affichage et integration au coeur des espaces Montelar.",
        zh: "Montelar 空间中的信号、控制、显示与集成原则。",
        ja: "Montelar の空間を支える信号、制御、表示、統合の原則。",
        ru: "Принципы сигнала, управления, изображения и интеграции в пространствах Montelar.",
      }),
    path: technologyPage?.seo.routePath ?? technologyPage?.routePath ?? "/technology",
    locale,
    keywords: getEditorialSeoKeywords(
      locale,
      "technology",
      technologyPage?.title ?? "Technology",
    ),
  });
}

export async function TechnologyRoutePage() {
  const locale = await getRequestLocale();
  const cmsClient = getCmsClient();
  const [technologyPage, directions, editorialPages, featuredProducts] = await Promise.all([
    cmsClient.getEditorialPageBySlug("technology", locale),
    cmsClient.listLaunchDirections(locale),
    cmsClient.listEditorialPages(locale),
    cmsClient.listFeaturedProducts(locale),
  ]);

  const resolvedTitle = technologyPage?.title ?? "Technology";
  const resolvedSummary =
    technologyPage?.heroSummary ??
    getLocaleCopy(locale, {
      en: "Signal, control, display and integration principles behind Montelar rooms.",
      de: "Signal, Steuerung, Display und Integration als Grundlage der Montelar Räume.",
      es: "Principios de señal, control, display e integración detrás de los espacios Montelar.",
      fr: "Signal, contrôle, affichage et intégration au cœur des espaces Montelar.",
      zh: "Montelar 空间背后的信号、控制、显示与集成原则。",
      ja: "Montelar の空間を支える信号、制御、表示、統合の原則。",
      ru: "Принципы сигнала, управления, изображения и интеграции в пространствах Montelar.",
    });
  const adjacentPages = adjacentEditorialSlugs
    .map((slug) => editorialPages.find((page) => page.slug === slug))
    .filter((page): page is NonNullable<typeof page> => Boolean(page));
  const technologyDirections = technologyDirectionSlugs
    .map((slug) => directions.find((direction) => direction.slug === slug))
    .filter((direction): direction is NonNullable<typeof direction> => Boolean(direction));
  const proofProducts = featuredProducts.filter((product) =>
    technologyDirectionSlugs.includes(product.directionSlug as (typeof technologyDirectionSlugs)[number]),
  );

  return (
    <RoutePageTemplate
      eyebrow={getLocaleCopy(locale, { en: "Technology", de: "Technologie", es: "Tecnología", fr: "Technologie", zh: "技术", ja: "テクノロジー", ru: "Технология" })}
      title={resolvedTitle}
      intro={resolvedSummary}
      status={getLocaleCopy(locale, { en: "Montelar treats signal, control, media glass and integration as one room discipline.", de: "Montelar behandelt Signal, Steuerung, Medienglas und Integration als eine Raumdisziplin.", es: "Montelar trata señal, control, vidrio multimedia e integración como una sola disciplina espacial.", fr: "Montelar traite signal, contrôle, verre média et intégration comme une même discipline de la pièce.", zh: "Montelar 将信号、控制、媒体玻璃和集成视为同一空间纪律。", ja: "Montelar は信号、制御、メディアガラス、統合を一つの空間の規律として扱います。", ru: "Montelar рассматривает сигнал, управление, медийное стекло и интеграцию как единую дисциплину пространства." })}
      nextTask={getLocaleCopy(locale, { en: "Technology logic connects naturally to craftsmanship, projects and product consultation.", de: "Die technologische Logik verbindet sich mit Handwerk, Projekten und Produktberatung.", es: "La lógica tecnológica conecta con artesanía, proyectos y consulta de producto.", fr: "La logique technologique relie savoir-faire, projets et conseil produit.", zh: "技术逻辑自然连接到工艺、项目和产品咨询。", ja: "テクノロジーの論理はクラフツマンシップ、プロジェクト、製品相談につながります。", ru: "Технологическая логика связывает мастерство, проекты и продуктовую консультацию." })}
      notes={[
        getLocaleCopy(locale, {
          en: "System logic comes before comparing individual products.",
          de: "Systemlogik steht vor dem Vergleich einzelner Produkte.",
          es: "La lógica de sistema precede la comparación de productos individuales.",
          fr: "La logique système précède la comparaison de produits isolés.",
          zh: "系统逻辑先于单个产品比较。",
          ja: "個別製品の比較より先にシステムの論理があります。",
          ru: "Системная логика предшествует сравнению отдельных продуктов.",
        }),
        getLocaleCopy(locale, {
          en: "Signal quality, control and integration matter more than one isolated specification.",
          de: "Signalqualität, Steuerung und Integration zählen mehr als eine isolierte Spezifikation.",
          es: "Calidad de señal, control e integración importan más que una especificación aislada.",
          fr: "Qualité du signal, contrôle et intégration comptent davantage qu'une fiche isolée.",
          zh: "信号质量、控制与集成比单项规格更重要。",
          ja: "信号品質、制御、統合は、孤立した仕様より重要です。",
          ru: "Качество сигнала, управление и интеграция важнее одной отдельной характеристики.",
        }),
        getLocaleCopy(locale, {
          en: "The next step is usually a direction or a product-specific request.",
          de: "Der nächste Schritt ist meist eine Richtung oder eine produktspezifische Anfrage.",
          es: "El siguiente paso suele ser una dirección o una solicitud específica de producto.",
          fr: "L'étape suivante est généralement une direction ou une demande produit.",
          zh: "下一步通常是进入某个方向或具体产品咨询。",
          ja: "次のステップは通常、ディレクションまたは製品別の依頼です。",
          ru: "Следующий шаг обычно ведет в направление или продуктовую заявку.",
        }),
      ]}
      links={technologyDirections.map((direction) => ({
        href: direction.routePath,
        label: direction.navigationLabel ?? direction.name,
        description: direction.shortDescription,
      }))}
      linksTitle={getLocaleCopy(locale, { en: "Technology-bearing directions", de: "Technologiegetragene Richtungen", es: "Direcciones con tecnologia", fr: "Directions a forte technologie", zh: "技术相关方向", ja: "テクノロジーを担う方向", ru: "Технологические направления" })}
      locale={locale}
    >
      <div className="route-grid">
        <div className="route-panel">
          <p className="eyebrow">{getLocaleCopy(locale, { en: "System logic", de: "Systemlogik", es: "Logica del sistema", fr: "Logique systeme", zh: "系统逻辑", ja: "システムの論理", ru: "Логика системы" })}</p>
          <p className="route-intro compact">
            {getLocaleCopy(locale, {
              en: "Technology connects image, sound, installation discipline and material control across the whole Montelar system.",
              de: "Technologie verbindet Bild, Klang, Installationsdisziplin und Materialkontrolle im gesamten Montelar System.",
              es: "La tecnología conecta imagen, sonido, disciplina de instalación y control material a través de todo el sistema Montelar.",
              fr: "La technologie relie l'image, le son, la discipline d'installation et le contrôle de la matière dans tout l'écosystème Montelar.",
              zh: "技术把图像、声音、安装纪律与材质控制连接为完整的 Montelar 系统。",
              ja: "テクノロジーは、映像、音、施工の規律、素材の制御を Montelar システム全体でつなぎます。",
              ru: "Технология связывает изображение, звук, дисциплину инсталляции и контроль материала во всей системе Montelar.",
            })}
          </p>
          <ul className="status-list">
            <li>{getLocaleCopy(locale, { en: "System logic matters when one exact product is not enough to define the room.", de: "Systemlogik wird wichtig, wenn ein einzelnes Produkt den Raum nicht definiert.", es: "La lógica del sistema importa cuando un producto exacto no basta para definir la sala.", fr: "La logique système compte lorsqu'un produit précis ne suffit pas à définir la pièce.", zh: "当一个产品不足以定义房间时，系统逻辑变得关键。", ja: "一つの製品だけでは部屋を定義できない場合、システムの論理が重要になります。", ru: "Системная логика важна, когда одной конкретной модели недостаточно для описания пространства." })}</li>
            <li>{getLocaleCopy(locale, { en: "Linked directions connect the system idea back to a room or project type.", de: "Verknüpfte Richtungen führen die Systemidee zurück zu Raum- oder Projekttyp.", es: "Las direcciones enlazadas devuelven la idea de sistema a un tipo de espacio o proyecto.", fr: "Les directions liées reconnectent l'idée système à un type d'espace ou de projet.", zh: "相关方向把系统想法连接回具体房间或项目类型。", ja: "関連するディレクションは、システムの考え方を部屋やプロジェクト種別に戻します。", ru: "Связанные направления привязывают системную идею к типу пространства или проекта." })}</li>
            <li>{getLocaleCopy(locale, { en: "A product request is useful when the room or system needs precise review.", de: "Eine Produktanfrage ist sinnvoll, wenn Raum oder System präzise geprüft werden müssen.", es: "La solicitud de producto ayuda cuando la sala o el sistema necesitan una revisión precisa.", fr: "La demande produit est utile lorsque la pièce ou le système demande une revue précise.", zh: "当房间或系统需要精确审核时，产品咨询更有用。", ja: "部屋やシステムに正確な確認が必要な場合、製品依頼が役立ちます。", ru: "Продуктовая заявка полезна, когда комнате или системе нужен точный разбор." })}</li>
          </ul>
        </div>

        <div className="route-panel">
          <p className="eyebrow">{getLocaleCopy(locale, { en: "Related reading", de: "Verwandte Kapitel", es: "Lectura relacionada", fr: "Lecture associee", zh: "相关章节", ja: "関連する章", ru: "Связанные разделы" })}</p>
          <div className="route-link-list">
            {adjacentPages.map((page) => (
              <Link
                key={page.slug}
                className="route-link-card"
                href={withLocale(page.routePath, locale)}
              >
                <span className="route-link-label">{page.navigationLabel ?? page.title}</span>
                <span className="route-link-description">
                  {page.heroSummary ?? page.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="route-panel product-blueprint-panel">
        <p className="eyebrow">{getLocaleCopy(locale, { en: "Product proof points", de: "Produktnachweise", es: "Pruebas de producto", fr: "Points d'appui produit", zh: "产品依据", ja: "製品の確認点", ru: "Продуктовые опоры" })}</p>
        <p className="product-route-summary">
          {getLocaleCopy(locale, {
            en: "These product requests are useful when the system direction is already clear and you need a precise conversation.",
            de: "Diese Produktanfragen helfen, wenn die Systemrichtung klar ist und ein präzises Gespräch nötig wird.",
            es: "Estas solicitudes ayudan cuando la direccion del sistema ya esta clara y necesita una conversacion precisa.",
            fr: "Ces demandes sont utiles lorsque l'orientation systeme est deja claire et qu'un echange precis est necessaire.",
            zh: "当系统方向已经清晰并需要精确沟通时，这些产品咨询会更有用。",
            ja: "システムの方向が明確で、正確な対話が必要な場合にこれらの製品依頼が役立ちます。",
            ru: "Эти продуктовые заявки полезны, когда системное направление уже понятно и нужен точный разговор.",
          })}
        </p>
        <div className="product-section-grid">
          {proofProducts.slice(0, 4).map((product) => (
            <Link
              key={product.slug}
              className="route-link-card compact product-section-card"
              href={productRequestPath(product.slug, locale)}
            >
              <span className="route-link-label">{product.name}</span>
              <span className="route-link-description">{product.shortDescription}</span>
            </Link>
          ))}
        </div>
      </div>
    </RoutePageTemplate>
  );
}
