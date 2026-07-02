import Link from "next/link";
import type { Metadata } from "next";
import { productRequestPath, withLocale } from "@/config/site-routes";
import { RoutePageTemplate } from "@/components/route-page-template";
import { getCmsClient } from "@/lib/cms/client";
import { getLocaleCopy } from "@/lib/copy/site-copy";
import { getRequestLocale } from "@/lib/request-locale";
import { getEditorialSeoKeywords } from "@/lib/seo/locale-seo";
import { buildRouteMetadata } from "@/lib/seo/metadata";

const adjacentEditorialSlugs = ["brand", "projects", "downloads", "contact"] as const;
const featuredDirectionSlugs = [
  "hi-end-audio",
  "vision-max",
  "pictorial-art-display",
  "living-glass",
] as const;

export async function generateJournalRouteMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const journalPage = await getCmsClient().getEditorialPageBySlug("journal", locale);

  return buildRouteMetadata({
    title: journalPage?.seo.title ?? "Journal | Montelar",
    description:
      journalPage?.seo.description ??
      getLocaleCopy(locale, {
        en: "Editorial notes on systems, materials, installations and the culture of quiet luxury.",
        de: "Redaktionelle Notizen über Systeme, Materialien, Installationen und die Kultur stillen Luxus.",
        es: "Notas editoriales sobre sistemas, materiales, instalaciones y cultura de lujo silencioso.",
        fr: "Notes éditoriales sur les systèmes, les matières, les installations et la culture du luxe discret.",
        zh: "关于系统、材质、安装与静奢文化的编辑笔记。",
        ja: "システム、素材、施工、静かなラグジュアリー文化についてのエディトリアルノート。",
        ru: "Редакционные заметки о системах, материалах, инсталляциях и культуре тихой роскоши.",
      }),
    path: journalPage?.seo.routePath ?? journalPage?.routePath ?? "/journal",
    locale,
    keywords: getEditorialSeoKeywords(locale, "journal", journalPage?.title ?? "Journal"),
  });
}

