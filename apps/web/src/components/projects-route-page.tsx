import Link from "next/link";
import type { Metadata } from "next";
import { productRequestPath, withLocale } from "@/config/site-routes";
import { RoutePageTemplate } from "@/components/route-page-template";
import { getCmsClient } from "@/lib/cms/client";
import { getLocaleCopy } from "@/lib/copy/site-copy";
import { getRequestLocale } from "@/lib/request-locale";
import { getEditorialSeoKeywords } from "@/lib/seo/locale-seo";
import { buildRouteMetadata } from "@/lib/seo/metadata";

const adjacentEditorialSlugs = ["brand", "craftsmanship", "journal", "contact"] as const;
const projectDirectionSlugs = [
  "vision-max",
  "living-glass",
  "hologram",
  "display-for-exhibition",
] as const;

export async function generateProjectsRouteMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const projectsPage = await getCmsClient().getEditorialPageBySlug("projects", locale);

  return buildRouteMetadata({
    title: projectsPage?.seo.title ?? "Projects | Montelar",
    description:
      projectsPage?.seo.description ??
      getLocaleCopy(locale, {
        en: "Residences, galleries, showrooms and private rooms where image, sound and light become one environment.",
        de: "Residenzen, Galerien, Showrooms und private Räume, in denen Bild, Klang und Licht zu einer Umgebung werden.",
        es: "Residencias, galerías, showrooms y salas privadas donde imagen, sonido y luz se componen como un solo entorno.",
        fr: "Résidences, galeries, showrooms et salons privés où image, son et lumière composent un même environnement.",
        zh: "住宅、画廊、展厅与私人空间中的图像、声音和光线被组织成同一环境。",
        ja: "住宅、ギャラリー、ショールームで映像、音、光を一つの環境として構成します。",
        ru: "Частные резиденции, галереи, шоурумы и залы, где изображение, звук и свет собираются как единая среда.",
      }),
    path: projectsPage?.seo.routePath ?? projectsPage?.routePath ?? "/projects",
    locale,
    keywords: getEditorialSeoKeywords(locale, "projects", projectsPage?.title ?? "Projects"),
  });
}

