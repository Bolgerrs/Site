import type { Metadata } from "next";
import {
  CategoryRoutePage,
  generateCategoryRouteMetadata,
} from "@/components/category-route-page";
import { getLocaleCopy } from "@/lib/copy/site-copy";
import { getRequestLocale } from "@/lib/request-locale";

type AudioCategoryPageProps = {
  params: Promise<{
    category: string;
  }>;
};

export async function generateMetadata({
  params,
}: AudioCategoryPageProps): Promise<Metadata> {
  const { category } = await params;

  return generateCategoryRouteMetadata(
    "hi-end-audio",
    category,
    category.replaceAll("-", " "),
    "Montelar Hi-end Audio category for comparing one product family inside a listening-room system.",
  );
}

export default async function AudioCategoryPage({
  params,
}: AudioCategoryPageProps) {
  const { category } = await params;
  const locale = await getRequestLocale();

  return (
    <CategoryRoutePage
      directionSlug="hi-end-audio"
      categorySlug={category}
      fallbackTitle={category.replaceAll("-", " ")}
      fallbackDescription="Montelar Hi-end Audio category for comparing one product family inside a listening-room system."
      intro={getLocaleCopy(locale, {
        en: "This category groups one audio family so related products can be compared without losing the room-level context.",
        de: "Diese Kategorie bündelt eine Audiofamilie, damit verwandte Produkte im Raumkontext vergleichbar bleiben.",
        es: "Esta categoría reúne una familia de audio para comparar productos relacionados sin perder el contexto de la sala.",
        fr: "Cette catégorie réunit une famille audio pour comparer les produits proches sans perdre le contexte de la pièce.",
        zh: "这个分类汇集一个音响家族，让相近产品在房间语境中比较。",
        ja: "このカテゴリは一つのオーディオファミリーをまとめ、部屋の文脈を失わずに関連製品を比較できます。",
        ru: "Эта категория собирает одну аудиосемью, чтобы можно было сравнивать близкие продукты без потери контекста комнаты.",
      })}
      notes={[
        getLocaleCopy(locale, {
          en: "This category is useful when the family to compare is already clear.",
          de: "Diese Kategorie hilft, wenn die zu vergleichende Familie bereits klar ist.",
          es: "Empiece aquí cuando ya sepa qué familia desea comparar.",
          fr: "Commencez ici lorsque vous savez déjà quelle famille vous souhaitez comparer.",
          zh: "当需要比较的产品家族已经明确时，这个分类最有用。",
          ja: "比較したいファミリーがすでに明確な場合に有効です。",
          ru: "Категория подходит, когда уже понятно, какую продуктовую семью нужно сравнить.",
        }),
        getLocaleCopy(locale, {
          en: "When the shortlist becomes clear, the conversation can move into a product page or private request.",
          de: "Wenn die engere Auswahl klar ist, führt das Gespräch zur Produktseite oder privaten Anfrage.",
          es: "Pase a una página de producto o a una solicitud privada cuando el shortlist ya esté claro.",
          fr: "Passez à une page produit ou à une demande privée lorsque la shortlist est déjà claire.",
          zh: "候选范围明确后，对话可进入产品页或私人咨询。",
          ja: "候補が明確になったら、製品ページまたはプライベート依頼へ進めます。",
          ru: "Переходите в продуктовую карточку или частную заявку, когда shortlist уже складывается.",
        }),
      ]}
    />
  );
}
