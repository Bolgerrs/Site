import Link from "next/link";
import type { Metadata } from "next";
import { productRequestPath, withLocale } from "@/config/site-routes";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { getCmsClient } from "@/lib/cms/client";
import { getLocaleCopy } from "@/lib/copy/site-copy";
import { getRequestLocale } from "@/lib/request-locale";
import { getEditorialSeoKeywords } from "@/lib/seo/locale-seo";
import { buildRouteMetadata } from "@/lib/seo/metadata";

const consultationDirectionSlugs = [
  "vision-max",
  "hi-end-audio",
  "living-glass",
  "hologram",
] as const;

const contactEmail = "sale@montelar.ru";
const contactPhone = "+7 993 914 25 05";
const contactPhoneHref = "tel:+79939142505";
const maxChatHref = "https://max.ru/";

export async function generateContactRouteMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const contactPage = await getCmsClient().getEditorialPageBySlug("contact", locale);

  return buildRouteMetadata({
    title: contactPage?.seo.title ?? "Contact | Montelar",
    description:
      contactPage?.seo.description ??
      getLocaleCopy(locale, {
        en: "Private contact for clients, architects, regional partners and project teams.",
        de: "Privater Kontakt für Kunden, Architekten, regionale Partner und Projektteams.",
        es: "Contacto privado para clientes, arquitectos, socios regionales y equipos de proyecto.",
        fr: "Contact privé pour clients, architectes, partenaires régionaux et équipes projet.",
        zh: "面向客户、建筑师、区域伙伴与项目团队的私人联系入口。",
        ja: "顧客、建築家、地域パートナー、プロジェクトチームのための個別連絡窓口。",
        ru: "Частный контакт для клиентов, архитекторов, региональных партнеров и проектных команд.",
      }),
    path: contactPage?.seo.routePath ?? contactPage?.routePath ?? "/contact",
    locale,
    keywords: getEditorialSeoKeywords(locale, "contact", contactPage?.title ?? "Contact"),
  });
}

