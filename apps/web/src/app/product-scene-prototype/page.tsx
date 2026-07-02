import { ProductScenePrototype } from "@/components/product-scene-prototype";
import { withLocale } from "@/config/site-routes";
import { getLocaleCopy } from "@/lib/copy/site-copy";
import { getRequestLocale } from "@/lib/request-locale";
import { buildRouteMetadata } from "@/lib/seo/metadata";

export async function generateMetadata() {
  const locale = await getRequestLocale();

  return buildRouteMetadata({
    title: getLocaleCopy(locale, {
      en: "Interactive product scene prototype | Montelar",
      de: "Interaktiver Produktszenen-Prototyp | Montelar",
      es: "Prototipo de escena interactiva de producto | Montelar",
      fr: "Prototype de scène produit interactive | Montelar",
      zh: "交互式产品场景原型 | Montelar",
      ja: "インタラクティブ製品シーンプロトタイプ | Montelar",
      ru: "Прототип интерактивного выбора продуктов | Montelar",
    }),
    description: getLocaleCopy(locale, {
      en: "A controlled Montelar prototype for selecting product directions directly on the main visual scene.",
      de: "Ein kontrollierter Montelar-Prototyp zur Auswahl von Produktrichtungen direkt in der Hauptszene.",
      es: "Prototipo controlado de Montelar para elegir direcciones de producto directamente sobre la escena principal.",
      fr: "Prototype Montelar contrôlé pour choisir les directions produit directement dans la scène principale.",
      zh: "Montelar 受控原型，用于在主视觉场景中直接选择产品方向。",
      ja: "メインビジュアル上で製品ディレクションを選ぶためのMontelarプロトタイプ。",
      ru: "Тестовый прототип Montelar для выбора продуктовых направлений прямо на главном визуале.",
    }),
    path: "/product-scene-prototype",
    locale,
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default async function ProductScenePrototypePage() {
  const locale = await getRequestLocale();
  const targets = [
    {
      id: "screen" as const,
      label: getLocaleCopy(locale, { en: "Image", de: "Bild", es: "Imagen", fr: "Image", zh: "图像", ja: "映像", ru: "Экран" }),
      title: getLocaleCopy(locale, {
        en: "Private cinema surface",
        de: "Private Cinema Surface",
        es: "Superficie de cine privado",
        fr: "Surface de cinéma privé",
        zh: "私人影院画面",
        ja: "プライベートシネマ面",
        ru: "Плоскость приватного кино",
      }),
      description: getLocaleCopy(locale, {
        en: "Screen, projection and room light as one visual field.",
        de: "Leinwand, Projektion und Raumlicht als ein visuelles Feld.",
        es: "Pantalla, proyección y luz de sala como un solo campo visual.",
        fr: "Écran, projection et lumière de pièce comme un seul champ visuel.",
        zh: "屏幕、投影与空间光被组织为一个视觉场。",
        ja: "スクリーン、投影、室内光を一つの視覚面として構成します。",
        ru: "Экран, проекция и свет комнаты как единое визуальное поле.",
      }),
      href: withLocale("/vision-max", locale),
    },
    {
      id: "speakers" as const,
      label: getLocaleCopy(locale, { en: "Sound", de: "Klang", es: "Sonido", fr: "Son", zh: "声音", ja: "音", ru: "Звук" }),
      title: getLocaleCopy(locale, {
        en: "Reference loudspeakers",
        de: "Referenzlautsprecher",
        es: "Altavoces de referencia",
        fr: "Enceintes de référence",
        zh: "参考级音箱",
        ja: "リファレンススピーカー",
        ru: "Референсная акустика",
      }),
      description: getLocaleCopy(locale, {
        en: "Matched speaker pairs scaled to the room and listening geometry.",
        de: "Abgestimmte Lautsprecherpaare für Raum und Hörgeometrie.",
        es: "Parejas de altavoces ajustadas a la sala y a la geometría de escucha.",
        fr: "Paires d'enceintes adaptées à la pièce et à la géométrie d'écoute.",
        zh: "与空间和聆听几何匹配的成对音箱。",
        ja: "空間とリスニングジオメトリに合わせたペアスピーカー。",
        ru: "Парные колонки, подобранные под комнату и геометрию прослушивания.",
      }),
      href: withLocale("/audio/speakers", locale),
    },
    {
      id: "amp-left" as const,
      label: getLocaleCopy(locale, { en: "Power", de: "Leistung", es: "Potencia", fr: "Puissance", zh: "功率", ja: "駆動", ru: "Усиление" }),
      title: getLocaleCopy(locale, {
        en: "Left power amplifier",
        de: "Linker Leistungsverstärker",
        es: "Amplificador izquierdo",
        fr: "Amplificateur gauche",
        zh: "左侧功放",
        ja: "左側パワーアンプ",
        ru: "Левый усилитель",
      }),
      description: getLocaleCopy(locale, {
        en: "A separate amplifier element in the lower system chain.",
        de: "Ein separates Verstärkerelement in der unteren Systemkette.",
        es: "Un elemento independiente dentro de la cadena inferior.",
        fr: "Un élément séparé dans la chaîne basse du système.",
        zh: "下方系统链路中的独立放大单元。",
        ja: "下部システムチェーン内の独立したアンプ要素。",
        ru: "Отдельный элемент усиления в нижней системной цепочке.",
      }),
      href: withLocale("/audio/amplifiers", locale),
    },
    {
      id: "amp-left-center" as const,
      label: getLocaleCopy(locale, { en: "Source", de: "Quelle", es: "Fuente", fr: "Source", zh: "音源", ja: "ソース", ru: "Источник" }),
      title: getLocaleCopy(locale, {
        en: "Source component",
        de: "Quellkomponente",
        es: "Componente fuente",
        fr: "Composant source",
        zh: "音源组件",
        ja: "ソースコンポーネント",
        ru: "Левый центральный компонент",
      }),
      description: getLocaleCopy(locale, {
        en: "The compact component between power and screen plane.",
        de: "Die kompakte Komponente zwischen Leistung und Bildebene.",
        es: "El componente compacto entre potencia y plano visual.",
        fr: "Le composant compact entre puissance et plan image.",
        zh: "位于功率与画面平面之间的紧凑组件。",
        ja: "駆動部と映像面の間に置かれるコンパクトな要素。",
        ru: "Компактный компонент между усилением и экранной плоскостью.",
      }),
      href: withLocale("/audio", locale),
    },
    {
      id: "amp-center" as const,
      label: getLocaleCopy(locale, { en: "Core", de: "Kern", es: "Núcleo", fr: "Noyau", zh: "核心", ja: "中核", ru: "Центр" }),
      title: getLocaleCopy(locale, {
        en: "Central component",
        de: "Zentrale Komponente",
        es: "Componente central",
        fr: "Composant central",
        zh: "中央组件",
        ja: "中央コンポーネント",
        ru: "Центральный компонент",
      }),
      description: getLocaleCopy(locale, {
        en: "The central unit is highlighted separately from the rest of the chain.",
        de: "Die zentrale Einheit wird getrennt vom Rest der Kette hervorgehoben.",
        es: "La unidad central se destaca separada del resto de la cadena.",
        fr: "L'unité centrale est isolée du reste de la chaîne.",
        zh: "中央单元与其他链路部件分开高亮。",
        ja: "中央ユニットを他のチェーン要素から分けて表示します。",
        ru: "Центральный блок подсвечивается отдельно от остальной цепочки.",
      }),
      href: withLocale("/technology", locale),
    },
    {
      id: "amp-right" as const,
      label: getLocaleCopy(locale, { en: "Power", de: "Leistung", es: "Potencia", fr: "Puissance", zh: "功率", ja: "駆動", ru: "Усиление" }),
      title: getLocaleCopy(locale, {
        en: "Right power amplifier",
        de: "Rechter Leistungsverstärker",
        es: "Amplificador derecho",
        fr: "Amplificateur droit",
        zh: "右侧功放",
        ja: "右側パワーアンプ",
        ru: "Правый усилитель",
      }),
      description: getLocaleCopy(locale, {
        en: "The second power element, selected independently.",
        de: "Das zweite Leistungselement, separat auswählbar.",
        es: "El segundo elemento de potencia, seleccionable por separado.",
        fr: "Le second élément de puissance, sélectionné séparément.",
        zh: "第二个功率单元，可独立选择。",
        ja: "個別に選択できる二つ目の駆動要素。",
        ru: "Второй силовой элемент, выбирается отдельно.",
      }),
      href: withLocale("/audio/amplifiers", locale),
    },
  ];

  return (
    <section className="product-scene-prototype-page">
      <div className="product-scene-prototype-page__intro">
        <p className="eyebrow">
          {getLocaleCopy(locale, {
            en: "Prototype",
            de: "Prototyp",
            es: "Prototipo",
            fr: "Prototype",
            zh: "原型",
            ja: "プロトタイプ",
            ru: "Прототип",
          })}
        </p>
        <h1>
          {getLocaleCopy(locale, {
            en: "Interactive product selection on the main visual scene.",
            de: "Interaktive Produktauswahl auf der Hauptszene.",
            es: "Selección interactiva de producto sobre la escena principal.",
            fr: "Sélection produit interactive sur la scène visuelle principale.",
            zh: "主视觉场景上的交互式产品选择。",
            ja: "メインビジュアル上のインタラクティブな製品選択。",
            ru: "Интерактивный выбор продуктов на главном визуале.",
          })}
        </h1>
      </div>
      <ProductScenePrototype targets={targets} locale={locale} />
    </section>
  );
}