export async function ProjectsRoutePage() {
  const locale = await getRequestLocale();
  const cmsClient = getCmsClient();
  const [projectsPage, directions, editorialPages, featuredProducts] = await Promise.all([
    cmsClient.getEditorialPageBySlug("projects", locale),
    cmsClient.listLaunchDirections(locale),
    cmsClient.listEditorialPages(locale),
    cmsClient.listFeaturedProducts(locale),
  ]);

  const resolvedTitle = projectsPage?.title ?? "Projects";
  const resolvedSummary =
    projectsPage?.heroSummary ??
    getLocaleCopy(locale, {
      en: "Residences, galleries, showrooms and private rooms where image, sound and light become one environment.",
      de: "Residenzen, Galerien, Showrooms und private Räume, in denen Bild, Klang und Licht zu einer Umgebung werden.",
      es: "Residencias, galerías, showrooms y salas privadas donde imagen, sonido y luz se componen como un solo entorno.",
      fr: "Résidences, galeries, showrooms et salons privés où image, son et lumière composent un même environnement.",
      zh: "住宅、画廊、展厅与私人空间中的图像、声音和光线被组织成同一环境。",
      ja: "住宅、ギャラリー、ショールームで映像、音、光を一つの環境として構成します。",
      ru: "Частные резиденции, галереи, шоурумы и залы, где изображение, звук и свет собираются как единая среда.",
    });
  const adjacentPages = adjacentEditorialSlugs
    .map((slug) => editorialPages.find((page) => page.slug === slug))
    .filter((page): page is NonNullable<typeof page> => Boolean(page));
  const projectDirections = projectDirectionSlugs
    .map((slug) => directions.find((direction) => direction.slug === slug))
    .filter((direction): direction is NonNullable<typeof direction> => Boolean(direction));
  const requestProducts = featuredProducts.filter((product) =>
    projectDirectionSlugs.includes(product.directionSlug as (typeof projectDirectionSlugs)[number]),
  );

  return (
    <RoutePageTemplate
      eyebrow={getLocaleCopy(locale, { en: "Projects", de: "Projekte", es: "Proyectos", fr: "Projets", zh: "项目", ja: "プロジェクト", ru: "Проекты" })}
      title={resolvedTitle}
      intro={resolvedSummary}
      status={getLocaleCopy(locale, { en: "Montelar projects show how image, sound, control and material fit into residences, galleries, showrooms and exhibition environments.", de: "Montelar Projekte zeigen, wie Bild, Klang, Steuerung und Material in Residenzen, Galerien, Showrooms und Ausstellungen passen.", es: "Los proyectos Montelar muestran cómo imagen, sonido, control y material se integran en residencias, galerías, showrooms y espacios expositivos.", fr: "Les projets Montelar montrent comment image, son, contrôle et matière s'inscrivent dans résidences, galeries, showrooms et espaces d'exposition.", zh: "Montelar 项目展示图像、声音、控制与材质如何进入住宅、画廊、展厅和展陈环境。", ja: "Montelar のプロジェクトは、映像、音、制御、素材が住宅、ギャラリー、ショールーム、展示環境にどう収まるかを示します。", ru: "Проекты Montelar показывают, как изображение, звук, управление и материал входят в резиденции, галереи, шоурумы и выставочные пространства." })}
      nextTask={getLocaleCopy(locale, { en: "Project context defines whether the right entry is a direction, a product family or direct consultation.", de: "Der Projektkontext entscheidet, ob Richtung, Produktfamilie oder direkte Beratung passt.", es: "El contexto del proyecto define si corresponde una dirección, una familia de producto o una consulta directa.", fr: "Le contexte projet indique si l'entrée juste est une direction, une famille produit ou le conseil direct.", zh: "项目语境决定入口应是产品方向、产品家族还是直接咨询。", ja: "プロジェクト文脈が、適切な入口がディレクション、製品ファミリー、直接相談のどれかを決めます。", ru: "Проектный контекст определяет, нужен ли вход через направление, продуктовую семью или прямую консультацию." })}
      notes={[
        getLocaleCopy(locale, { en: "Projects matter when the room, venue or visitor journey is more important than one isolated product.", de: "Projekte zählen, wenn Raum, Ort oder Besucherführung wichtiger sind als ein isoliertes Produkt.", es: "Los proyectos importan cuando sala, lugar o recorrido del visitante pesan más que un producto aislado.", fr: "Les projets comptent lorsque pièce, lieu ou parcours visiteur comptent plus qu'un produit isolé.", zh: "当房间、场地或访客动线比单个产品更重要时，项目语境才是关键。", ja: "部屋、会場、来場者動線が単体製品より重要な場合、プロジェクトが意味を持ちます。", ru: "Проекты важны там, где комната, площадка или движение посетителя важнее одного изолированного продукта." }),
        getLocaleCopy(locale, { en: "Directions connect project type to the system type it needs.", de: "Richtungen verbinden den Projekttyp mit dem passenden Systemtyp.", es: "Las direcciones conectan el tipo de proyecto con el sistema que necesita.", fr: "Les directions relient le type de projet au système nécessaire.", zh: "产品方向把项目类型连接到所需系统类型。", ja: "ディレクションはプロジェクト種別を必要なシステム種別につなぎます。", ru: "Направления связывают тип проекта с нужным типом системы." }),
        getLocaleCopy(locale, { en: "A private request is useful once the solution and installation context are clear.", de: "Eine private Anfrage ist sinnvoll, sobald Lösung und Installationskontext klar sind.", es: "La solicitud privada es útil cuando solución e instalación ya están claras.", fr: "La demande privée est utile lorsque solution et contexte d'installation sont clairs.", zh: "当方案和安装语境明确后，私人咨询最有用。", ja: "ソリューションと施工文脈が明確になったら、プライベート依頼が有効です。", ru: "Частная заявка уместна, когда уже понятны решение и контекст инсталляции." }),
      ]}
      links={projectDirections.map((direction) => ({
        href: direction.routePath,
        label: direction.navigationLabel ?? direction.name,
        description: direction.shortDescription,
      }))}
      linksTitle={getLocaleCopy(locale, { en: "Project-bearing directions", de: "Projekttragende Richtungen", es: "Direcciones orientadas a proyecto", fr: "Directions porteuses de projets", zh: "项目相关方向", ja: "プロジェクトを支える方向", ru: "Направления для проектов" })}
      locale={locale}
    >
      <div className="route-grid">
        <div className="route-panel">
          <p className="eyebrow">{getLocaleCopy(locale, { en: "Installation story", de: "Installationsszenario", es: "Historia de instalacion", fr: "Histoire d'installation", zh: "安装场景", ja: "インスタレーションの文脈", ru: "Сценарий инсталляции" })}</p>
          <p className="route-intro compact">
            {getLocaleCopy(locale, {
              en: "Montelar projects are framed as complete environments: room logic, visitor flow, control, light and material composition work together.",
              de: "Montelar Projekte werden als vollständige Umgebungen verstanden: Raumlogik, Besucherfluss, Steuerung, Licht und Material wirken zusammen.",
              es: "Los proyectos Montelar se presentan como entornos completos: lógica espacial, flujo del visitante, control, luz y materialidad trabajan juntos.",
              fr: "Les projets Montelar sont pensés comme des environnements complets : logique spatiale, parcours visiteur, contrôle, lumière et matière travaillent ensemble.",
              zh: "Montelar 项目被视为完整环境：空间逻辑、访客动线、控制、光线与材质共同工作。",
              ja: "Montelar のプロジェクトは、空間の論理、来場者動線、制御、光、素材が一体で働く完全な環境として捉えます。",
              ru: "Проекты Montelar рассматриваются как цельные среды: логика пространства, движение посетителя, управление, свет и материал работают вместе.",
            })}
          </p>
          <ul className="status-list">
            <li>{getLocaleCopy(locale, { en: "Residential cinema, gallery installations, showroom systems and exhibition programs require different project logic.", de: "Wohnkino, Galerieinstallationen, Showroom-Systeme und Ausstellungsprogramme brauchen unterschiedliche Projektlogik.", es: "El cine residencial, las instalaciones de galería, los sistemas de showroom y los programas expositivos requieren una lógica de proyecto distinta.", fr: "Cinéma résidentiel, installations de galerie, systèmes showroom et programmes d'exposition demandent chacun une logique de projet distincte.", zh: "住宅影院、画廊装置、展厅系统和展陈项目需要不同的项目逻辑。", ja: "住宅シネマ、ギャラリー設置、ショールームシステム、展示プログラムにはそれぞれ異なるプロジェクト論理が必要です。", ru: "Частный кинотеатр, галерейные инсталляции, showroom-системы и выставочные программы требуют разной проектной логики." })}</li>
            <li>{getLocaleCopy(locale, { en: "The matching direction is chosen from project type, space and visitor behavior.", de: "Die passende Richtung ergibt sich aus Projekttyp, Raum und Besucherverhalten.", es: "La dirección adecuada se elige desde tipo de proyecto, espacio y comportamiento del visitante.", fr: "La direction juste se choisit à partir du type de projet, du lieu et du comportement visiteur.", zh: "合适的方向由项目类型、空间和访客行为共同决定。", ja: "適切なディレクションは、プロジェクト種別、空間、来場者の振る舞いから選びます。", ru: "Подходящее направление выбирается из типа проекта, пространства и поведения посетителя." })}</li>
            <li>{getLocaleCopy(locale, { en: "When the solution is clear, a private request gives exact context and advisory follow-up.", de: "Wenn die Lösung klar ist, liefert eine private Anfrage präzisen Kontext und Beratung.", es: "Cuando la solución está clara, una solicitud privada da contexto preciso y acompañamiento.", fr: "Lorsque la solution est claire, une demande privée donne le contexte exact et le relais conseil.", zh: "方案明确后，私人咨询提供准确语境和后续顾问支持。", ja: "ソリューションが明確になったら、プライベート依頼が正確な文脈と相談の継続を支えます。", ru: "Когда решение понятно, частная заявка дает точный контекст и консультационное сопровождение." })}</li>
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
        <p className="eyebrow">{getLocaleCopy(locale, { en: "Private consultations", de: "Private Beratungen", es: "Consultas privadas", fr: "Consultations privées", zh: "私人咨询", ja: "プライベート相談", ru: "Частные консультации" })}</p>
        <p className="product-route-summary">
          {getLocaleCopy(locale, {
            en: "These requests are useful when the project is already tied to a concrete product family.",
            de: "Diese Anfragen helfen, wenn das Projekt bereits an eine konkrete Produktfamilie gebunden ist.",
            es: "Estas solicitudes resultan útiles cuando el proyecto ya está ligado a una familia de producto concreta.",
            fr: "Ces demandes sont utiles lorsque le projet est déjà lié à une famille produit précise.",
            zh: "当项目已连接到具体产品家族时，这些咨询最有用。",
            ja: "プロジェクトが具体的な製品ファミリーに結びついている場合、これらの依頼が有効です。",
            ru: "Эти заявки полезны, когда проект уже привязан к конкретной продуктовой семье.",
          })}
        </p>
        <div className="product-section-grid">
          {requestProducts.slice(0, 4).map((product) => (
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