export async function ContactRoutePage() {
  const locale = await getRequestLocale();
  const cmsClient = getCmsClient();
  const t = (en: string, ru: string) =>
    getLocaleCopy(locale, { en, de: en, es: en, fr: en, zh: en, ja: en, ru });
  const [directions, featuredProducts] = await Promise.all([
    cmsClient.listLaunchDirections(locale),
    cmsClient.listFeaturedProducts(locale),
  ]);

  const consultationDirections = consultationDirectionSlugs
    .map((slug) => directions.find((direction) => direction.slug === slug))
    .filter((direction): direction is NonNullable<typeof direction> => Boolean(direction));
  const consultationProducts = featuredProducts.filter((product) =>
    consultationDirectionSlugs.includes(
      product.directionSlug as (typeof consultationDirectionSlugs)[number],
    ),
  );

  return (
    <main className="contact-page contact-page--lux">
      <div className="contact-mobile-locale" aria-label={getLocaleCopy(locale, {
        en: "Page language",
        de: "Seitensprache",
        es: "Idioma de la página",
        fr: "Langue de la page",
        zh: "页面语言",
        ja: "ページ言語",
        ru: "Язык страницы",
      })}>
        <LocaleSwitcher className="contact-locale-switcher contact-locale-switcher--mobile" locale={locale} mode="inline" />
      </div>
      <section className="contact-hero" aria-labelledby="contact-title">
        <div className="contact-hero-depth" aria-hidden="true" />
        <div className="contact-wrap contact-hero-grid">
          <div className="contact-hero-copy">
            <p className="contact-eyebrow">
              {getLocaleCopy(locale, {
                en: "Private contact",
                de: "Privater Kontakt",
                es: "Contacto privado",
                fr: "Contact privé",
                zh: "私人联系",
                ja: "プライベートコンタクト",
                ru: "Частный контакт",
              })}
            </p>
            <h1 id="contact-title">
              {getLocaleCopy(locale, {
                en: "Contact Montelar",
                de: "Montelar kontaktieren",
                es: "Contactar con Montelar",
                fr: "Contacter Montelar",
                zh: "联系 Montelar",
                ja: "Montelar への連絡",
                ru: "Контакты Montelar",
              })}
            </h1>
            <p className="contact-lead">
              {getLocaleCopy(locale, {
                en: "Write directly about a private cinema, hi-end audio system, transparent display, hologram, partnership or installation brief. A short note is enough to start.",
                de: "Schreiben Sie direkt zu Privatkino, High-End-Audio, transparentem Display, Hologramm, Partnerschaft oder Installationsbrief. Eine kurze Nachricht genügt.",
                es: "Escriba directamente sobre cine privado, audio high-end, display transparente, holograma, colaboración o brief de instalación. Una nota breve basta para empezar.",
                fr: "Écrivez directement au sujet d'un cinéma privé, d'un système audio high-end, d'un display transparent, d'un hologramme, d'un partenariat ou d'un brief d'installation.",
                zh: "可直接说明私人影院、高端音响、透明显示、全息、合作或安装需求。简短说明即可开始。",
                ja: "プライベートシネマ、ハイエンドオーディオ、透明ディスプレイ、ホログラム、提携、設置概要について直接ご連絡ください。",
                ru: "Напишите напрямую о частном кинотеатре, hi-end аудио, прозрачном экране, голограмме, партнёрстве или инсталляции. Для старта достаточно короткого сообщения.",
              })}
            </p>
            <div className="contact-primary-actions" aria-label={getLocaleCopy(locale, { en: "Direct contact channels", de: "Direkte Kontaktkanäle", es: "Canales directos", fr: "Canaux directs", zh: "直接联系方式", ja: "直接連絡先", ru: "Прямые контакты" })}>
              <a className="contact-action contact-action--accent" href={contactPhoneHref}>
                {contactPhone}
              </a>
              <a
                className="contact-action"
                href={maxChatHref}
                target="_blank"
                rel="noreferrer"
              >
                {t("Message on MAX", "Написать в MAX")}
              </a>
              <a className="contact-action" href={`mailto:${contactEmail}`}>
                {contactEmail}
              </a>
            </div>
          </div>

          <aside className="contact-hero-aside" aria-label={getLocaleCopy(locale, { en: "Contact summary", de: "Kontaktübersicht", es: "Resumen de contacto", fr: "Résumé contact", zh: "联系摘要", ja: "連絡概要", ru: "Кратко о контакте" })}>
            <LocaleSwitcher className="contact-locale-switcher contact-locale-switcher--panel" locale={locale} mode="inline" />
            <dl className="contact-signal-list">
              <div>
                <dt>{getLocaleCopy(locale, { en: "Commercial contact", de: "Kommerzieller Kontakt", es: "Contacto comercial", fr: "Contact commercial", zh: "商务联系", ja: "商談窓口", ru: "Коммерческий контакт" })}</dt>
                <dd><a href={`mailto:${contactEmail}`}>{contactEmail}</a></dd>
              </div>
              <div>
                <dt>{getLocaleCopy(locale, { en: "Phone", de: "Telefon", es: "Teléfono", fr: "Téléphone", zh: "电话", ja: "電話", ru: "Телефон" })}</dt>
                <dd><a href={contactPhoneHref}>{contactPhone}</a></dd>
              </div>
              <div>
                <dt>{getLocaleCopy(locale, { en: "Best first note", de: "Beste erste Nachricht", es: "Primera nota ideal", fr: "Premier message idéal", zh: "建议首封信息", ja: "最初の連絡内容", ru: "Что написать сразу" })}</dt>
                <dd>
                  {getLocaleCopy(locale, {
                    en: "city, object, task, preferred direction and timing",
                    de: "Stadt, Objekt, Aufgabe, gewünschte Richtung und Timing",
                    es: "ciudad, objeto, tarea, dirección deseada y calendario",
                    fr: "ville, lieu, objectif, direction souhaitée et calendrier",
                    zh: "城市、项目、任务、意向方向和时间",
                    ja: "都市、対象、目的、希望方向、時期",
                    ru: "город, объект, задача, интересующее направление и ориентир по срокам",
                  })}
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <section className="contact-brief contact-wrap" aria-labelledby="contact-brief-title">
        <div className="contact-section-heading">
          <p className="contact-eyebrow">
            {getLocaleCopy(locale, { en: "How the dialogue starts", de: "Wie der Dialog beginnt", es: "Cómo empieza el diálogo", fr: "Comment le dialogue commence", zh: "对话如何开始", ja: "対話の始まり", ru: "Как начинается диалог" })}
          </p>
          <h2 id="contact-brief-title">
            {getLocaleCopy(locale, {
              en: "A calm entry point for projects, dealers and private clients.",
              de: "Ein ruhiger Einstieg für Projekte, Händler und Privatkunden.",
              es: "Un punto de entrada sereno para proyectos, dealers y clientes privados.",
              fr: "Un point d'entrée calme pour projets, revendeurs et clients privés.",
              zh: "面向项目、经销商与私人客户的安静入口。",
              ja: "プロジェクト、ディーラー、個人顧客のための静かな入口。",
              ru: "Прямой контакт для частных проектов, дилеров и интеграторов.",
            })}
          </h2>
        </div>
        <div className="contact-brief-copy">
          <p>
            {getLocaleCopy(locale, {
              en: "Like the leading high-end houses, Montelar keeps contact direct: questions, remarks, product interest, listening sessions, partner requests and early project ideas can all begin from one address.",
              de: "Wie führende High-End-Häuser hält Montelar den Kontakt direkt: Fragen, Hinweise, Produktinteresse, Hörtermine, Partneranfragen und frühe Projektideen können über eine Adresse beginnen.",
              es: "Como las casas high-end de referencia, Montelar mantiene el contacto directo: preguntas, comentarios, interés de producto, sesiones de escucha, socios e ideas de proyecto pueden empezar desde una dirección.",
              fr: "Comme les grandes maisons high-end, Montelar garde le contact direct : questions, remarques, intérêt produit, sessions d'écoute, partenaires et idées de projet commencent depuis une adresse.",
              zh: "如高端品牌一样，Montelar 保持直接联系：问题、反馈、产品兴趣、试听、合作与早期项目想法都可从一个入口开始。",
              ja: "主要なハイエンドブランドと同じく、Montelar は直接連絡を重視します。質問、意見、製品関心、試聴、パートナー依頼、初期プロジェクト相談を一つの窓口から始められます。",
              ru: "По этому адресу принимаются частные проектные запросы, дилерские обращения, интерес к продуктам, запросы на демонстрацию и первичные брифы по инсталляциям.",
            })}
          </p>
          <ol className="contact-process">
            <li>
              <span>01</span>
              {getLocaleCopy(locale, { en: "Describe the object, task and expected result.", de: "Beschreiben Sie Objekt, Aufgabe und gewünschtes Ergebnis.", es: "Describa el objeto, la tarea y el resultado esperado.", fr: "Décrivez le lieu, l'objectif et le résultat attendu.", zh: "说明项目、任务和期望结果。", ja: "対象、目的、期待する結果を説明してください。", ru: "Опишите объект, задачу и желаемый результат." })}
            </li>
            <li>
              <span>02</span>
              {getLocaleCopy(locale, { en: "Montelar clarifies the system, installation logic and demonstration path.", de: "Montelar klärt System, Installationslogik und Demonstrationsweg.", es: "Montelar aclara sistema, lógica de instalación y demostración.", fr: "Montelar clarifie le système, la logique d'installation et la démonstration.", zh: "Montelar 明确系统、安装逻辑和演示路径。", ja: "Montelar がシステム、設置ロジック、デモの流れを整理します。", ru: "Montelar уточняет состав системы, логику монтажа и формат демонстрации." })}
            </li>
            <li>
              <span>03</span>
              {getLocaleCopy(locale, { en: "The next step is a private consultation, product selection or partner follow-up.", de: "Der nächste Schritt ist Beratung, Produktauswahl oder Partnerkontakt.", es: "El siguiente paso es consulta privada, selección de producto o seguimiento de partner.", fr: "La suite devient conseil privé, sélection produit ou suivi partenaire.", zh: "下一步是私人咨询、产品选择或合作跟进。", ja: "次のステップは個別相談、製品選定、またはパートナー対応です。", ru: "Следующий шаг — частная консультация, подбор решения или партнёрское сопровождение." })}
            </li>
          </ol>
        </div>
      </section>

      <section className="contact-routes contact-wrap" aria-labelledby="contact-routes-title">
        <div className="contact-section-heading">
          <p className="contact-eyebrow">
            {getLocaleCopy(locale, { en: "Choose a direction", de: "Richtung wählen", es: "Elegir dirección", fr: "Choisir une direction", zh: "选择方向", ja: "方向を選ぶ", ru: "Выберите направление" })}
          </p>
          <h2 id="contact-routes-title">
            {getLocaleCopy(locale, {
              en: "If the direction is already clear, open the relevant Montelar line.",
              de: "Wenn die Anfrage bereits umrissen ist, gehen Sie direkt in den passenden Produktkontext.",
              es: "Si la solicitud ya tiene forma, pase directamente al contexto de producto adecuado.",
              fr: "Si la demande est déjà cadrée, passez directement au bon contexte produit.",
              zh: "如果需求已经成形，请直接进入合适的产品语境。",
              ja: "依頼内容がすでに固まっている場合は、適切な製品文脈へ直接進んでください。",
              ru: "Если направление уже понятно, откройте соответствующую линию Montelar.",
            })}
          </h2>
        </div>
        <div className="contact-route-lines">
          {consultationDirections.map((direction, index) => (
            <Link
              key={direction.slug}
              className="contact-route-line"
              href={withLocale(direction.routePath, locale)}
            >
              <span className="contact-route-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="contact-route-title">{direction.navigationLabel ?? direction.name}</span>
              <span className="contact-route-desc">{direction.shortDescription}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="contact-products contact-wrap" aria-labelledby="contact-products-title">
        <div className="contact-section-heading">
          <p className="contact-eyebrow">
            {getLocaleCopy(locale, { en: "Already know the direction?", de: "Richtung schon klar?", es: "¿Ya sabe la dirección?", fr: "Vous savez déjà quoi explorer ?", zh: "已经知道方向？", ja: "方向が決まっていますか？", ru: "Уже знаете, что обсудить?" })}
          </p>
          <h2 id="contact-products-title">
            {getLocaleCopy(locale, {
              en: "Choose the closest Montelar direction below, or write to us directly if the request is easier to explain in your own words.",
              de: "Wählen Sie unten die passende Montelar-Richtung oder schreiben Sie direkt, wenn sich die Anfrage besser frei beschreiben lässt.",
              es: "Elija abajo la dirección Montelar más cercana o escríbanos directamente si es más fácil explicarlo con sus propias palabras.",
              fr: "Choisissez ci-dessous la direction Montelar la plus proche, ou écrivez-nous directement si la demande se décrit mieux avec vos mots.",
              zh: "选择下方最接近的 Montelar 方向；如果更容易用自己的话说明，也可以直接写给我们。",
              ja: "下から近い Montelar の方向を選ぶか、ご自身の言葉で説明しやすい場合は直接ご連絡ください。",
              ru: "Выберите близкое направление ниже или напишите нам напрямую, если задачу проще описать своими словами.",
            })}
          </h2>
        </div>
        <div className="contact-product-lines">
          {consultationProducts.slice(0, 4).map((product) => (
            <Link
              key={product.slug}
              className="contact-product-line"
              href={productRequestPath(product.slug, locale)}
            >
              <span>{product.name}</span>
              <small>{product.shortDescription}</small>
            </Link>
          ))}
        </div>
      </section>

      <section className="contact-requisites contact-wrap" aria-labelledby="contact-requisites-title">
        <div className="contact-section-heading">
          <p className="contact-eyebrow">{t("Company details", "Реквизиты")}</p>
          <h2 id="contact-requisites-title">{t("Bank account details", "Реквизиты счёта")}</h2>
        </div>
        <dl className="contact-requisites-list">
          <div className="contact-req-row contact-req-row--wide">
            <dt>{t("Organization", "Название организации")}</dt>
            <dd>ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ИВАНОВ АНДРЕЙ ВЛАДИМИРОВИЧ</dd>
          </div>
          <div className="contact-req-row">
            <dt>{t("TIN (INN)", "ИНН")}</dt>
            <dd className="contact-req-num">503216147020</dd>
          </div>
          <div className="contact-req-row">
            <dt>{t("OGRNIP", "ОГРНИП")}</dt>
            <dd className="contact-req-num">321508100608068</dd>
          </div>
          <div className="contact-req-row">
            <dt>{t("Account", "Расчётный счёт")}</dt>
            <dd className="contact-req-num">40802810400002848025</dd>
          </div>
          <div className="contact-req-row">
            <dt>{t("Bank", "Банк")}</dt>
            <dd>АО «ТБанк»</dd>
          </div>
          <div className="contact-req-row">
            <dt>{t("Bank TIN", "ИНН банка")}</dt>
            <dd className="contact-req-num">7710140679</dd>
          </div>
          <div className="contact-req-row">
            <dt>{t("BIC", "БИК банка")}</dt>
            <dd className="contact-req-num">044525974</dd>
          </div>
          <div className="contact-req-row">
            <dt>{t("Correspondent account", "Корреспондентский счёт")}</dt>
            <dd className="contact-req-num">30101810145250000974</dd>
          </div>
          <div className="contact-req-row contact-req-row--wide">
            <dt>{t("Bank legal address", "Юридический адрес банка")}</dt>
            <dd>127287, г. Москва, ул. Хуторская 2-я, д. 38А, стр. 26</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
