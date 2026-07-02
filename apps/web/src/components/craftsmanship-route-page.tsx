import Link from "next/link";
import type { Metadata } from "next";
import { productRequestPath, withLocale } from "@/config/site-routes";
import { RoutePageTemplate } from "@/components/route-page-template";
import { getCmsClient } from "@/lib/cms/client";
import { getLocaleCopy } from "@/lib/copy/site-copy";
import { getRequestLocale } from "@/lib/request-locale";
import { getEditorialSeoKeywords } from "@/lib/seo/locale-seo";
import { buildRouteMetadata } from "@/lib/seo/metadata";

const adjacentEditorialSlugs = ["brand", "technology", "projects", "contact"] as const;
const craftsmanshipDirectionSlugs = [
  "hi-end-audio",
  "vision-max",
  "living-glass",
  "display-for-exhibition",
] as const;

export async function generateCraftsmanshipRouteMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const craftsmanshipPage = await getCmsClient().getEditorialPageBySlug(
    "craftsmanship",
    locale,
  );

  return buildRouteMetadata({
    title: craftsmanshipPage?.seo.title ?? "Craftsmanship | Montelar",
    description:
      craftsmanshipPage?.seo.description ??
      getLocaleCopy(locale, {
        en: "Materials, finishing, installation tolerances and service discipline for systems built to last.",
        de: "Materialien, Oberflächen, Installationstoleranzen und Servicedisziplin für langlebige Systeme.",
        es: "Materiales, acabados, tolerancias de instalación y disciplina de servicio para sistemas duraderos.",
        fr: "Matières, finitions, tolérances d'installation et discipline de service pour des systèmes durables.",
        zh: "为长期系统服务的材质、饰面、安装公差与服务纪律。",
        ja: "長く使うシステムのための素材、仕上げ、施工精度、サービス規律。",
        ru: "Материалы, отделка, монтажные допуски и сервисная дисциплина для долговечной системы.",
      }),
    path:
      craftsmanshipPage?.seo.routePath ??
      craftsmanshipPage?.routePath ??
      "/craftsmanship",
    locale,
    keywords: getEditorialSeoKeywords(
      locale,
      "craftsmanship",
      craftsmanshipPage?.title ?? "Craftsmanship",
    ),
  });
}

