import type { Metadata } from "next";
import {
  DirectionRoutePage,
  generateDirectionRouteMetadata,
} from "@/components/direction-route-page";
import { getLocaleCopy } from "@/lib/copy/site-copy";
import { getRequestLocale } from "@/lib/request-locale";

export async function generateMetadata(): Promise<Metadata> {
  return generateDirectionRouteMetadata(
    "vision-max",
    "Vision MAX",
    "Private cinema environments and immersive screening systems.",
    "/vision-max",
  );
}

export default function VisionMaxPage() {
  const localePromise = getRequestLocale();

  return localePromise.then((locale) => (
    <DirectionRoutePage
      directionSlug="vision-max"
      fallbackTitle="Vision MAX"
      fallbackDescription="Private cinema environments and immersive screening systems."
      intro={getLocaleCopy(locale, {
        en: "Vision MAX frames private cinema as an interior environment shaped by image scale, seating geometry and controlled light.",
        de: "Vision MAX rahmt privates Kino als Innenraum, geprägt von Bildmaßstab, Sitzgeometrie und kontrolliertem Licht.",
        es: "Vision MAX presenta el cine privado como un entorno interior definido por la escala de imagen, la geometría de asientos y la luz controlada.",
        fr: "Vision MAX presente le cinema prive comme un environnement interieur faconne par l'echelle de l'image, la geometrie des assises et la lumiere maitrisee.",
        zh: "Vision MAX 将私人影院视为由画面尺度、座席几何和受控光线塑造的室内环境。",
        ja: "Vision MAX は、映像のスケール、座席のジオメトリー、制御された光で形づくるインテリア環境としてプライベートシネマを捉えます。",
        ru: "Vision MAX рассматривает частный кинотеатр как интерьерную среду, построенную на масштабе изображения, геометрии посадки и контролируемом свете.",
      })}
      notes={[
        getLocaleCopy(locale, {
          en: "Use Vision MAX when the room and the cinema atmosphere matter before the exact equipment set.",
          de: "Vision MAX passt, wenn Raum und Kinoatmosphäre vor der konkreten Geräteliste stehen.",
          es: "Empiece aqui si la sala y la atmosfera de cine importan antes que el conjunto exacto de equipos.",
          fr: "Commencez ici si la piece et l'atmosphere cinema comptent avant la liste precise des equipements.",
          zh: "当房间和影院氛围比具体设备清单更先决定方向时，选择 Vision MAX。",
          ja: "具体的な機器構成より先に部屋とシネマの空気感が重要な場合、Vision MAX が適しています。",
          ru: "Vision MAX подходит, когда сначала важны сама комната и атмосфера кинотеатра, а не конкретный комплект техники.",
        }),
        getLocaleCopy(locale, {
          en: "When the room concept feels right, the conversation can narrow into a product or private consultation.",
          de: "Wenn das Raumkonzept stimmt, kann das Gespräch in ein Produkt oder eine private Beratung übergehen.",
          es: "Avance hacia productos o consulta cuando el concepto de sala ya encaje.",
          fr: "Passez ensuite aux produits ou a la consultation lorsque le concept de piece est juste.",
          zh: "当房间概念成立后，对话可收束到具体产品或私人咨询。",
          ja: "部屋のコンセプトが整ったら、製品またはプライベート相談へ絞り込めます。",
          ru: "Дальше можно перейти к продуктам или консультации, когда концепция комнаты уже совпадает с вашим замыслом.",
        }),
      ]}
    />
  ));
}
