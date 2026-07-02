import type { Metadata } from "next";
import {
  DirectionRoutePage,
  generateDirectionRouteMetadata,
} from "@/components/direction-route-page";
import { getLocaleCopy } from "@/lib/copy/site-copy";
import { getRequestLocale } from "@/lib/request-locale";

export async function generateMetadata(): Promise<Metadata> {
  return generateDirectionRouteMetadata(
    "display-for-exhibition",
    "Exhibition Displays",
    "Embedded touch and media systems for exhibitions, showrooms and guided visitor journeys.",
    "/exhibition-displays",
  );
}

export default function ExhibitionDisplaysPage() {
  return getRequestLocale().then((locale) => {
    return (
      <DirectionRoutePage
        directionSlug="display-for-exhibition"
        fallbackTitle="Exhibition Displays"
        fallbackDescription="Embedded touch and media systems for exhibitions, showrooms and guided visitor journeys."
        intro={getLocaleCopy(locale, {
          en: "Exhibition Displays treats touch surfaces as part of architecture, visitor flow and guided visitor control.",
          de: "Exhibition Displays behandelt Touch-Flächen als Teil von Architektur, Besucherfluss und geführter Interaktion.",
          es: "Exhibition Displays trata las superficies tactiles como parte de la arquitectura, el recorrido del visitante y la interaccion guiada.",
          fr: "Exhibition Displays traite les surfaces tactiles comme une partie de l'architecture, du parcours visiteur et de l'interaction guidee.",
          zh: "Exhibition Displays 将触控表面视为建筑、访客动线和引导互动的一部分。",
          ja: "Exhibition Displays は、タッチ面を建築、来場者動線、ガイドされたインタラクションの一部として扱います。",
          ru: "Exhibition Displays рассматривает сенсорные поверхности как часть архитектуры, движения посетителя и управляемой интерактивности.",
        })}
        notes={[
          getLocaleCopy(locale, {
          en: "Exhibition Displays fits projects where interaction belongs to a wall, rail, table or showroom setting.",
            de: "Exhibition Displays passt zu Projekten, in denen Interaktion zu Wand, Schiene, Tisch oder Showroom gehört.",
            es: "Use esta direccion cuando la interaccion pertenece a un muro, un rail, una mesa o una superficie de showroom.",
            fr: "Utilisez cette direction lorsque l'interaction appartient a un mur, un rail, une table ou une surface de showroom.",
            zh: "当互动需要属于墙面、导轨、桌面或展厅场景时，Exhibition Displays 更合适。",
            ja: "壁、レール、テーブル、ショールームにインタラクションを組み込むプロジェクトに適しています。",
          ru: "Exhibition Displays подходит, когда интерактивность встроена в стену, рейл, стол или пространство шоурума.",
          }),
          getLocaleCopy(locale, {
            en: "When the visitor scenario is clear, the discussion can narrow into product format or consultation.",
            de: "Wenn das Besucherszenario klar ist, führt das Gespräch in Produktformat oder Beratung.",
            es: "Avance hacia productos o consulta cuando el escenario del visitante ya este claro.",
            fr: "Passez aux produits ou a la consultation lorsque le scenario visiteur est clair.",
            zh: "访客场景明确后，对话可进入产品形式或咨询。",
            ja: "来場者シナリオが明確になれば、製品形式または相談へ進めます。",
            ru: "Дальше можно перейти к продуктам или консультации, когда сценарий посетителя уже понятен.",
          }),
        ]}
      />
    );
  });
}
