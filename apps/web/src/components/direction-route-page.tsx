import Link from "next/link";
import type { Metadata } from "next";
import { withLocale } from "@/config/site-routes";
import { RouteLuxMedia } from "@/components/route-lux-media";
import { RoutePageTemplate } from "@/components/route-page-template";
import { getCmsClient } from "@/lib/cms/client";
import { getLocaleCopy, isRussianLocale } from "@/lib/copy/site-copy";
import { getRequestLocale } from "@/lib/request-locale";
import { getDirectionSeoKeywords } from "@/lib/seo/locale-seo";
import { buildRouteMetadata } from "@/lib/seo/metadata";
import type { ReactNode } from "react";

type DirectionRoutePageProps = {
  directionSlug: string;
  fallbackTitle: string;
  fallbackDescription: string;
  intro: string;
  notes: string[];
  details?: ReactNode;
  hideStatement?: boolean;
  hideProducts?: boolean;
  ctaTitle?: string;
  hideCta?: boolean;
};

type DirectionPresentation = {
  stageLabel: string;
  stageTitle: string;
  stageCopy: string;
  material: string;
  signature: string;
  planningTracks: string[];
};

function getDirectionPresentation(directionSlug: string, locale: Awaited<ReturnType<typeof getRequestLocale>>): DirectionPresentation {
  const fallback = {
    stageLabel: getLocaleCopy(locale, {
      en: "Montelar direction",
      de: "Montelar Richtung",
      es: "Dirección Montelar",
      fr: "Direction Montelar",
      zh: "Montelar 方向",
      ja: "Montelar ディレクション",
      ru: "Направление Montelar",
    }),
    stageTitle: getLocaleCopy(locale, {
      en: "Image, sound and design held together as one quiet spatial system.",
      de: "Bild, Klang und Design als ein ruhiges räumliches System.",
      es: "Imagen, sonido y diseño reunidos como un sistema espacial sereno.",
      fr: "Image, son et design réunis dans un système spatial calme.",
      zh: "图像、声音与设计被组织成一个安静的空间系统。",
      ja: "映像、音、デザインを一つの静かな空間システムとして束ねます。",
      ru: "Изображение, звук и дизайн, собранные в единую спокойную систему пространства.",
    }),
    stageCopy: getLocaleCopy(locale, {
      en: "Montelar begins with the room: proportion, material, control and a private consultation rhythm.",
      de: "Montelar beginnt mit dem Raum: Proportion, Material, Steuerung und privater Entscheidungsweg.",
      es: "Montelar comienza por el espacio: proporción, material, control y ruta privada de decisión.",
      fr: "Montelar commence par la pièce : proportion, matière, contrôle et parcours de décision privé.",
      zh: "Montelar 从空间开始：比例、材质、控制与私密决策路径。",
      ja: "Montelar は空間から始めます。プロポーション、素材、制御、そして私的な意思決定の流れです。",
      ru: "Montelar начинает с пространства: пропорций, материала, контроля и спокойного ритма консультации.",
    }),
    material: getLocaleCopy(locale, {
      en: "Black walnut / warm metal / ivory light",
      de: "Schwarznuss / warmes Metall / elfenbeinfarbenes Licht",
      es: "Nogal oscuro / metal cálido / luz marfil",
      fr: "Noyer noir / métal chaud / lumière ivoire",
      zh: "黑胡桃 / 温暖金属 / 象牙色光",
      ja: "ブラックウォルナット / 温かい金属 / アイボリーの光",
      ru: "Черный орех / теплый металл / светлая кость",
    }),
    signature: getLocaleCopy(locale, {
      en: "Quiet systems for image, sound and space",
      de: "Stille Systeme für Bild, Klang und Raum",
      es: "Sistemas serenos para imagen, sonido y espacio",
      fr: "Systèmes calmes pour l'image, le son et l'espace",
      zh: "面向图像、声音与空间的安静系统",
      ja: "映像、音、空間のための静かなシステム",
      ru: "Спокойные системы изображения, звука и пространства",
    }),
    planningTracks: [
      getLocaleCopy(locale, {
        en: "Room and object context",
        de: "Raum- und Objektkontext",
        es: "Contexto de sala y objeto",
        fr: "Contexte de la pièce et de l'objet",
        zh: "空间与对象语境",
        ja: "空間と対象物の文脈",
        ru: "Контекст помещения и объекта",
      }),
      getLocaleCopy(locale, {
        en: "Product-specific inquiry",
        de: "Produktspezifische Anfrage",
        es: "Consulta específica de producto",
        fr: "Demande liée au produit",
        zh: "具体产品咨询",
        ja: "製品別の相談",
        ru: "Заявка по конкретному продукту",
      }),
      getLocaleCopy(locale, {
          en: "Spatial scenario and consultation",
        de: "Räumliches Szenario und Beratungsweg",
        es: "Escenario espacial y ruta de consulta",
        fr: "Scénario spatial et parcours de consultation",
        zh: "空间场景与咨询路径",
        ja: "空間シナリオと相談導線",
          ru: "Пространственный сценарий и консультация",
      }),
    ],
  };

  const presentations: Record<string, DirectionPresentation> = {
    "vision-max": {
      stageLabel: getLocaleCopy(locale, {
        en: "Private cinema",
        de: "Privates Kino",
        es: "Cine privado",
        fr: "Cinéma privé",
        zh: "私人影院",
        ja: "プライベートシネマ",
        ru: "Частный кинотеатр",
      }),
      stageTitle: getLocaleCopy(locale, {
        en: "Private cinema shaped by image scale, acoustic axis, seating and controlled light.",
        de: "Privates Kino, geformt durch Bildmaßstab, akustische Achse, Sitzordnung und kontrolliertes Licht.",
        es: "Cine privado definido por escala de imagen, eje acústico, asientos y luz controlada.",
        fr: "Cinéma privé façonné par l'échelle de l'image, l'axe acoustique, l'assise et la lumière contrôlée.",
        zh: "由画面尺度、声学轴线、座席与受控光线共同塑造的私人影院。",
        ja: "映像のスケール、音響軸、座席、制御された光で構成するプライベートシネマ。",
        ru: "Частный кинотеатр, где масштаб изображения, акустическая ось, посадка и свет работают вместе.",
      }),
      stageCopy: getLocaleCopy(locale, {
        en: "Vision MAX is specified around the room first, then around screen, sound, control and service access.",
        de: "Vision MAX wird zuerst um den Raum geplant, danach um Bildwand, Klang, Steuerung und Servicezugang.",
        es: "Vision MAX se especifica primero desde la sala y después desde pantalla, sonido, control y servicio.",
        fr: "Vision MAX se définit d'abord autour de la pièce, puis de l'écran, du son, du contrôle et de l'accès service.",
        zh: "Vision MAX 先围绕房间定义，再围绕屏幕、声音、控制与维护通道细化。",
        ja: "Vision MAX はまず部屋を基準にし、その後スクリーン、音、制御、サービス動線を詰めます。",
        ru: "Vision MAX сначала уточняется вокруг комнаты, затем вокруг экрана, звука, управления и сервисного доступа.",
      }),
      material: getLocaleCopy(locale, {
        en: "Dark wall finish, warm veneer and low reflected screen light",
        de: "Dunkle Wandoberfläche, warmes Furnier und weiches reflektiertes Bildlicht",
        es: "Muros oscuros, chapa cálida y luz de pantalla reflejada con suavidad",
        fr: "Finition murale sombre, placage chaud et reflet d'écran discret",
        zh: "深色墙面、温暖木皮与低反射屏幕光",
        ja: "暗い壁仕上げ、温かい突板、低く反射するスクリーン光",
        ru: "Темная отделка стен, теплый шпон и мягкий отраженный свет экрана",
      }),
      signature: getLocaleCopy(locale, {
        en: "Cinema as a private interior",
        de: "Kino als privater Innenraum",
        es: "El cine como interior privado",
        fr: "Le cinéma comme intérieur privé",
        zh: "作为私人室内空间的影院",
        ja: "私的なインテリアとしてのシネマ",
        ru: "Кинотеатр как частный интерьер",
      }),
      planningTracks: [
        getLocaleCopy(locale, {
          en: "Room brief and seating intent",
          de: "Raumbrief und Sitzabsicht",
          es: "Brief de sala e intención de asientos",
          fr: "Brief de pièce et intention d'assise",
          zh: "房间 brief 与座席意图",
          ja: "部屋のブリーフと座席意図",
          ru: "Бриф помещения и сценарий посадки",
        }),
        getLocaleCopy(locale, {
          en: "Screen, sound and control zones",
          de: "Bildwand-, Klang- und Steuerungszonen",
          es: "Zonas de pantalla, sonido y control",
          fr: "Zones d'écran, de son et de contrôle",
          zh: "屏幕、声音与控制区域",
          ja: "スクリーン、音、制御のゾーン",
          ru: "Зоны экрана, звука и управления",
        }),
        getLocaleCopy(locale, {
          en: "Private consultation",
          de: "Privater Beratungsweg",
          es: "Ruta de consulta privada",
          fr: "Parcours de consultation privée",
          zh: "私人咨询路径",
          ja: "プライベート相談導線",
          ru: "Частная консультация",
        }),
      ],
    },
    "hi-end-audio": {
      stageLabel: getLocaleCopy(locale, { en: "Hi-end audio", de: "Hi-end Audio", es: "Hi-end audio", fr: "Hi-end audio", zh: "Hi-end 音响", ja: "Hi-end オーディオ", ru: "Hi-end аудио" }),
      stageTitle: getLocaleCopy(locale, {
        en: "A complete audio architecture from loudspeaker presence to cable materiality.",
        de: "Eine vollständige Audioarchitektur von der Lautsprecherpräsenz bis zur Materialität der Kabel.",
        es: "Una arquitectura de audio completa, desde la presencia del altavoz hasta la materialidad del cable.",
        fr: "Une architecture audio complète, de la présence de l'enceinte à la matérialité du câble.",
        zh: "从扬声器存在感到线材质感的完整音响架构。",
        ja: "スピーカーの存在感からケーブルの素材性までを含む完全なオーディオ建築。",
        ru: "Полная аудиоархитектура от акустического высказывания до материальности кабелей.",
      }),
      stageCopy: getLocaleCopy(locale, {
        en: "The direction can carry category depth while staying calm enough for listening-room and specification-led entry points.",
        de: "Die Richtung trägt Kategorietiefe und bleibt zugleich ruhig genug für Hörraum und technische Auswahl.",
        es: "La dirección sostiene profundidad de categorías sin perder calma para sala de escucha y especificación.",
        fr: "La direction porte la profondeur des catégories tout en restant calme pour la salle d'écoute et la spécification.",
        zh: "该方向承载分类深度，同时保持适合听音室与配置入口的克制。",
        ja: "このディレクションはカテゴリの深さを保ちながら、リスニングルームと仕様選定に向く静けさを残します。",
        ru: "Направление держит глубину категорий и остается спокойным для входа через комнату прослушивания и спецификации.",
      }),
      material: getLocaleCopy(locale, { en: "Ivory grille / dark veneer / brushed metal", de: "Elfenbeinfarbener Stoff / dunkles Furnier / gebürstetes Metall", es: "Rejilla marfil / chapa oscura / metal cepillado", fr: "Grille ivoire / placage sombre / métal brossé", zh: "象牙色网罩 / 深色木皮 / 拉丝金属", ja: "アイボリーのグリル / 暗い突板 / ブラッシュドメタル", ru: "Светлая ткань / темный шпон / матовый металл" }),
      signature: getLocaleCopy(locale, { en: "Sound as interior discipline", de: "Klang als Disziplin des Interieurs", es: "Sonido como disciplina interior", fr: "Le son comme discipline intérieure", zh: "作为室内秩序的声音", ja: "インテリアの規律としての音", ru: "Звук как интерьерная дисциплина" }),
      planningTracks: [
        getLocaleCopy(locale, { en: "Listening room and system role", de: "Hörraum und Systemrolle", es: "Sala de escucha y rol del sistema", fr: "Salle d'écoute et rôle système", zh: "听音室与系统角色", ja: "リスニングルームとシステム上の役割", ru: "Комната прослушивания и роль системы" }),
        getLocaleCopy(locale, { en: "Category-led exploration", de: "Auswahl über Kategorien", es: "Exploración por categorías", fr: "Exploration par catégories", zh: "按分类探索", ja: "カテゴリからの探索", ru: "Навигация через категории" }),
        getLocaleCopy(locale, { en: "Component and conductor matching", de: "Abstimmung von Komponenten und Leitern", es: "Correspondencia de componentes y conductores", fr: "Accord composants et conducteurs", zh: "组件与导体匹配", ja: "コンポーネントと導体のマッチング", ru: "Согласование компонентов и проводников" }),
      ],
    },
    "living-glass": {
      stageLabel: getLocaleCopy(locale, { en: "Invisible display", de: "Transparenter Display", es: "Display transparente", fr: "Affichage transparent", zh: "透明显示", ja: "透明ディスプレイ", ru: "Прозрачный дисплей" }),
      stageTitle: getLocaleCopy(locale, {
        en: "A transparent display surface that belongs to the room before it belongs to the interface.",
        de: "Eine transparente Medienfläche, die zuerst zum Raum und erst danach zur Oberfläche wird.",
        es: "Un vidrio multimedia transparente que pertenece primero al espacio y después a la interfaz.",
        fr: "Un verre média transparent qui appartient d'abord à la pièce, puis à l'interface.",
        zh: "透明媒体玻璃先属于空间，然后才属于界面。",
        ja: "インターフェースである前に空間に属する透明メディアガラス。",
        ru: "Прозрачная дисплейная поверхность, которая сначала принадлежит интерьеру, а потом интерфейсу.",
      }),
      stageCopy: getLocaleCopy(locale, {
        en: "Living Glass needs to communicate placement, daylight behavior and architectural restraint without leaning on unapproved renders.",
        de: "Living Glass erklärt Platzierung, Tageslichtverhalten und architektonische Zurückhaltung ohne ungeprüfte Renderings.",
        es: "Living Glass comunica ubicación, luz diurna y contención arquitectónica sin depender de renders no aprobados.",
        fr: "Living Glass précise placement, lumière du jour et retenue architecturale sans s'appuyer sur des rendus non approuvés.",
        zh: "Living Glass 说明位置、日光表现与建筑克制，不依赖未批准的渲染图。",
        ja: "Living Glass は未承認レンダーに頼らず、配置、日中の見え方、建築的な抑制を伝えます。",
        ru: "Living Glass должен показывать сценарий размещения, дневной свет и архитектурную сдержанность без неутвержденных рендеров.",
      }),
      material: getLocaleCopy(locale, { en: "Clear glass / black frame / beige room light", de: "Klares Glas / schwarzer Rahmen / beiges Raumlicht", es: "Vidrio claro / marco negro / luz beige de interior", fr: "Verre clair / cadre noir / lumière beige intérieure", zh: "清透玻璃 / 黑色框架 / 米色室内光", ja: "クリアガラス / 黒いフレーム / ベージュの室内光", ru: "Прозрачное стекло / черная рамка / бежевый интерьерный свет" }),
      signature: getLocaleCopy(locale, { en: "Image held in glass", de: "Bild im Glas gehalten", es: "Imagen contenida en vidrio", fr: "L'image tenue dans le verre", zh: "被玻璃承载的图像", ja: "ガラスに留まる映像", ru: "Изображение внутри стекла" }),
      planningTracks: [
        getLocaleCopy(locale, { en: "Interior placement and sightlines", de: "Platzierung und Sichtachsen", es: "Ubicación interior y líneas de visión", fr: "Placement intérieur et lignes de vue", zh: "室内位置与视线", ja: "室内配置と視線", ru: "Размещение и линии обзора" }),
        getLocaleCopy(locale, { en: "Transparency and presentation behavior", de: "Transparenz und Präsentationsverhalten", es: "Transparencia y comportamiento de presentación", fr: "Transparence et comportement de présentation", zh: "透明度与呈现方式", ja: "透明度と表示の振る舞い", ru: "Прозрачность и поведение презентации" }),
        getLocaleCopy(locale, { en: "Integration constraints", de: "Integrationsgrenzen", es: "Restricciones de integración", fr: "Contraintes d'intégration", zh: "集成限制", ja: "統合上の制約", ru: "Ограничения интеграции" }),
      ],
    },
    hologram: {
      stageLabel: getLocaleCopy(locale, { en: "Hologram", de: "Hologramm", es: "Holograma", fr: "Hologramme", zh: "全息呈现", ja: "ホログラム", ru: "Голограмма" }),
      stageTitle: getLocaleCopy(locale, {
        en: "A spatial presentation system for objects that need presence without noise.",
        de: "Ein räumliches Präsentationssystem für Objekte, die Präsenz ohne Lärm brauchen.",
        es: "Un sistema de presentación espacial para objetos que necesitan presencia sin ruido.",
        fr: "Un système de présentation spatiale pour les objets qui demandent une présence sans bruit.",
        zh: "为空间中需要安静存在感的对象打造的展示系统。",
        ja: "静かな存在感を必要とする対象物のための空間プレゼンテーションシステム。",
        ru: "Пространственная презентационная система для объектов, которым нужна выразительность без шума.",
      }),
      stageCopy: getLocaleCopy(locale, {
        en: "The direction should feel like a luxury vitrine: measured light, controlled depth and a clear advisory handoff.",
        de: "Die Richtung wirkt wie eine luxuriöse Vitrine: gemessenes Licht, kontrollierte Tiefe und ein klarer Beratungsweg.",
        es: "La dirección debe sentirse como una vitrina de lujo: luz medida, profundidad controlada y consulta clara.",
        fr: "La direction doit évoquer une vitrine de luxe : lumière mesurée, profondeur contrôlée et relais conseil clair.",
        zh: "这个方向应像高级展柜：光线克制、深度受控，并清晰进入咨询。",
        ja: "このディレクションは上質なショーケースのように、測られた光、制御された奥行き、明確な相談導線を持ちます。",
        ru: "Направление должно ощущаться как люксовая витрина: выверенный свет, контролируемая глубина и понятный переход к консультации.",
      }),
      material: getLocaleCopy(locale, { en: "Dark plinth / bronze edge / suspended light", de: "Dunkler Sockel / Bronze-Kante / schwebendes Licht", es: "Pedestal oscuro / canto bronce / luz suspendida", fr: "Socle sombre / bord bronze / lumière suspendue", zh: "深色基座 / 青铜边缘 / 悬浮光", ja: "暗い台座 / ブロンズの縁 / 吊られた光", ru: "Темный постамент / бронзовая кромка / подвешенный свет" }),
      signature: getLocaleCopy(locale, { en: "Presence without spectacle", de: "Präsenz ohne Spektakel", es: "Presencia sin espectáculo", fr: "Présence sans spectacle", zh: "没有噱头的存在感", ja: "見世物ではない存在感", ru: "Присутствие без зрелищного шума" }),
      planningTracks: [
        getLocaleCopy(locale, { en: "Object scale and viewing distance", de: "Objektmaßstab und Betrachtungsdistanz", es: "Escala del objeto y distancia de visión", fr: "Échelle de l'objet et distance de vue", zh: "对象尺度与观看距离", ja: "対象物のスケールと視距離", ru: "Масштаб объекта и дистанция просмотра" }),
        getLocaleCopy(locale, { en: "Content loop and event mode", de: "Content-Loop und Event-Modus", es: "Bucle de contenido y modo evento", fr: "Boucle de contenu et mode événement", zh: "内容循环与活动模式", ja: "コンテンツループとイベントモード", ru: "Контентный цикл и event mode" }),
        getLocaleCopy(locale, { en: "Retail or exhibition setting", de: "Retail- oder Ausstellungskontext", es: "Contexto retail o expositivo", fr: "Contexte retail ou exposition", zh: "零售或展览语境", ja: "リテールまたは展示の環境", ru: "Retail или exhibition контекст" }),
      ],
    },
    "pictorial-art-display": {
      stageLabel: getLocaleCopy(locale, { en: "Pictorial art", de: "Digitale Kunstwand", es: "Arte pictorial", fr: "Art pictorial", zh: "艺术显示", ja: "ピクトリアルアート", ru: "Живая картина" }),
      stageTitle: getLocaleCopy(locale, {
        en: "A framed digital object that must read as art before it reveals technology.",
        de: "Ein gerahmtes digitales Objekt, das zuerst als Kunst und dann als Technologie gelesen wird.",
        es: "Un objeto digital enmarcado que debe leerse como arte antes de revelar tecnología.",
        fr: "Un objet numérique encadré qui doit se lire comme art avant de révéler la technologie.",
        zh: "先被阅读为艺术、再显露技术属性的框装数字对象。",
        ja: "テクノロジーを見せる前に、まずアートとして読ませる額装デジタルオブジェクト。",
        ru: "Цифровой объект в раме, который сначала считывается как искусство и только затем раскрывает технологию.",
      }),
      stageCopy: getLocaleCopy(locale, {
        en: "The page supports collector, residential and hospitality contexts while keeping artwork selection and rights explicit.",
        de: "Die Richtung eignet sich für Sammler-, Wohn- und Hospitality-Kontexte und hält Kunstwahl sowie Rechte klar.",
        es: "La dirección sostiene contextos de colección, residencia y hospitality con selección artística y derechos claros.",
        fr: "La direction soutient les contextes collection, résidentiel et hospitality en gardant choix d'art et droits explicites.",
        zh: "该方向支持收藏、住宅与酒店场景，同时明确艺术选择与权利边界。",
        ja: "コレクター、住宅、ホスピタリティの文脈を支え、作品選定と権利を明確にします。",
        ru: "Страница поддерживает коллекционный, жилой и hospitality контекст, оставляя выбор искусства и права прозрачными.",
      }),
      material: getLocaleCopy(locale, { en: "Gallery white / black bevel / walnut shadow", de: "Galerieweiß / schwarze Fase / Nussbaumschatten", es: "Blanco galería / bisel negro / sombra de nogal", fr: "Blanc galerie / biseau noir / ombre de noyer", zh: "画廊白 / 黑色斜边 / 胡桃木阴影", ja: "ギャラリーホワイト / 黒いベベル / ウォルナットの影", ru: "Галерейный белый / черный скос / ореховая тень" }),
      signature: getLocaleCopy(locale, { en: "Image as collectible object", de: "Bild als sammelbares Objekt", es: "La imagen como objeto coleccionable", fr: "L'image comme objet de collection", zh: "作为收藏对象的图像", ja: "コレクション対象としての映像", ru: "Изображение как коллекционный объект" }),
      planningTracks: [
        getLocaleCopy(locale, { en: "Frame, wall and artwork intent", de: "Rahmen, Wand und künstlerische Absicht", es: "Marco, muro e intención artística", fr: "Cadre, mur et intention artistique", zh: "画框、墙面与艺术意图", ja: "フレーム、壁、作品意図", ru: "Рама, стена и художественный замысел" }),
        getLocaleCopy(locale, { en: "Collection and content source", de: "Sammlung und Content-Quelle", es: "Colección y fuente de contenido", fr: "Collection et source de contenu", zh: "收藏与内容来源", ja: "コレクションとコンテンツソース", ru: "Коллекция и источник контента" }),
        getLocaleCopy(locale, { en: "Interior installation path", de: "Weg der Interior-Installation", es: "Ruta de instalación interior", fr: "Parcours d'installation intérieure", zh: "室内安装路径", ja: "インテリア設置の流れ", ru: "Маршрут интерьерной установки" }),
      ],
    },
    "display-for-exhibition": {
      stageLabel: getLocaleCopy(locale, { en: "Exhibition displays", de: "Ausstellungsdisplays", es: "Displays expositivos", fr: "Écrans d'exposition", zh: "展陈显示", ja: "展示ディスプレイ", ru: "Выставочные дисплеи" }),
      stageTitle: getLocaleCopy(locale, {
        en: "Embedded touch surfaces for curated rooms, showrooms and high-value presentations.",
        de: "Eingebettete Touch- und Mediensysteme für kuratierte Räume, Showrooms und hochwertige Präsentationen.",
        es: "Sistemas táctiles y multimedia integrados para salas curadas, showrooms y presentaciones de alto valor.",
        fr: "Systèmes tactiles et média intégrés pour espaces curatés, showrooms et présentations à forte valeur.",
        zh: "面向策展空间、展厅与高价值展示的嵌入式触控与媒体系统。",
        ja: "キュレーション空間、ショールーム、高付加価値プレゼンテーションのための組み込みタッチ・メディアシステム。",
        ru: "Встраиваемые сенсорные поверхности для кураторских залов, шоурумов и презентаций высокого уровня.",
      }),
      stageCopy: getLocaleCopy(locale, {
        en: "The direction makes orientation, object context and guided visitor control feel premium before the exact project kit is selected.",
        de: "Die Richtung macht Orientierung, Objektkontext und geführte Besucherinteraktion hochwertig, bevor das Projektset feststeht.",
        es: "La dirección hace que orientación, contexto del objeto e interacción guiada se sientan premium antes de elegir el kit del proyecto.",
        fr: "La direction rend orientation, contexte d'objet et interaction guidée premium avant de choisir le kit projet.",
        zh: "在确定项目设备前，该方向先让导览、对象语境与访客互动呈现高级秩序。",
        ja: "具体的機器構成を選ぶ前に、案内、対象物の文脈、来場者インタラクションを上質に整えます。",
        ru: "Направление делает ориентацию, контекст объекта и управляемую интерактивность премиальными до выбора точного проектного комплекта.",
      }),
      material: getLocaleCopy(locale, { en: "Museum beige / black rail / satin glass", de: "Museumsbeige / schwarze Schiene / satiniertes Glas", es: "Beige museo / raíl negro / vidrio satinado", fr: "Beige musée / rail noir / verre satiné", zh: "博物馆米色 / 黑色导轨 / 缎面玻璃", ja: "ミュージアムベージュ / 黒いレール / サテンガラス", ru: "Музейный беж / черная рейка / сатинированное стекло" }),
      signature: getLocaleCopy(locale, { en: "Interaction built into architecture", de: "Interaktion in Architektur eingebaut", es: "Interacción integrada en la arquitectura", fr: "Interaction intégrée à l'architecture", zh: "嵌入建筑的交互", ja: "建築に組み込まれたインタラクション", ru: "Интерактивность, встроенная в архитектуру" }),
      planningTracks: [
        getLocaleCopy(locale, { en: "Visitor journey and interaction density", de: "Besucherführung und Interaktionsdichte", es: "Recorrido del visitante y densidad interactiva", fr: "Parcours visiteur et densité d'interaction", zh: "访客路径与交互密度", ja: "来場者導線とインタラクション密度", ru: "Маршрут посетителя и плотность интерактива" }),
        getLocaleCopy(locale, { en: "Wall, table or rail format", de: "Wand-, Tisch- oder Schienenformat", es: "Formato de pared, mesa o raíl", fr: "Format mural, table ou rail", zh: "墙面、桌面或导轨形式", ja: "壁、テーブル、レール形式", ru: "Формат стены, стола или рейла" }),
        getLocaleCopy(locale, { en: "Service and content operations", de: "Service- und Content-Betrieb", es: "Servicio y operación de contenidos", fr: "Service et opérations de contenu", zh: "维护与内容运营", ja: "サービスとコンテンツ運用", ru: "Сервис и контент-операции" }),
      ],
    },
  };

  return presentations[directionSlug] ?? fallback;
}

