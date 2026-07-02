import { withLocale } from "@/config/site-routes";
import type { SiteLocale } from "@/config/i18n";
import { getLocaleCopy } from "@/lib/copy/site-copy";

export type MotionCatalogLink = {
  label: string;
  href: string;
};

export type MotionCatalogDirection = {
  id: string;
  indexLabel: string;
  label: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  image: string;
  material: string;
  marker: string;
  relatedLinks: MotionCatalogLink[];
};

export function buildMotionCatalogContent(locale: SiteLocale) {
  const cta = getLocaleCopy(locale, {
    en: "Open direction",
    de: "Richtung öffnen",
    es: "Abrir dirección",
    fr: "Ouvrir la direction",
    zh: "打开方向",
    ja: "領域を開く",
    ru: "Открыть направление",
  });

  const directions: MotionCatalogDirection[] = [
    {
      id: "vision",
      indexLabel: "01",
      label: "Vision MAX",
      title: getLocaleCopy(locale, {
        en: "Private cinema as an architectural event.",
        de: "Privates Kino als architektonisches Ereignis.",
        es: "Cine privado como acontecimiento arquitectónico.",
        fr: "Cinéma privé comme événement architectural.",
        zh: "作为建筑事件的私人影院。",
        ja: "建築的な体験としてのプライベートシネマ。",
        ru: "Приватное кино как архитектурное событие.",
      }),
      description: getLocaleCopy(locale, {
        en: "Screen, projection, acoustics and room light resolve as one composed environment.",
        de: "Leinwand, Projektion, Akustik und Raumlicht werden zu einer Umgebung.",
        es: "Pantalla, proyección, acústica y luz de sala se resuelven como un entorno.",
        fr: "Ecran, projection, acoustique et lumière de pièce forment un environnement.",
        zh: "屏幕、投影、声学与空间光被组织为一个环境。",
        ja: "スクリーン、投影、音響、室内光を一つの環境として構成します。",
        ru: "Экран, проекция, акустика и свет комнаты собираются в одну среду.",
      }),
      href: withLocale("/vision-max", locale),
      cta,
      image: "/images/home/montelar-master-room-wide.webp",
      material: getLocaleCopy(locale, { en: "Screen plane", de: "Bildebene", es: "Plano visual", fr: "Plan image", zh: "影像平面", ja: "映像面", ru: "Плоскость изображения" }),
      marker: getLocaleCopy(locale, { en: "Image", de: "Bild", es: "Imagen", fr: "Image", zh: "图像", ja: "映像", ru: "Изображение" }),
      relatedLinks: [
        { label: "Vision MAX Premium", href: withLocale("/products/vision-max-premium", locale) },
        { label: "Vision MAX LUX", href: withLocale("/products/vision-max-lux", locale) },
      ],
    },
    {
      id: "audio",
      indexLabel: "02",
      label: getLocaleCopy(locale, { en: "Hi-end Audio", de: "Hi-end Audio", es: "Hi-end Audio", fr: "Hi-end Audio", zh: "Hi-end Audio", ja: "Hi-end Audio", ru: "Люкс аудио" }),
      title: getLocaleCopy(locale, {
        en: "Sound, power and material held in one controlled system.",
        de: "Klang, Leistung und Material in einem kontrollierten System.",
        es: "Sonido, potencia y materia dentro de un sistema controlado.",
        fr: "Son, puissance et matière dans un système maîtrisé.",
        zh: "声音、功率与材料被纳入同一受控系统。",
        ja: "音、駆動、素材を一つの制御されたシステムに収めます。",
        ru: "Звук, мощность и материал в одной контролируемой системе.",
      }),
      description: getLocaleCopy(locale, {
        en: "Speakers, electronics and conductors appear as infrastructure for a room, not separate products.",
        de: "Lautsprecher, Elektronik und Leiter erscheinen als Raum-Infrastruktur.",
        es: "Altavoces, electrónica y conductores aparecen como infraestructura de sala.",
        fr: "Enceintes, électronique et conducteurs deviennent une infrastructure de pièce.",
        zh: "音箱、电子设备与导体成为空间基础设施，而非孤立产品。",
        ja: "スピーカー、電子機器、導体を空間のインフラとして扱います。",
        ru: "Колонки, электроника и проводники выглядят как инфраструктура комнаты.",
      }),
      href: withLocale("/audio", locale),
      cta,
      image: "/images/home/product-series/connected-system-four-plugs.webp",
      material: getLocaleCopy(locale, { en: "Signal chain", de: "Signalkette", es: "Cadena de señal", fr: "Chaîne signal", zh: "信号链路", ja: "信号系統", ru: "Сигнальная цепь" }),
      marker: getLocaleCopy(locale, { en: "Sound", de: "Klang", es: "Sonido", fr: "Son", zh: "声音", ja: "音", ru: "Звук" }),
      relatedLinks: [
        { label: getLocaleCopy(locale, { en: "Speakers", de: "Lautsprecher", es: "Altavoces", fr: "Enceintes", zh: "音箱", ja: "スピーカー", ru: "Акустика" }), href: withLocale("/audio/speakers", locale) },
        { label: getLocaleCopy(locale, { en: "Amplifiers", de: "Verstärker", es: "Amplificadores", fr: "Amplificateurs", zh: "功放", ja: "アンプ", ru: "Усилители" }), href: withLocale("/audio/amplifiers", locale) },
        { label: "Prima Materia", href: withLocale("/audio/perfect-conductors/prima-materia", locale) },
      ],
    },
    {
      id: "glass",
      indexLabel: "03",
      label: getLocaleCopy(locale, { en: "Living Glass", de: "Living Glass", es: "Living Glass", fr: "Living Glass", zh: "Living Glass", ja: "Living Glass", ru: "Прозрачный дисплей" }),
      title: getLocaleCopy(locale, {
        en: "Image surfaces that appear without interrupting the room.",
        de: "Bildflächen, die erscheinen, ohne den Raum zu brechen.",
        es: "Superficies de imagen que aparecen sin interrumpir el espacio.",
        fr: "Surfaces d'image qui apparaissent sans rompre la pièce.",
        zh: "不打断空间秩序而显现的影像表面。",
        ja: "空間を遮らずに現れる映像面。",
        ru: "Поверхности изображения, которые появляются без разрыва интерьера.",
      }),
      description: getLocaleCopy(locale, {
        en: "Transparent display planes stay architectural first and technological second.",
        de: "Transparente Displayflächen bleiben zuerst architektonisch, danach technologisch.",
        es: "Los planos transparentes siguen siendo arquitectura antes que tecnología.",
        fr: "Les plans transparents restent d'abord architecturaux, puis technologiques.",
        zh: "透明显示平面首先属于建筑，其次才是技术。",
        ja: "透明ディスプレイ面は、技術以前に建築の一部として存在します。",
        ru: "Прозрачная плоскость сначала работает как архитектура, а уже потом как технология.",
      }),
      href: withLocale("/invisible-display", locale),
      cta,
      image: "/images/home/product-series/transparent-screens.webp",
      material: getLocaleCopy(locale, { en: "Black glass", de: "Black Glass", es: "Black glass", fr: "Black glass", zh: "黑玻璃", ja: "ブラックガラス", ru: "Black glass" }),
      marker: "Glass",
      relatedLinks: [{ label: "Living Glass OLED", href: withLocale("/products/living-glass-oled", locale) }],
    },
    {
      id: "hologram",
      indexLabel: "04",
      label: getLocaleCopy(locale, { en: "Hologram", de: "Hologramm", es: "Holograma", fr: "Hologramme", zh: "全息", ja: "ホログラム", ru: "Голограмма" }),
      title: getLocaleCopy(locale, {
        en: "Spatial presentation for objects, collections and private showrooms.",
        de: "Räumliche Präsentation für Objekte, Sammlungen und private Showrooms.",
        es: "Presentación espacial para objetos, colecciones y showrooms privados.",
        fr: "Présentation spatiale pour objets, collections et showrooms privés.",
        zh: "面向物件、收藏与私人展厅的空间呈现。",
        ja: "オブジェクト、コレクション、プライベートショールームのための空間演出。",
        ru: "Пространственная подача объектов, коллекций и приватных шоурумов.",
      }),
      description: getLocaleCopy(locale, {
        en: "A controlled light volume turns presentation into a quiet spatial plane.",
        de: "Ein kontrolliertes Lichtvolumen macht Präsentation zu einer stillen Raumebene.",
        es: "Un volumen de luz controlado convierte la presentación en un plano espacial sereno.",
        fr: "Un volume lumineux maîtrisé transforme la présentation en plan spatial calme.",
        zh: "受控光体积让展示成为安静的空间平面。",
        ja: "制御された光のボリュームが、静かな空間面をつくります。",
        ru: "Контролируемый объем света превращает презентацию в спокойную пространственную плоскость.",
      }),
      href: withLocale("/hologram", locale),
      cta,
      image: "/images/home/generated/montelar-nano-banana-video-frame.webp",
      material: getLocaleCopy(locale, { en: "Light volume", de: "Lichtvolumen", es: "Volumen de luz", fr: "Volume lumineux", zh: "光体积", ja: "光の量感", ru: "Объем света" }),
      marker: getLocaleCopy(locale, { en: "Depth", de: "Tiefe", es: "Profundidad", fr: "Profondeur", zh: "深度", ja: "奥行き", ru: "Глубина" }),
      relatedLinks: [{ label: "Hologram Vitrine", href: withLocale("/products/hologram-vitrine", locale) }],
    },
    {
      id: "art",
      indexLabel: "05",
      label: getLocaleCopy(locale, { en: "Pictorial Art", de: "Pictorial Art", es: "Pictorial Art", fr: "Pictorial Art", zh: "艺术显示", ja: "ピクトリアルアート", ru: "Живая картина" }),
      title: getLocaleCopy(locale, {
        en: "Moving image framed as an architectural object.",
        de: "Bewegtes Bild als architektonisches Objekt gerahmt.",
        es: "Imagen en movimiento enmarcada como objeto arquitectónico.",
        fr: "Image en mouvement cadrée comme objet architectural.",
        zh: "被框定为建筑物件的动态影像。",
        ja: "建築的なオブジェクトとして額装された動く映像。",
        ru: "Движущееся изображение как архитектурный объект.",
      }),
      description: getLocaleCopy(locale, {
        en: "A display becomes a composed surface for slow image presence, not a technical screen.",
        de: "Ein Display wird zur komponierten Fläche für ruhige Bildpräsenz.",
        es: "El display se vuelve una superficie compuesta para presencia visual lenta.",
        fr: "Le display devient une surface composée pour une présence lente de l'image.",
        zh: "显示设备成为承载缓慢影像存在的构成表面。",
        ja: "ディスプレイは技術画面ではなく、静かな映像のための構成面になります。",
        ru: "Дисплей становится собранной поверхностью для медленного присутствия изображения.",
      }),
      href: withLocale("/pictorial-art-display", locale),
      cta,
      image: "/images/home/product-series/led-seamless.webp",
      material: getLocaleCopy(locale, { en: "Framed image", de: "Gerahmtes Bild", es: "Imagen enmarcada", fr: "Image cadrée", zh: "框景影像", ja: "額装された映像", ru: "Изображение в раме" }),
      marker: getLocaleCopy(locale, { en: "Frame", de: "Rahmen", es: "Marco", fr: "Cadre", zh: "框", ja: "フレーム", ru: "Рама" }),
      relatedLinks: [{ label: "Pictorial Canvas", href: withLocale("/products/pictorial-canvas", locale) }],
    },
    {
      id: "exhibition",
      indexLabel: "06",
      label: getLocaleCopy(locale, { en: "Exhibition", de: "Ausstellung", es: "Exhibición", fr: "Exposition", zh: "展陈", ja: "展示", ru: "Выставка" }),
      title: getLocaleCopy(locale, {
        en: "Embedded interaction for galleries, retail and curated environments.",
        de: "Eingebaute Interaktion für Galerien, Retail und kuratierte Räume.",
        es: "Interacción integrada para galerías, retail y entornos curados.",
        fr: "Interaction intégrée pour galeries, retail et espaces curatoriaux.",
        zh: "面向画廊、零售与策展空间的嵌入式互动。",
        ja: "ギャラリー、リテール、キュレーション空間のための埋め込み型インタラクション。",
        ru: "Встроенное взаимодействие для галерей, retail и кураторских пространств.",
      }),
      description: getLocaleCopy(locale, {
        en: "Touch surfaces and media walls stay flush with the interior logic.",
        de: "Touchflächen und Media Walls bleiben bündig mit der Innenraumlogik.",
        es: "Superficies táctiles y muros media quedan alineados con la lógica interior.",
        fr: "Surfaces tactiles et murs média restent intégrés à la logique intérieure.",
        zh: "触控表面与媒体墙保持与室内逻辑齐平。",
        ja: "タッチ面とメディアウォールはインテリアの論理に沿って収まります。",
        ru: "Сенсорные поверхности и media wall остаются встроенными в логику интерьера.",
      }),
      href: withLocale("/exhibition-displays", locale),
      cta,
      image: "/images/home/montelar-master-screen-mechanism.webp",
      material: getLocaleCopy(locale, { en: "Embedded surface", de: "Eingebaute Fläche", es: "Superficie integrada", fr: "Surface intégrée", zh: "嵌入表面", ja: "埋め込み面", ru: "Встроенная поверхность" }),
      marker: getLocaleCopy(locale, { en: "Touch", de: "Touch", es: "Táctil", fr: "Touch", zh: "触控", ja: "タッチ", ru: "Touch" }),
      relatedLinks: [
        { label: "Exhibition Wall", href: withLocale("/products/exhibition-wall", locale) },
        { label: "Exhibition Table", href: withLocale("/products/exhibition-table", locale) },
        { label: "Exhibition Rail", href: withLocale("/products/exhibition-rail", locale) },
      ],
    },
  ];

  return {
    ariaLabel: getLocaleCopy(locale, {
      en: "Montelar product directions",
      de: "Montelar Produktrichtungen",
      es: "Direcciones de producto Montelar",
      fr: "Directions produit Montelar",
      zh: "Montelar 产品方向",
      ja: "Montelar 製品領域",
      ru: "Продуктовые направления Montelar",
    }),
    directions,
    eyebrow: getLocaleCopy(locale, {
      en: "The Montelar System",
      de: "The Montelar System",
      es: "The Montelar System",
      fr: "The Montelar System",
      zh: "The Montelar System",
      ja: "The Montelar System",
      ru: "The Montelar System",
    }),
    intro: getLocaleCopy(locale, {
      en: "Six directions behave as one room system: image, sound, glass, light, art and interaction move through the same quiet architecture.",
      de: "Sechs Richtungen verhalten sich wie ein Raumsystem: Bild, Klang, Glas, Licht, Kunst und Interaktion bewegen sich in derselben ruhigen Architektur.",
      es: "Seis direcciones actúan como un sistema de sala: imagen, sonido, vidrio, luz, arte e interacción se mueven dentro de la misma arquitectura serena.",
      fr: "Six directions forment un système de pièce: image, son, verre, lumière, art et interaction avancent dans la même architecture calme.",
      zh: "六个方向如同一个空间系统：图像、声音、玻璃、光、艺术与互动都在同一静谧架构中展开。",
      ja: "六つの領域を一つの空間システムとして扱い、映像、音、ガラス、光、アート、インタラクションを同じ静かな建築の中で動かします。",
      ru: "Шесть направлений работают как единая система комнаты: изображение, звук, стекло, свет, искусство и взаимодействие движутся внутри одной спокойной архитектуры.",
    }),
    title: getLocaleCopy(locale, {
      en: "One catalog, composed as a system.",
      de: "Ein Katalog, als System komponiert.",
      es: "Un catálogo compuesto como sistema.",
      fr: "Un catalogue composé comme un système.",
      zh: "一个以系统构成的目录。",
      ja: "システムとして構成された一つのカタログ。",
      ru: "Каталог, собранный как система.",
    }),
  };
}
