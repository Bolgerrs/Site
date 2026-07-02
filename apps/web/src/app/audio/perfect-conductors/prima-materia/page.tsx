import type { Metadata } from "next";
import { RoutePageTemplate } from "@/components/route-page-template";
import { getLocaleCopy } from "@/lib/copy/site-copy";
import { getRequestLocale } from "@/lib/request-locale";
import { getLineSeoKeywords } from "@/lib/seo/locale-seo";
import { buildRouteMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return buildRouteMetadata({
    title: "Prima Materia | Montelar",
    description: getLocaleCopy(locale, {
      en: "Prima Materia conductor line for signal, power and material discipline.",
      de: "Prima Materia Kabellinie für Signal, Strom und materielle Disziplin.",
      es: "Línea de conductores Prima Materia para señal, energía y disciplina material.",
      fr: "Ligne de conducteurs Prima Materia pour le signal, l'alimentation et la discipline matière.",
      zh: "Prima Materia 线材系列，用于信号、电源与材料秩序。",
      ja: "信号、電源、素材の規律を扱う Prima Materia ケーブルライン。",
      ru: "Линейка Prima Materia для сигнала, питания и материальной дисциплины.",
    }),
    path: "/audio/perfect-conductors/prima-materia",
    locale,
    keywords: getLineSeoKeywords(locale, "Prima Materia"),
  });
}

export default function PrimaMateriaPage() {
  return getRequestLocale().then((locale) => (
    <RoutePageTemplate
      eyebrow="Prima Materia"
      title="Prima Materia"
      intro={getLocaleCopy(locale, {
        en: "Prima Materia gathers cable solutions for systems where signal integrity, power delivery and cable path discipline are specified together.",
        de: "Prima Materia bündelt Kabellösungen für Systeme, in denen Signalintegrität, Stromführung und Kabelführung gemeinsam geplant werden.",
        es: "Prima Materia reúne soluciones de cableado para sistemas donde integridad de señal, alimentación y trazado se especifican juntos.",
        fr: "Prima Materia réunit des solutions de câblage où intégrité du signal, alimentation et parcours sont définis ensemble.",
        zh: "Prima Materia 汇集线材方案，用于同时规划信号完整性、供电与走线秩序的系统。",
        ja: "Prima Materia は、信号の整合性、電源供給、配線の規律を一体で指定するシステムのためのケーブルラインです。",
        ru: "Prima Materia собирает кабельные решения для систем, где целостность сигнала, питание и трассировка проектируются вместе.",
      })}
      status={getLocaleCopy(locale, {
        en: "Prima Materia belongs where conductor choice, cable path, termination and visible restraint affect the whole system.",
        de: "Prima Materia gehört dorthin, wo Leiterwahl, Führung, Terminierung und sichtbare Zurückhaltung das ganze System beeinflussen.",
        es: "Prima Materia pertenece a sistemas donde conductor, recorrido, terminación y contención visible afectan al conjunto.",
        fr: "Prima Materia s'impose lorsque conducteur, parcours, terminaison et retenue visible influencent tout le système.",
        zh: "当导体选择、走线、端接和可见克制影响整个系统时，Prima Materia 才有意义。",
        ja: "導体選択、配線、端末処理、見える抑制がシステム全体に影響する場所に Prima Materia は属します。",
        ru: "Prima Materia нужна там, где выбор проводника, трасса, терминалы и видимая сдержанность влияют на всю систему.",
      })}
      nextTask={getLocaleCopy(locale, {
        en: "Discuss cable role, length, cable path and terminations once the system is clear.",
        de: "Besprechen Sie Kabelrolle, Länge, Führung und Terminierung, sobald der Systemweg klar ist.",
        es: "Defina función del cable, longitud, trazado y terminaciones cuando el recorrido del sistema esté claro.",
        fr: "Précisez rôle du câble, longueur, parcours et terminaisons lorsque le chemin système est clair.",
        zh: "系统路径明确后，再讨论线材角色、长度、走线和端接。",
        ja: "システム経路が見えたら、ケーブルの役割、長さ、配線、端末処理を確認します。",
        ru: "Когда путь системы понятен, уточните роль кабеля, длину, трассу и терминалы.",
      })}
      notes={[
        getLocaleCopy(locale, {
          en: "The line supports listening-room systems and installation-led projects where the cable path is part of the architecture.",
          de: "Die Linie unterstützt Hörräume und installationsgeführte Projekte, in denen Kabelführung Teil der Architektur ist.",
          es: "La línea acompaña salas de escucha y proyectos de instalación donde el trazado del cable forma parte de la arquitectura.",
          fr: "La ligne accompagne les salles d'écoute et les projets où le parcours des câbles appartient à l'architecture.",
          zh: "该线材系列适用于聆听空间和安装导向项目，其中走线也是建筑的一部分。",
          ja: "このラインは、配線が建築の一部となるリスニングルームや施工主導のプロジェクトに対応します。",
          ru: "Линейка поддерживает комнаты прослушивания и инсталляционные проекты, где трасса кабеля становится частью архитектуры.",
        }),
        getLocaleCopy(locale, {
          en: "The consultation clarifies conductor type, length, connector standard, visibility and the components being connected.",
          de: "Die Beratung klärt Leitertyp, Länge, Anschlussstandard, Sichtbarkeit und die verbundenen Komponenten.",
          es: "La consulta aclara tipo de conductor, longitud, conector, visibilidad y componentes conectados.",
          fr: "Le conseil précise type de conducteur, longueur, terminaison, visibilité et composants reliés.",
          zh: "咨询会确认导体类型、长度、端接标准、可见度和连接的组件。",
          ja: "相談では導体タイプ、長さ、端子規格、見え方、接続する機器を確認します。",
          ru: "Консультация уточняет тип проводника, длину, стандарт коннекторов, видимость трассы и компоненты, которые он соединяет.",
        }),
      ]}
      locale={locale}
    />
  ));
}