export async function JournalRoutePage() {
  const locale = await getRequestLocale();
  const cmsClient = getCmsClient();
  const [journalPage, directions, editorialPages, featuredProducts] = await Promise.all([
    cmsClient.getEditorialPageBySlug("journal", locale),
    cmsClient.listLaunchDirections(locale),
    cmsClient.listEditorialPages(locale),
    cmsClient.listFeaturedProducts(locale),
  ]);

  const resolvedTitle = journalPage?.title ?? "Journal";
  const resolvedSummary =
    journalPage?.heroSummary ??
    getLocaleCopy(locale, {
      en: "Editorial notes on systems, materials, installations and the culture of quiet luxury.",
      de: "Redaktionelle Notizen über Systeme, Materialien, Installationen und die Kultur stillen Luxus.",
      es: "Notas editoriales sobre sistemas, materiales, instalaciones y cultura de lujo silencioso.",
      fr: "Notes éditoriales sur les systèmes, les matières, les installations et la culture du luxe discret.",
      zh: "关于系统、材质、安装与静奢文化的编辑笔记。",
      ja: "システム、素材、施工、静かなラグジュアリー文化についてのエディトリアルノート。",
      ru: "Редакционные заметки о системах, материалах, инсталляциях и культуре тихой роскоши.",
    });
  const adjacentPages = adjacentEditorialSlugs
    .map((slug) => editorialPages.find((page) => page.slug === slug))
    .filter((page): page is NonNullable<typeof page> => Boolean(page));
  const featuredDirections = featuredDirectionSlugs
    .map((slug) => directions.find((direction) => direction.slug === slug))
    .filter((direction): direction is NonNullable<typeof direction> => Boolean(direction));
  const launchRequestProducts = featuredProducts.filter((product) =>
    featuredDirectionSlugs.includes(product.directionSlug as (typeof featuredDirectionSlugs)[number]),
  );

  return (
    <RoutePageTemplate
      eyebrow={getLocaleCopy(locale, { en: "Journal", de: "Journal", es: "Journal", fr: "Journal", zh: "杂志", ja: "ジャーナル", ru: "Журнал" })}
      title={resolvedTitle}
      intro={resolvedSummary}
      status={getLocaleCopy(locale, {
        en: "Journal carries launches, cultural notes and editorial context around the brand.",
        de: "Das Journal trägt Launches, kulturelle Notizen und redaktionellen Kontext rund um die Marke.",
        es: "Journal reúne lanzamientos, notas culturales y contexto editorial alrededor de la marca.",
        fr: "Le Journal réunit lancements, notes culturelles et contexte éditorial autour de la marque.",
        zh: "Journal 承载发布、文化笔记与围绕品牌的编辑语境。",
        ja: "ジャーナルは、ローンチ、文化的なノート、ブランド周辺の編集文脈を扱います。",
        ru: "Журнал собирает релизы, культурные заметки и редакционный контекст вокруг бренда.",
      })}
      nextTask={getLocaleCopy(locale, {
        en: "Read the editorial view, then continue to downloads, contact or a product request when the topic becomes practical.",
        de: "Lesen Sie die redaktionelle Perspektive und wechseln Sie bei konkretem Bedarf zu Downloads, Kontakt oder Produktanfrage.",
        es: "Lea la mirada editorial y continúe hacia materiales, contacto o consulta de producto cuando el tema sea práctico.",
        fr: "Lisez le point de vue éditorial, puis passez aux téléchargements, au contact ou à une demande produit lorsque le sujet devient concret.",
        zh: "先阅读编辑视角，主题具体后再进入资料、联系或产品咨询。",
        ja: "編集視点を読み、内容が具体化したらダウンロード、連絡、製品相談へ進みます。",
        ru: "Сначала прочитайте редакционный взгляд, затем переходите к материалам, контакту или продуктовой заявке, когда тема становится практической.",
      })}
      notes={[
        getLocaleCopy(locale, {
          en: "Journal is useful when context and launch framing matter before product comparison.",
          de: "Das Journal ist sinnvoll, wenn Kontext und Launch-Perspektive vor dem Produktvergleich stehen.",
          es: "Journal es útil cuando el contexto y la mirada de lanzamiento importan antes de comparar productos.",
          fr: "Le Journal est utile lorsque le contexte et l'angle de lancement précèdent la comparaison produit.",
          zh: "当语境与发布视角先于产品比较时，Journal 最有用。",
          ja: "製品比較の前に文脈やローンチの視点が重要な場合、ジャーナルが役立ちます。",
          ru: "Журнал полезен, когда контекст и запуск важнее немедленного сравнения продуктов.",
        }),
        getLocaleCopy(locale, {
          en: "Adjacent directions connect editorial themes back to rooms, objects and systems.",
          de: "Benachbarte Richtungen verbinden redaktionelle Themen wieder mit Räumen, Objekten und Systemen.",
          es: "Las direcciones cercanas conectan los temas editoriales con espacios, objetos y sistemas.",
          fr: "Les directions voisines relient les thèmes éditoriaux aux pièces, objets et systèmes.",
          zh: "相邻方向把编辑主题重新连接到空间、对象与系统。",
          ja: "隣接するディレクションは、編集テーマを部屋、対象物、システムへ戻します。",
          ru: "Соседние направления возвращают редакционные темы к пространствам, объектам и системам.",
        }),
        getLocaleCopy(locale, {
          en: "When the subject becomes specific, continue into a product request or contact conversation.",
          de: "Wird das Thema konkret, führt der nächste Schritt zur Produktanfrage oder zum Kontakt.",
          es: "Cuando el tema se concreta, el siguiente paso es una consulta de producto o contacto.",
          fr: "Lorsque le sujet devient précis, le relais passe à une demande produit ou au contact.",
          zh: "主题具体后，可继续进入产品咨询或联系对话。",
          ja: "テーマが具体化したら、製品相談または連絡へ進みます。",
          ru: "Когда тема становится конкретной, следующий шаг ведет в продуктовую заявку или контакт.",
        }),
      ]}
      links={adjacentPages.map((page) => ({
        href: page.routePath,
        label: page.navigationLabel ?? page.title,
        description: page.heroSummary ?? page.title,
      }))}
      linksTitle={getLocaleCopy(locale, { en: "Related chapters", de: "Verwandte Kapitel", es: "Capítulos relacionados", fr: "Chapitres liés", zh: "相关章节", ja: "関連する章", ru: "Связанные главы" })}
      locale={locale}
    >
      <div className="route-grid">
        <div className="route-panel">
          <p className="eyebrow">{getLocaleCopy(locale, { en: "Editorial view", de: "Redaktionelle Sicht", es: "Mirada editorial", fr: "Regard éditorial", zh: "编辑视角", ja: "編集視点", ru: "Редакционный взгляд" })}</p>
          <p className="route-intro compact">
            {getLocaleCopy(locale, {
              en: "Journal holds launches, installation notes and cultural observations around the brand.",
              de: "Das Journal sammelt Launches, Installationsnotizen und kulturelle Beobachtungen rund um die Marke.",
              es: "Journal reúne lanzamientos, notas de instalación y observaciones culturales alrededor de la marca.",
              fr: "Le journal rassemble les lancements, notes d'installation et observations culturelles autour de la marque.",
              zh: "Journal 汇集品牌发布、安装笔记与文化观察。",
              ja: "ジャーナルは、ブランド周辺のローンチ、設置ノート、文化的な観察を扱います。",
              ru: "Журнал собирает релизы, заметки об инсталляциях и культурные наблюдения вокруг бренда.",
            })}
          </p>
          <ul className="status-list">
            <li>{getLocaleCopy(locale, { en: "Editorial context helps before a product decision.", de: "Redaktioneller Kontext hilft vor einer Produktentscheidung.", es: "El contexto editorial ayuda antes de una decisión de producto.", fr: "Le contexte éditorial aide avant une décision produit.", zh: "产品决策前，编辑语境有助于建立判断。", ja: "製品判断の前に編集文脈が役立ちます。", ru: "Редакционный контекст помогает до выбора продукта." })}</li>
            <li>{getLocaleCopy(locale, { en: "The linked directions connect stories back to systems and spaces.", de: "Die verknüpften Richtungen führen Geschichten zurück zu Systemen und Räumen.", es: "Las direcciones enlazadas conectan las historias con sistemas y espacios.", fr: "Les directions liées reconnectent les récits aux systèmes et aux espaces.", zh: "相关方向把故事重新连接到系统与空间。", ja: "関連するディレクションは、ストーリーをシステムと空間へ戻します。", ru: "Связанные направления возвращают истории к системам и пространствам." })}</li>
            <li>{getLocaleCopy(locale, { en: "When a theme becomes practical, contact or a product request keeps the conversation precise.", de: "Wenn ein Thema konkret wird, halten Kontakt oder Produktanfrage das Gespräch präzise.", es: "Cuando el tema se vuelve práctico, contacto o solicitud de producto mantiene la conversación precisa.", fr: "Lorsque le sujet devient concret, contact ou demande produit gardent l'échange précis.", zh: "当主题变得具体时，联系或产品咨询会让对话保持准确。", ja: "テーマが具体化したら、連絡または製品依頼が対話を正確に保ちます。", ru: "Когда тема становится практической, контакт или продуктовая заявка помогают вести разговор предметно." })}</li>
          </ul>
        </div>

        <div className="route-panel">
          <p className="eyebrow">{getLocaleCopy(locale, { en: "Editorial directions", de: "Redaktionelle Richtungen", es: "Direcciones editoriales", fr: "Directions éditoriales", zh: "编辑相关方向", ja: "編集に関連する方向", ru: "Редакционные направления" })}</p>
          <div className="route-link-list">
            {featuredDirections.map((direction) => (
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
        <p className="eyebrow">{getLocaleCopy(locale, { en: "Consultation continuity", de: "Beratungskontinuität", es: "Continuidad de consulta", fr: "Continuité de consultation", zh: "咨询延续", ja: "相談への連続性", ru: "Продолжение консультации" })}</p>
        <p className="product-route-summary">
          {getLocaleCopy(locale, {
            en: "These requests are useful when an editorial theme has already turned into a concrete project question.",
            de: "Diese Anfragen helfen, wenn ein redaktionelles Thema bereits zur konkreten Projektfrage geworden ist.",
            es: "Estas solicitudes son útiles cuando un tema editorial ya se ha convertido en una pregunta de proyecto concreta.",
            fr: "Ces demandes sont utiles lorsqu'un thème éditorial s'est déjà transformé en question de projet concrète.",
            zh: "当编辑主题已经变成具体项目问题时，这些咨询最有用。",
            ja: "編集テーマが具体的なプロジェクトの問いに変わった場合、これらの依頼が役立ちます。",
            ru: "Эти заявки полезны, когда редакционная тема уже превратилась в конкретный проектный вопрос.",
          })}
        </p>
        <div className="product-section-grid">
          {launchRequestProducts.slice(0, 4).map((product) => (
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
