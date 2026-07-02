import Link from "next/link";
import { getRequestLocale } from "@/lib/request-locale";
import { buildRouteMetadata } from "@/lib/seo/metadata";
import { withLocale } from "@/config/site-routes";
import { getLocaleCopy } from "@/lib/copy/site-copy";
import { getCmsClient } from "@/lib/cms/client";
import { getHomeSeoKeywords } from "@/lib/seo/locale-seo";
import { SloganComposition } from "@/components/slogan-composition";
import { HomepageMotion } from "@/components/homepage-motion";
import { ProductScenePrototype } from "@/components/product-scene-prototype";
import { HomeCarousel } from "@/components/home-carousel";
import { DacProductCarousel } from "@/components/dac-product-carousel";

const homeProductSceneEnabled = process.env.NEXT_PUBLIC_HOME_PRODUCT_SCENE !== "false";

export async function generateMetadata() {
  const locale = await getRequestLocale();
  const homePage = await getCmsClient().getPageByRoutePath("/", locale);

  return buildRouteMetadata({
    title: homePage?.seo.title ?? getLocaleCopy(locale, {
      en: "Montelar | Architecture of image, sound and AI design.",
      de: "Montelar | Architektur von Bild, Klang und KI-Design.",
      es: "Montelar | Arquitectura de imagen, sonido y diseño con IA.",
      fr: "Montelar | Architecture de l'image, du son et du design IA.",
      zh: "Montelar | 图像、声音与 AI 设计的架构。",
      ja: "Montelar | 画像、音、AIデザインのアーキテクチャ。",
      ru: "Montelar | Архитектура изображения, звука и AI дизайна.",
    }),
    description: homePage?.seo.description ?? getLocaleCopy(locale, {
      en: "Quiet-luxury platform for private cinema, hi-end audio and spatial display technologies.",
      de: "Plattform stillen Luxus für private Kinos, Hi-end-Audio und räumliche Display-Technologien.",
      es: "Plataforma de lujo silencioso para cine privado, hi-end audio y tecnologías espaciales de display.",
      fr: "Plateforme de luxe discret pour le cinéma privé, l'audio hi-end et les technologies d'affichage spatial.",
      zh: "面向私人影院、Hi-end 音频与空间显示技术的静奢平台。",
      ja: "プライベートシネマ、Hi-end オーディオ、空間ディスプレイ技術のための静かなラグジュアリープラットフォーム。",
      ru: "Тихая роскошь для частных кинотеатров, hi-end аудио, прозрачных экранов и пространственных инсталляций.",
    }),
    path: "/",
    locale,
    keywords: getHomeSeoKeywords(locale),
  });
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ hv?: string }> }) {
  const locale = await getRequestLocale();
  const { hv } = await searchParams;
  const heroVariant = hv && /^[a-z]$/.test(hv) ? hv : undefined;
  const dacOnHome = process.env.NEXT_PUBLIC_HOME_DAC === "true";
  const effectiveHv = heroVariant ?? (dacOnHome ? "d" : undefined);
  const cmsClient = getCmsClient();
  const homePage = await cmsClient.getPageByRoutePath("/", locale);
  const homeHeroSection =
    homePage?.sections?.find((section) => section.sectionType === "hero") ?? null;
  const primaryCtaTarget = homePage?.heroPrimaryCtaTarget ?? "/contact";
  const secondaryCtaTarget = homePage?.heroSecondaryCtaTarget ?? "/brand";
  const interactiveProductTargets = [
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
      description: "",
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
      description: "",
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
      description: "",
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
      description: "",
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
      description: "",
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
      description: "",
      href: withLocale("/audio/amplifiers", locale),
    },
  ];
  const productSequence = [
    {
      href: withLocale("/vision-max", locale),
      image: "/images/production-visual-sprint/homepage/vision-max-home-cinema-vm-027.webp",
      label: getLocaleCopy(locale, { en: "Vision MAX", de: "Vision MAX", es: "Vision MAX", fr: "Vision MAX", zh: "Vision MAX", ja: "Vision MAX", ru: "Vision MAX" }),
      sourceId: "VM-021",
      title: getLocaleCopy(locale, { en: "A cinema screen as architecture", de: "Kinoleinwand als Architektur", es: "Pantalla de cine como arquitectura", fr: "Écran de cinéma comme architecture", zh: "作为建筑的影院幕面", ja: "建築としてのシネマスクリーン", ru: "Киноэкран как архитектура" }),
      text: getLocaleCopy(locale, {
        en: "Projection is planned as part of the room: screen plane, mechanism, acoustic scale and the distance from which the image becomes private.",
        de: "Projektion wird als Teil des Raums geplant: Leinwandebene, Mechanik, akustischer Maßstab und der Abstand, aus dem das Bild privat wird.",
        es: "La proyección se planifica como parte de la sala: plano de pantalla, mecanismo, escala acústica y distancia desde la que la imagen se vuelve privada.",
        fr: "La projection se conçoit comme une partie de la pièce : plan d'écran, mécanisme, échelle acoustique et distance où l'image devient privée.",
        zh: "投影被作为空间的一部分规划：幕面、机构、声学尺度，以及影像变得私密的观看距离。",
        ja: "投影は空間の一部として計画されます。スクリーン面、機構、音響スケール、映像がプライベートになる距離まで含めて整えます。",
        ru: "Когда кино становится незаменимой частью жизни.",
      }),
    },
    {
      href: withLocale("/audio", locale),
      image: "/images/production-visual-sprint/homepage/hi-end-audio-system-ha-011.webp",
      label: getLocaleCopy(locale, { en: "Hi-end Audio", de: "Hi-end Audio", es: "Hi-end Audio", fr: "Audio hi-end", zh: "Hi-end Audio", ja: "Hi-end Audio", ru: "Hi-end Audio" }),
      sourceId: "HA-013",
      title: getLocaleCopy(locale, { en: "Audio that belongs to the room", de: "Audio, das zum Raum gehört", es: "Audio que pertenece a la sala", fr: "Un audio qui appartient à la pièce", zh: "属于空间的音响", ja: "空間に属するオーディオ", ru: "Hi-end звук без лишнего" }),
      text: getLocaleCopy(locale, {
        en: "Loudspeakers, amplification and sources voiced as one system — part of the room, not equipment added to it.",
        de: "Rack, Verstärker, Quellen und Lautsprecher werden als ein ruhiges Objekt ausgerichtet, damit das System in den Raum gebaut wirkt.",
        es: "Rack, amplificadores, fuentes y altavoces se alinean como un único objeto sereno, para que el sistema parezca construido dentro de la sala.",
        fr: "Rack, amplificateurs, sources et enceintes s'alignent comme un seul objet calme, afin que le système semble construit avec la pièce.",
        zh: "机架、功放、音源与音箱被组织为一个安静对象，让系统像是被建入空间，而不是后置摆放。",
        ja: "ラック、アンプ、ソース機器、スピーカーを一つの静かなオブジェクトとして揃え、後から置いたのではなく空間に組み込まれた印象にします。",
        ru: "Звук проектируется вместе с интерьером: расстановка, масштаб сцены и управление остаются спокойными и точными.",
      }),
    },
    {
      href: withLocale("/audio/perfect-conductors/prima-materia", locale),
      image: "/images/production-visual-sprint/homepage/prima-materia-connection-pm-005.webp",
      label: getLocaleCopy(locale, { en: "Prima Materia", de: "Prima Materia", es: "Prima Materia", fr: "Prima Materia", zh: "Prima Materia", ja: "Prima Materia", ru: "Prima Materia" }),
      sourceId: "PM-005",
      title: getLocaleCopy(locale, { en: "Power becomes visible craft", de: "Strom wird sichtbares Handwerk", es: "La energía se vuelve oficio visible", fr: "La puissance devient métier visible", zh: "电源成为可见工艺", ja: "電源が見えるクラフトになる", ru: "Кабели которые действительно звучат" }),
      text: getLocaleCopy(locale, {
        en: "Connector geometry, braided jackets and cable routing remain visible because power and signal are part of the material architecture.",
        de: "Steckergeometrie, Geflecht und Kabelführung bleiben sichtbar, weil Strom und Signal Teil der Materialarchitektur sind.",
        es: "La geometría del conector, la funda trenzada y el trazado quedan visibles porque energía y señal pertenecen a la arquitectura material.",
        fr: "Géométrie des connecteurs, gaines tressées et parcours restent visibles, car puissance et signal font partie de l'architecture matière.",
        zh: "连接器几何、编织外被与走线保持可见，因为电源与信号本身就是材质架构的一部分。",
        ja: "コネクタの形状、編み込みシース、ケーブルルートは、電源と信号が素材のアーキテクチャの一部であるため見えるままにします。",
        ru: "Проводники, экранирование и разъёмы согласуются с системой, чтобы сохранить динамику, снизить шумы и аккуратно вписать кабельную часть в инсталляцию.",
      }),
    },
  ];

  return (
    <section className="home-page" data-hv={effectiveHv}>
      <HomepageMotion />
      <section className="home-hero">
        <div className="home-hero-stage">
          <div className="home-hero-visual" aria-hidden={homeProductSceneEnabled ? undefined : true}>
            {homeProductSceneEnabled ? (
              <ProductScenePrototype targets={interactiveProductTargets} locale={locale} showCaption={false} />
            ) : (
              <img
                alt=""
                className="home-hero-image"
                data-atomic-media=""
                decoding="sync"
                draggable={false}
                fetchPriority="high"
                loading="eager"
                src="/images/home/montelar-master-hero-room-logo.webp"
                translate="no"
              />
            )}
            <span className="home-hero-visual-glass" />
          </div>
          <div className="home-hero-copy">
            <p className="eyebrow">
              {homeHeroSection?.heroContent?.supportingLabel ??
                getLocaleCopy(locale, {
                  en: "Quiet luxury",
                  de: "Stiller Luxus",
                  es: "Lujo silencioso",
                  fr: "Luxe discret",
                  zh: "静奢",
                  ja: "静かなラグジュアリー",
                  ru: "Тихая роскошь",
                })}
            </p>
            <h1 className="home-hero-title">Montelar</h1>
            <SloganComposition className="home-slogan-composition" locale={locale} />
            <p className="home-brand-statement">
              {homeHeroSection?.title ??
                getLocaleCopy(locale, {
                  en: "Architecture of image, sound and AI design.",
                  de: "Architektur von Bild, Klang und KI-Design.",
                  es: "Arquitectura de imagen, sonido y diseño con IA.",
                  fr: "Architecture de l'image, du son et du design IA.",
                  zh: "图像、声音与 AI 设计的架构。",
                  ja: "画像、音、AIデザインのアーキテクチャ。",
                  ru: "Архитектура изображения, звука и AI дизайна.",
                })}
            </p>
            <p className="home-hero-text">
              {homePage?.heroSummary ??
                getLocaleCopy(locale, {
                  en: "Private cinema, hi-end audio and spatial display systems composed as one architectural environment.",
                  de: "Private Kinos, Hi-end-Audio und räumliche Displaysysteme als eine architektonische Umgebung.",
                  es: "Cine privado, hi-end audio y displays espaciales compuestos como un solo entorno arquitectónico.",
                  fr: "Cinéma privé, audio hi-end et affichage spatial composés comme un seul environnement architectural.",
                  zh: "私人影院、Hi-end 音频与空间显示系统被组织为统一的建筑环境。",
                  ja: "プライベートシネマ、Hi-end オーディオ、空間ディスプレイを一つの建築環境として構成します。",
                  ru: "Приватное кино, hi-end аудио, прозрачные экраны и цифровое искусство собираются в единое пространство.",
                })}
            </p>
            <div className="home-hero-axis" aria-label={getLocaleCopy(locale, {
              en: "Montelar experience axis",
              de: "Montelar Erlebnisachse",
              es: "Eje de experiencia Montelar",
              fr: "Axe d'experience Montelar",
              zh: "Montelar 体验轴",
              ja: "Montelar 体験軸",
              ru: "Ось опыта Montelar",
            })}>
              <span>{getLocaleCopy(locale, { en: "Image", de: "Bild", es: "Imagen", fr: "Image", zh: "图像", ja: "画像", ru: "Изображение" })}</span>
              <span>{getLocaleCopy(locale, { en: "Sound", de: "Klang", es: "Sonido", fr: "Son", zh: "声音", ja: "音", ru: "Звук" })}</span>
              <span>{getLocaleCopy(locale, { en: "Design", de: "Design", es: "Diseño", fr: "Design", zh: "设计", ja: "デザイン", ru: "Дизайн" })}</span>
            </div>
            <div className="home-hero-actions">
              <Link className="home-primary-link" href={withLocale(primaryCtaTarget, locale)}>
                {homePage?.heroPrimaryCtaLabel ??
                  getLocaleCopy(locale, {
                    en: "Discuss a project",
                    de: "Projekt besprechen",
                    es: "Hablar sobre un proyecto",
                    fr: "Parler d'un projet",
                    zh: "讨论项目",
                    ja: "プロジェクトを相談する",
                    ru: "Запросить консультацию",
                  })}
              </Link>
              <Link className="home-secondary-link" href={withLocale(secondaryCtaTarget, locale)}>
                {homePage?.heroSecondaryCtaLabel ??
                  getLocaleCopy(locale, {
                    en: "Explore the brand",
                    de: "Marke entdecken",
                    es: "Explorar la marca",
                    fr: "Découvrir la marque",
                    zh: "探索品牌",
                    ja: "ブランドを見る",
                    ru: "О бренде",
                  })}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {effectiveHv === "d" ? <DacProductCarousel locale={locale} /> : null}

      <HomeCarousel
        eyebrow={getLocaleCopy(locale, {
          en: "Gallery",
          de: "Galerie",
          es: "Galería",
          fr: "Galerie",
          zh: "作品集",
          ja: "ギャラリー",
          ru: "Галерея",
        })}
        title={getLocaleCopy(locale, {
          en: "Project gallery",
          de: "Projektgalerie",
          es: "Galería de proyectos",
          fr: "Galerie de projets",
          zh: "项目画廊",
          ja: "プロジェクトギャラリー",
          ru: "Галерея проектов",
        })}
        ctaLabel={getLocaleCopy(locale, {
          en: "View project",
          de: "Projekt ansehen",
          es: "Ver proyecto",
          fr: "Voir le projet",
          zh: "查看项目",
          ja: "プロジェクトを見る",
          ru: "Смотреть проект",
        })}
        slides={[
          {
            src: "/rework-carousel/slide1.webp",
            name: "Hi-end Audio",
            category: "Audio",
            href: withLocale("/projects", locale),
            desc: getLocaleCopy(locale, {
              en: "Loudspeakers, amplification and sources voiced as one system.",
              ru: "Система звучит цельно: от источника до последнего метра кабеля.",
            }),
          },
          {
            src: "/rework-carousel/slide2.webp",
            name: "Living Glass",
            category: "Architecture",
            href: withLocale("/projects", locale),
            desc: getLocaleCopy(locale, {
              en: "Transparent displays set into the architecture itself.",
              ru: "Прозрачные дисплеи, встроенные в саму архитектуру.",
            }),
          },
          {
            src: "/rework-carousel/slide3.webp",
            name: "Vision MAX",
            category: "Cinema",
            href: withLocale("/projects", locale),
            desc: getLocaleCopy(locale, {
              en: "Private cinema with an image that holds the whole room.",
              ru: "Частный кинотеатр с изображением на всю комнату.",
            }),
          },
          {
            src: "/rework-carousel/slide4.webp",
            name: "Prima Materia",
            category: "Conductors",
            href: withLocale("/projects", locale),
            desc: getLocaleCopy(locale, {
              en: "Cables and conductors built as functional matter, not accessories.",
              ru: "Кабели и проводники как часть системы, а не случайный аксессуар.",
            }),
          },
          {
            src: "/rework-carousel/slide5.webp",
            name: "Pictorial Art",
            category: "Display",
            href: withLocale("/projects", locale),
            desc: getLocaleCopy(locale, {
              en: "A screen that rests as a painting when the room is quiet.",
              ru: "Экран, который в покое читается как картина.",
            }),
          },
          {
            src: "/rework-carousel/slide6.webp",
            name: "Exhibition Displays",
            category: "Spaces",
            href: withLocale("/projects", locale),
            desc: getLocaleCopy(locale, {
              en: "Image systems composed for galleries and public spaces.",
              ru: "Системы изображения для галерей и общественных пространств.",
            }),
          },
        ]}
      />

      <section className="home-system-story">
        <div className="home-system-story-inner">
          <div className="home-system-copy">
            <p className="eyebrow">
              {getLocaleCopy(locale, {
                en: "Hi-end audio",
                de: "Komponiertes System",
                es: "Sistema compuesto",
                fr: "Système composé",
                zh: "组合系统",
                ja: "構成されたシステム",
                ru: "Hi-end аудио",
              })}
            </p>
            <h2 className="home-section-title">
              {getLocaleCopy(locale, {
                en: "Control, scale, depth — and silence.",
                de: "Klang, Strom und Material in einem Rahmen.",
                es: "Sonido, energía y material en un solo encuadre.",
                fr: "Son, puissance et matière dans un seul cadre.",
                zh: "声音、电源与材质共处一帧。",
                ja: "音、電源、素材を一つのフレームに。",
                ru: "Контроль, масштаб, глубина — и тишина.",
              })}
            </h2>
            <p className="home-section-text">
              {getLocaleCopy(locale, {
                en: "Loudspeakers, amplification and cabling tuned as one listening-room system — reference engineering, a low noise floor, nothing spent on spectacle.",
                de: "Verstärker, Lautsprecher, Stromverteilung und Leiter werden als ruhiges Raumobjekt komponiert, geprägt von Platzierung und Material ebenso wie von Spezifikation.",
                es: "Amplificadores, altavoces, distribución de energía y conductores se componen como un único objeto sereno de la sala, afinado por ubicación, material y especificación.",
                fr: "Amplificateurs, enceintes, distribution électrique et conducteurs forment un objet calme de la pièce, réglé par le placement, la matière et la spécification.",
                zh: "功放、音箱、电源分配与导体被组合为一个安静的空间对象，由摆位、材质与规格共同调校。",
                ja: "アンプ、スピーカー、電源配分、導体を一つの静かな室内オブジェクトとして構成し、仕様だけでなく配置と素材で整えます。",
                ru: "Мы создаём hi-end аудио под индивидуальные пожелания клиента: мягкая подача, быстрый собранный бас, лёгкие верха и чёткая разборчивая середина.",
              })}
            </p>
            <div className="home-system-axis" aria-label={getLocaleCopy(locale, {
              en: "System elements",
              de: "Systemelemente",
              es: "Elementos del sistema",
              fr: "Éléments du système",
              zh: "系统元素",
              ja: "システム要素",
              ru: "Элементы системы",
            })}>
              <span>{getLocaleCopy(locale, { en: "Amplification", de: "Verstärkung", es: "Amplificación", fr: "Amplification", zh: "放大", ja: "増幅", ru: "Усиление" })}</span>
              <span>{getLocaleCopy(locale, { en: "Power", de: "Strom", es: "Energía", fr: "Puissance", zh: "电源", ja: "電源", ru: "Питание" })}</span>
              <span>{getLocaleCopy(locale, { en: "Speakers", de: "Lautsprecher", es: "Altavoces", fr: "Enceintes", zh: "音箱", ja: "スピーカー", ru: "Колонки" })}</span>
              <span>{getLocaleCopy(locale, { en: "Cables", de: "Kabel", es: "Cables", fr: "Câbles", zh: "线缆", ja: "ケーブル", ru: "Кабели" })}</span>
            </div>
          </div>

          <div className="home-system-visual">
            <img
              src="/images/production-visual-sprint/homepage/hi-end-audio-rack-ha-013.webp"
              alt={getLocaleCopy(locale, {
                en: "Montelar connected audio system with speakers, amplifiers, power conditioner and cables",
                de: "Verbundenes Montelar-Audiosystem mit Lautsprechern, Verstärkern, Netzaufbereitung und Kabeln",
                es: "Sistema de audio Montelar conectado con altavoces, amplificadores, acondicionador de energía y cables",
                fr: "Système audio Montelar connecté avec enceintes, amplificateurs, conditionneur secteur et câbles",
                zh: "Montelar 连接式音频系统，包含音箱、功放、电源处理器与线缆",
                ja: "スピーカー、アンプ、電源コンディショナー、ケーブルを備えたMontelar接続オーディオシステム",
                ru: "Аудиосистема Montelar с акустикой, усилителями, питанием и кабельной частью",
              })}
              width={1024}
              height={572}
              data-atomic-media=""
              decoding="async"
              draggable={false}
              loading="lazy"
              sizes="(max-width: 900px) 100vw, 62vw"
              translate="no"
            />
          </div>
        </div>
      </section>

      <section className="home-product-sequence">
        <div className="home-product-reel">
          {productSequence.map((item) => (
            <article className="home-product-reel-item" data-source-id={item.sourceId} key={item.title}>
              <figure>
                <img
                  src={item.image}
                  alt={item.title}
                  width={1024}
                  height={572}
                  data-atomic-media=""
                  decoding="async"
                  draggable={false}
                  loading="lazy"
                  sizes="(max-width: 900px) 100vw, 56vw"
                  translate="no"
                />
              </figure>
              <div>
                <span>{item.label}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <Link className="home-product-story-link" href={item.href}>
                  {getLocaleCopy(locale, {
                    en: "Explore",
                    de: "Entdecken",
                    es: "Explorar",
                    fr: "Découvrir",
                    zh: "了解更多",
                    ja: "詳しく見る",
                    ru: "Подробнее",
                  })}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="home-display-surfaces">
        <div className="home-display-surfaces-inner">
          <div className="home-display-copy">
            <p className="eyebrow">
            {getLocaleCopy(locale, {
              en: "Living Glass",
              de: "Living Glass",
              es: "Living Glass",
              fr: "Living Glass",
              zh: "Living Glass",
              ja: "Living Glass",
              ru: "Living Glass",
            })}
            </p>
            <h2 className="home-section-title">
            {getLocaleCopy(locale, {
              en: "An image that stays part of the room.",
              de: "Transparente Displays als Teil des Interieurs.",
              es: "Display transparente como parte del interior.",
              fr: "Display transparent intégré à l'intérieur.",
              zh: "透明显示成为室内的一部分。",
              ja: "インテリアの一部になる透明ディスプレイ。",
              ru: "Изображение внутри стекла и света.",
            })}
            </h2>
            <p className="home-section-text">
            {getLocaleCopy(locale, {
              en: "A transparent surface where glass, content and daylight hold together — never a flat screen on the wall.",
              de: "Living Glass hält die Grenze nutzbar: Glas, Content und Raumtiefe arbeiten zusammen, ohne das Interieur in eine flache Screen-Wand zu verwandeln.",
              es: "Living Glass mantiene útil el límite: vidrio, contenido y profundidad de sala trabajan juntos sin convertir el interior en un muro de pantallas.",
              fr: "Living Glass rend la limite utile : verre, contenu et profondeur de pièce travaillent ensemble sans transformer l'intérieur en mur d'écrans.",
              zh: "Living Glass 让边界保持可用：玻璃、内容与空间深度共同工作，而不是把室内变成平面屏幕墙。",
              ja: "Living Glassは境界を有効に保ちます。ガラス、コンテンツ、空間の奥行きが連動し、インテリアを平板なスクリーン壁にしません。",
              ru: "Контент появляется на стекле, перегородке или витрине, не превращая интерьер в обычную экранную стену.",
            })}
            </p>
          </div>

          <figure className="home-display-surface">
            <img
              src="/images/production-visual-sprint/homepage/living-glass-architecture-lg-076.webp"
              alt={getLocaleCopy(locale, {
                en: "Montelar Living Glass transparent display surface in an interior",
                de: "Montelar Living Glass transparente Displayfläche im Interieur",
                es: "Superficie de display transparente Montelar Living Glass en un interior",
                fr: "Surface de display transparent Montelar Living Glass dans un intérieur",
                zh: "室内场景中的 Montelar Living Glass 透明显示表面",
                ja: "インテリア内のMontelar Living Glass透明ディスプレイ面",
                ru: "Прозрачная поверхность Montelar Living Glass в интерьере",
              })}
              width={1024}
              height={572}
              data-atomic-media=""
              decoding="async"
              draggable={false}
              loading="lazy"
              sizes="(max-width: 900px) 100vw, 54vw"
              translate="no"
            />
            <figcaption>
              <span>{getLocaleCopy(locale, { en: "Transparent plane", de: "Transparente Ebene", es: "Plano transparente", fr: "Plan transparent", zh: "透明平面", ja: "透明面", ru: "Прозрачная плоскость" })}</span>
              <strong>{getLocaleCopy(locale, { en: "Content inside the glass boundary", de: "Content innerhalb der Glasgrenze", es: "Contenido dentro del límite de vidrio", fr: "Contenu dans la limite du verre", zh: "玻璃边界中的内容", ja: "ガラス境界の中のコンテンツ", ru: "Контент внутри стеклянной границы" })}</strong>
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="home-display-surfaces home-display-surfaces--exhibition">
        <div className="home-display-surfaces-inner">
          <figure className="home-display-surface">
            <img
              src="/images/production-visual-sprint/homepage/exhibition-displays-table-rail-ed-050.webp"
              alt={getLocaleCopy(locale, {
                en: "Montelar Exhibition Displays interactive table rail surface",
                de: "Montelar Exhibition Displays interaktive Tisch- und Rail-Oberfläche",
                es: "Superficie interactiva Montelar Exhibition Displays para mesa y línea",
                fr: "Surface interactive Montelar Exhibition Displays pour table et rail",
                zh: "Montelar Exhibition Displays 交互桌面与导览线",
                ja: "Montelar Exhibition Displays インタラクティブテーブルとレール面",
                ru: "Интерактивная поверхность Montelar Exhibition Displays для стола и навигационной линии",
              })}
              width={1024}
              height={572}
              data-atomic-media=""
              decoding="async"
              draggable={false}
              loading="lazy"
              sizes="(max-width: 900px) 100vw, 54vw"
              translate="no"
            />
            <figcaption>
              <span>{getLocaleCopy(locale, { en: "Exhibition Displays", de: "Exhibition Displays", es: "Exhibition Displays", fr: "Exhibition Displays", zh: "展陈显示", ja: "Exhibition Displays", ru: "Exhibition Displays" })}</span>
              <strong>{getLocaleCopy(locale, { en: "Touch surfaces inside the route", de: "Touchflächen im Weg", es: "Superficies táctiles en el recorrido", fr: "Surfaces tactiles dans le parcours", zh: "路径中的触控表面", ja: "導線の中のタッチ面", ru: "Сенсорные поверхности внутри маршрута" })}</strong>
            </figcaption>
          </figure>

          <div className="home-display-copy">
            <p className="eyebrow">
              {getLocaleCopy(locale, {
                en: "Exhibition Displays",
                de: "Exhibition Displays",
                es: "Exhibition Displays",
                fr: "Exhibition Displays",
                zh: "Exhibition Displays",
                ja: "Exhibition Displays",
                ru: "Exhibition Displays",
              })}
            </p>
            <h2 className="home-section-title">
              {getLocaleCopy(locale, {
                en: "Interactive surfaces for a visitor route.",
                de: "Interaktive Flächen für Besucherwege.",
                es: "Superficies interactivas para el recorrido.",
                fr: "Surfaces interactives pour le parcours visiteur.",
                zh: "面向参观路径的交互表面。",
                ja: "来場者導線のためのインタラクティブ面。",
                ru: "Интерактивные поверхности для маршрута посетителя.",
              })}
            </h2>
            <p className="home-section-text">
              {getLocaleCopy(locale, {
                en: "Touch tables, navigation rails and embedded screens help a gallery, showroom or exhibition speak to the visitor through the route itself.",
                de: "Touch-Tische, Navigationslinien und eingebaute Screens lassen Galerie, Showroom oder Ausstellung direkt über den Weg mit dem Besucher sprechen.",
                es: "Mesas táctiles, líneas de navegación y pantallas integradas ayudan a que la galería, showroom o exposición hable con el visitante desde el propio recorrido.",
                fr: "Tables tactiles, lignes de navigation et écrans intégrés permettent à une galerie, un showroom ou une exposition de parler au visiteur par le parcours lui-même.",
                zh: "触控桌、导览线与嵌入式屏幕让画廊、展厅或展览通过参观路径本身与访客交流。",
                ja: "タッチテーブル、ナビゲーションレール、組み込みスクリーンにより、ギャラリーやショールーム、展示が導線そのもので来場者に語りかけます。",
                ru: "Сенсорные столы, навигационные линии и встроенные экраны помогают галерее, шоуруму или выставке говорить с посетителем через сам маршрут.",
              })}
            </p>
            <Link className="home-product-story-link" href={withLocale("/exhibition-displays", locale)}>
              {getLocaleCopy(locale, {
                en: "Explore",
                de: "Entdecken",
                es: "Explorar",
                fr: "Découvrir",
                zh: "了解更多",
                ja: "詳しく見る",
                ru: "Подробнее",
              })}
            </Link>
          </div>
        </div>
      </section>

      <section className="home-private-briefing">
        <div className="home-private-briefing-inner">
          <div className="home-private-briefing-head">
            <p className="eyebrow">
              {getLocaleCopy(locale, {
                en: "Consultation",
                de: "Private Beratung",
                es: "Brief privado",
                fr: "Brief privé",
                zh: "私享简报",
                ja: "プライベートブリーフ",
                ru: "Консультация",
              })}
            </p>
            <h2 className="home-section-title">
              {getLocaleCopy(locale, {
                en: "Tell us what you want to build.",
                de: "Ein ruhiger Weg von der Absicht zur Beratung.",
                es: "Un camino sereno desde la intención hasta la consulta.",
                fr: "Un parcours calme de l'intention à la consultation.",
                zh: "从意图到咨询，一条安静而清晰的路径。",
                ja: "意図から相談へ、静かな導線で進みます。",
                ru: "Расскажите, что хотите собрать.",
              })}
            </h2>
          </div>
          <div className="home-private-briefing-body">
            <div className="home-private-briefing-steps">
              <span>{getLocaleCopy(locale, { en: "1. Describe the space", de: "1. Raum praezisieren", es: "1. Definir el espacio", fr: "1. Definir le lieu", zh: "1. 明确空间", ja: "1. 空間を整える", ru: "1. Опишите пространство" })}</span>
              <span>{getLocaleCopy(locale, { en: "2. Name the desired effect", de: "2. Wirkung benennen", es: "2. Definir el efecto", fr: "2. Nommer l'effet recherché", zh: "2. 明确想要的效果", ja: "2. 望む体験を伝える", ru: "2. Назовите желаемый эффект" })}</span>
              <span>{getLocaleCopy(locale, { en: "3. We prepare the next step", de: "3. Wir bereiten den nächsten Schritt vor", es: "3. Preparamos el siguiente paso", fr: "3. Nous préparons la suite", zh: "3. 我们准备下一步", ja: "3. 次のステップを準備", ru: "3. Мы подготовим следующий шаг" })}</span>
            </div>
            <p className="home-section-text">
              {getLocaleCopy(locale, {
                en: "Write directly if you are planning a private cinema, a hi-end listening system, transparent displays, a hologram installation or a partner project. We will clarify the space, the equipment, the constraints and the format of the demonstration.",
                de: "Schreiben Sie direkt, wenn Sie Privatkino, High-End-Hören, transparente Displays, eine Hologramm-Installation oder ein Partnerprojekt planen. Wir klären Raum, Technik, Grenzen und Demonstrationsformat.",
                es: "Escríbanos directamente si está planeando cine privado, audio high-end, displays transparentes, una instalación holográfica o un proyecto de partner. Aclararemos espacio, equipo, límites y demostración.",
                fr: "Écrivez-nous directement pour un cinéma privé, un système hi-end, des displays transparents, une installation holographique ou un projet partenaire. Nous clarifions l'espace, les équipements, les contraintes et la démonstration.",
                zh: "如果您正在规划私人影院、高端聆听系统、透明显示、全息装置或合作项目，请直接联系我们。我们会明确空间、设备、限制和演示形式。",
                ja: "プライベートシネマ、ハイエンドリスニング、透明ディスプレイ、ホログラム設置、またはパートナー案件をご検討の場合は直接ご連絡ください。空間、機器、制約、デモ形式を整理します。",
                ru: "Напишите напрямую, если планируете частный кинотеатр, hi-end систему прослушивания, прозрачные дисплеи, голограмму или партнёрский проект. Мы уточним пространство, состав техники, ограничения и формат демонстрации.",
              })}
            </p>
            <div className="home-cta-actions">
              <Link className="home-primary-link" href={withLocale("/contact", locale)}>
                {getLocaleCopy(locale, {
                  en: "Discuss a project",
                  de: "Projekt besprechen",
                  es: "Hablar sobre un proyecto",
                  fr: "Parler d'un projet",
                  zh: "讨论项目",
                  ja: "プロジェクトを相談する",
                  ru: "Обсудить проект",
                })}
              </Link>
              <Link className="home-secondary-link" href={withLocale("/brand", locale)}>
                {getLocaleCopy(locale, {
                  en: "Understand Montelar",
                  de: "Montelar verstehen",
                  es: "Conocer Montelar",
                  fr: "Comprendre Montelar",
                  zh: "了解 Montelar",
                  ja: "Montelarを知る",
                  ru: "Понять Montelar",
                })}
              </Link>
            </div>
          </div>
        </div>
      </section>

    </section>
  );
}
