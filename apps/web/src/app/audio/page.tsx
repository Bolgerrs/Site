import type { Metadata } from "next";
import {
  DirectionRoutePage,
  generateDirectionRouteMetadata,
} from "@/components/direction-route-page";
import { getLocaleCopy } from "@/lib/copy/site-copy";
import { getRequestLocale } from "@/lib/request-locale";

export async function generateMetadata(): Promise<Metadata> {
  return generateDirectionRouteMetadata(
    "hi-end-audio",
    "Hi-end Audio",
    "Loudspeakers, source components, amplification and cable systems.",
    "/audio",
  );
}

export default async function AudioPage() {
  const locale = await getRequestLocale();

  return (
    <DirectionRoutePage
      directionSlug="hi-end-audio"
      fallbackTitle="Hi-end Audio"
      fallbackDescription="Loudspeakers, source components, amplification and cable systems."
      intro={getLocaleCopy(locale, {
        en: "Loudspeakers, source components, amplification and cable systems are gathered here as one listening-room discipline.",
        de: "Lautsprecher, Quellkomponenten, Verstaerkung und Kabelsysteme werden hier als eine Disziplin des Hoerraums gefuehrt.",
        es: "Altavoces, fuentes, amplificación y cableado se reúnen aquí como una sola disciplina de sala de escucha.",
        fr: "Enceintes, sources, amplification et câblage sont réunis ici comme une seule discipline de pièce d'écoute.",
        zh: "在这里，音箱、信源、放大与线缆被组织为一个完整的聆听空间体系。",
        ja: "スピーカー、ソース機器、増幅、ケーブルシステムを一つのリスニングルームの規律としてまとめます。",
        ru: "Здесь акустика, источники, усиление и кабели собраны в одну дисциплину комнаты прослушивания.",
      })}
      notes={[
        getLocaleCopy(locale, {
          en: "The listening role of the system comes first; categories narrow the choice after the room is understood.",
          de: "Beginnen Sie mit der Rolle des Systems im Hoerraum und verengen Sie die Wahl dann ueber die Kategorie.",
          es: "Empiece por la función del sistema en la sala de escucha y concrete después por categoría.",
          fr: "Commencez par le rôle du système dans la pièce d'écoute, puis précisez par catégorie.",
          zh: "先从系统在聆听空间中的作用开始，再通过类别收窄选择。",
          ja: "まずシステムがリスニングルームで担う役割を捉え、その後カテゴリで選択を絞ります。",
          ru: "Начните с роли системы в комнате, затем сузьте выбор через категорию.",
        }),
        getLocaleCopy(locale, {
          en: "Categories compare product families first; individual products make sense when the system path is clear.",
          de: "Vergleichen Sie zuerst die Familien ueber die Kategorien und wechseln Sie erst dann in einzelne Produkte.",
          es: "Use las categorias para comparar familias primero y avance a productos solo cuando el camino este claro.",
          fr: "Utilisez d'abord les categories pour comparer les familles, puis passez aux produits lorsque le chemin est clair.",
          zh: "先通过类别比较产品家族，再在路径清晰时进入具体产品。",
          ja: "カテゴリで先に製品ファミリーを比較し、システムの方向が見えた段階で個別製品へ進みます。",
          ru: "Сначала сравните семьи через категории, а к продуктам переходите тогда, когда путь уже понятен.",
        }),
      ]}
    />
  );
}
