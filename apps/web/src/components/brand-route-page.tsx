import Link from "next/link";
import type { Metadata } from "next";
import { productRequestPath, withLocale } from "@/config/site-routes";
import { RoutePageTemplate } from "@/components/route-page-template";
import { getCmsClient } from "@/lib/cms/client";
import { getLocaleCopy } from "@/lib/copy/site-copy";
import { getRequestLocale } from "@/lib/request-locale";
import { getEditorialSeoKeywords } from "@/lib/seo/locale-seo";
import { buildRouteMetadata } from "@/lib/seo/metadata";

const adjacentEditorialSlugs = ["technology", "craftsmanship", "projects", "contact"] as const;

export async function generateBrandRouteMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const brandPage = await getCmsClient().getEditorialPageBySlug("brand", locale);

  return buildRouteMetadata({
    title: brandPage?.seo.title ?? "Brand | Montelar",
    description:
      brandPage?.seo.description ??
      getLocaleCopy(locale, {
        en: "Montelar brand language for image, sound and spatial design.",
        de: "Montelar Markensprache für Bild, Klang und räumliches Design.",
        es: "Lenguaje de marca Montelar para imagen, sonido y diseño espacial.",
        fr: "Langage de marque Montelar pour l'image, le son et le design spatial.",
        zh: "Montelar 面向图像、声音与空间设计的品牌语言。",
        ja: "映像、音、空間デザインのための Montelar ブランド言語。",
        ru: "Язык бренда Montelar для изображения, звука и пространственного дизайна.",
      }),
    path: brandPage?.seo.routePath ?? brandPage?.routePath ?? "/brand",
    locale,
    keywords: getEditorialSeoKeywords(locale, "brand", brandPage?.title ?? "Brand"),
  });
}

