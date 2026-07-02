import type { Metadata } from "next";
import {
  DirectionRoutePage,
  generateDirectionRouteMetadata,
} from "@/components/direction-route-page";
import { getLocaleCopy } from "@/lib/copy/site-copy";
import { getRequestLocale } from "@/lib/request-locale";

export async function generateMetadata(): Promise<Metadata> {
  return generateDirectionRouteMetadata(
    "pictorial-art-display",
    "Pictorial Art Display",
    "Framed digital art objects with architectural integration.",
    "/pictorial-art-display",
  );
}

export default function PictorialArtDisplayPage() {
  return getRequestLocale().then((locale) => {
    return (
      <DirectionRoutePage
        directionSlug="pictorial-art-display"
        fallbackTitle="Pictorial Art Display"
        fallbackDescription="Framed digital art objects with architectural integration."
        intro={getLocaleCopy(locale, {
          en: "Pictorial Art Display frames digital art as a collectible interior object before it is treated as a screen.",
          de: "Pictorial Art Display rahmt digitale Kunst zuerst als sammelbares Interior-Objekt, bevor sie als Bildschirm gelesen wird.",
          es: "Pictorial Art Display trata el arte digital como un objeto interior coleccionable antes de tratarlo como pantalla.",
          fr: "Pictorial Art Display aborde l'art numerique comme un objet interieur de collection avant de le considerer comme ecran.",
          zh: "Pictorial Art Display 先把数字艺术作为可收藏的室内对象呈现，再显露屏幕属性。",
          ja: "Pictorial Art Display は、スクリーンである前にコレクション可能なインテリアオブジェクトとしてデジタルアートを扱います。",
          ru: "Pictorial Art Display рассматривает цифровое искусство как коллекционный интерьерный объект до того, как оно начинает вести себя как экран.",
        })}
        notes={[
          getLocaleCopy(locale, {
            en: "Use Pictorial Art Display when wall, frame and atmosphere matter as much as the image itself.",
            de: "Pictorial Art Display passt, wenn Wand, Rahmen und Atmosphäre so wichtig sind wie das Bild selbst.",
            es: "Empiece aqui si la pared, el marco y la atmosfera importan tanto como la imagen.",
            fr: "Commencez ici si le mur, le cadre et l'atmosphere comptent autant que l'image.",
            zh: "当墙面、画框和氛围与图像本身同样重要时，选择 Pictorial Art Display。",
            ja: "壁、フレーム、空気感が映像そのものと同じくらい重要な場合に適しています。",
            ru: "Pictorial Art Display подходит, когда стена, рама и атмосфера важны не меньше самого изображения.",
          }),
          getLocaleCopy(locale, {
            en: "When the collector, hospitality or residential context is clear, the discussion can narrow into product and consultation.",
            de: "Wenn Sammler-, Hospitality- oder Wohnkontext klar ist, kann das Gespräch in Produkt und Beratung übergehen.",
            es: "Avance hacia productos o consulta cuando el contexto residencial, hospitality o de coleccion este claro.",
            fr: "Passez aux produits ou a la consultation lorsque le contexte collection, hospitality ou residentiel est clair.",
            zh: "收藏、酒店或住宅语境明确后，对话可收束到产品和咨询。",
            ja: "コレクター、ホスピタリティ、住宅の文脈が明確になれば、製品と相談へ進めます。",
            ru: "Дальше можно перейти к продуктам или консультации, когда уже понятен коллекционный, hospitality или жилой контекст.",
          }),
        ]}
      />
    );
  });
}