function getDirectionStageClass(directionSlug: string) {
  return `direction-stage-${directionSlug.replace(/[^a-z0-9]+/g, "-")}`;
}

function getDirectionFallbackRoutePath(directionSlug: string) {
  if (directionSlug === "hi-end-audio") {
    return "/audio";
  }

  if (directionSlug === "living-glass") {
    return "/invisible-display";
  }

  if (directionSlug === "display-for-exhibition") {
    return "/exhibition-displays";
  }

  return `/${directionSlug}`;
}

function getDirectionLuxMediaSource(
  directionSlug: string,
): { src: string; mobileSrc?: string; variant: "cinema" | "audio" | "display"; video?: boolean } | null {
  const map: Record<string, { src: string; mobileSrc?: string; variant: "cinema" | "audio" | "display"; video?: boolean }> = {
    "vision-max": { src: "/images/dir-hero/vision-max.webp", variant: "cinema" },
    "hi-end-audio": { src: "/images/dir-hero/hi-end-audio.webp", variant: "audio" },
    "living-glass": { src: "/images/dir-hero/living-glass.mp4", variant: "display", video: true },
    "pictorial-art-display": { src: "/images/dir-hero/pictorial-art-display.webp", variant: "display" },
    hologram: {
      src: "/images/dir-hero/hologram-cover-desktop-16x9-candidate-001.webp",
      mobileSrc: "/images/dir-hero/hologram-cover-mobile-9x16-candidate-001.webp",
      variant: "display",
    },
    "display-for-exhibition": { src: "/images/site-vis-021a/exhibition-display-active-surface/web-context.webp", variant: "display" },
  };
  return map[directionSlug] ?? null;
}

