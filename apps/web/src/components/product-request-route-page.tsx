import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { productDetailPath, withLocale } from "@/config/site-routes";
import { ProductInquiryForm } from "@/components/product-inquiry-form";
import { RoutePageTemplate } from "@/components/route-page-template";
import { getCmsClient } from "@/lib/cms/client";
import { getLocaleCopy, isRussianLocale } from "@/lib/copy/site-copy";
import type { CmsProductInquiryField } from "@/lib/cms/types";
import { localizeSharedInquiryField } from "@/lib/forms/product-inquiry-copy";
import { getRequestLocale } from "@/lib/request-locale";
import { getRequestSeoKeywords } from "@/lib/seo/locale-seo";
import { buildRouteMetadata } from "@/lib/seo/metadata";

type ProductRequestRoutePageProps = {
  productSlug: string;
};

const fallbackFieldKeys = [
  "fullName",
  "email",
  "phone",
  "projectBrief",
  "timeline",
  "consent",
] as const;

function formatToken(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export async function generateProductRequestRouteMetadata(
  productSlug: string,
): Promise<Metadata> {
  const locale = await getRequestLocale();
  const cmsClient = getCmsClient();
  const [product, form] = await Promise.all([
    cmsClient.getProductBySlug(productSlug, locale),
    cmsClient.getProductInquiryFormByProductSlug(productSlug, locale),
  ]);

  return buildRouteMetadata({
    title:
      form?.title ??
      (product
        ? getLocaleCopy(locale, {
            en: `Request ${product.name} | Montelar`,
            de: `${product.name} anfragen | Montelar`,
            es: `Solicitar ${product.name} | Montelar`,
            fr: `Demander ${product.name} | Montelar`,
            zh: `咨询 ${product.name} | Montelar`,
            ja: `${product.name} を問い合わせる | Montelar`,
            ru: `Заявка на ${product.name} | Montelar`,
          })
        : getLocaleCopy(locale, {
            en: `${productSlug} | Request | Montelar`,
            de: `${productSlug} | Anfrage | Montelar`,
            es: `${productSlug} | Solicitud | Montelar`,
            fr: `${productSlug} | Demande | Montelar`,
            zh: `${productSlug} | 咨询 | Montelar`,
            ja: `${productSlug} | 問い合わせ | Montelar`,
            ru: `${productSlug} | Заявка | Montelar`,
          })),
    description:
      form?.description ??
      product?.shortDescription ??
      getLocaleCopy(locale, {
        en: "Dedicated Montelar product inquiry.",
        de: "Eigene Montelar Produktanfrage.",
        es: "Solicitud dedicada de producto Montelar.",
        fr: "Demande produit dédiée Montelar.",
        zh: "Montelar 产品专属咨询。",
        ja: "Montelar 製品専用の問い合わせ。",
        ru: "Отдельная заявка по продукту Montelar.",
      }),
    path: product?.inquiryRoutePath ?? `/request/${productSlug}`,
    canonicalPath: product?.routePath ?? `/products/${productSlug}`,
    locale,
    keywords: getRequestSeoKeywords(locale, product?.name ?? productSlug),
    robots: {
      index: false,
      follow: true,
    },
  });
}

export async function ProductRequestRoutePage({
  productSlug,
}: ProductRequestRoutePageProps) {
  const locale = await getRequestLocale();
  const isRu = isRussianLocale(locale);
  const cmsClient = getCmsClient();
  const product = await cmsClient.getProductBySlug(productSlug, locale);

  if (!product) {
    notFound();
  }

  const [direction, form, contactPage, siblingPool] = await Promise.all([
    cmsClient.getDirectionBySlug(product.directionSlug, locale),
    cmsClient.getProductInquiryFormByProductSlug(product.slug, locale),
    cmsClient.getEditorialPageBySlug("contact", locale),
    cmsClient.listProductsByDirection(product.directionSlug, locale),
  ]);

  const resolvedTitle = form?.title ?? getLocaleCopy(locale, {
    en: `Request ${product.name}`,
    de: `${product.name} anfragen`,
    es: `Solicitar ${product.name}`,
    fr: `Demander ${product.name}`,
    zh: `咨询 ${product.name}`,
    ja: `${product.name} を問い合わせる`,
    ru: `Заявка по ${product.name}`,
  });
  const resolvedSummary =
    form?.description ??
    getLocaleCopy(locale, {
      en: `Private request for ${product.name}: space, scenarios, privacy and preferred consultation format.`,
      de: `Private Anfrage zu ${product.name}: Raum, Szenarien, Privatsphäre und gewünschtes Beratungsformat.`,
      es: `Solicitud privada para ${product.name}: espacio, escenarios, privacidad y formato de consulta preferido.`,
      fr: `Demande privée pour ${product.name} : espace, scénarios, confidentialité et format de conseil souhaité.`,
      zh: `${product.name} 私人咨询：空间、场景、隐私与期望的咨询形式。`,
      ja: `${product.name} のプライベート相談: 空間、シナリオ、プライバシー、希望する相談形式。`,
      ru: `Частная заявка по ${product.name}: пространство, сценарии, приватность и желаемый формат консультации.`,
    });
  const renderedFields =
    form?.fields.length
      ? form.fields
      : fallbackFieldKeys.map<CmsProductInquiryField>((fieldKey) => {
          const fieldType: CmsProductInquiryField["fieldType"] =
            fieldKey === "email"
              ? "email"
              : fieldKey === "phone"
                ? "phone"
                : fieldKey === "projectBrief"
                  ? "textarea"
                  : fieldKey === "consent"
                    ? "consent"
                    : "text";

          return {
            fieldKey,
            fieldType,
            label: formatToken(fieldKey),
            required: fieldKey !== "timeline",
            width:
              fieldKey === "fullName" || fieldKey === "email" || fieldKey === "phone"
                ? "half"
                : "full",
          };
        }).map((field) => localizeSharedInquiryField(field, locale));
  const relatedRequests = siblingPool
    .filter((candidate) => candidate.slug !== product.slug)
    .slice(0, 3);
  return (
    <RoutePageTemplate
      eyebrow={getLocaleCopy(locale, {
        en: "Private consultation",
        de: "Private Beratung",
        es: "Consulta privada",
        fr: "Consultation privée",
        zh: "私人咨询",
        ja: "プライベート相談",
        ru: "Частная консультация",
      })}
      title={resolvedTitle}
      intro={resolvedSummary}
      status={getLocaleCopy(locale, {
        en: "Montelar receives the product, room and privacy context in one private consultation brief.",
        de: "Ein Montelar Berater erhält Produkt-, Raum- und Privatsphäre-Kontext in einer privaten Anfrage.",
        es: "Un asesor de Montelar recibe el contexto de producto, sala y privacidad en una solicitud controlada.",
        fr: "Un conseiller Montelar reçoit le contexte produit, pièce et confidentialité dans une demande maîtrisée.",
        zh: "Montelar 顾问会在一份受控咨询中收到产品、空间与隐私背景。",
        ja: "Montelarのアドバイザーが、製品、空間、プライバシーの文脈を一つの管理された依頼として受け取ります。",
        ru: "Консультант Montelar получает продуктовый, интерьерный и приватный контекст в одной частной заявке.",
      })}
      nextTask={getLocaleCopy(locale, {
        en: "For residences, private cinemas, galleries, hospitality suites and partner showrooms.",
        de: "Für Residenzen, private Kinos, Galerien, Hospitality-Suiten und Partner-Showrooms.",
        es: "Utiliza esta vía para residencias, cines privados, galerías, suites hoteleras y showrooms asociados.",
        fr: "Utilisez ce parcours pour résidences, cinémas privés, galeries, suites hôtelières et showrooms partenaires.",
        zh: "适用于住宅、私人影院、画廊、酒店套房与合作展厅项目。",
        ja: "住宅、プライベートシネマ、ギャラリー、ホスピタリティスイート、パートナーショールームに適した窓口です。",
        ru: "Подходит для резиденций, частных кинозалов, галерей, hospitality-пространств и партнерских шоурумов.",
      })}
      notes={[
        getLocaleCopy(locale, {
          en: `Focus product: ${product.name}.`,
          de: `Ausgewählter Fokus: ${product.name}.`,
          es: `Foco seleccionado: ${product.name}.`,
          fr: `Focalisation choisie : ${product.name}.`,
          zh: `已选择重点：${product.name}。`,
          ja: `選択中の対象：${product.name}。`,
          ru: `Выбранный фокус: ${product.name}.`,
        }),
        direction
          ? getLocaleCopy(locale, {
              en: `${direction.name} defines the room family, installation discipline and advisory team for the conversation.`,
              de: `${direction.name} definiert Raumfamilie, Installationsdisziplin und Beratungsteam für das Gespräch.`,
              es: `${direction.name} define la familia de espacio, la disciplina de instalación y el equipo asesor para la conversación.`,
              fr: `${direction.name} définit la famille de pièce, la discipline d'installation et l'équipe conseil pour l'échange.`,
              zh: `${direction.name} 会定义空间类型、安装纪律与后续顾问团队。`,
              ja: `${direction.name} が空間の種類、施工の規律、相談チームを定めます。`,
              ru: `${direction.name} задает тип пространства, дисциплину инсталляции и состав консультации.`,
            })
          : getLocaleCopy(locale, {
              en: "The request remains available while the direction is still being clarified.",
              de: "Die Anfrage bleibt verfügbar, während die Richtung noch geklärt wird.",
              es: "La solicitud sigue disponible mientras la dirección aún se aclara.",
              fr: "La demande reste disponible pendant que la direction se précise.",
              zh: "即使方向仍在确认，咨询入口也保持可用。",
              ja: "ディレクションがまだ整理中でも、相談依頼は利用できます。",
              ru: "Заявка продолжит работу даже без отдельного контекста направления.",
            }),
        form
          ? getLocaleCopy(locale, {
              en: "Montelar reviews the room, scenarios, privacy level and integration context before the first reply.",
              de: "Montelar prüft Raum, Szenarien, Privatsphäre und Integrationskontext vor der ersten Antwort.",
              es: "Montelar revisa la sala, los escenarios, el nivel de privacidad y la integración antes de la primera respuesta.",
              fr: "Montelar examine la pièce, les scénarios, le niveau de confidentialité et l'intégration avant la première réponse.",
              zh: "Montelar 会在首次回复前审阅空间、使用场景、隐私级别与集成语境。",
              ja: "Montelar は最初の返信前に、空間、利用シーン、プライバシー、統合の文脈を確認します。",
              ru: "Montelar до первого ответа разбирает пространство, сценарии, уровень приватности и контекст интеграции.",
            })
          : getLocaleCopy(locale, {
              en: "A short baseline question set is available for the first private request.",
              de: "Ein kurzer Basissatz von Fragen steht für die erste private Anfrage bereit.",
              es: "Hay una base breve de preguntas para la primera solicitud privada.",
              fr: "Une courte base de questions est prête pour la première demande privée.",
              zh: "首次私人咨询可使用一组简短基础问题。",
              ja: "初回のプライベート依頼には短い基本質問セットを使えます。",
              ru: "Для первичной частной заявки доступен короткий базовый набор вопросов.",
            }),
        getLocaleCopy(locale, {
          en: "Product context stays available before the consultation is sent.",
          de: "Produktdetails bleiben zur Prüfung verfügbar, bevor die Beratung gesendet wird.",
          es: "Los detalles del producto siguen disponibles para revisar antes de enviar la consulta.",
          fr: "Les détails produit restent disponibles avant l'envoi de la consultation.",
          zh: "提交咨询前仍可返回查看产品细节。",
          ja: "相談を送信する前に、製品詳細を確認できます。",
          ru: "Перед отправкой консультации можно вернуться к деталям продукта.",
        }),
      ]}
      links={relatedRequests.map((candidate) => ({
        href: candidate.inquiryRoutePath,
        label: getLocaleCopy(locale, {
          en: `${candidate.name} request`,
          de: `${candidate.name} Anfrage`,
          es: `${candidate.name} solicitud`,
          fr: `${candidate.name} demande`,
          zh: `${candidate.name} 咨询`,
          ja: `${candidate.name} 問い合わせ`,
          ru: `${candidate.name} заявка`,
        }),
        description: candidate.shortDescription,
      }))}
      linksTitle={relatedRequests.length
        ? getLocaleCopy(locale, {
            en: "Related consultations",
            de: "Verwandte Beratungen",
            es: "Solicitudes relacionadas",
            fr: "Demandes liees",
            zh: "相关咨询",
            ja: "関連する相談",
            ru: "Связанные заявки",
          })
        : getLocaleCopy(locale, {
            en: "Request context",
            de: "Anfragekontext",
            es: "Contexto de la solicitud",
            fr: "Contexte de la demande",
            zh: "咨询范围",
            ja: "問い合わせ範囲",
            ru: "Контекст заявки",
      })}
      locale={locale}
      heroMedia={
        <div className="request-hero-card" aria-label={getLocaleCopy(locale, {
          en: "Request summary",
          de: "Anfrageübersicht",
          es: "Resumen de solicitud",
          fr: "Résumé de demande",
          zh: "咨询摘要",
          ja: "依頼サマリー",
          ru: "Сводка заявки",
        })}>
          <p className="eyebrow">{getLocaleCopy(locale, {
            en: "Consultation brief",
            de: "Beratungsbrief",
            es: "Brief de consulta",
            fr: "Brief conseil",
            zh: "咨询 brief",
            ja: "相談ブリーフ",
            ru: "Бриф консультации",
          })}</p>
          <dl className="request-hero-ledger">
            <div>
              <dt>{getLocaleCopy(locale, { en: "Product", de: "Produkt", es: "Producto", fr: "Produit", zh: "产品", ja: "製品", ru: "Продукт" })}</dt>
              <dd>{product.name}</dd>
            </div>
            <div>
              <dt>{getLocaleCopy(locale, { en: "Direction", de: "Richtung", es: "Dirección", fr: "Direction", zh: "方向", ja: "ディレクション", ru: "Направление" })}</dt>
              <dd>{direction?.name ?? formatToken(product.directionSlug)}</dd>
            </div>
            <div>
              <dt>{getLocaleCopy(locale, { en: "Brief", de: "Brief", es: "Brief", fr: "Brief", zh: "brief", ja: "ブリーフ", ru: "Бриф" })}</dt>
              <dd>{getLocaleCopy(locale, { en: "private", de: "privat", es: "privado", fr: "privé", zh: "私人", ja: "プライベート", ru: "частный" })}</dd>
            </div>
          </dl>
        </div>
      }
    >
      <div className="route-grid product-route-grid">
        <div className="route-panel product-route-panel">
          <p className="eyebrow">{getLocaleCopy(locale, {
            en: "Consultation context",
            de: "Beratungskontext",
            es: "Contexto de la consulta",
            fr: "Contexte de consultation",
            zh: "咨询范围",
            ja: "相談範囲",
            ru: "Контекст консультации",
          })}</p>
          <p className="product-route-summary">
            {getLocaleCopy(locale, {
              en: "The private brief captures project context without public pricing pressure: product, property, timing, privacy and desired advisory depth.",
              de: "Die private Anfrage rahmt Projektkontext ohne öffentlichen Preisdruck: Produkt, Objekt, Timing, Privatsphäre und gewünschte Beratungstiefe.",
              es: "La solicitud privada encuadra el contexto de proyecto sin presión pública de precio: producto, propiedad, plazos, privacidad y acompañamiento deseado.",
              fr: "La demande privée cadre le contexte projet sans pression publique de prix : produit, lieu, calendrier, confidentialité et niveau de conseil.",
              zh: "私人咨询会梳理项目语境，而不制造公开价格压力：产品、空间、时间、隐私和所需顾问深度。",
              ja: "プライベート依頼は公開価格の圧力をかけず、製品、物件、時期、プライバシー、相談の深さを整理します。",
              ru: "Частная заявка фиксирует проектный контекст без публичных цен и без лишнего давления на посетителя: продукт, объект, сроки, приватность и желаемый уровень сопровождения.",
            })}
          </p>
          <ul className="status-list">
            <li>{getLocaleCopy(locale, { en: "The reply is shaped around room architecture, viewing scenarios and privacy level.", de: "Die Antwort orientiert sich an Raumarchitektur, Nutzungsszenarien und Privatsphäre.", es: "La respuesta se construye alrededor de la arquitectura del espacio, los escenarios de uso y la privacidad.", fr: "La réponse se construit autour de l'architecture de la pièce, des scénarios et du niveau de confidentialité.", zh: "回复会围绕空间架构、观看场景与隐私级别展开。", ja: "返信は空間設計、視聴シナリオ、プライバシー水準を軸に組み立てます。", ru: "Ответ строится вокруг архитектуры пространства, сценариев просмотра и уровня приватности." })}</li>
            <li>{getLocaleCopy(locale, { en: "After submission, Montelar reviews the context and returns with a precise next step.", de: "Nach dem Absenden prüft Montelar den Kontext und meldet sich mit einem präzisen nächsten Schritt.", es: "Tras el envío, Montelar revisa el contexto y responde con un siguiente paso preciso.", fr: "Après l'envoi, Montelar examine le contexte et revient avec une étape suivante précise.", zh: "提交后，Montelar 会审核语境并给出明确下一步。", ja: "送信後、Montelar が文脈を確認し、具体的な次のステップを返します。", ru: "После отправки Montelar проверяет контекст и возвращается с предметным следующим шагом." })}</li>
            <li>{getLocaleCopy(locale, { en: "Budget, plans and private details stay outside the public site.", de: "Budget, Pläne und private Details bleiben außerhalb der öffentlichen Website.", es: "Presupuesto, planos y detalles privados permanecen fuera del sitio público.", fr: "Budget, plans et détails privés restent hors du site public.", zh: "预算、图纸和私人细节不会进入公开网站。", ja: "予算、図面、個人情報は公開サイトに出ません。", ru: "Бюджет, планы и приватные детали не попадают в публичную часть сайта." })}</li>
            <li>
              {form
                ? getLocaleCopy(locale, { en: "The post-submit message stays product-specific and keeps the visitor inside the Montelar flow.", de: "Die Bestätigung bleibt produktspezifisch und hält den Besucher im Montelar-Ablauf.", es: "El mensaje posterior al envío sigue siendo específico del producto y mantiene al visitante dentro del flujo Montelar.", fr: "Le message après envoi reste lié au produit et garde le visiteur dans le flux Montelar.", zh: "提交后的信息保持产品语境，并让访客留在 Montelar 流程中。", ja: "送信後のメッセージは製品固有で、訪問者を Montelar の流れに保ちます。", ru: "Сообщение после отправки остается продуктовым и не выводит посетителя из Montelar-сценария." })
                : getLocaleCopy(locale, { en: "A baseline post-submit message is ready for the first request.", de: "Eine Basisbestätigung ist für die erste Anfrage bereit.", es: "Hay un mensaje base posterior al envío para la primera solicitud.", fr: "Un message de confirmation de base est prêt pour la première demande.", zh: "首次咨询已有基础提交确认。", ja: "初回依頼向けの基本送信後メッセージが用意されています。", ru: "Базовое сообщение после отправки готово для первичного запроса." })}
            </li>
          </ul>
        </div>

        <div className="route-panel product-route-panel">
          <p className="eyebrow">{getLocaleCopy(locale, {
            en: "Continue",
            de: "Weiterer Weg",
            es: "Continuar desde aqui",
            fr: "Continuer depuis ici",
            zh: "路径衔接",
            ja: "ルート連携",
            ru: "Продолжить",
          })}</p>
          <div className="route-link-list">
            <Link
              className="route-link-card"
              href={productDetailPath(product.slug, locale)}
            >
              <span className="route-link-label">{product.name}</span>
              <span className="route-link-description">
                {getLocaleCopy(locale, {
                  en: "Review the product again for positioning, hierarchy and context.",
                  de: "Zurück zum Produkt für Positionierung, Hierarchie und Kontext.",
                  es: "Volver al producto para revisar posicionamiento, jerarquía y contexto.",
                  fr: "Revenir au produit pour le positionnement, la hiérarchie et le contexte.",
                  zh: "返回产品页查看定位、层级与整体语境。",
                  ja: "製品ページへ戻り、位置づけ、階層、文脈を確認します。",
                  ru: "Вернуться к продукту для позиционирования, иерархии и общего контекста.",
                })}
              </span>
            </Link>

            {direction ? (
              <Link
                className="route-link-card"
                href={withLocale(direction.routePath, locale)}
              >
                <span className="route-link-label">{direction.name}</span>
                <span className="route-link-description">{direction.shortDescription}</span>
              </Link>
            ) : null}

            {contactPage ? (
              <Link
                className="route-link-card"
                href={withLocale(contactPage.routePath, locale)}
              >
                <span className="route-link-label">
                  {contactPage.navigationLabel ?? contactPage.title}
                </span>
                <span className="route-link-description">
                  {isRu
                  ? "Консультация уровня бренда для партнерских, проектных и общих обращений."
                    : getLocaleCopy(locale, { en: "Brand-level consultation for partner, project and general contact conversations.", de: "Beratung auf Markenebene für Partner-, Projekt- und allgemeine Anfragen.", es: "Consulta de marca para conversaciones de socios, proyectos y contacto general.", fr: "Conseil au niveau marque pour partenaires, projets et demandes générales.", zh: "面向合作、项目和一般联系的品牌级咨询。", ja: "パートナー、プロジェクト、一般連絡のためのブランドレベル相談。", ru: "Консультация уровня бренда для партнерских, проектных и общих обращений." })}
                </span>
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="route-panel product-blueprint-panel">
        <p className="eyebrow">{getLocaleCopy(locale, {
          en: "Private request",
          de: "Private Anfrage",
          es: "Solicitud privada",
          fr: "Demande privée",
          zh: "私人请求",
          ja: "プライベート依頼",
          ru: "Частная заявка",
        })}</p>
        <p className="product-route-summary">
          {isRu
            ? "Заполните только тот контекст, который помогает Montelar подготовить предметный ответ. Технические детали можно уточнить позже с консультантом."
            : getLocaleCopy(locale, { en: "Provide the context that helps Montelar prepare a precise reply. Technical detail can be refined later with an advisor.", de: "Teilen Sie den Kontext, der Montelar eine präzise Antwort ermöglicht. Technische Details können später mit einem Berater geklärt werden.", es: "Comparta el contexto que ayuda a Montelar a preparar una respuesta precisa. Los detalles técnicos pueden ajustarse después con un asesor.", fr: "Partagez le contexte qui aide Montelar à préparer une réponse précise. Les détails techniques seront affinés ensuite avec un conseiller.", zh: "请提供有助于 Montelar 准备准确回复的语境。技术细节可稍后与顾问细化。", ja: "Montelar が的確に返答するための文脈を共有してください。技術的な詳細は後でアドバイザーと詰められます。", ru: "Заполните только тот контекст, который помогает Montelar подготовить предметный ответ. Технические детали можно уточнить позже с консультантом." })}
        </p>
        <div className="request-consultation-panel">
          <div>
            <p className="request-form-kicker">{getLocaleCopy(locale, { en: "Before you submit", de: "Vor dem Absenden", es: "Antes de enviar", fr: "Avant l'envoi", zh: "提交之前", ja: "送信前に", ru: "До отправки" })}</p>
            <p className="request-form-intro">
              {getLocaleCopy(locale, { en: "Contact, project and privacy details are separated so the first consultation does not start by collecting the basics again.", de: "Kontakt, Projekt und Privatsphäre sind getrennt, damit die erste Beratung nicht wieder mit Basisfragen beginnt.", es: "Contacto, proyecto y privacidad se separan para que la primera consulta no empiece recogiendo datos básicos de nuevo.", fr: "Contact, projet et confidentialité sont séparés afin que le premier échange ne recommence pas par les bases.", zh: "联系方式、项目与隐私信息会分开整理，让首次咨询无需重新收集基础资料。", ja: "連絡先、プロジェクト、プライバシーを分け、初回相談が基本情報の再確認から始まらないようにします。", ru: "Контакты, проект и приватность разделены, чтобы первая консультация не начиналась с повторного сбора базовой информации." })}
            </p>
          </div>
          <dl className="request-consultation-ledger">
            <div>
              <dt>{getLocaleCopy(locale, { en: "Contact", de: "Kontakt", es: "Contacto", fr: "Contact", zh: "联系方式", ja: "連絡先", ru: "Контакт" })}</dt>
              <dd>{getLocaleCopy(locale, { en: "private", de: "privat", es: "privado", fr: "privé", zh: "私人", ja: "プライベート", ru: "частный" })}</dd>
            </div>
            <div>
              <dt>{getLocaleCopy(locale, { en: "Project", de: "Projekt", es: "Proyecto", fr: "Projet", zh: "项目", ja: "プロジェクト", ru: "Проект" })}</dt>
              <dd>{getLocaleCopy(locale, { en: "context", de: "Kontext", es: "contexto", fr: "contexte", zh: "语境", ja: "文脈", ru: "контекст" })}</dd>
            </div>
            <div>
              <dt>{getLocaleCopy(locale, { en: "Format", de: "Format", es: "Formato", fr: "Format", zh: "形式", ja: "形式", ru: "Формат" })}</dt>
              <dd>{form?.title ?? getLocaleCopy(locale, { en: "Private consultation", de: "Private Beratung", es: "Consulta privada", fr: "Consultation privée", zh: "私人咨询", ja: "プライベート相談", ru: "Частная консультация" })}</dd>
            </div>
          </dl>
        </div>
        <ProductInquiryForm
          fields={renderedFields}
          locale={locale}
          productSlug={product.slug}
          stagedMessage={
            form?.successMessage ??
            (isRu
              ? "Заявка сохранена. Команда Montelar получила контекст и подготовит следующий шаг консультации."
              : getLocaleCopy(locale, { en: "Your request was saved. The Montelar team now has the context needed to prepare the next consultation step.", de: "Ihre Anfrage wurde gespeichert. Das Montelar Team hat den Kontext für den nächsten Beratungsschritt.", es: "Su solicitud se ha guardado. El equipo Montelar tiene el contexto para preparar el siguiente paso de consulta.", fr: "Votre demande est enregistrée. L'équipe Montelar dispose du contexte pour préparer la suite du conseil.", zh: "您的咨询已保存。Montelar 团队已收到准备下一步咨询所需的语境。", ja: "ご依頼を保存しました。Montelar チームは次の相談ステップに必要な文脈を受け取りました。", ru: "Заявка сохранена. Команда Montelar получила контекст и подготовит следующий шаг консультации." }))
          }
          stagedTitle={form?.successTitle ?? getLocaleCopy(locale, { en: "Request received", de: "Anfrage erhalten", es: "Solicitud recibida", fr: "Demande reçue", zh: "咨询已收到", ja: "依頼を受け付けました", ru: "Заявка принята" })}
          submitLabel={form?.submitLabel ?? getLocaleCopy(locale, { en: "Request consultation", de: "Beratung anfragen", es: "Solicitar consulta", fr: "Demander une consultation", zh: "请求咨询", ja: "相談を依頼", ru: "Запросить консультацию" })}
        />
      </div>
    </RoutePageTemplate>
  );
}