export async function CraftsmanshipRoutePage() {
  const locale = await getRequestLocale();
  const cmsClient = getCmsClient();
  const [craftsmanshipPage, directions, editorialPages, featuredProducts] = await Promise.all([
    cmsClient.getEditorialPageBySlug("craftsmanship", locale),
    cmsClient.listLaunchDirections(locale),
    cmsClient.listEditorialPages(locale),
    cmsClient.listFeaturedProducts(locale),
  ]);

  const resolvedTitle = craftsmanshipPage?.title ?? "Craftsmanship";
  const resolvedSummary =
    craftsmanshipPage?.heroSummary ??
    getLocaleCopy(locale, {
      en: "Materials, finishing, installation tolerances and service discipline for systems built to last.",
      de: "Materialien, Oberflächen, Installationstoleranzen und Servicedisziplin für langlebige Systeme.",
      es: "Materiales, acabados, tolerancias de instalación y disciplina de servicio para sistemas duraderos.",
      fr: "Matières, finitions, tolérances d'installation et discipline de service pour des systèmes durables.",
      zh: "为长期系统服务的材质、饰面、安装公差与服务纪律。",
      ja: "長く使うシステムのための素材、仕上げ、施工精度、サービス規律。",
      ru: "Материалы, отделка, монтажные допуски и сервисная дисциплина для долговечной системы.",
    });
  const adjacentPages = adjacentEditorialSlugs
    .map((slug) => editorialPages.find((page) => page.slug === slug))
    .filter((page): page is NonNullable<typeof page> => Boolean(page));
  const craftsmanshipDirections = craftsmanshipDirectionSlugs
    .map((slug) => directions.find((direction) => direction.slug === slug))
    .filter((direction): direction is NonNullable<typeof direction> => Boolean(direction));
  const proofProducts = featuredProducts.filter((product) =>
    craftsmanshipDirectionSlugs.includes(
      product.directionSlug as (typeof craftsmanshipDirectionSlugs)[number],
    ),
  );

  return (
    <RoutePageTemplate
      eyebrow={getLocaleCopy(locale, { en: "Craftsmanship", de: "Handwerk", es: "Artesanía", fr: "Savoir-faire", zh: "工艺", ja: "クラフツマンシップ", ru: "Мастерство" })}
      title={resolvedTitle}
      intro={resolvedSummary}
      status={getLocaleCopy(locale, {
        en: "Materials, finishing and installation discipline support the quiet-luxury promise.",
        de: "Materialien, Oberflächen und Installationsdisziplin tragen das Versprechen stillen Luxus.",
        es: "Materiales, acabados y disciplina de instalación sostienen la promesa de lujo silencioso.",
        fr: "Matières, finitions et discipline d'installation soutiennent la promesse de luxe discret.",
        zh: "材质、饰面与安装纪律共同支撑静奢承诺。",
        ja: "素材、仕上げ、施工の規律が静かなラグジュアリーの約束を支えます。",
        ru: "Материалы, отделка и дисциплина инсталляции поддерживают обещание тихой роскоши.",
      })}
      nextTask={getLocaleCopy(locale, {
        en: "Read the material logic, then continue into projects, contact or a product consultation.",
        de: "Lesen Sie die Materiallogik und wechseln Sie danach zu Projekten, Kontakt oder Produktberatung.",
        es: "Lea la lógica material y continúe hacia proyectos, contacto o una consulta de producto.",
        fr: "Lisez la logique matière, puis poursuivez vers les projets, le contact ou une consultation produit.",
        zh: "先了解材质逻辑，再进入项目、联系或产品咨询。",
        ja: "素材の論理を読み、その後プロジェクト、連絡、製品相談へ進みます。",
        ru: "Изучите материальную логику, затем переходите к проектам, контакту или продуктовой консультации.",
      })}
      notes={[
        getLocaleCopy(locale, { en: "Montelar products must feel composed in the room, not only on paper.", de: "Montelar Produkte müssen im Raum stimmig wirken, nicht nur auf dem Papier.", es: "Los productos Montelar deben sentirse compuestos en la sala, no solo sobre el papel.", fr: "Les produits Montelar doivent paraître composés dans la pièce, pas seulement sur le papier.", zh: "Montelar 产品必须在空间中成立，而不只是停留在图纸上。", ja: "Montelar の製品は紙面だけでなく、空間の中で整って見える必要があります。", ru: "Продукты Montelar должны быть собранными в комнате, а не только на бумаге." }),
        getLocaleCopy(locale, { en: "Finish quality, tolerances and installation care can determine the decision.", de: "Oberflächenqualität, Toleranzen und Sorgfalt der Installation können entscheidend sein.", es: "Calidad de acabado, tolerancias y cuidado de instalación pueden decidir el proyecto.", fr: "Qualité des finitions, tolérances et soin d'installation peuvent déterminer la décision.", zh: "饰面质量、公差与安装细节可能决定最终选择。", ja: "仕上げ品質、公差、施工の丁寧さが判断を左右します。", ru: "Качество отделки, допуски и аккуратность инсталляции могут определить выбор." }),
        getLocaleCopy(locale, { en: "The next step is usually a project conversation or a product-specific consultation.", de: "Der nächste Schritt ist meist ein Projektgespräch oder eine produktspezifische Beratung.", es: "El siguiente paso suele ser una conversación de proyecto o una consulta específica de producto.", fr: "L'étape suivante est généralement un échange projet ou une consultation liée au produit.", zh: "下一步通常是项目对话或具体产品咨询。", ja: "次のステップは通常、プロジェクト相談または製品別の相談です。", ru: "Следующий шаг обычно ведет к проектному разговору или продуктовой консультации." }),
      ]}
      links={craftsmanshipDirections.map((direction) => ({
        href: direction.routePath,
        label: direction.navigationLabel ?? direction.name,
        description: direction.shortDescription,
      }))}
      linksTitle={getLocaleCopy(locale, { en: "Craft-led directions", de: "Handwerklich geprägte Richtungen", es: "Direcciones guiadas por la artesanía", fr: "Directions guidées par le savoir-faire", zh: "由工艺驱动的方向", ja: "クラフト主導のディレクション", ru: "Направления, где важна работа материала" })}
      locale={locale}
    >
      <div className="route-grid">
        <div className="route-panel">
          <p className="eyebrow">{getLocaleCopy(locale, { en: "Material discipline", de: "Materialdisziplin", es: "Disciplina material", fr: "Discipline matière", zh: "材质纪律", ja: "素材の規律", ru: "Дисциплина материала" })}</p>
          <p className="route-intro compact">
            {getLocaleCopy(locale, {
              en: "Craftsmanship explains how materials, finishes, installation tolerances and service discipline support the brand promise.",
              de: "Handwerk erklärt, wie Materialien, Oberflächen, Installationstoleranzen und Service die Marke tragen.",
              es: "Artesanía explica cómo materiales, acabados, tolerancias de instalación y disciplina de servicio sostienen la promesa de la marca.",
              fr: "Le savoir-faire explique comment les matières, les finitions, les tolérances d'installation et la discipline de service soutiennent la promesse de la marque.",
              zh: "工艺说明材质、饰面、安装公差与服务纪律如何支撑品牌承诺。",
              ja: "クラフツマンシップは、素材、仕上げ、施工許容差、サービスの規律がブランドの約束をどう支えるかを示します。",
              ru: "Мастерство объясняет, как материалы, отделка, допуски инсталляции и сервисная дисциплина поддерживают обещание бренда.",
            })}
          </p>
          <ul className="status-list">
            <li>{getLocaleCopy(locale, { en: "Finish quality and installation care can influence the decision.", de: "Oberflächenqualität und Installationssorgfalt können die Entscheidung beeinflussen.", es: "La calidad de acabado y el cuidado de instalación pueden influir en la decisión.", fr: "La qualité des finitions et le soin d'installation peuvent influencer la décision.", zh: "饰面质量与安装细节会影响选择。", ja: "仕上げ品質と施工の丁寧さは判断に影響します。", ru: "Качество отделки и аккуратность инсталляции могут повлиять на выбор." })}</li>
            <li>{getLocaleCopy(locale, { en: "Linked directions show where material decisions become concrete system choices.", de: "Verlinkte Richtungen zeigen, wo Materialentscheidungen zu konkreten Systemwahlen werden.", es: "Las direcciones enlazadas muestran dónde las decisiones materiales se vuelven elecciones de sistema.", fr: "Les directions liées montrent où les décisions matière deviennent des choix système concrets.", zh: "相关方向说明材质判断如何转化为具体系统选择。", ja: "関連するディレクションは、素材判断が具体的なシステム選択へ変わる場所を示します。", ru: "Связанные направления показывают, где материальные решения становятся конкретным выбором системы." })}</li>
            <li>{getLocaleCopy(locale, { en: "A product request is useful when the finish, room and installation standard are already clear.", de: "Eine Produktanfrage ist sinnvoll, wenn Finish, Raum und Installationsstandard bereits klar sind.", es: "La solicitud de producto es útil cuando acabado, espacio y estándar de instalación ya están claros.", fr: "La demande produit est utile lorsque finition, espace et standard d'installation sont déjà clairs.", zh: "当饰面、空间和安装标准已经明确时，产品咨询最有用。", ja: "仕上げ、空間、施工基準がすでに明確な場合、製品依頼が有効です。", ru: "Продуктовая заявка полезна, когда уже понятны отделка, пространство и стандарт инсталляции." })}</li>
          </ul>
        </div>

        <div className="route-panel">
          <p className="eyebrow">{getLocaleCopy(locale, { en: "Related chapters", de: "Verwandte Kapitel", es: "Capítulos relacionados", fr: "Chapitres liés", zh: "相关章节", ja: "関連する章", ru: "Связанные главы" })}</p>
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
        <p className="eyebrow">{getLocaleCopy(locale, { en: "Consultation options", de: "Beratungsoptionen", es: "Opciones de consulta", fr: "Options de consultation", zh: "咨询选项", ja: "相談オプション", ru: "Варианты консультации" })}</p>
        <p className="product-route-summary">
          {getLocaleCopy(locale, {
            en: "These requests are useful when the material and installation standard is already part of the brief.",
            de: "Diese Anfragen helfen, wenn Material- und Installationsstandard bereits Teil des Briefs sind.",
            es: "Estas solicitudes son útiles cuando el estándar de material e instalación ya forma parte del brief.",
            fr: "Ces demandes sont utiles lorsque le standard matière et installation fait déjà partie du brief.",
            zh: "当材料与安装标准已经进入 brief 时，这些咨询最有用。",
            ja: "素材と施工基準がすでにブリーフに含まれている場合、これらの依頼が有効です。",
            ru: "Эти заявки полезны, когда стандарт материалов и инсталляции уже входит в бриф.",
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