export async function BrandRoutePage() {
  const locale = await getRequestLocale();
  const cmsClient = getCmsClient();
  const [brandPage, directions, editorialPages, featuredProducts] = await Promise.all([
    cmsClient.getEditorialPageBySlug("brand", locale),
    cmsClient.listLaunchDirections(locale),
    cmsClient.listEditorialPages(locale),
    cmsClient.listFeaturedProducts(locale),
  ]);

  const brandTitle = brandPage?.title ?? "Brand";
  const brandSummary =
    brandPage?.heroSummary ??
    getLocaleCopy(locale, {
      en: "Montelar brand language for image, sound and spatial design.",
      de: "Montelar Markensprache für Bild, Klang und räumliches Design.",
      es: "Lenguaje de marca Montelar para imagen, sonido y diseño espacial.",
      fr: "Langage de marque Montelar pour l'image, le son et le design spatial.",
      zh: "Montelar 面向图像、声音与空间设计的品牌语言。",
      ja: "映像、音、空間デザインのための Montelar ブランド言語。",
      ru: "Язык бренда Montelar для изображения, звука и пространственного дизайна.",
    });
  const adjacentPages = adjacentEditorialSlugs
    .map((slug) => editorialPages.find((page) => page.slug === slug))
    .filter((page): page is NonNullable<typeof page> => Boolean(page));
  const inquiryProducts = featuredProducts.slice(0, 3);

  return (
    <RoutePageTemplate
      eyebrow={getLocaleCopy(locale, { en: "Brand", de: "Marke", es: "Marca", fr: "Marque", zh: "品牌", ja: "ブランド", ru: "Бренд" })}
      title={brandTitle}
      intro={brandSummary}
      status={brandPage?.introBody ?? getLocaleCopy(locale, {
        en: "Montelar brings image, sound and design into one quiet-luxury language before the visitor chooses a product family.",
        de: "Montelar verbindet Bild, Klang und Design zu einer Sprache stillen Luxus, bevor eine Produktfamilie gewählt wird.",
        es: "Montelar reúne imagen, sonido y diseño en un solo lenguaje de lujo silencioso antes de elegir una familia de producto.",
        fr: "Montelar réunit image, son et design dans un même langage de luxe discret avant le choix d'une famille de produits.",
        zh: "Montelar 在选择产品家族之前，将图像、声音与设计组织成同一种静奢语言。",
        ja: "Montelar は製品ファミリーを選ぶ前に、映像、音、デザインを静かなラグジュアリーの言語へまとめます。",
        ru: "Montelar собирает изображение, звук и дизайн в один язык тихой роскоши еще до выбора продуктовой семьи.",
      })}
      nextTask={brandPage?.sections?.[0]?.lead ?? getLocaleCopy(locale, {
        en: "Use the brand story to understand the posture, then continue to technology, craftsmanship or private consultation.",
        de: "Die Markengeschichte klärt die Haltung, danach führen Technologie, Handwerk oder private Beratung weiter.",
        es: "Empiece aquí para entender la postura de la marca y continúe hacia tecnología, artesanía o una consulta privada.",
        fr: "Commencez ici pour comprendre la posture de marque, puis continuez vers la technologie, le savoir-faire ou une consultation privée.",
        zh: "先通过品牌故事理解姿态，再进入技术、工艺或私人咨询。",
        ja: "ブランドの姿勢を理解し、その後テクノロジー、クラフツマンシップ、プライベート相談へ進みます。",
        ru: "Брендовая история помогает понять позицию Montelar, затем можно перейти к технологии, мастерству или частной консультации.",
      })}
      notes={[
        getLocaleCopy(locale, {
          en: "The brand story sets the point of view before systems or products are compared.",
          de: "Die Markengeschichte setzt den Blickwinkel, bevor Systeme oder Produkte verglichen werden.",
          es: "Use esta página para entender la marca antes de comparar sistemas o productos.",
          fr: "Utilisez cette page pour comprendre la marque avant de comparer les systèmes ou les produits.",
          zh: "品牌故事先确定视角，再进入系统或产品比较。",
          ja: "ブランドストーリーは、システムや製品を比較する前に視点を整えます。",
          ru: "Брендовая история задает точку зрения до сравнения систем и продуктов.",
        }),
        getLocaleCopy(locale, {
        en: "The next best step is usually to choose the direction that matches the room or experience you want to build.",
          de: "Der nächste sinnvolle Schritt führt meist in die Richtung, die zum gewünschten Raum oder Erlebnis passt.",
          es: "El siguiente mejor paso suele ser entrar en una dirección que coincida con el espacio o la experiencia que desea crear.",
          fr: "L'étape suivante consiste généralement à ouvrir la direction qui correspond à l'espace ou à l'expérience à créer.",
          zh: "下一步通常是进入与目标空间或体验相匹配的产品方向。",
          ja: "次の自然なステップは、つくりたい空間や体験に合うディレクションへ進むことです。",
          ru: "Следующий шаг обычно ведет к направлению, соответствующему пространству или сценарию, который вы хотите собрать.",
        }),
        getLocaleCopy(locale, {
          en: "Montelar is positioned as a composed interior system, not as a list of isolated components.",
          de: "Montelar ist als komponiertes Interior-System positioniert, nicht als Liste isolierter Komponenten.",
          es: "Montelar se presenta como un sistema interior compuesto, no como una lista de componentes aislados.",
          fr: "Montelar est présenté comme un système intérieur composé, et non comme une liste de composants isolés.",
          zh: "Montelar 被定位为完整的室内系统，而不是孤立组件列表。",
          ja: "Montelar は孤立した部品のリストではなく、構成されたインテリアシステムとして位置づけられます。",
          ru: "Montelar позиционируется как собранная интерьерная система, а не как список разрозненных компонентов.",
        }),
      ]}
      links={directions.map((direction) => ({
        href: direction.routePath,
        label: direction.navigationLabel ?? direction.name,
        description: direction.shortDescription,
      }))}
      linksTitle={getLocaleCopy(locale, { en: "Explore the directions", de: "Richtungen ansehen", es: "Explorar direcciones", fr: "Explorer les directions", zh: "浏览方向", ja: "ディレクションを見る", ru: "Исследовать направления" })}
      locale={locale}
    >
      <div className="route-grid">
        <div className="route-panel">
          <p className="eyebrow">{getLocaleCopy(locale, { en: "Brand framework", de: "Markenrahmen", es: "Marco de marca", fr: "Cadre de marque", zh: "品牌框架", ja: "ブランドの骨格", ru: "Каркас бренда" })}</p>
          <p className="route-intro compact">
            {getLocaleCopy(locale, {
              en: "The brand story frames private cinema, hi-end audio and display systems as one interior experience with calm materials and controlled light.",
              de: "Die Markengeschichte verbindet privates Kino, Hi-end Audio und Displaysysteme zu einer Innenraumerfahrung mit ruhigen Materialien und kontrolliertem Licht.",
              es: "La página de marca explica cómo Montelar presenta el cine privado, el hi-end audio y los sistemas de display como una sola experiencia interior de materiales serenos y luz controlada.",
              fr: "La page marque explique comment Montelar réunit cinéma privé, hi-end audio et systèmes d'affichage dans une seule expérience intérieure faite de matières calmes et de lumière maîtrisée.",
              zh: "品牌故事将私人影院、Hi-end 音响和显示系统组织成由安静材质与受控光线构成的室内体验。",
              ja: "ブランドストーリーは、プライベートシネマ、Hi-end オーディオ、ディスプレイシステムを、静かな素材と制御された光による一つのインテリア体験として捉えます。",
              ru: "Брендовая история объясняет, как Montelar собирает частный кинотеатр, hi-end аудио и display-системы в единый интерьерный опыт со спокойными материалами и контролируемым светом.",
            })}
          </p>
          <ul className="status-list">
            <li>{getLocaleCopy(locale, {
              en: "Begin with the brand if your decision is still about atmosphere, trust and point of view.",
              de: "Diese Seite hilft, wenn die Entscheidung noch von Atmosphäre, Vertrauen und Haltung abhängt.",
              es: "Lea esta página primero si su decisión sigue siendo sobre atmósfera, confianza y punto de vista.",
              fr: "Commencez par cette page si votre décision porte encore sur l'atmosphère, la confiance et le point de vue.",
              zh: "如果决策仍围绕氛围、信任和品牌视角，这一页应先被阅读。",
              ja: "判断がまだ空気感、信頼、視点に関わる段階なら、このページから読むのが適しています。",
              ru: "Начните с бренда, если ваш выбор пока строится вокруг атмосферы, доверия и общего взгляда.",
            })}</li>
            <li>{getLocaleCopy(locale, {
              en: "Continue to technology and craftsmanship when you want proof in systems, materials and execution quality.",
              de: "Technologie und Handwerk zeigen Nachweise in Systemen, Materialien und Ausführungsqualität.",
              es: "Continúe hacia tecnología y artesanía cuando quiera pruebas en sistemas, materiales y calidad de ejecución.",
              fr: "Poursuivez vers la technologie et le savoir-faire si vous cherchez des preuves dans les systèmes, les matières et la qualité d'exécution.",
              zh: "当需要系统、材质和执行质量的依据时，再看技术与工艺。",
              ja: "システム、素材、実行品質の根拠が必要な場合は、テクノロジーとクラフツマンシップへ進みます。",
              ru: "Переходите к технологии и мастерству, если вам нужны доказательства в системах, материалах и качестве исполнения.",
            })}</li>
            <li>{getLocaleCopy(locale, {
              en: "Move straight to consultation if the project context is already clear and you need personal guidance.",
              de: "Wenn der Projektkontext bereits klar ist, führt der direkte Weg in die persönliche Beratung.",
              es: "Pase directamente a la consulta si el alcance del proyecto ya está claro y necesita orientación personal.",
              fr: "Passez directement à la consultation si le périmètre du projet est déjà clair et que vous avez besoin d'un accompagnement personnel.",
              zh: "如果项目语境已经明确，可以直接进入私人咨询。",
              ja: "プロジェクトの文脈がすでに明確なら、個別の相談へ直接進めます。",
              ru: "Переходите сразу к консультации, если проект уже понятен и вам нужно персональное сопровождение.",
            })}</li>
          </ul>
        </div>

        <div className="route-panel">
          <p className="eyebrow">{getLocaleCopy(locale, { en: "Related brand chapters", de: "Verwandte Markenkapitel", es: "Capítulos de marca relacionados", fr: "Chapitres de marque liés", zh: "相关品牌章节", ja: "関連するブランド章", ru: "Связанные главы бренда" })}</p>
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
            en: "If you already know the direction you want, go straight into product-specific consultation.",
            de: "Wenn die gewünschte Richtung klar ist, kann die Anfrage direkt produktspezifisch werden.",
            es: "Si ya sabe qué dirección quiere, vaya directamente a una consulta específica por producto.",
            fr: "Si vous connaissez déjà la direction souhaitée, passez directement à un parcours de consultation lié au produit.",
            zh: "如果已经知道目标方向，可以直接进入具体产品咨询。",
            ja: "希望するディレクションが分かっている場合は、製品別の相談経路へ直接進めます。",
            ru: "Если вы уже понимаете нужное направление, переходите сразу к продуктовой консультации.",
          })}
        </p>
        <div className="product-section-grid">
          {inquiryProducts.map((product) => (
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
