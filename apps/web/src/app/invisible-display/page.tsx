import type { Metadata } from "next";
import {
  DirectionRoutePage,
  generateDirectionRouteMetadata,
} from "@/components/direction-route-page";
import { getLocaleCopy } from "@/lib/copy/site-copy";
import { getRequestLocale } from "@/lib/request-locale";

export async function generateMetadata(): Promise<Metadata> {
  return generateDirectionRouteMetadata(
    "living-glass",
    "Living Glass",
    "Transparent media glass for residential, gallery and branded interiors.",
    "/invisible-display",
  );
}

export default function InvisibleDisplayPage() {
  return getRequestLocale().then((locale) => {
    return (
      <DirectionRoutePage
        directionSlug="living-glass"
        fallbackTitle="Living Glass"
        fallbackDescription="Transparent media glass for residential, gallery and branded interiors."
        intro={getLocaleCopy(locale, {
          en: "Living Glass brings image into transparent media glass that stays architectural and quiet until content is needed.",
          de: "Living Glass bringt Bild in transparentes Medienglas, das architektonisch und ruhig bleibt, bis Inhalte gebraucht werden.",
          es: "Living Glass explica como una superficie de display puede seguir siendo arquitectonica, serena y casi invisible hasta que el contenido sea necesario.",
          fr: "Living Glass montre comment une surface d'affichage peut rester architecturale, calme et presque invisible jusqu'au moment du contenu.",
          zh: "Living Glass 将图像带入透明媒体玻璃，在内容出现前仍保持建筑性和安静。",
          ja: "Living Glass は、コンテンツが必要になるまで建築的で静かな透明メディアガラスへ映像を入れます。",
          ru: "Living Glass вводит изображение в прозрачное медийное стекло, которое остается архитектурным и спокойным до момента показа контента.",
        })}
        notes={[
          getLocaleCopy(locale, {
            en: "Use Living Glass when interior integration matters as much as image output.",
            de: "Living Glass passt, wenn die Integration in den Innenraum ebenso wichtig ist wie die Bildausgabe.",
            es: "Empiece aqui si la integracion interior importa tanto como la imagen.",
            fr: "Commencez ici si l'integration interieure compte autant que l'image.",
            zh: "当室内整合与图像输出同样重要时，Living Glass 才合适。",
            ja: "映像出力と同じくらいインテリア統合が重要な場合、Living Glass が適しています。",
            ru: "Living Glass подходит, когда интеграция в интерьер важна не меньше самого изображения.",
          }),
          getLocaleCopy(locale, {
            en: "When placement, glass behavior and context are clear, the discussion can narrow into product choice or consultation.",
            de: "Wenn Platzierung, Glasverhalten und Kontext klar sind, kann die Auswahl auf Produkt oder Beratung eingegrenzt werden.",
            es: "Avance hacia productos o consulta cuando ubicacion, comportamiento del vidrio y contexto ya esten claros.",
            fr: "Passez aux produits ou a la consultation lorsque l'emplacement, le comportement du verre et le contexte sont clairs.",
            zh: "当位置、玻璃表现和项目语境明确后，对话可进入产品选择或咨询。",
            ja: "配置、ガラスの振る舞い、文脈が明確になったら、製品選定または相談へ進めます。",
            ru: "Дальше можно перейти к продуктам или консультации, когда уже понятны размещение, поведение стекла и контекст.",
          }),
        ]}
      />
    );
  });
}