export async function generateDirectionRouteMetadata(
  directionSlug: string,
  fallbackTitle: string,
  fallbackDescription: string,
  fallbackRoutePath: string,
): Promise<Metadata> {
  const locale = await getRequestLocale();
  const cmsClient = getCmsClient();
  const [direction, directionPage] = await Promise.all([
    cmsClient.getDirectionBySlug(directionSlug, locale),
    cmsClient.getPageByRoutePath(fallbackRoutePath, locale),
  ]);
  const isRu = isRussianLocale(locale);

  return buildRouteMetadata({
    title: directionPage?.seo.title ?? direction?.seo.title ?? `${fallbackTitle} | Montelar`,
    description:
      directionPage?.seo.description ??
      direction?.seo.description ??
      (isRu ? "Направление Montelar с понятным пространственным сценарием и частной консультацией." : fallbackDescription),
    path:
      directionPage?.seo.routePath ??
      directionPage?.routePath ??
      direction?.seo.routePath ??
      direction?.routePath ??
      fallbackRoutePath,
    locale,
    keywords: getDirectionSeoKeywords(
      locale,
      directionSlug,
      direction?.name ?? fallbackTitle,
    ),
  });
}

export async function DirectionRoutePage({
  directionSlug,
  fallbackTitle,
  fallbackDescription,
  intro,
  notes,
  details,
  hideStatement,
  hideProducts,
  ctaTitle: ctaTitleProp,
  hideCta,
}: DirectionRoutePageProps) {
  const locale = await getRequestLocale();
  const isRu = isRussianLocale(locale);
  const cmsClient = getCmsClient();
  const fallbackRoutePath = getDirectionFallbackRoutePath(directionSlug);
  const [direction, directionPage, categories, products] = await Promise.all([
    cmsClient.getDirectionBySlug(directionSlug, locale),
    cmsClient.getPageByRoutePath(fallbackRoutePath, locale),
    cmsClient.listDirectionCategories(directionSlug, locale),
    cmsClient.listProductsByDirection(directionSlug, locale),
  ]);

  const resolvedTitle = directionPage?.title ?? direction?.name ?? fallbackTitle;
  const resolvedDescription = direction?.shortDescription ?? fallbackDescription;
  const presentation = getDirectionPresentation(directionSlug, locale);
  const directionHeroSection =
    directionPage?.sections?.find((section) => section.sectionType === "hero") ?? null;
  const categoryLinks = categories.map((category) => ({
    href: category.routePath,
    label: category.label,
    description: category.description,
  }));
  const productLinks = products.map((product) => ({
    href: product.routePath,
    inquiryHref: product.inquiryRoutePath,
    label: product.name,
    description: product.shortDescription,
    categorySlug: product.categorySlug,
  }));
  const routeDepthSummary = categoryLinks.length
    ? isRu
      ? `${categoryLinks.length} категории и ${productLinks.length} продукта помогают перейти от общего замысла к выбору системы.`
      : `${categoryLinks.length} categories and ${productLinks.length} products guide the conversation from intent into system selection.`
    : productLinks.length
      ? isRu
        ? `${productLinks.length} продукта доступны для прямого сравнения без лишнего промежуточного выбора.`
        : `${productLinks.length} products are available for direct comparison without forcing an extra selection layer.`
      : isRu
        ? "Направление помогает понять характер решения и перейти к личной консультации."
        : "This direction helps visitors understand the system character and move into consultation.";
  const routeDepthSummaryLocalized = getLocaleCopy(locale, {
    en: routeDepthSummary,
    de: categoryLinks.length
      ? `${categoryLinks.length} Kategorien und ${productLinks.length} Produkte führen von der Absicht zur Systemauswahl.`
      : productLinks.length
        ? `${productLinks.length} Produkte sind direkt vergleichbar, ohne zuerst weitere Kategorieebenen zu erzwingen.`
        : "Diese Richtung kann Stimmung, Systemlogik und Beratung tragen.",
    es: categoryLinks.length
      ? `${categoryLinks.length} categorías y ${productLinks.length} productos llevan de la intención al sistema.`
      : productLinks.length
        ? `${productLinks.length} productos están disponibles directamente dentro de esta dirección sin exigir primero otra capa.`
        : "Esta dirección ya orienta la atmósfera, la lógica del sistema y la consulta.",
    fr: categoryLinks.length
      ? `${categoryLinks.length} catégories et ${productLinks.length} produits mènent de l'intention à la sélection du système.`
      : productLinks.length
        ? `${productLinks.length} produits sont disponibles directement dans cette direction sans imposer une couche supplémentaire.`
        : "Cette direction oriente déjà l'atmosphère, la logique système et la consultation.",
    zh: categoryLinks.length
      ? `该方向下有 ${categoryLinks.length} 个分类和 ${productLinks.length} 个产品可用于判断。`
      : productLinks.length
        ? `该方向下有 ${productLinks.length} 个产品可直接比较，无需先展开更多层级。`
        : "该方向已经帮助访客理解系统特征并进入咨询。",
    ja: categoryLinks.length
      ? `このディレクションでは ${categoryLinks.length} 件のカテゴリと ${productLinks.length} 件の製品を比較できます。`
      : productLinks.length
        ? `このディレクションではカテゴリ階層を増やさなくても ${productLinks.length} 件の製品を直接比較できます。`
        : "このディレクションは、システムの性格を理解し相談へ進むための入口として機能します。",
    ru: routeDepthSummary,
  });
  const luxMediaSource = getDirectionLuxMediaSource(directionSlug);

  const heroEyebrow =
    direction?.tagline ??
    getLocaleCopy(locale, {
      en: "Product direction",
      de: "Produktrichtung",
      es: "Direccion de producto",
      fr: "Direction produit",
      zh: "产品方向",
      ja: "製品ディレクション",
      ru: "Продуктовое направление",
    });
  const heroLead = directionPage?.heroSummary ?? intro ?? resolvedDescription;
  const productsLabel = getLocaleCopy(locale, {
    en: "The line", de: "Die Linie", es: "La linea", fr: "La ligne", zh: "产品线", ja: "ラインアップ", ru: "Линейка",
  });
  const openLabel = getLocaleCopy(locale, {
    en: "Open product", de: "Produkt offnen", es: "Abrir producto", fr: "Ouvrir le produit", zh: "查看产品", ja: "製品を見る", ru: "Открыть продукт",
  });
  const inquiryLabel = getLocaleCopy(locale, {
    en: "Request consultation", de: "Beratung anfragen", es: "Solicitar consulta", fr: "Demander conseil", zh: "预约咨询", ja: "相談する", ru: "Запросить консультацию",
  });
  const ctaTitle = ctaTitleProp ?? getLocaleCopy(locale, {
    en: "Shape this system around one room.",
    de: "Dieses System um einen Raum herum gestalten.",
    es: "Componer este sistema en torno a una sala.",
    fr: "Composer ce systeme autour d'une piece.",
    zh: "围绕一个空间构建这套系统。",
    ja: "一つの空間を軸にこのシステムを構成する。",
    ru: "Соберём систему вокруг вашей комнаты.",
  });

  return (
    <main className="dir-page">
      <section className="dir-hero notranslate" translate="no" data-nosnippet="true">
        {luxMediaSource ? (
          luxMediaSource.video ? (
            <video
              className="dir-hero-img dir-hero-video notranslate"
              poster={luxMediaSource.src.replace(/\.mp4$/, "-poster.jpg")}
              autoPlay
              muted
              loop
              playsInline
              draggable={false}
              aria-hidden="true"
              data-nosnippet="true"
              translate="no"
              disablePictureInPicture
              disableRemotePlayback
              controlsList="nodownload nofullscreen noremoteplayback"
              preload="metadata"
            >
              <source media="(max-width: 768px)" src={luxMediaSource.src.replace(/\.mp4$/, "-720.mp4")} type="video/mp4" />
              <source src={luxMediaSource.src.replace(/\.mp4$/, "-1080.mp4")} type="video/mp4" />
            </video>
          ) : (
            <>
              <img
                className="dir-hero-img"
                src={luxMediaSource.src}
                alt={resolvedTitle}
                data-atomic-media=""
                decoding="async"
                draggable={false}
                fetchPriority="high"
                loading="eager"
              />
              {luxMediaSource.mobileSrc ? (
                <img
                  className="dir-hero-img dir-hero-img-mobile"
                  src={luxMediaSource.mobileSrc}
                  alt=""
                  data-atomic-media=""
                  decoding="async"
                  draggable={false}
                  fetchPriority="high"
                  loading="eager"
                  aria-hidden="true"
                />
              ) : null}
            </>
          )
        ) : null}
        <span className="dir-hero-scrim" aria-hidden="true" />
        <div className="dir-hero-copy">
          <p className="dir-eyebrow">{heroEyebrow}</p>
          <h1 className="dir-title">{resolvedTitle}</h1>
          {heroLead ? <p className="dir-lead">{heroLead}</p> : null}
        </div>
      </section>

      {hideStatement ? null : (
      <section className="dir-statement">
        <div className="dir-wrap">
          <p className="dir-eyebrow">{presentation.stageLabel}</p>
          <h2 className="dir-statement-title">{presentation.stageTitle}</h2>
          <p className="dir-statement-body">{presentation.stageCopy}</p>
          <dl className="dir-meta">
            <div>
              <dt>{getLocaleCopy(locale, { en: "Surface", de: "Oberflache", es: "Superficie", fr: "Surface", zh: "表面", ja: "面", ru: "Среда" })}</dt>
              <dd>{presentation.material}</dd>
            </div>
            <div>
              <dt>{getLocaleCopy(locale, { en: "Depth", de: "Tiefe", es: "Profundidad", fr: "Profondeur", zh: "路径深度", ja: "階層", ru: "Глубина" })}</dt>
              <dd>{categoryLinks.length
                ? getLocaleCopy(locale, {
                    en: categoryLinks.length + " categories / " + productLinks.length + " products",
                    ru: categoryLinks.length + " категории / " + productLinks.length + " продукта",
                  })
                : getLocaleCopy(locale, {
                    en: productLinks.length + " products",
                    ru: productLinks.length + " продукта",
                  })}</dd>
            </div>
          </dl>
        </div>
      </section>
      )}

      {details ?? null}

      {!hideProducts && productLinks.length ? (
        <section className="dir-line">
          <div className="dir-wrap">
            <p className="dir-eyebrow">{productsLabel}</p>
          </div>
          <ol className="dir-products">
            {productLinks.map((product, index) => (
              <li className="dir-product" key={product.href}>
                <span className="dir-product-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <div className="dir-product-body">
                  <h3 className="dir-product-name">{product.label}</h3>
                  {product.description ? <p className="dir-product-desc">{product.description}</p> : null}
                  <div className="dir-product-actions">
                    <Link className="dir-link" href={withLocale(product.href, locale)}>{openLabel}</Link>
                    {product.inquiryHref ? (
                      <Link className="dir-link dir-link--soft" href={withLocale(product.inquiryHref, locale)}>{inquiryLabel}</Link>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {!hideProducts && categoryLinks.length ? (
        <section className="dir-line">
          <div className="dir-wrap">
            <p className="dir-eyebrow">{getLocaleCopy(locale, { en: "Families", de: "Familien", es: "Familias", fr: "Familles", zh: "分类", ja: "カテゴリ", ru: "Семьи продуктов" })}</p>
          </div>
          <ol className="dir-products">
            {categoryLinks.map((category, index) => (
              <li className="dir-product" key={category.href}>
                <span className="dir-product-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <div className="dir-product-body">
                  <h3 className="dir-product-name">{category.label}</h3>
                  {category.description ? <p className="dir-product-desc">{category.description}</p> : null}
                  <div className="dir-product-actions">
                    <Link className="dir-link" href={withLocale(category.href, locale)}>{getLocaleCopy(locale, { en: "Explore family", ru: "Открыть семью", de: "Familie offnen", es: "Abrir familia", fr: "Ouvrir la famille", zh: "查看分类", ja: "カテゴリを見る" })}</Link>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {hideCta ? null : (
      <section className="dir-cta">
        <div className="dir-wrap">
          <h2 className="dir-cta-title">{ctaTitle}</h2>
          <Link className="dir-link dir-link--lg" href={withLocale("/contact", locale)}>{inquiryLabel}</Link>
        </div>
      </section>
      )}
    </main>
  );
}
