import type { Metadata } from "next";
import Link from "next/link";
import { CategoryProductFilmStage, type CategoryFilmScene } from "@/components/category-product-film-stage";
import { withLocale } from "@/config/site-routes";
import { getLocaleCopy } from "@/lib/copy/site-copy";
import { getRequestLocale } from "@/lib/request-locale";
import { buildRouteMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return buildRouteMetadata({
    title: getLocaleCopy(locale, {
      en: "Category product-film study | Montelar",
      de: "Kategorie Product-Film Studie | Montelar",
      es: "Estudio product-film de categoria | Montelar",
      fr: "Etude product-film de categorie | Montelar",
      zh: "分类产品影片研究 | Montelar",
      ja: "カテゴリ製品フィルム検証 | Montelar",
      ru: "Исследование продуктового фильма категории | Montelar",
    }),
    description: getLocaleCopy(locale, {
      en: "A hidden Montelar category prototype testing product-led collage motion without replacing live category pages.",
      de: "Ein versteckter Montelar Kategorie-Prototyp fuer produktgefuehrte Collage-Bewegung ohne Austausch der Live-Kategorieseiten.",
      es: "Un prototipo oculto de categoria Montelar que prueba collage motion centrado en producto sin reemplazar las paginas activas.",
      fr: "Un prototype cache de categorie Montelar testant un collage produit anime sans remplacer les pages actives.",
      zh: "Montelar 隐藏分类原型，用产品驱动的拼贴动效测试分类叙事，不替换线上页面。",
      ja: "公開中のカテゴリを置き換えずに、製品主導のコラージュモーションを検証するMontelarの隠しルート。",
      ru: "Скрытый прототип Montelar: продуктовый collage motion для категорий без замены живых страниц.",
    }),
    path: "/category-product-film-prototype",
    locale,
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default async function CategoryProductFilmPrototypePage() {
  const locale = await getRequestLocale();
  const scenes: CategoryFilmScene[] = [
    {
      id: "acoustic-system",
      eyebrow: getLocaleCopy(locale, {
        en: "Listening-room audio",
        de: "Hoerraum-Audio",
        es: "Audio para sala de escucha",
        fr: "Audio de piece d'ecoute",
        zh: "聆听空间音响",
        ja: "リスニングルーム音響",
        ru: "Аудиосистема комнаты",
      }),
      title: getLocaleCopy(locale, {
        en: "The category begins as one composed sound object.",
        de: "Die Kategorie beginnt als ein komponiertes Klangobjekt.",
        es: "La categoria empieza como un solo objeto sonoro compuesto.",
        fr: "La categorie commence comme un seul objet sonore compose.",
        zh: "分类从一个完整的声音物件开始。",
        ja: "カテゴリは一つの構成された音のオブジェクトとして始まります。",
        ru: "Категория начинается как один собранный звуковой объект.",
      }),
      summary: getLocaleCopy(locale, {
        en: "Speakers, amplification and conductors are presented as a room discipline first. The visitor can compare the family only after the system logic is visible.",
        de: "Lautsprecher, Verstaerkung und Leiter erscheinen zuerst als Disziplin des Raums. Erst wenn die Systemlogik sichtbar ist, beginnt der Vergleich.",
        es: "Altavoces, amplificacion y conductores se presentan primero como disciplina de sala. La comparacion empieza cuando la logica del sistema ya es visible.",
        fr: "Enceintes, amplification et conducteurs sont d'abord une discipline de piece. La comparaison commence lorsque la logique systeme devient visible.",
        zh: "音箱、放大与导体先作为空间秩序呈现。系统逻辑可见之后，访客才进入比较。",
        ja: "スピーカー、増幅、導体をまず部屋の規律として見せます。システムの論理が見えてから比較に進みます。",
        ru: "Акустика, усиление и проводники сначала показываются как дисциплина пространства. Сравнение начинается после того, как видна логика системы.",
      }),
      metric: getLocaleCopy(locale, {
        en: "Speakers, electronics, conductors",
        de: "Lautsprecher, Elektronik, Leiter",
        es: "Altavoces, electronica, conductores",
        fr: "Enceintes, electronique, conducteurs",
        zh: "音箱、电子设备、导体",
        ja: "スピーカー、電子機器、導体",
        ru: "Акустика, электроника, проводники",
      }),
      primaryHref: withLocale("/audio/speakers", locale),
      primaryLabel: getLocaleCopy(locale, {
        en: "Open speaker family",
        de: "Lautsprecherfamilie oeffnen",
        es: "Abrir familia de altavoces",
        fr: "Ouvrir la famille d'enceintes",
        zh: "打开音箱家族",
        ja: "スピーカーファミリーを見る",
        ru: "Открыть акустику",
      }),
      secondaryHref: withLocale("/request/monolith-reference", locale),
      secondaryLabel: getLocaleCopy(locale, {
        en: "Request acoustic consultation",
        de: "Akustikberatung anfragen",
        es: "Solicitar consulta acustica",
        fr: "Demander un conseil acoustique",
        zh: "预约声学咨询",
        ja: "音響相談を依頼",
        ru: "Запросить консультацию",
      }),
      products: [
        {
          id: "monolith-reference",
          name: "Monolith Reference",
          href: withLocale("/products/monolith-reference", locale),
          note: getLocaleCopy(locale, {
            en: "Reference loudspeaker entry",
            de: "Referenzlautsprecher",
            es: "Entrada de altavoz de referencia",
            fr: "Entree enceinte de reference",
            zh: "参考级音箱入口",
            ja: "リファレンススピーカー",
            ru: "Референсная акустика",
          }),
        },
        {
          id: "vela-integrated-amplifier",
          name: "Vela Integrated Amplifier",
          href: withLocale("/products/vela-integrated-amplifier", locale),
          note: getLocaleCopy(locale, {
            en: "Amplification anchor",
            de: "Verstaerkungsanker",
            es: "Ancla de amplificacion",
            fr: "Ancrage d'amplification",
            zh: "放大核心",
            ja: "増幅の中核",
            ru: "Усилительный центр",
          }),
        },
        {
          id: "prima-materia-lux-speaker",
          name: "Prima Materia LUX Speaker",
          href: withLocale("/products/prima-materia-lux-speaker", locale),
          note: getLocaleCopy(locale, {
            en: "Conductor path",
            de: "Leiterweg",
            es: "Ruta de conductor",
            fr: "Chemin conducteur",
            zh: "导体路径",
            ja: "導体経路",
            ru: "Трасса проводника",
          }),
        },
      ],
      layers: [
        {
          id: "audio-speakers",
          src: "/images/home/product-series/paired-speakers.webp",
          alt: getLocaleCopy(locale, {
            en: "Paired Montelar loudspeakers",
            de: "Gepaarte Montelar Lautsprecher",
            es: "Altavoces Montelar emparejados",
            fr: "Enceintes Montelar appairees",
            zh: "成对 Montelar 音箱",
            ja: "ペアのMontelarスピーカー",
            ru: "Парные акустические системы Montelar",
          }),
          productId: "monolith-reference",
          className: "category-film-stage__layer--speakers",
        },
        {
          id: "audio-amplifier",
          src: "/images/home/product-series/amplifier-stack.webp",
          alt: getLocaleCopy(locale, {
            en: "Montelar audio electronics stack",
            de: "Montelar Audio-Elektronik",
            es: "Electronica de audio Montelar",
            fr: "Electronique audio Montelar",
            zh: "Montelar 音频电子设备",
            ja: "Montelarオーディオ機器",
            ru: "Аудиоэлектроника Montelar",
          }),
          productId: "vela-integrated-amplifier",
          className: "category-film-stage__layer--amplifier",
        },
        {
          id: "audio-cables",
          src: "/images/home/product-series/connected-system-four-plugs.webp",
          alt: getLocaleCopy(locale, {
            en: "Montelar conductor connection",
            de: "Montelar Leiterverbindung",
            es: "Conexion de conductor Montelar",
            fr: "Connexion de conducteur Montelar",
            zh: "Montelar 导体连接",
            ja: "Montelar導体接続",
            ru: "Подключение проводников Montelar",
          }),
          productId: "prima-materia-lux-speaker",
          className: "category-film-stage__layer--cables",
        },
        {
          id: "audio-disassembly",
          src: "/images/product-motion/speaker-pair-premium/engineered-disassembly-poster.webp",
          alt: getLocaleCopy(locale, {
            en: "Speaker structure study",
            de: "Studie einer Lautsprecherstruktur",
            es: "Estudio de estructura de altavoz",
            fr: "Etude de structure d'enceinte",
            zh: "音箱结构研究",
            ja: "スピーカー構造スタディ",
            ru: "Исследование структуры акустики",
          }),
          productId: "monolith-reference",
          className: "category-film-stage__layer--disassembly",
        },
      ],
    },
    {
      id: "display-surface",
      eyebrow: getLocaleCopy(locale, {
        en: "Glass and embedded display",
        de: "Glas und Einbaudisplay",
        es: "Cristal y display integrado",
        fr: "Verre et ecran integre",
        zh: "玻璃与嵌入式显示",
        ja: "ガラスと組込ディスプレイ",
        ru: "Стекло и встроенный дисплей",
      }),
      title: getLocaleCopy(locale, {
        en: "The display category is a surface, not a monitor list.",
        de: "Die Display-Kategorie ist eine Oberflaeche, keine Monitorliste.",
        es: "La categoria de display es una superficie, no una lista de monitores.",
        fr: "La categorie display est une surface, pas une liste d'ecrans.",
        zh: "显示分类是一种表面，而不是屏幕列表。",
        ja: "ディスプレイカテゴリはモニター一覧ではなく、空間の表面です。",
        ru: "Категория дисплеев — это поверхность, а не список мониторов.",
      }),
      summary: getLocaleCopy(locale, {
        en: "Transparent, seamless and embedded display choices are shown through placement and crop. The product path stays clear without turning the page into a showroom grid.",
        de: "Transparente, nahtlose und integrierte Displayoptionen werden ueber Platzierung und Zuschnitt gezeigt. Der Produktweg bleibt klar, ohne Raster.",
        es: "Opciones transparentes, continuas e integradas se muestran mediante colocacion y encuadre. El camino al producto queda claro sin cuadricula de showroom.",
        fr: "Les choix transparents, continus et integres se lisent par placement et cadrage. Le chemin produit reste clair sans grille de showroom.",
        zh: "透明、无缝与嵌入式显示通过位置和裁切来呈现。产品路径清晰，但页面不变成展厅网格。",
        ja: "透明、シームレス、組込型の選択肢を配置とクロップで示します。製品導線は明確で、ショールームグリッドにはしません。",
        ru: "Прозрачные, бесшовные и встроенные поверхности показаны через размещение и кроп. Путь к продукту остается ясным без выставочной сетки.",
      }),
      metric: getLocaleCopy(locale, {
        en: "Transparent, seamless, embedded",
        de: "Transparent, nahtlos, integriert",
        es: "Transparente, continuo, integrado",
        fr: "Transparent, continu, integre",
        zh: "透明、无缝、嵌入",
        ja: "透明、シームレス、組込",
        ru: "Прозрачное, бесшовное, встроенное",
      }),
      primaryHref: withLocale("/invisible-display", locale),
      primaryLabel: getLocaleCopy(locale, {
        en: "Open display direction",
        de: "Displayrichtung oeffnen",
        es: "Abrir direccion display",
        fr: "Ouvrir la direction display",
        zh: "打开显示方向",
        ja: "ディスプレイ領域を見る",
        ru: "Открыть дисплеи",
      }),
      secondaryHref: withLocale("/request/living-glass-oled", locale),
      secondaryLabel: getLocaleCopy(locale, {
        en: "Request display consultation",
        de: "Displayberatung anfragen",
        es: "Solicitar consulta display",
        fr: "Demander un conseil display",
        zh: "预约显示方案咨询",
        ja: "ディスプレイ相談を依頼",
        ru: "Запросить дисплейный проект",
      }),
      products: [
        {
          id: "living-glass-oled",
          name: "Living Glass OLED",
          href: withLocale("/products/living-glass-oled", locale),
          note: getLocaleCopy(locale, {
            en: "Transparent architectural surface",
            de: "Transparente Architekturflaeche",
            es: "Superficie arquitectonica transparente",
            fr: "Surface architecturale transparente",
            zh: "透明建筑表面",
            ja: "透明な建築表面",
            ru: "Прозрачная архитектурная поверхность",
          }),
        },
        {
          id: "exhibition-wall",
          name: "Exhibition Wall",
          href: withLocale("/products/exhibition-wall", locale),
          note: getLocaleCopy(locale, {
            en: "Embedded visitor display",
            de: "Integriertes Besuchsdisplay",
            es: "Display integrado para visitantes",
            fr: "Ecran integre visiteur",
            zh: "嵌入式访客显示",
            ja: "組込型ビジター表示",
            ru: "Встроенная поверхность для посетителей",
          }),
        },
      ],
      layers: [
        {
          id: "display-glass",
          src: "/images/home/product-series/transparent-screens.webp",
          alt: getLocaleCopy(locale, {
            en: "Transparent display surface",
            de: "Transparente Displayflaeche",
            es: "Superficie de display transparente",
            fr: "Surface d'ecran transparente",
            zh: "透明显示表面",
            ja: "透明ディスプレイ表面",
            ru: "Прозрачная дисплейная поверхность",
          }),
          productId: "living-glass-oled",
          className: "category-film-stage__layer--glass",
        },
        {
          id: "display-led",
          src: "/images/home/product-series/led-seamless.webp",
          alt: getLocaleCopy(locale, {
            en: "Seamless LED display surface",
            de: "Nahtlose LED-Displayflaeche",
            es: "Superficie LED continua",
            fr: "Surface LED sans rupture",
            zh: "无缝 LED 显示表面",
            ja: "シームレスLED表示面",
            ru: "Бесшовная LED-поверхность",
          }),
          productId: "exhibition-wall",
          className: "category-film-stage__layer--led",
        },
        {
          id: "display-mechanism",
          src: "/images/home/montelar-master-screen-mechanism.webp",
          alt: getLocaleCopy(locale, {
            en: "Montelar screen mechanism detail",
            de: "Montelar Screen-Mechanik",
            es: "Detalle de mecanismo de pantalla Montelar",
            fr: "Detail de mecanisme d'ecran Montelar",
            zh: "Montelar 屏幕机构细节",
            ja: "Montelarスクリーン機構ディテール",
            ru: "Деталь экранного механизма Montelar",
          }),
          productId: "living-glass-oled",
          className: "category-film-stage__layer--mechanism",
        },
      ],
    },
  ];

  return (
    <main className="category-product-film-page">
      <section className="category-film-hero">
        <p className="eyebrow">
          {getLocaleCopy(locale, {
            en: "Category product film",
            de: "Kategorie Product Film",
            es: "Product film de categoria",
            fr: "Product film de categorie",
            zh: "分类产品影片",
            ja: "カテゴリ製品フィルム",
            ru: "Продуктовый фильм категории",
          })}
        </p>
        <h1>
          {getLocaleCopy(locale, {
            en: "Choose a category by seeing how its products occupy the room.",
            de: "Waehlen Sie eine Kategorie, indem Sie sehen, wie ihre Produkte den Raum besetzen.",
            es: "Elija una categoria viendo como sus productos ocupan la sala.",
            fr: "Choisissez une categorie en voyant comment ses produits occupent la piece.",
            zh: "通过产品如何占据空间来选择分类。",
            ja: "製品が空間をどう占めるかを見てカテゴリを選びます。",
            ru: "Выбирайте категорию по тому, как ее продукты занимают пространство.",
          })}
        </h1>
        <p>
          {getLocaleCopy(locale, {
            en: "This hidden route tests the next category model: a calm product-film stage first, then direct entry into real category, product and request paths.",
            de: "Diese versteckte Route testet das naechste Kategoriemodell: zuerst eine ruhige Produktfilm-Buehne, dann echte Kategorie-, Produkt- und Anfragewege.",
            es: "Esta ruta oculta prueba el siguiente modelo de categoria: primero una escena product-film serena, despues accesos reales a categoria, producto y solicitud.",
            fr: "Cette route cachee teste le prochain modele de categorie: scene product-film calme, puis acces reels vers categorie, produit et demande.",
            zh: "这个隐藏路线测试下一代分类模型：先是克制的产品影片舞台，再进入真实分类、产品和咨询路径。",
            ja: "この隠しルートは次のカテゴリモデルを検証します。まず静かな製品フィルムステージ、その後に実際のカテゴリ、製品、依頼導線へ進みます。",
            ru: "Скрытая страница проверяет новую модель категории: сначала спокойная продуктовая сцена, затем прямой вход в настоящие категории, продукты и заявки.",
          })}
        </p>
      </section>

      <CategoryProductFilmStage
        ariaLabel={getLocaleCopy(locale, {
          en: "Category product-film scenes",
          de: "Kategorie Product-Film Szenen",
          es: "Escenas product-film de categoria",
          fr: "Scenes product-film de categorie",
          zh: "分类产品影片场景",
          ja: "カテゴリ製品フィルムシーン",
          ru: "Сцены продуктового фильма категории",
        })}
        scenes={scenes}
      />

      <section className="category-film-close">
        <p className="eyebrow">Montelar</p>
        <h2>
          {getLocaleCopy(locale, {
            en: "A category can be cinematic without becoming a carousel.",
            de: "Eine Kategorie kann filmisch sein, ohne zum Karussell zu werden.",
            es: "Una categoria puede ser cinematica sin convertirse en carrusel.",
            fr: "Une categorie peut etre cinematographique sans devenir un carrousel.",
            zh: "分类可以有电影感，而不必变成轮播。",
            ja: "カテゴリはカルーセルにならずにシネマティックでいられます。",
            ru: "Категория может быть кинематографичной без превращения в карусель.",
          })}
        </h2>
        <Link className="category-film-close__link" href={withLocale("/contact", locale)}>
          {getLocaleCopy(locale, {
            en: "Discuss a Montelar system",
            de: "Montelar System besprechen",
            es: "Hablar de un sistema Montelar",
            fr: "Parler d'un systeme Montelar",
            zh: "讨论 Montelar 系统",
            ja: "Montelarシステムを相談する",
            ru: "Обсудить систему Montelar",
          })}
        </Link>
      </section>
    </main>
  );
}
