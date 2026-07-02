import type { SiteLocale } from "@/config/i18n";
import type {
  CmsPage,
  CmsProduct,
  CmsProductCategory,
  CmsProductDirection,
  CmsProductInquiryField,
  CmsProductInquiryForm,
} from "@/lib/cms/types";
import { localizeInquiryFormRuntimeCopy } from "@/lib/forms/product-inquiry-copy";

function seo(title: string, description: string, routePath: string, locale: SiteLocale) {
  return {
    title,
    description,
    routePath,
    locale,
  };
}

function field(
  fieldKey: string,
  label: string,
  fieldType: CmsProductInquiryField["fieldType"] = "text",
  options: Partial<CmsProductInquiryField> = {},
): CmsProductInquiryField {
  return {
    fieldKey,
    fieldType,
    ...(fieldType === "hidden-context" ? {} : { leadMappingKey: fieldKey }),
    required: false,
    width: "full",
    ...options,
    label,
  };
}

function option(value: string, label: string) {
  return { value, label };
}

function isRussianLocale(locale: SiteLocale) {
  return locale === "ru";
}

function isSpanishLocale(locale: SiteLocale) {
  return locale === "es";
}

function isFrenchLocale(locale: SiteLocale) {
  return locale === "fr";
}

function isChineseLocale(locale: SiteLocale) {
  return locale === "zh";
}

function isJapaneseLocale(locale: SiteLocale) {
  return locale === "ja";
}

function isGermanLocale(locale: SiteLocale) {
  return locale === "de";
}

const russianDirectionCopy: Record<
  string,
  { shortDescription: string; seoTitle: string; seoDescription: string }
> = {
  "vision-max": {
    shortDescription: "Приватный кинотеатр как законченная система комнаты: экран, проектор, акустика, электроника, посадка, свет и калибровка.",
    seoTitle: "Vision MAX | Montelar",
    seoDescription: "Приватный кинотеатр Montelar: экран, проектор, акустика, электроника, посадка, свет и калибровка как единая архитектура комнаты.",
  },
  "hi-end-audio": {
    shortDescription: "Акустика, источники, усиление и кабели как предметная система для комнаты прослушивания.",
    seoTitle: "Hi-end Audio | Montelar",
    seoDescription: "Hi-end Audio Montelar: акустика, источники, усиление и кабели как референсная система для частной комнаты прослушивания.",
  },
  "living-glass": {
    shortDescription: "Прозрачные дисплейные поверхности, которые остаются частью стекла, мебели или перегородки, а не отдельным экраном.",
    seoTitle: "Living Glass | Montelar",
    seoDescription: "Living Glass Montelar: прозрачные дисплейные поверхности для интерьеров, шоурумов и брендовых пространств.",
  },
  hologram: {
    shortDescription: "Голографические витрины и световые презентации для объектов, коллекций, запусков и премиального ритейла.",
    seoTitle: "Hologram | Montelar",
    seoDescription: "Hologram Montelar: голографические витрины и пространственные презентации для объекта, коллекции, события и luxury retail.",
  },
  "pictorial-art-display": {
    shortDescription: "Цифровая картина в раме, где изображение, фактура стены и право на контент рассматриваются вместе.",
    seoTitle: "Pictorial Art Display | Montelar",
    seoDescription: "Pictorial Art Display Montelar: цифровая картина в раме для частных интерьеров, галерей и curated media art.",
  },
  "display-for-exhibition": {
    shortDescription: "Встраиваемые сенсорные стены, столы и линии навигации для выставок, музеев, шоурумов и hospitality.",
    seoTitle: "Exhibition Displays | Montelar",
    seoDescription: "Exhibition Displays Montelar: встраиваемые сенсорные стены, столы и навигационные поверхности для публичных премиальных пространств.",
  },
};

const spanishDirectionCopy: Record<
  string,
  { shortDescription: string; seoTitle: string; seoDescription: string }
> = {
  "vision-max": {
    shortDescription: "Cines privados y sistemas inmersivos de proyección.",
    seoTitle: "Vision MAX | Montelar",
    seoDescription: "Cines privados y sistemas inmersivos de proyección.",
  },
  "hi-end-audio": {
    shortDescription: "Altavoces, componentes de fuente, amplificación y sistemas de cableado.",
    seoTitle: "Hi-end Audio | Montelar",
    seoDescription: "Altavoces, componentes de fuente, amplificación y sistemas de cableado.",
  },
  "living-glass": {
    shortDescription: "Superficies de display transparentes para interiores residenciales y de marca.",
    seoTitle: "Living Glass | Montelar",
    seoDescription: "Superficies de display transparentes para interiores residenciales y de marca.",
  },
  hologram: {
    shortDescription: "Sistemas de presentación espacial para contextos coleccionables, retail y eventos.",
    seoTitle: "Hologram | Montelar",
    seoDescription: "Sistemas de presentación espacial para contextos coleccionables, retail y eventos.",
  },
  "pictorial-art-display": {
    shortDescription: "Objetos de arte digital enmarcado para integración arquitectónica.",
    seoTitle: "Pictorial Art Display | Montelar",
    seoDescription: "Objetos de arte digital enmarcado para integración arquitectónica.",
  },
  "display-for-exhibition": {
    shortDescription: "Superficies táctiles integradas para exposiciones premium y showrooms.",
    seoTitle: "Exhibition Displays | Montelar",
    seoDescription: "Superficies táctiles integradas para exposiciones premium y showrooms.",
  },
};

const frenchDirectionCopy: Record<
  string,
  { shortDescription: string; seoTitle: string; seoDescription: string }
> = {
  "vision-max": {
    shortDescription: "Cinémas privés et systèmes de projection immersifs.",
    seoTitle: "Vision MAX | Montelar",
    seoDescription: "Cinémas privés et systèmes de projection immersifs.",
  },
  "hi-end-audio": {
    shortDescription: "Enceintes, composants source, amplification et systèmes de câbles.",
    seoTitle: "Hi-end Audio | Montelar",
    seoDescription: "Enceintes, composants source, amplification et systèmes de câbles.",
  },
  "living-glass": {
    shortDescription: "Surfaces d'affichage transparentes pour intérieurs résidentiels et de marque.",
    seoTitle: "Living Glass | Montelar",
    seoDescription: "Surfaces d'affichage transparentes pour intérieurs résidentiels et de marque.",
  },
  hologram: {
    shortDescription: "Systèmes de présentation spatiale pour contextes de collection, retail et événementiels.",
    seoTitle: "Hologram | Montelar",
    seoDescription: "Systèmes de présentation spatiale pour contextes de collection, retail et événementiels.",
  },
  "pictorial-art-display": {
    shortDescription: "Objets d'art numérique encadrés pour une intégration architecturale.",
    seoTitle: "Pictorial Art Display | Montelar",
    seoDescription: "Objets d'art numérique encadrés pour une intégration architecturale.",
  },
  "display-for-exhibition": {
    shortDescription: "Surfaces tactiles intégrées pour expositions premium et showrooms.",
    seoTitle: "Exhibition Displays | Montelar",
    seoDescription: "Surfaces tactiles intégrées pour expositions premium et showrooms.",
  },
};

const chineseDirectionCopy: Record<
  string,
  { shortDescription: string; seoTitle: string; seoDescription: string }
> = {
  "vision-max": {
    shortDescription: "面向高端住宅场景的私人影院与沉浸式放映系统。",
    seoTitle: "Vision MAX | Montelar",
    seoDescription: "面向高端住宅场景的私人影院与沉浸式放映系统。",
  },
  "hi-end-audio": {
    shortDescription: "扬声器、音源组件、放大系统与线材方案。",
    seoTitle: "Hi-end Audio | Montelar",
    seoDescription: "扬声器、音源组件、放大系统与线材方案。",
  },
  "living-glass": {
    shortDescription: "面向住宅与品牌空间的透明显示界面。",
    seoTitle: "Living Glass | Montelar",
    seoDescription: "面向住宅与品牌空间的透明显示界面。",
  },
  hologram: {
    shortDescription: "适用于藏品、零售与活动场景的空间展示系统。",
    seoTitle: "Hologram | Montelar",
    seoDescription: "适用于藏品、零售与活动场景的空间展示系统。",
  },
  "pictorial-art-display": {
    shortDescription: "用于建筑整合的框装数字艺术对象。",
    seoTitle: "Pictorial Art Display | Montelar",
    seoDescription: "用于建筑整合的框装数字艺术对象。",
  },
  "display-for-exhibition": {
    shortDescription: "面向高端展览与展厅的嵌入式触控显示界面。",
    seoTitle: "Exhibition Displays | Montelar",
    seoDescription: "面向高端展览与展厅的嵌入式触控显示界面。",
  },
};

const japaneseDirectionCopy: Record<
  string,
  { shortDescription: string; seoTitle: string; seoDescription: string }
> = {
  "vision-max": {
    shortDescription: "上質な住空間に向けたプライベートシネマと没入型上映システム。",
    seoTitle: "Vision MAX | Montelar",
    seoDescription: "上質な住空間に向けたプライベートシネマと没入型上映システム。",
  },
  "hi-end-audio": {
    shortDescription: "スピーカー、ソース機器、増幅システム、ケーブル構成。",
    seoTitle: "Hi-end Audio | Montelar",
    seoDescription: "スピーカー、ソース機器、増幅システム、ケーブル構成。",
  },
  "living-glass": {
    shortDescription: "住宅空間とブランド空間のための透過ディスプレイ面。",
    seoTitle: "Living Glass | Montelar",
    seoDescription: "住宅空間とブランド空間のための透過ディスプレイ面。",
  },
  hologram: {
    shortDescription: "コレクタブル、リテール、イベントのための空間演出プレゼンテーションシステム。",
    seoTitle: "Hologram | Montelar",
    seoDescription: "コレクタブル、リテール、イベントのための空間演出プレゼンテーションシステム。",
  },
  "pictorial-art-display": {
    shortDescription: "建築統合のための額装デジタルアートオブジェクト。",
    seoTitle: "Pictorial Art Display | Montelar",
    seoDescription: "建築統合のための額装デジタルアートオブジェクト。",
  },
  "display-for-exhibition": {
    shortDescription: "上質な展示空間とショールームのための組み込み型タッチディスプレイ。",
    seoTitle: "Exhibition Displays | Montelar",
    seoDescription: "上質な展示空間とショールームのための組み込み型タッチディスプレイ。",
  },
};

const germanDirectionCopy: Record<
  string,
  { shortDescription: string; seoTitle: string; seoDescription: string }
> = {
  "vision-max": {
    shortDescription: "Private Kinos und immersive Vorführsysteme für anspruchsvolle Wohnräume.",
    seoTitle: "Vision MAX | Montelar",
    seoDescription: "Private Kinos und immersive Vorführsysteme für anspruchsvolle Wohnräume.",
  },
  "hi-end-audio": {
    shortDescription: "Lautsprecher, Quellkomponenten, Verstärkung und Kabelsysteme.",
    seoTitle: "Hi-end Audio | Montelar",
    seoDescription: "Lautsprecher, Quellkomponenten, Verstärkung und Kabelsysteme.",
  },
  "living-glass": {
    shortDescription: "Transparente Display-Flächen für Wohn- und Markeninterieurs.",
    seoTitle: "Living Glass | Montelar",
    seoDescription: "Transparente Display-Flächen für Wohn- und Markeninterieurs.",
  },
  hologram: {
    shortDescription: "Räumliche Präsentationssysteme für Sammlungs-, Retail- und Eventkontexte.",
    seoTitle: "Hologram | Montelar",
    seoDescription: "Räumliche Präsentationssysteme für Sammlungs-, Retail- und Eventkontexte.",
  },
  "pictorial-art-display": {
    shortDescription: "Gerahmte digitale Kunstobjekte für architektonische Integration.",
    seoTitle: "Pictorial Art Display | Montelar",
    seoDescription: "Gerahmte digitale Kunstobjekte für architektonische Integration.",
  },
  "display-for-exhibition": {
    shortDescription: "Integrierte Touch-Flächen für Premium-Ausstellungen und Showrooms.",
    seoTitle: "Exhibition Displays | Montelar",
    seoDescription: "Integrierte Touch-Flächen für Premium-Ausstellungen und Showrooms.",
  },
};

const russianCategoryCopy: Record<string, { label: string; description: string }> = {
  speakers: {
    label: "Акустика",
    description: "Референсные акустические системы для комнат, где масштаб звучания должен оставаться собранным и спокойным.",
  },
  streamers: {
    label: "Стримеры",
    description: "Сетевые источники для точного цифрового тракта и спокойного управления системой.",
  },
  dac: {
    label: "ЦАП",
    description: "Выделенные ступени преобразования для цифрового тракта Montelar.",
  },
  amplifiers: {
    label: "Усилители",
    description: "Интегральные и раздельные платформы усиления.",
  },
  "perfect-conductors": {
    label: "Perfect Conductors",
    description: "Кабельные системы и материальные программы для сигнала, питания и акустики.",
  },
};

const spanishCategoryCopy: Record<string, { label: string; description: string }> = {
  speakers: {
    label: "Altavoces",
    description: "Programas acústicos de referencia y propuestas espaciales para salas completas.",
  },
  streamers: {
    label: "Streamers",
    description: "Componentes de red para una capa digital controlada y refinada.",
  },
  dac: {
    label: "DAC",
    description: "Etapas de conversión dedicadas para una cadena digital de lujo.",
  },
  amplifiers: {
    label: "Amplificadores",
    description: "Plataformas de amplificación integradas y separadas.",
  },
  "perfect-conductors": {
    label: "Perfect Conductors",
    description: "Sistemas de cable y programas materiales para señal y potencia.",
  },
};

const frenchCategoryCopy: Record<string, { label: string; description: string }> = {
  speakers: {
    label: "Enceintes",
    description: "Programmes acoustiques de référence et propositions spatiales à l'échelle de la pièce.",
  },
  streamers: {
    label: "Streamers",
    description: "Composants réseau pour une couche numérique maîtrisée et raffinée.",
  },
  dac: {
    label: "DAC",
    description: "Étages de conversion dédiés pour une chaîne numérique de luxe.",
  },
  amplifiers: {
    label: "Amplificateurs",
    description: "Plateformes d'amplification intégrées et séparées.",
  },
  "perfect-conductors": {
    label: "Perfect Conductors",
    description: "Systèmes de câbles et programmes matières pour le signal et l'alimentation.",
  },
};

const chineseCategoryCopy: Record<string, { label: string; description: string }> = {
  speakers: {
    label: "扬声器",
    description: "面向完整聆听空间的参考级声学方案。",
  },
  streamers: {
    label: "流媒体播放器",
    description: "为受控数字前端打造的网络音源组件。",
  },
  dac: {
    label: "DAC",
    description: "面向奢华数字播放链路的专用转换级。",
  },
  amplifiers: {
    label: "放大器",
    description: "集成式与分体式放大平台。",
  },
  "perfect-conductors": {
    label: "Perfect Conductors",
    description: "覆盖信号与供电的线材与材料方案。",
  },
};

const japaneseCategoryCopy: Record<string, { label: string; description: string }> = {
  speakers: {
    label: "スピーカー",
    description: "豊かな試聴空間に向けたリファレンス級スピーカープログラム。",
  },
  streamers: {
    label: "ストリーマー",
    description: "制御されたデジタルフロントエンドのためのネットワークソース機器。",
  },
  dac: {
    label: "DAC",
    description: "ラグジュアリーなデジタル再生系のための専用変換ステージ。",
  },
  amplifiers: {
    label: "アンプ",
    description: "インテグレーテッドおよびセパレートの増幅プラットフォーム。",
  },
  "perfect-conductors": {
    label: "Perfect Conductors",
    description: "信号伝送と給電のためのケーブルおよび素材プログラム。",
  },
};

const germanCategoryCopy: Record<string, { label: string; description: string }> = {
  speakers: {
    label: "Lautsprecher",
    description: "Referenz-Lautsprecherprogramme und akustische Aussagen für komplette Hörräume.",
  },
  streamers: {
    label: "Streamer",
    description: "Netzwerk-Quellkomponenten für ein kontrolliertes digitales Frontend.",
  },
  dac: {
    label: "DAC",
    description: "Dedizierte Wandlungsstufen für eine luxuriöse digitale Wiedergabekette.",
  },
  amplifiers: {
    label: "Verstärker",
    description: "Integrierte und getrennte Verstärkungsplattformen.",
  },
  "perfect-conductors": {
    label: "Perfect Conductors",
    description: "Kabelsysteme und Materialprogramme für Signal- und Stromführung.",
  },
};

const russianPageCopy: Record<
  string,
  { title: string; navigationLabel?: string; heroSummary: string; seoTitle: string; seoDescription: string }
> = {
  brand: {
    title: "Бренд",
    navigationLabel: "Бренд",
    heroSummary: "Тихая роскошь Montelar: точность, форма, материал и спокойное присутствие в пространстве.",
    seoTitle: "Бренд | Montelar",
    seoDescription: "Тихая роскошь Montelar: точность, форма, материал и спокойное присутствие в пространстве.",
  },
  technology: {
    title: "Технологии",
    heroSummary: "Сигнал, управление, изображение и интеграция как единая логика пространства.",
    seoTitle: "Технологии | Montelar",
    seoDescription: "Сигнал, управление, изображение и интеграция как единая логика пространства.",
  },
  craftsmanship: {
    title: "Мастерство",
    heroSummary: "Материалы, отделка, монтажные допуски и сервисная дисциплина для долговечной системы.",
    seoTitle: "Мастерство | Montelar",
    seoDescription: "Материалы, отделка, монтажные допуски и сервисная дисциплина для долговечной системы.",
  },
  projects: {
    title: "Проекты",
    navigationLabel: "Проекты",
    heroSummary: "Частные резиденции, галереи, шоурумы и залы, где изображение, звук и свет собираются как единая среда.",
    seoTitle: "Проекты | Montelar",
    seoDescription: "Частные резиденции, галереи, шоурумы и залы, где изображение, звук и свет собираются как единая среда.",
  },
  journal: {
    title: "Журнал",
    heroSummary: "Редакционные заметки о системах, материалах, инсталляциях и культуре тихой роскоши.",
    seoTitle: "Журнал | Montelar",
    seoDescription: "Редакционные заметки о системах, материалах, инсталляциях и культуре тихой роскоши.",
  },
  downloads: {
    title: "Материалы",
    heroSummary: "Брошюры, спецификации и проектные документы для частного изучения.",
    seoTitle: "Материалы | Montelar",
    seoDescription: "Брошюры, спецификации и проектные документы для частного изучения.",
  },
  contact: {
    title: "Контакты",
    navigationLabel: "Контакты",
    heroSummary: "Прямой контакт для частной консультации, партнерства или обсуждения проекта.",
    seoTitle: "Контакты | Montelar",
    seoDescription: "Прямой контакт для частной консультации, партнерства или обсуждения проекта.",
  },
};

const spanishPageCopy: Record<
  string,
  { title: string; navigationLabel?: string; heroSummary: string; seoTitle: string; seoDescription: string }
> = {
  brand: {
    title: "Marca",
    navigationLabel: "Marca",
    heroSummary: "Lujo silencioso Montelar: precisión, forma, materia y presencia serena en el espacio.",
    seoTitle: "Marca | Montelar",
    seoDescription: "Lujo silencioso Montelar: precisión, forma, materia y presencia serena en el espacio.",
  },
  technology: {
    title: "Tecnología",
    heroSummary: "Señal, control, display e integración como una sola lógica espacial.",
    seoTitle: "Tecnología | Montelar",
    seoDescription: "Señal, control, display e integración como una sola lógica espacial.",
  },
  craftsmanship: {
    title: "Artesanía",
    heroSummary: "Materiales, acabados, tolerancias de instalación y disciplina de servicio para un sistema duradero.",
    seoTitle: "Artesanía | Montelar",
    seoDescription: "Materiales, acabados, tolerancias de instalación y disciplina de servicio para un sistema duradero.",
  },
  projects: {
    title: "Proyectos",
    navigationLabel: "Proyectos",
    heroSummary: "Residencias, galerías, showrooms y salas donde imagen, sonido y luz se componen como un solo entorno.",
    seoTitle: "Proyectos | Montelar",
    seoDescription: "Residencias, galerías, showrooms y salas donde imagen, sonido y luz se componen como un solo entorno.",
  },
  journal: {
    title: "Journal",
    heroSummary: "Notas editoriales sobre sistemas, materiales, instalaciones y cultura de lujo silencioso.",
    seoTitle: "Journal | Montelar",
    seoDescription: "Notas editoriales sobre sistemas, materiales, instalaciones y cultura de lujo silencioso.",
  },
  downloads: {
    title: "Materiales",
    heroSummary: "Folletos, especificaciones y documentos de proyecto para revisión privada.",
    seoTitle: "Materiales | Montelar",
    seoDescription: "Folletos, especificaciones y documentos de proyecto para revisión privada.",
  },
  contact: {
    title: "Contacto",
    navigationLabel: "Contacto",
    heroSummary: "Contacto directo para consulta privada, colaboración regional o conversación de proyecto.",
    seoTitle: "Contacto | Montelar",
    seoDescription: "Contacto directo para consulta privada, colaboración regional o conversación de proyecto.",
  },
};

const frenchPageCopy: Record<
  string,
  { title: string; navigationLabel?: string; heroSummary: string; seoTitle: string; seoDescription: string }
> = {
  brand: {
    title: "Marque",
    navigationLabel: "Marque",
    heroSummary: "Le luxe discret Montelar : précision, forme, matière et présence calme dans l'espace.",
    seoTitle: "Marque | Montelar",
    seoDescription: "Le luxe discret Montelar : précision, forme, matière et présence calme dans l'espace.",
  },
  technology: {
    title: "Technologie",
    heroSummary: "Signal, controle, affichage et integration comme logique unique de l'espace.",
    seoTitle: "Technologie | Montelar",
    seoDescription: "Signal, controle, affichage et integration comme logique unique de l'espace.",
  },
  craftsmanship: {
    title: "Savoir-faire",
    heroSummary: "Matières, finitions, tolérances d'installation et discipline de service pour un système durable.",
    seoTitle: "Savoir-faire | Montelar",
    seoDescription: "Matières, finitions, tolérances d'installation et discipline de service pour un système durable.",
  },
  projects: {
    title: "Projets",
    navigationLabel: "Projets",
    heroSummary: "Résidences, galeries, showrooms et salles où image, son et lumière composent un même environnement.",
    seoTitle: "Projets | Montelar",
    seoDescription: "Résidences, galeries, showrooms et salles où image, son et lumière composent un même environnement.",
  },
  journal: {
    title: "Journal",
    heroSummary: "Notes éditoriales sur les systèmes, les matières, les installations et la culture du luxe discret.",
    seoTitle: "Journal | Montelar",
    seoDescription: "Notes éditoriales sur les systèmes, les matières, les installations et la culture du luxe discret.",
  },
  downloads: {
    title: "Téléchargements",
    heroSummary: "Brochures, specifications et documents projet pour une revue privee.",
    seoTitle: "Téléchargements | Montelar",
    seoDescription: "Brochures, specifications et documents projet pour une revue privee.",
  },
  contact: {
    title: "Contact",
    navigationLabel: "Contact",
    heroSummary: "Contact direct pour consultation privée, partenariat régional ou conversation de projet.",
    seoTitle: "Contact | Montelar",
    seoDescription: "Contact direct pour consultation privée, partenariat régional ou conversation de projet.",
  },
};

const chinesePageCopy: Record<
  string,
  { title: string; navigationLabel?: string; heroSummary: string; seoTitle: string; seoDescription: string }
> = {
  brand: {
    title: "品牌",
    navigationLabel: "品牌",
    heroSummary: "Montelar 静奢：精度、形体、材质与空间中的安静存在感。",
    seoTitle: "品牌 | Montelar",
    seoDescription: "Montelar 静奢：精度、形体、材质与空间中的安静存在感。",
  },
  technology: {
    title: "技术",
    heroSummary: "信号、控制、显示与集成共同构成空间逻辑。",
    seoTitle: "技术 | Montelar",
    seoDescription: "信号、控制、显示与集成共同构成空间逻辑。",
  },
  craftsmanship: {
    title: "工艺",
    heroSummary: "为长期系统服务的材质、饰面、安装公差与服务纪律。",
    seoTitle: "工艺 | Montelar",
    seoDescription: "为长期系统服务的材质、饰面、安装公差与服务纪律。",
  },
  projects: {
    title: "项目",
    navigationLabel: "项目",
    heroSummary: "住宅、画廊、展厅与私人空间中的图像、声音和光线被组织成同一环境。",
    seoTitle: "项目 | Montelar",
    seoDescription: "住宅、画廊、展厅与私人空间中的图像、声音和光线被组织成同一环境。",
  },
  journal: {
    title: "Journal",
    heroSummary: "关于系统、材质、安装与静奢文化的编辑笔记。",
    seoTitle: "Journal | Montelar",
    seoDescription: "关于系统、材质、安装与静奢文化的编辑笔记。",
  },
  downloads: {
    title: "资料下载",
    heroSummary: "用于私人审阅的宣传册、规格资料与项目文件。",
    seoTitle: "资料下载 | Montelar",
    seoDescription: "用于私人审阅的宣传册、规格资料与项目文件。",
  },
  contact: {
    title: "联系",
    navigationLabel: "联系",
    heroSummary: "用于私人咨询、区域合作或项目沟通的直接联系。",
    seoTitle: "联系 | Montelar",
    seoDescription: "用于私人咨询、区域合作或项目沟通的直接联系。",
  },
};

const japanesePageCopy: Record<
  string,
  { title: string; navigationLabel?: string; heroSummary: string; seoTitle: string; seoDescription: string }
> = {
  brand: {
    title: "ブランド",
    navigationLabel: "ブランド",
    heroSummary: "Montelar の静かなラグジュアリー。精度、形、素材、空間に残る落ち着いた存在感。",
    seoTitle: "ブランド | Montelar",
    seoDescription: "Montelar の静かなラグジュアリー。精度、形、素材、空間に残る落ち着いた存在感。",
  },
  technology: {
    title: "テクノロジー",
    heroSummary: "信号、制御、表示、統合を一つの空間ロジックとして扱います。",
    seoTitle: "テクノロジー | Montelar",
    seoDescription: "信号、制御、表示、統合を一つの空間ロジックとして扱います。",
  },
  craftsmanship: {
    title: "クラフツマンシップ",
    heroSummary: "長く使うシステムのための素材、仕上げ、施工精度、サービス規律。",
    seoTitle: "クラフツマンシップ | Montelar",
    seoDescription: "長く使うシステムのための素材、仕上げ、施工精度、サービス規律。",
  },
  projects: {
    title: "プロジェクト",
    navigationLabel: "プロジェクト",
    heroSummary: "住宅、ギャラリー、ショールームで映像、音、光を一つの環境として構成します。",
    seoTitle: "プロジェクト | Montelar",
    seoDescription: "住宅、ギャラリー、ショールームで映像、音、光を一つの環境として構成します。",
  },
  journal: {
    title: "ジャーナル",
    heroSummary: "システム、素材、施工、静かなラグジュアリー文化についてのエディトリアルノート。",
    seoTitle: "ジャーナル | Montelar",
    seoDescription: "システム、素材、施工、静かなラグジュアリー文化についてのエディトリアルノート。",
  },
  downloads: {
    title: "ダウンロード",
    heroSummary: "パンフレット、仕様資料、プロジェクト文書を個別検討のために用意します。",
    seoTitle: "ダウンロード | Montelar",
    seoDescription: "パンフレット、仕様資料、プロジェクト文書を個別検討のために用意します。",
  },
  contact: {
    title: "コンタクト",
    navigationLabel: "コンタクト",
    heroSummary: "個別相談、地域パートナーシップ、プロジェクト対話のための直接連絡。",
    seoTitle: "コンタクト | Montelar",
    seoDescription: "個別相談、地域パートナーシップ、プロジェクト対話のための直接連絡。",
  },
};

const germanPageCopy: Record<
  string,
  { title: string; navigationLabel?: string; heroSummary: string; seoTitle: string; seoDescription: string }
> = {
  brand: {
    title: "Marke",
    navigationLabel: "Marke",
    heroSummary: "Stiller Luxus von Montelar: Präzision, Form, Material und ruhige Präsenz im Raum.",
    seoTitle: "Marke | Montelar",
    seoDescription: "Stiller Luxus von Montelar: Präzision, Form, Material und ruhige Präsenz im Raum.",
  },
  technology: {
    title: "Technologie",
    heroSummary: "Signal, Steuerung, Display und Integration als eine Raumlogik.",
    seoTitle: "Technologie | Montelar",
    seoDescription: "Signal, Steuerung, Display und Integration als eine Raumlogik.",
  },
  craftsmanship: {
    title: "Handwerk",
    heroSummary: "Materialien, Oberflächen, Installationstoleranzen und Servicedisziplin für ein langlebiges System.",
    seoTitle: "Handwerk | Montelar",
    seoDescription: "Materialien, Oberflächen, Installationstoleranzen und Servicedisziplin für ein langlebiges System.",
  },
  projects: {
    title: "Projekte",
    navigationLabel: "Projekte",
    heroSummary: "Residenzen, Galerien, Showrooms und Räume, in denen Bild, Klang und Licht als eine Umgebung wirken.",
    seoTitle: "Projekte | Montelar",
    seoDescription: "Residenzen, Galerien, Showrooms und Räume, in denen Bild, Klang und Licht als eine Umgebung wirken.",
  },
  journal: {
    title: "Journal",
    heroSummary: "Redaktionelle Notizen über Systeme, Materialien, Installationen und die Kultur stillen Luxus.",
    seoTitle: "Journal | Montelar",
    seoDescription: "Redaktionelle Notizen über Systeme, Materialien, Installationen und die Kultur stillen Luxus.",
  },
  downloads: {
    title: "Downloads",
    heroSummary: "Broschüren, Spezifikationen und Projektdokumente für private Prüfung.",
    seoTitle: "Downloads | Montelar",
    seoDescription: "Broschüren, Spezifikationen und Projektdokumente für private Prüfung.",
  },
  contact: {
    title: "Kontakt",
    navigationLabel: "Kontakt",
    heroSummary: "Direkter Kontakt für private Beratung, regionale Partnerschaft oder Projektgespräch.",
    seoTitle: "Kontakt | Montelar",
    seoDescription: "Direkter Kontakt für private Beratung, regionale Partnerschaft oder Projektgespräch.",
  },
};

const russianProductDescriptions: Record<string, string> = {
  "vision-max-premium": "Частный кинотеатр для резиденции: проектор или экранная система, акустика, электроника, посадка и управление собираются под конкретную комнату.",
  "vision-max-lux": "Флагманская архитектура Vision MAX для VIP-залов, estates и частных screening suites, где важны масштаб, приватность и сервис жизненного цикла.",
  "living-glass-oled": "Прозрачная дисплейная поверхность для стекла, витрины, перегородки или мебели, где медиа должно оставаться частью интерьера.",
  "hologram-vitrine": "Физическая витрина с контролируемым светом и голографическим слоем для объекта, коллекции, запуска продукта или boutique-сценария.",
  "pictorial-canvas": "Цифровая картина в раме для стены, галереи или частного пространства, где изображение подбирается с учетом прав, света и материала стены.",
  "exhibition-wall": "Встроенная сенсорная стена для выставок, музеев, брендовых пространств и публичной навигации без ощущения рекламного экрана.",
  "exhibition-table": "Интерактивная поверхность мебельного масштаба для галерей, салонов и шоурумов, где контент работает на объект и маршрут посетителя.",
  "exhibition-rail": "Встраиваемая информационная линия для витрин, стен и экспозиционных маршрутов с требованиями к читаемости, языкам и обслуживанию.",
  "monolith-reference": "Референсная акустика для комнаты прослушивания, где масштаб, корпус, опоры и расположение в интерьере так же важны, как звуковая сцена.",
  "nexus-reference-hub": "Сетевой источник и управляющий центр для цифрового тракта, который должен быть точным, спокойным в управлении и обслуживаемым.",
  "prism-reference-dac": "Выделенный ЦАП для раздельных референсных систем, частных демонстраций и трактов, где conversion stage нельзя растворять в общем источнике.",
  "vela-integrated-amplifier": "Интегральный усилитель для hi-end системы, где контроль акустики, материал корпуса и сценарий размещения рассматриваются вместе.",
  "prima-materia-lux-speaker": "Акустический кабель Prima Materia для референсных систем: длина, коннекторы, трасса и влияние на систему уточняются до поставки.",
};

const spanishProductDescriptions: Record<string, string> = {
  "vision-max-premium": "Arquitectura de cine privado para salas residenciales premium.",
  "vision-max-lux": "Arquitectura insignia de cine privado para suites de colección, estates y entornos VIP.",
  "living-glass-oled": "Superficie de display transparente para espacios residenciales y de marca.",
  "hologram-vitrine": "Escaparate holográfico de lujo para instalaciones coleccionables, retail y eventos.",
  "pictorial-canvas": "Objeto de arte digital enmarcado para integración mural y motion stills curados.",
  "exhibition-wall": "Muro táctil integrado para exposiciones premium y escenarios de showroom.",
  "exhibition-table": "Superficie interactiva de exhibición a escala mobiliario para usos curatoriales y showrooms.",
  "exhibition-rail": "Línea de display integrada para vitrinas, exposiciones y superficies arquitectónicas.",
  "monolith-reference": "Sistema acústico de referencia para salas de escucha expresivas e interiores emblematicos.",
  "nexus-reference-hub": "Componente de fuente en red para una capa digital controlada y sistemas integrados.",
  "prism-reference-dac": "DAC de referencia dedicado para una cadena digital de lujo.",
  "vela-integrated-amplifier": "Amplificador integrado para sistemas hi-end con foco en control, materialidad e integración.",
  "prima-materia-lux-speaker": "Juego premium de cables de altavoz para sistemas de referencia y audiciones curadas.",
};

const frenchProductDescriptions: Record<string, string> = {
  "vision-max-premium": "Architecture de cinéma privé pour salles résidentielles premium.",
  "vision-max-lux": "Architecture phare de cinéma privé pour suites de collection, estates et environnements VIP.",
  "living-glass-oled": "Surface d'affichage transparente pour espaces résidentiels et de marque.",
  "hologram-vitrine": "Vitrine holographique de luxe pour installations de collection, retail et événementielles.",
  "pictorial-canvas": "Objet d'art numérique encadré pour intégration murale et motion stills curés.",
  "exhibition-wall": "Mur tactile intégré pour expositions premium et scénarios de showroom.",
  "exhibition-table": "Surface interactive d'exposition à l'échelle du mobilier pour usages curatoriaux et showrooms.",
  "exhibition-rail": "Ligne d'affichage intégrée pour vitrines, expositions et surfaces architecturales.",
  "monolith-reference": "Systeme acoustique de reference pour espaces d'ecoute expressifs et interieurs emblematiques.",
  "nexus-reference-hub": "Composant source réseau pour une façade numérique maîtrisée et des systèmes intégrés.",
  "prism-reference-dac": "DAC de référence dédié pour une chaîne numérique de luxe.",
  "vela-integrated-amplifier": "Amplificateur intégré pour systèmes hi-end, axé sur le contrôle, la matérialité et l'intégration.",
  "prima-materia-lux-speaker": "Jeu premium de câbles d'enceinte pour systèmes de référence et écoutes curées.",
};

const chineseProductDescriptions: Record<string, string> = {
  "vision-max-premium": "面向高端住宅观影空间的私人影院架构。",
  "vision-max-lux": "面向收藏级套房、庄园与 VIP 观影环境的旗舰私人影院架构。",
  "living-glass-oled": "适用于住宅与品牌空间的透明显示界面。",
  "hologram-vitrine": "面向藏品、零售与活动场景的奢华全息展示柜。",
  "pictorial-canvas": "用于墙面建筑整合与策展式动态静帧展示的框装数字艺术对象。",
  "exhibition-wall": "面向高端展览与展厅场景的嵌入式触控墙面。",
  "exhibition-table": "适用于策展与展厅场景的家具尺度互动展示界面。",
  "exhibition-rail": "用于橱窗、展陈与建筑表面的嵌入式信息显示线。",
  "monolith-reference": "面向表达性聆听空间与声明式室内的参考级扬声器系统。",
  "nexus-reference-hub": "为受控数字前端与整合系统打造的网络音源组件。",
  "prism-reference-dac": "面向奢华数字播放链路的专用参考级 DAC。",
  "vela-integrated-amplifier": "强调控制力、材质感与整合能力的 Hi-end 集成放大器。",
  "prima-materia-lux-speaker": "面向参考级系统与策展试听场景的高端扬声器线材套装。",
};

const japaneseProductDescriptions: Record<string, string> = {
  "vision-max-premium": "上質な住宅用シアタールームのためのプライベートシネマ構成。",
  "vision-max-lux": "コレクター向けスイート、邸宅、VIP視聴空間のための旗艦プライベートシネマ構成。",
  "living-glass-oled": "住宅空間とブランド空間のための透過ディスプレイ面。",
  "hologram-vitrine": "コレクタブル、リテール、イベント演出のためのラグジュアリーホログラムショーケース。",
  "pictorial-canvas": "壁面統合と演出的なモーションスチル展示のための額装デジタルアートオブジェクト。",
  "exhibition-wall": "上質な展示空間とショールームのための組み込み型タッチウォール。",
  "exhibition-table": "キュレーション空間とショールームのための家具スケールのインタラクティブ展示面。",
  "exhibition-rail": "ケース、展示、建築面のための組み込み型情報ディスプレイライン。",
  "monolith-reference": "表現力の高いリスニングルームと象徴的なインテリアのためのリファレンススピーカーシステム。",
  "nexus-reference-hub": "制御されたデジタルフロントエンドと統合システムのためのネットワークソース機器。",
  "prism-reference-dac": "ラグジュアリーなデジタル再生系のための専用リファレンス DAC。",
  "vela-integrated-amplifier": "制御力、素材感、統合性を重視した Hi-end インテグレーテッドアンプ。",
  "prima-materia-lux-speaker": "リファレンスシステムと選定試聴のためのプレミアムスピーカーケーブルセット。",
};

const germanProductDescriptions: Record<string, string> = {
  "vision-max-premium": "Private-Cinema-Architektur für hochwertige Wohnkino-Räume.",
  "vision-max-lux": "Flaggschiff-Architektur für private Kinos in Collector-Suiten, Anwesen und VIP-Vorführräumen.",
  "living-glass-oled": "Transparente Display-Fläche für architektonische Wohn- und Markenräume.",
  "hologram-vitrine": "Luxus-Hologramm-Vitrine für Sammlungs-, Retail- und Eventinszenierungen.",
  "pictorial-canvas": "Gerahmtes digitales Kunstobjekt für Wandintegration und kuratierte Motion-Stills.",
  "exhibition-wall": "Integrierte Touch-Wand für Premium-Ausstellungen und Showroom-Szenarien.",
  "exhibition-table": "Interaktive Ausstellungsfläche im Möbelmaßstab für kuratorische und Showroom-Szenarien.",
  "exhibition-rail": "Integrierte Informations-Display-Linie für Vitrinen, Ausstellungen und architektonische Oberflächen.",
  "monolith-reference": "Referenz-Lautsprechersystem für ausdrucksstarke Hörräume und markante Interieurs.",
  "nexus-reference-hub": "Netzwerk-Quellkomponente für ein kontrolliertes digitales Frontend und integrierte Systeme.",
  "prism-reference-dac": "Dedizierter Referenz-DAC für eine luxuriöse digitale Wiedergabekette.",
  "vela-integrated-amplifier": "Integrierter Verstärker für Hi-end-Systeme mit Fokus auf Kontrolle, Materialität und Integration.",
  "prima-materia-lux-speaker": "Premium-Lautsprecherkabel-Set für Referenzsysteme und kuratierte Hörsitzungen.",
};

const russianFormMetaByProductSlug: Record<
  string,
  { title: string; description: string; submitLabel: string; successTitle: string; successMessage: string }
> = {
  "monolith-reference": {
    title: "Запрос консультации по Monolith Reference",
    description: "Опишите масштаб комнаты, контекст системы и сценарий установки.",
    submitLabel: "Запросить приватную консультацию",
    successTitle: "Заявка принята",
    successMessage: "Заявка сохранена; консультант Montelar сможет продолжить разговор с учетом продукта и комнаты.",
  },
  "nexus-reference-hub": {
    title: "Обсудить Nexus Reference Hub",
    description: "Опишите цели source-системы, ожидания по управлению и интеграционный контекст.",
    submitLabel: "Запросить контакт консультанта",
    successTitle: "Заявка принята",
    successMessage: "Запрос сохранен для следующего консультационного шага Montelar.",
  },
  "prism-reference-dac": {
    title: "Запросить консультацию по Prism Reference DAC",
    description: "Опишите приоритеты conversion-тракта, контекст системы и интерес к прослушиванию.",
    submitLabel: "Запросить техническую консультацию",
    successTitle: "Заявка принята",
    successMessage: "Запрос сохранен для технической консультации Montelar.",
  },
  "vela-integrated-amplifier": {
    title: "Сконфигурировать Vela Integrated Amplifier",
    description: "Опишите pairing с акустикой, контекст комнаты и сценарий установки.",
    submitLabel: "Запросить системную консультацию",
    successTitle: "Заявка принята",
    successMessage: "Запрос по усилителю сохранен для системной консультации Montelar.",
  },
  "vision-max-premium": {
    title: "Сконфигурировать Vision MAX Premium",
    description: "Опишите параметры комнаты, посадки, акустики и интеграции.",
    submitLabel: "Запросить консультацию по приватному кинотеатру",
    successTitle: "Заявка принята",
    successMessage: "Бриф Vision MAX Premium сохранен; консультант продолжит разговор с учетом комнаты, посадки и приватности.",
  },
  "vision-max-lux": {
    title: "Сконфигурировать Vision MAX LUX",
    description: "Опишите контекст флагманской кинозоны, стейкхолдеров и сервис жизненного цикла.",
    submitLabel: "Запросить флагманскую консультацию",
    successTitle: "Заявка принята",
    successMessage: "Бриф Vision MAX LUX сохранен для флагманской консультации Montelar.",
  },
  "living-glass-oled": {
    title: "Обсудить Living Glass OLED",
    description: "Опишите остекление, световые условия и желаемый сценарий интеграции.",
    submitLabel: "Запросить выездное обследование",
    successTitle: "Бриф принят",
    successMessage: "Бриф Living Glass сохранен для предметного ответа Montelar.",
  },
  "hologram-vitrine": {
    title: "Обсудить Hologram Vitrine",
    description: "Опишите объект, среду показа и желаемый сценарий интеграции.",
    submitLabel: "Запросить консультацию по объектному сценарию",
    successTitle: "Бриф принят",
    successMessage: "Бриф Hologram Vitrine сохранен для консультации по объектному сценарию.",
  },
  "pictorial-canvas": {
    title: "Обсудить Pictorial Canvas",
    description: "Опишите стену, кураторскую задачу, права на контент и сценарий интеграции.",
    submitLabel: "Запросить консультацию по art-display",
    successTitle: "Бриф принят",
    successMessage: "Бриф Pictorial Canvas сохранен для кураторской консультации Montelar.",
  },
  "exhibition-wall": {
    title: "Обсудить Exhibition Wall",
    description: "Опишите масштаб стены, публичное использование, контент и интеграционный контекст.",
    submitLabel: "Запросить консультацию по стеновой системе",
    successTitle: "Бриф принят",
    successMessage: "Бриф Exhibition Wall сохранен для проектной консультации Montelar.",
  },
  "exhibition-table": {
    title: "Обсудить Exhibition Table",
    description: "Опишите взаимодействие на уровне мебели, использование пространства и контентный сценарий.",
    submitLabel: "Запросить консультацию по table-системе",
    successTitle: "Бриф принят",
    successMessage: "Бриф Exhibition Table сохранен для проектной консультации Montelar.",
  },
  "exhibition-rail": {
    title: "Обсудить Exhibition Rail",
    description: "Опишите встраиваемую поверхность, читаемость и требования к обслуживанию.",
    submitLabel: "Запросить review по встраиваемому дисплею",
    successTitle: "Бриф принят",
    successMessage: "Бриф Exhibition Rail сохранен для проектной консультации Montelar.",
  },
  "prima-materia-lux-speaker": {
    title: "Запросить консультацию по Prima Materia LUX Speaker",
    description: "Соберите контекст системы, ожидаемые длины кабеля и интерес к прослушиванию.",
    submitLabel: "Запросить контакт консультанта",
    successTitle: "Заявка принята",
    successMessage: "Заявка сохранена для консультации Montelar по системе и кабельному тракту.",
  },
};

const spanishFormMetaByProductSlug: Record<
  string,
  { title: string; description: string; submitLabel: string; successTitle: string; successMessage: string }
> = {
  "monolith-reference": {
    title: "Solicitar consulta sobre Monolith Reference",
    description: "Comparta la escala de la sala, el contexto del sistema y el escenario de instalación dentro del formulario activo.",
    submitLabel: "Solicitar consulta privada",
    successTitle: "Solicitud registrada",
    successMessage: "La solicitud quedo guardada para una consulta privada de Montelar.",
  },
  "nexus-reference-hub": {
    title: "Hablar sobre Nexus Reference Hub",
    description: "Comparta los objetivos del sistema source, las expectativas de control y el contexto de integración.",
    submitLabel: "Solicitar contacto de consultoría",
    successTitle: "Solicitud registrada",
    successMessage: "La solicitud quedo guardada para el siguiente contacto de Montelar.",
  },
  "prism-reference-dac": {
    title: "Solicitar consulta sobre Prism Reference DAC",
    description: "Comparta las prioridades de conversion, el contexto del sistema y el interes por una audicion.",
    submitLabel: "Solicitar consulta técnica",
    successTitle: "Solicitud registrada",
    successMessage: "La solicitud quedo guardada para una consulta Montelar.",
  },
  "vela-integrated-amplifier": {
    title: "Configurar Vela Integrated Amplifier",
    description: "Comparta el pairing con altavoces, el contexto de sala y el escenario de instalación.",
    submitLabel: "Solicitar consulta del sistema",
    successTitle: "Solicitud registrada",
    successMessage: "La solicitud quedó guardada para una consulta de sistema Montelar.",
  },
  "vision-max-premium": {
    title: "Configurar Vision MAX Premium",
    description: "Comparta los parámetros de la sala, asientos, acústica e integración dentro del formulario activo.",
    submitLabel: "Solicitar consulta de cine privado",
    successTitle: "Solicitud registrada",
    successMessage: "La solicitud Vision MAX Premium quedo guardada para el siguiente contacto.",
  },
  "vision-max-lux": {
    title: "Configurar Vision MAX LUX",
    description: "Comparta el contexto de la sala de cine insignia, las partes involucradas y las expectativas de servicio.",
    submitLabel: "Solicitar consulta insignia",
    successTitle: "Solicitud registrada",
    successMessage: "La solicitud Vision MAX LUX quedo guardada para el siguiente contacto.",
  },
  "living-glass-oled": {
    title: "Hablar sobre Living Glass OLED",
    description: "Comparta el contexto del acristalamiento, las condiciones de luz y el alcance de integración deseado.",
    submitLabel: "Solicitar visita de evaluación",
    successTitle: "Brief recibido",
    successMessage: "La solicitud Living Glass quedo guardada para una consulta Montelar.",
  },
  "hologram-vitrine": {
    title: "Hablar sobre Hologram Vitrine",
    description: "Comparta el contexto del objeto, del entorno y de la integracion.",
    submitLabel: "Solicitar consulta del escenario",
    successTitle: "Brief recibido",
    successMessage: "La solicitud Hologram Vitrine quedo guardada para una consulta Montelar.",
  },
  "pictorial-canvas": {
    title: "Hablar sobre Pictorial Canvas",
    description: "Comparta el contexto mural, la intención curatorial y el alcance de integración.",
    submitLabel: "Solicitar consulta art-display",
    successTitle: "Brief recibido",
    successMessage: "La solicitud Pictorial Canvas quedo guardada para una consulta Montelar.",
  },
  "exhibition-wall": {
    title: "Hablar sobre Exhibition Wall",
    description: "Comparta el contexto de uso público, contenido e integración.",
    submitLabel: "Solicitar consulta del sistema mural",
    successTitle: "Brief recibido",
    successMessage: "La solicitud Exhibition Wall quedo guardada para una consulta Montelar.",
  },
  "exhibition-table": {
    title: "Hablar sobre Exhibition Table",
    description: "Comparta la interacción a escala mobiliario, el uso del espacio y el contexto de contenido.",
    submitLabel: "Solicitar consulta del sistema de mesa",
    successTitle: "Brief recibido",
    successMessage: "La solicitud Exhibition Table quedo guardada para una consulta Montelar.",
  },
  "exhibition-rail": {
    title: "Hablar sobre Exhibition Rail",
    description: "Comparta la superficie integrada, la legibilidad y los requisitos de mantenimiento.",
    submitLabel: "Solicitar revisión del display integrado",
    successTitle: "Brief recibido",
    successMessage: "La solicitud Exhibition Rail quedo guardada para una consulta Montelar.",
  },
  "prima-materia-lux-speaker": {
    title: "Solicitar consulta sobre Prima Materia LUX Speaker",
    description: "Comparta el contexto del sistema, las longitudes esperadas y el interes por una audicion.",
    submitLabel: "Solicitar contacto de consultoría",
    successTitle: "Solicitud registrada",
    successMessage: "La solicitud quedo guardada para una consulta Montelar.",
  },
};

const frenchFormMetaByProductSlug: Record<
  string,
  { title: string; description: string; submitLabel: string; successTitle: string; successMessage: string }
> = {
  "monolith-reference": {
    title: "Demander une consultation Monolith Reference",
    description: "Partagez l'échelle de la pièce, le contexte système et le scénario d'installation.",
    submitLabel: "Demander une consultation privée",
    successTitle: "Demande enregistrée",
    successMessage: "La demande est enregistrée pour une consultation privée Montelar.",
  },
  "nexus-reference-hub": {
    title: "Parler de Nexus Reference Hub",
    description: "Partagez les objectifs du système source, les attentes de contrôle et le contexte d'intégration.",
    submitLabel: "Demander un contact de conseil",
    successTitle: "Demande enregistrée",
    successMessage: "La demande est enregistrée pour le prochain échange avec Montelar.",
  },
  "prism-reference-dac": {
    title: "Demander une consultation Prism Reference DAC",
    description: "Partagez les priorites de conversion, le contexte systeme et l'interet pour une ecoute.",
    submitLabel: "Demander une consultation technique",
    successTitle: "Demande enregistrée",
    successMessage: "La demande est enregistrée pour une consultation technique Montelar.",
  },
  "vela-integrated-amplifier": {
    title: "Configurer Vela Integrated Amplifier",
    description: "Partagez le scénario d'association avec les enceintes, le contexte de la pièce et l'installation.",
    submitLabel: "Demander une consultation système",
    successTitle: "Demande enregistrée",
    successMessage: "La demande est enregistrée pour une consultation système Montelar.",
  },
  "vision-max-premium": {
    title: "Configurer Vision MAX Premium",
    description: "Partagez les paramètres de la salle, des sièges, de l'acoustique et de l'intégration.",
    submitLabel: "Demander une consultation cinéma privé",
    successTitle: "Demande enregistrée",
    successMessage: "La demande Vision MAX Premium est enregistrée pour un échange privé Montelar.",
  },
  "vision-max-lux": {
    title: "Configurer Vision MAX LUX",
    description: "Partagez le contexte de la salle de cinéma phare, les parties prenantes et les attentes de service.",
    submitLabel: "Demander une consultation flagship",
    successTitle: "Demande enregistrée",
    successMessage: "La demande Vision MAX LUX est enregistrée pour une consultation flagship Montelar.",
  },
  "living-glass-oled": {
    title: "Parler de Living Glass OLED",
    description: "Partagez le contexte du vitrage, les conditions lumineuses et le périmètre d'intégration souhaité.",
    submitLabel: "Demander une visite d'évaluation",
    successTitle: "Brief reçu",
    successMessage: "La demande Living Glass est enregistrée pour une réponse ciblée de Montelar.",
  },
  "hologram-vitrine": {
    title: "Parler de Hologram Vitrine",
    description: "Partagez le contexte de l'objet, de l'environnement et de l'integration.",
    submitLabel: "Demander une consultation de scénario objet",
    successTitle: "Brief reçu",
    successMessage: "La demande Hologram Vitrine est enregistrée pour une consultation centrée sur l'objet.",
  },
  "pictorial-canvas": {
    title: "Parler de Pictorial Canvas",
    description: "Partagez le contexte mural, l'intention curatoriale et le périmètre d'intégration.",
    submitLabel: "Demander une consultation art-display",
    successTitle: "Brief reçu",
    successMessage: "La demande Pictorial Canvas est enregistrée pour une consultation curatoriale Montelar.",
  },
  "exhibition-wall": {
    title: "Parler de Exhibition Wall",
    description: "Partagez le contexte d'usage public, le contenu et l'intégration.",
    submitLabel: "Demander une consultation murale",
    successTitle: "Brief reçu",
    successMessage: "La demande Exhibition Wall est enregistrée pour une consultation projet.",
  },
  "exhibition-table": {
    title: "Parler de Exhibition Table",
    description: "Partagez l'interaction à l'échelle du mobilier, l'usage de l'espace et le contexte de contenu.",
    submitLabel: "Demander une consultation table",
    successTitle: "Brief reçu",
    successMessage: "La demande Exhibition Table est enregistrée pour une consultation projet.",
  },
  "exhibition-rail": {
    title: "Parler de Exhibition Rail",
    description: "Partagez la surface intégrée, la lisibilité et le contexte de maintenance.",
    submitLabel: "Demander une revue d'affichage intégré",
    successTitle: "Brief reçu",
    successMessage: "La demande Exhibition Rail est enregistrée pour une consultation projet.",
  },
  "prima-materia-lux-speaker": {
    title: "Demander une consultation Prima Materia LUX Speaker",
    description: "Partagez le contexte systeme, les longueurs attendues et l'interet pour une ecoute.",
    submitLabel: "Demander un contact de conseil",
    successTitle: "Demande enregistrée",
    successMessage: "La demande est enregistrée pour une consultation Montelar.",
  },
};

const chineseFormMetaByProductSlug: Record<
  string,
  { title: string; description: string; submitLabel: string; successTitle: string; successMessage: string }
> = {
  "monolith-reference": {
    title: "申请 Monolith Reference 专属咨询",
    description: "请在当前表单中提交房间尺度、系统背景与安装场景。",
    submitLabel: "申请专属咨询",
    successTitle: "请求已记录",
    successMessage: "请求已保存，Montelar 将根据房间和系统背景继续咨询。",
  },
  "nexus-reference-hub": {
    title: "讨论 Nexus Reference Hub",
    description: "请提交音源系统目标、控制预期与整合背景。",
    submitLabel: "申请顾问联系",
    successTitle: "请求已记录",
    successMessage: "请求已保存，Montelar 将继续下一步顾问沟通。",
  },
  "prism-reference-dac": {
    title: "申请 Prism Reference DAC 咨询",
    description: "请提交转换链路重点、系统背景与试听意向。",
    submitLabel: "申请技术咨询",
    successTitle: "请求已记录",
    successMessage: "请求已保存，用于 Montelar 技术咨询。",
  },
  "vela-integrated-amplifier": {
    title: "配置 Vela Integrated Amplifier",
    description: "请提交扬声器配对、房间背景与安装条件。",
    submitLabel: "申请系统咨询",
    successTitle: "请求已记录",
    successMessage: "请求已保存，用于 Montelar 系统咨询。",
  },
  "vision-max-premium": {
    title: "配置 Vision MAX Premium",
    description: "请在当前表单中提交空间参数、座位、声学条件与整合要求。",
    submitLabel: "申请私人影院咨询",
    successTitle: "请求已记录",
    successMessage: "Vision MAX Premium 请求已保存，Montelar 将结合房间、座席与私密性继续沟通。",
  },
  "vision-max-lux": {
    title: "配置 Vision MAX LUX",
    description: "请提交旗舰影院区背景、相关干系人与生命周期服务要求。",
    submitLabel: "申请旗舰咨询",
    successTitle: "请求已记录",
    successMessage: "Vision MAX LUX 请求已保存，用于 Montelar 旗舰咨询。",
  },
  "living-glass-oled": {
    title: "讨论 Living Glass OLED",
    description: "请提交玻璃场景、光照条件与整合范围。",
    submitLabel: "申请现场评估",
    successTitle: "简报已接收",
    successMessage: "Living Glass 请求已保存，Montelar 将针对玻璃场景回复。",
  },
  "hologram-vitrine": {
    title: "讨论 Hologram Vitrine",
    description: "请提交对象背景、环境条件与整合要求。",
    submitLabel: "申请场景咨询",
    successTitle: "简报已接收",
    successMessage: "Hologram Vitrine 请求已保存，用于对象展示场景咨询。",
  },
  "pictorial-canvas": {
    title: "讨论 Pictorial Canvas",
    description: "请提交墙面背景、策展意图与整合范围。",
    submitLabel: "申请艺术显示咨询",
    successTitle: "简报已接收",
    successMessage: "Pictorial Canvas 请求已保存，用于 Montelar 策展咨询。",
  },
  "exhibition-wall": {
    title: "讨论 Exhibition Wall",
    description: "请提交公共使用、内容与整合背景。",
    submitLabel: "申请墙面系统咨询",
    successTitle: "简报已接收",
    successMessage: "Exhibition Wall 请求已保存，用于项目咨询。",
  },
  "exhibition-table": {
    title: "讨论 Exhibition Table",
    description: "请提交家具尺度互动、空间用途与内容背景。",
    submitLabel: "申请桌面系统咨询",
    successTitle: "简报已接收",
    successMessage: "Exhibition Table 请求已保存，用于项目咨询。",
  },
  "exhibition-rail": {
    title: "讨论 Exhibition Rail",
    description: "请提交嵌入式界面、可读性与维护背景。",
    submitLabel: "申请嵌入式显示评估",
    successTitle: "简报已接收",
    successMessage: "Exhibition Rail 请求已保存，用于项目咨询。",
  },
  "prima-materia-lux-speaker": {
    title: "申请 Prima Materia LUX Speaker 咨询",
    description: "请提交系统背景、预期线长与试听意向。",
    submitLabel: "申请顾问联系",
    successTitle: "请求已记录",
    successMessage: "请求已保存，用于 Montelar 系统与线材咨询。",
  },
};

const japaneseFormMetaByProductSlug: Record<
  string,
  { title: string; description: string; submitLabel: string; successTitle: string; successMessage: string }
> = {
  "monolith-reference": {
    title: "Monolith Reference の相談を依頼する",
    description: "現行フォーム上で部屋のスケール、システム背景、設置意図を共有してください。",
    submitLabel: "個別相談を依頼する",
    successTitle: "リクエストを受け付けました",
    successMessage: "リクエストを保存しました。Montelar が空間とシステムの文脈を踏まえて次の相談へ進みます。",
  },
  "nexus-reference-hub": {
    title: "Nexus Reference Hub について相談する",
    description: "ソースシステムの目的、操作要件、統合背景を共有してください。",
    submitLabel: "アドバイザー連絡を依頼する",
    successTitle: "リクエストを受け付けました",
    successMessage: "リクエストを保存しました。Montelar の次の相談ステップへ進めます。",
  },
  "prism-reference-dac": {
    title: "Prism Reference DAC の相談を依頼する",
    description: "変換系の優先事項、システム背景、試聴意向を共有してください。",
    submitLabel: "技術相談を依頼する",
    successTitle: "リクエストを受け付けました",
    successMessage: "リクエストを保存しました。Montelar の技術相談へ引き継ぎます。",
  },
  "vela-integrated-amplifier": {
    title: "Vela Integrated Amplifier を構成する",
    description: "スピーカーとの組み合わせ、部屋の背景、設置条件を共有してください。",
    submitLabel: "システム相談を依頼する",
    successTitle: "リクエストを受け付けました",
    successMessage: "リクエストを保存しました。Montelar のシステム相談へ引き継ぎます。",
  },
  "vision-max-premium": {
    title: "Vision MAX Premium を構成する",
    description: "現行フォーム上で空間条件、座席、音響、統合要件を共有してください。",
    submitLabel: "プライベートシネマ相談を依頼する",
    successTitle: "リクエストを受け付けました",
    successMessage: "Vision MAX Premium のブリーフを受け付けました。空間、座席、プライバシーを踏まえて次の相談へ進みます。",
  },
  "vision-max-lux": {
    title: "Vision MAX LUX を構成する",
    description: "旗艦シネマ空間の背景、関係者、ライフサイクルサービス要件を共有してください。",
    submitLabel: "旗艦相談を依頼する",
    successTitle: "リクエストを受け付けました",
    successMessage: "Vision MAX LUX のブリーフを受け付けました。",
  },
  "living-glass-oled": {
    title: "Living Glass OLED について相談する",
    description: "ガラス面の条件、採光、統合範囲を共有してください。",
    submitLabel: "現地評価を依頼する",
    successTitle: "ブリーフを受領しました",
    successMessage: "Living Glass のリクエストを保存しました。Montelar がガラス面の条件を確認します。",
  },
  "hologram-vitrine": {
    title: "Hologram Vitrine について相談する",
    description: "対象物、環境、統合条件を共有してください。",
    submitLabel: "シナリオ相談を依頼する",
    successTitle: "ブリーフを受領しました",
    successMessage: "Hologram Vitrine のリクエストを保存しました。オブジェクト展示の相談へ進めます。",
  },
  "pictorial-canvas": {
    title: "Pictorial Canvas について相談する",
    description: "壁面背景、キュレーション意図、統合範囲を共有してください。",
    submitLabel: "アートディスプレイ相談を依頼する",
    successTitle: "ブリーフを受領しました",
    successMessage: "Pictorial Canvas のリクエストを保存しました。アートと空間の相談へ進めます。",
  },
  "exhibition-wall": {
    title: "Exhibition Wall について相談する",
    description: "公共利用、コンテンツ、統合背景を共有してください。",
    submitLabel: "壁面システム相談を依頼する",
    successTitle: "ブリーフを受領しました",
    successMessage: "Exhibition Wall のリクエストを保存しました。プロジェクト相談へ進めます。",
  },
  "exhibition-table": {
    title: "Exhibition Table について相談する",
    description: "家具スケールの対話、空間利用、コンテンツ背景を共有してください。",
    submitLabel: "テーブルシステム相談を依頼する",
    successTitle: "ブリーフを受領しました",
    successMessage: "Exhibition Table のリクエストを保存しました。プロジェクト相談へ進めます。",
  },
  "exhibition-rail": {
    title: "Exhibition Rail について相談する",
    description: "組み込み面、可読性、保守条件を共有してください。",
    submitLabel: "組み込みディスプレイ評価を依頼する",
    successTitle: "ブリーフを受領しました",
    successMessage: "Exhibition Rail のリクエストを保存しました。プロジェクト相談へ進めます。",
  },
  "prima-materia-lux-speaker": {
    title: "Prima Materia LUX Speaker の相談を依頼する",
    description: "システム背景、想定ケーブル長、試聴意向を共有してください。",
    submitLabel: "アドバイザー連絡を依頼する",
    successTitle: "リクエストを受け付けました",
    successMessage: "リクエストを保存しました。Montelar のシステムとケーブル相談へ引き継ぎます。",
  },
};

const germanFormMetaByProductSlug: Record<
  string,
  { title: string; description: string; submitLabel: string; successTitle: string; successMessage: string }
> = {
  "monolith-reference": {
    title: "Beratung zu Monolith Reference anfragen",
    description: "Teilen Sie Raumgröße, Systemkontext und Installationsszenario direkt im aktiven Formular.",
    submitLabel: "Private Beratung anfragen",
    successTitle: "Anfrage erfasst",
    successMessage: "Die Anfrage ist gespeichert; Montelar kann den nächsten Beratungsschritt vorbereiten.",
  },
  "nexus-reference-hub": {
    title: "Nexus Reference Hub besprechen",
    description: "Teilen Sie Ziele des Quellsystems, Steuerungserwartungen und Integrationskontext.",
    submitLabel: "Beraterkontakt anfragen",
    successTitle: "Anfrage erfasst",
    successMessage: "Die Anfrage ist gespeichert; Montelar bereitet den nächsten Beratungsschritt vor.",
  },
  "prism-reference-dac": {
    title: "Beratung zu Prism Reference DAC anfragen",
    description: "Teilen Sie Prioritäten der Wandlungskette, Systemkontext und Interesse an einer Hörsitzung.",
    submitLabel: "Technische Beratung anfragen",
    successTitle: "Anfrage erfasst",
    successMessage: "Die Anfrage ist für eine technische Montelar Beratung gespeichert.",
  },
  "vela-integrated-amplifier": {
    title: "Vela Integrated Amplifier konfigurieren",
    description: "Teilen Sie Lautsprecher-Pairing, Raumkontext und Installationsbedingungen.",
    submitLabel: "Systemberatung anfragen",
    successTitle: "Anfrage erfasst",
    successMessage: "Die Anfrage ist für eine Montelar Systemberatung gespeichert.",
  },
  "vision-max-premium": {
    title: "Vision MAX Premium konfigurieren",
    description: "Teilen Sie Raumparameter, Sitzplanung, Akustik und Integration direkt im aktuellen Formular.",
    submitLabel: "Beratung zum privaten Kino anfragen",
    successTitle: "Anfrage erfasst",
    successMessage: "Die Vision MAX Premium Anfrage ist gespeichert; Montelar kann Raum, Sitzplanung und Privatsphäre prüfen.",
  },
  "vision-max-lux": {
    title: "Vision MAX LUX konfigurieren",
    description: "Teilen Sie Kontext der Flaggschiff-Kinozone, Stakeholder und Lifecycle-Service vor dem vollständigen Routing.",
    submitLabel: "Flaggschiff-Beratung anfragen",
    successTitle: "Anfrage erfasst",
    successMessage: "Der Beratungsvertrag für Vision MAX LUX ist für die nächste Live-Routing-Phase vorbereitet.",
  },
  "living-glass-oled": {
    title: "Living Glass OLED besprechen",
    description: "Teilen Sie Verglasungskontext, Lichtbedingungen und Integrationsumfang.",
    submitLabel: "Vor-Ort-Bewertung anfragen",
    successTitle: "Brief erhalten",
    successMessage: "Der Living Glass Brief ist gespeichert; Montelar kann die Glassituation prüfen.",
  },
  "hologram-vitrine": {
    title: "Hologram Vitrine besprechen",
    description: "Teilen Sie Objekt, Umgebung und Integrationskontext für die räumliche Präsentation.",
    submitLabel: "Szenarioberatung anfragen",
    successTitle: "Brief erhalten",
    successMessage: "Der Hologram Vitrine Brief ist für die objektbezogene Beratung gespeichert.",
  },
  "pictorial-canvas": {
    title: "Pictorial Canvas besprechen",
    description: "Teilen Sie Wandkontext, kuratorische Absicht und Integrationsumfang vor dem finalen Renderer.",
    submitLabel: "Art-Display-Beratung anfragen",
    successTitle: "Brief erhalten",
    successMessage: "Der Pictorial Canvas Brief ist für die Kunst- und Raumabstimmung gespeichert.",
  },
  "exhibition-wall": {
    title: "Exhibition Wall besprechen",
    description: "Teilen Sie Nutzungskontext, Content-Bedarf und Integrationsrahmen.",
    submitLabel: "Beratung zur Wandsystem-Lösung anfragen",
    successTitle: "Brief erhalten",
    successMessage: "Der Exhibition Wall Brief ist für die Projektberatung gespeichert.",
  },
  "exhibition-table": {
    title: "Exhibition Table besprechen",
    description: "Teilen Sie Interaktion im Möbelmaßstab, Raumnutzung und Content-Kontext.",
    submitLabel: "Beratung zum Tischsystem anfragen",
    successTitle: "Brief erhalten",
    successMessage: "Der Exhibition Table Brief ist für die Projektberatung gespeichert.",
  },
  "exhibition-rail": {
    title: "Exhibition Rail besprechen",
    description: "Teilen Sie integrierte Oberfläche, Lesbarkeit und Wartungskontext.",
    submitLabel: "Bewertung des integrierten Displays anfragen",
    successTitle: "Brief erhalten",
    successMessage: "Der Exhibition Rail Brief ist für die Projektberatung gespeichert.",
  },
  "prima-materia-lux-speaker": {
    title: "Beratung zu Prima Materia LUX Speaker anfragen",
    description: "Teilen Sie Systemkontext, gewünschte Kabellängen und Interesse an einer Hörsitzung.",
    submitLabel: "Beraterkontakt anfragen",
    successTitle: "Anfrage erfasst",
    successMessage: "Die Anfrage ist für eine Montelar System- und Kabelberatung gespeichert.",
  },
};

function getDirectionCopy(locale: SiteLocale) {
  if (isRussianLocale(locale)) {
    return russianDirectionCopy;
  }

  if (isSpanishLocale(locale)) {
    return spanishDirectionCopy;
  }

  if (isFrenchLocale(locale)) {
    return frenchDirectionCopy;
  }

  if (isChineseLocale(locale)) {
    return chineseDirectionCopy;
  }

  if (isJapaneseLocale(locale)) {
    return japaneseDirectionCopy;
  }

  if (isGermanLocale(locale)) {
    return germanDirectionCopy;
  }

  return null;
}

function getCategoryCopy(locale: SiteLocale) {
  if (isRussianLocale(locale)) {
    return russianCategoryCopy;
  }

  if (isSpanishLocale(locale)) {
    return spanishCategoryCopy;
  }

  if (isFrenchLocale(locale)) {
    return frenchCategoryCopy;
  }

  if (isChineseLocale(locale)) {
    return chineseCategoryCopy;
  }

  if (isJapaneseLocale(locale)) {
    return japaneseCategoryCopy;
  }

  if (isGermanLocale(locale)) {
    return germanCategoryCopy;
  }

  return null;
}

function getPageCopy(locale: SiteLocale) {
  if (isRussianLocale(locale)) {
    return russianPageCopy;
  }

  if (isSpanishLocale(locale)) {
    return spanishPageCopy;
  }

  if (isFrenchLocale(locale)) {
    return frenchPageCopy;
  }

  if (isChineseLocale(locale)) {
    return chinesePageCopy;
  }

  if (isJapaneseLocale(locale)) {
    return japanesePageCopy;
  }

  if (isGermanLocale(locale)) {
    return germanPageCopy;
  }

  return null;
}

function getProductDescriptionCopy(locale: SiteLocale) {
  if (isRussianLocale(locale)) {
    return russianProductDescriptions;
  }

  if (isSpanishLocale(locale)) {
    return spanishProductDescriptions;
  }

  if (isFrenchLocale(locale)) {
    return frenchProductDescriptions;
  }

  if (isChineseLocale(locale)) {
    return chineseProductDescriptions;
  }

  if (isJapaneseLocale(locale)) {
    return japaneseProductDescriptions;
  }

  if (isGermanLocale(locale)) {
    return germanProductDescriptions;
  }

  return null;
}

function getFormMetaCopy(locale: SiteLocale) {
  if (isRussianLocale(locale)) {
    return russianFormMetaByProductSlug;
  }

  if (isSpanishLocale(locale)) {
    return spanishFormMetaByProductSlug;
  }

  if (isFrenchLocale(locale)) {
    return frenchFormMetaByProductSlug;
  }

  if (isChineseLocale(locale)) {
    return chineseFormMetaByProductSlug;
  }

  if (isJapaneseLocale(locale)) {
    return japaneseFormMetaByProductSlug;
  }

  if (isGermanLocale(locale)) {
    return germanFormMetaByProductSlug;
  }

  return null;
}

function contactFields() {
  return [
    field("fullName", "Full name", "text", {
      required: true,
      width: "half",
      placeholder: "Name and surname",
    }),
    field("email", "Email", "email", {
      required: true,
      width: "half",
      placeholder: "name@company.com",
    }),
  ];
}

function consentField() {
  return field("consent", "I agree to the privacy review and advisory follow-up.", "consent", {
    required: true,
    helperText: "Montelar uses this request only to continue the advisory conversation.",
  });
}

function preferredLanguageField() {
  return field("preferredLanguage", "Preferred language", "select", {
    required: true,
    width: "half",
    options: [
      option("en", "English"),
      option("ru", "Russian"),
      option("es", "Spanish"),
      option("fr", "French"),
      option("zh", "Chinese"),
      option("ja", "Japanese"),
      option("de", "German"),
    ],
  });
}

function locationFields() {
  return [
    field("country", "Country", "text", {
      required: true,
      width: "half",
      placeholder: "Country / region",
    }),
    field("city", "City", "text", {
      required: true,
      width: "half",
      placeholder: "City",
    }),
    preferredLanguageField(),
  ];
}

function phoneField(required = false) {
  return field("phone", "Phone", "phone", {
    required,
    width: "half",
    placeholder: "+31 6 1234 5678",
  });
}

function budgetBandField() {
  return field("budgetBand", "Budget band", "select", {
    width: "half",
    options: [
      option("under-25k", "Under 25k"),
      option("25k-50k", "25k-50k"),
      option("50k-100k", "50k-100k"),
      option("100k-plus", "100k+"),
      option("undecided", "Undecided"),
    ],
  });
}

function attachmentPlaceholderField(
  label = "Reference attachments",
  fieldKey = "attachments",
) {
  return field(fieldKey, label, "file-placeholder", {
    helperText: "Attachments can be shared with the advisor after the first consultation.",
  });
}

function dealerPreferenceField() {
  return field("dealerPreference", "Dealer / showroom preference", "select", {
    width: "half",
    options: [
      option("direct-montelar", "Direct Montelar advisory"),
      option("local-dealer", "Local dealer / showroom"),
      option("architect-partner", "Architect / design partner"),
      option("undecided", "Undecided"),
    ],
  });
}

function audioIdentityFields() {
  return [...contactFields(), phoneField(), ...locationFields()];
}

function cinemaIdentityFields() {
  return [
    ...contactFields(),
    field("companyOrOffice", "Company / family office", "text", {
      width: "half",
      placeholder: "Optional company, family office or hospitality brand",
    }),
    phoneField(true),
    field("preferredContactMethod", "Preferred contact method", "radio", {
      required: true,
      width: "half",
      options: [
        option("email", "Email"),
        option("phone", "Phone"),
        option("whatsapp", "WhatsApp"),
        option("signal", "Signal"),
      ],
    }),
    ...locationFields(),
  ];
}

function projectStageField() {
  return field("projectStage", "Current project stage", "select", {
    required: true,
    width: "half",
    options: [
      option("concept", "Concept / early brief"),
      option("design", "Design development"),
      option("technical-coordination", "Technical coordination"),
      option("construction", "Construction / fit-out"),
      option("existing-room", "Existing room upgrade"),
    ],
  });
}

function projectTimelineField() {
  return field("timeline", "Project timeline", "select", {
    required: true,
    width: "half",
    options: [
      option("active-design", "Active design phase"),
      option("3-months", "Within 3 months"),
      option("6-12-months", "Within 6-12 months"),
      option("next-year", "Next year"),
      option("research", "Research stage"),
    ],
  });
}

function cinemaCoordinationFields() {
  return [
    field("newBuildOrRetrofit", "Project context", "radio", {
      required: true,
      width: "half",
      options: [
        option("new-build", "New build"),
        option("retrofit", "Retrofit"),
        option("hybrid", "Partial renovation"),
      ],
    }),
    projectStageField(),
    projectTimelineField(),
    budgetBandField(),
    field("stakeholders", "Stakeholders already involved", "multi-select", {
      width: "full",
      options: [
        option("architect", "Architect"),
        option("interior-designer", "Interior designer"),
        option("integrator", "Integrator"),
        option("acoustic-consultant", "Acoustic consultant"),
        option("shipyard-operator", "Shipyard / hospitality operator"),
      ],
    }),
  ];
}

function cinemaRoomFields() {
  return [
    field("roomType", "Room type", "select", {
      required: true,
      width: "half",
      options: [
        option("dedicated-cinema", "Dedicated cinema"),
        option("media-room", "Media room"),
        option("lounge-cinema", "Lounge cinema"),
        option("collector-screening-room", "Collector screening room"),
        option("vip-screening-suite", "VIP screening suite"),
      ],
    }),
    field("roomDimensions", "Approximate room dimensions", "text", {
      required: true,
      width: "half",
      placeholder: "Length x width or project floor area",
    }),
    field("ceilingHeight", "Ceiling height", "text", {
      width: "half",
      placeholder: "Approximate finished ceiling height",
    }),
    field("seatCount", "Seats / rows expectation", "text", {
      width: "half",
      placeholder: "Seats, rows or lounge arrangement",
    }),
    field("equipmentRoomAvailability", "Equipment-room availability", "radio", {
      required: true,
      width: "half",
      options: [
        option("dedicated-room", "Dedicated equipment room"),
        option("rack-zone", "Rack zone inside the space"),
        option("undecided", "Undecided"),
      ],
    }),
    attachmentPlaceholderField("Room plans or drawings", "planUploadPlaceholder"),
    attachmentPlaceholderField("Room or equipment photos", "photoUploadPlaceholder"),
  ];
}

function cinemaExperienceFields() {
  return [
    field("displayPreference", "Display path preference", "select", {
      required: true,
      width: "half",
      options: [
        option("projection-first", "Projection-first"),
        option("direct-view", "Concealed direct-view"),
        option("led-evaluation", "Engineered LED evaluation"),
        option("format-agnostic", "Format-agnostic"),
      ],
    }),
    field("audioAmbition", "Audio ambition", "select", {
      required: true,
      width: "half",
      options: [
        option("premium-immersive", "Premium immersive"),
        option("reference-immersive", "Reference immersive"),
        option("balanced-family", "Balanced family experience"),
        option("needs-guidance", "Needs guidance"),
      ],
    }),
    field("primaryUseCases", "Primary scenarios", "multi-select", {
      required: true,
      width: "full",
      options: [
        option("cinema", "Cinema"),
        option("family-viewing", "Family viewing"),
        option("sports", "Sports"),
        option("gaming", "Gaming"),
        option("concert-content", "Concert content"),
        option("private-screenings", "Private screenings"),
      ],
    }),
    field("supportLevel", "Desired support level", "select", {
      width: "half",
      options: [
        option("consultation-only", "Consultation and concept"),
        option("design-delivery", "Design and delivery coordination"),
        option("full-lifecycle", "Lifecycle support"),
      ],
    }),
    field("siteVisitInterest", "Site-visit interest", "radio", {
      width: "half",
      options: [
        option("yes", "Yes"),
        option("after-feasibility", "After feasibility review"),
        option("not-yet", "Not yet"),
      ],
    }),
    field("privacyRequest", "Privacy / NDA request", "checkbox", {
      width: "half",
      helperText: "Use this when the project requires an NDA or elevated privacy handling.",
    }),
    dealerPreferenceField(),
    field("projectBrief", "Project brief", "textarea", {
      width: "full",
      placeholder: "Share room goals, concealment priorities, architectural context and any known constraints.",
    }),
  ];
}

function livingGlassIdentityFields() {
  return [
    ...contactFields(),
    field("companyOrStudio", "Company / studio / family office", "text", {
      width: "half",
      placeholder: "Optional company, design studio or family office",
    }),
    phoneField(true),
    field("preferredContactMethod", "Preferred contact method", "radio", {
      required: true,
      width: "half",
      options: [
        option("email", "Email"),
        option("phone", "Phone"),
        option("whatsapp", "WhatsApp"),
        option("signal", "Signal"),
      ],
    }),
    ...locationFields(),
  ];
}

function livingGlassProjectFields() {
  return [
    field("projectType", "Project type", "select", {
      required: true,
      width: "half",
      options: [
        option("residential", "Residential"),
        option("retail", "Retail / showroom"),
        option("hospitality", "Hospitality"),
        option("gallery", "Gallery / exhibition"),
        option("brand-space", "Brand space"),
      ],
    }),
    field("projectPath", "Project context", "radio", {
      required: true,
      width: "half",
      options: [
        option("new-build", "New build"),
        option("retrofit", "Retrofit"),
        option("fit-out", "Interior fit-out"),
      ],
    }),
    projectStageField(),
    projectTimelineField(),
  ];
}

function livingGlassSurfaceFields() {
  return [
    field("surfaceType", "Surface type", "select", {
      required: true,
      width: "half",
      options: [
        option("divider", "Divider / partition"),
        option("showcase", "Showcase / vitrine"),
        option("console", "Console / furniture integration"),
        option("feature-wall", "Feature wall"),
        option("window-glazing", "Window / glazing surface"),
        option("other", "Other"),
      ],
    }),
    field("approximateDimensions", "Approximate dimensions", "text", {
      required: true,
      width: "half",
      placeholder: "Width x height or overall opening size",
    }),
    field("mountingContext", "Mounting / furniture context", "textarea", {
      width: "full",
      placeholder: "Share cabinetry, framing, glazing, divider or vitrine context.",
    }),
    field("daylightLevel", "Daylight level", "select", {
      required: true,
      width: "half",
      options: [
        option("controlled-low", "Controlled / low daylight"),
        option("balanced-interior", "Balanced interior daylight"),
        option("bright-interior", "Bright interior"),
        option("window-adjacent", "Directly adjacent to glazing"),
      ],
    }),
    field("directSunExposure", "Direct sun exposure", "radio", {
      required: true,
      width: "half",
      options: [
        option("no", "No"),
        option("limited", "Limited / partial"),
        option("yes", "Yes"),
        option("unknown", "Unknown"),
      ],
    }),
    attachmentPlaceholderField("Site photos", "sitePhotoUploadPlaceholder"),
    attachmentPlaceholderField("Plan or section drawings", "planUploadPlaceholder"),
  ];
}

function livingGlassExperienceFields() {
  return [
    field("primaryUseCase", "Primary use case", "multi-select", {
      required: true,
      width: "full",
      options: [
        option("art-layer", "Art / ambient layer"),
        option("product-storytelling", "Product storytelling"),
        option("information-layer", "Information / wayfinding"),
        option("media-accent", "Media accent"),
        option("collector-display", "Collector / object display"),
      ],
    }),
    field("transparencyPriority", "Transparency priority", "select", {
      required: true,
      width: "half",
      options: [
        option("glass-first", "Glass-first / subtle media"),
        option("balanced", "Balanced transparency and media"),
        option("media-first", "Media visibility first"),
        option("needs-guidance", "Needs guidance"),
      ],
    }),
    field("interactivityNeed", "Interactivity need", "radio", {
      required: true,
      width: "half",
      options: [
        option("none", "No interaction"),
        option("touch-layer", "Touch / guided visitor layer"),
        option("custom-control", "Custom control layer"),
        option("undecided", "Undecided"),
      ],
    }),
    field("integrationNeeds", "Integration needs", "multi-select", {
      width: "full",
      options: [
        option("audio", "Audio integration"),
        option("lighting-scenes", "Lighting scenes"),
        option("smart-home", "Smart-home / control"),
        option("privacy", "Privacy / NDA handling"),
        option("content-management", "Content management"),
      ],
    }),
    field("stakeholders", "Stakeholders already involved", "multi-select", {
      width: "full",
      options: [
        option("architect", "Architect"),
        option("interior-designer", "Interior designer"),
        option("integrator", "Integrator"),
        option("fabricator", "Glass / millwork fabricator"),
        option("brand-team", "Brand / exhibition team"),
      ],
    }),
    budgetBandField(),
    dealerPreferenceField(),
    field("siteSurveyInterest", "Site-survey interest", "radio", {
      width: "half",
      options: [
        option("yes", "Yes"),
        option("after-initial-review", "After initial review"),
        option("not-yet", "Not yet"),
      ],
    }),
    field("projectBrief", "Project brief", "textarea", {
      width: "full",
      placeholder: "Share the glass zone, desired effect, content role, power/network constraints and any known design limits.",
    }),
  ];
}

function hologramIdentityFields() {
  return [
    ...contactFields(),
    field("companyOrBrand", "Company / brand / family office", "text", {
      width: "half",
      placeholder: "Optional company, luxury brand or family office",
    }),
    phoneField(true),
    field("preferredContactMethod", "Preferred contact method", "radio", {
      required: true,
      width: "half",
      options: [
        option("email", "Email"),
        option("phone", "Phone"),
        option("whatsapp", "WhatsApp"),
        option("signal", "Signal"),
      ],
    }),
    ...locationFields(),
  ];
}

function hologramProjectFields() {
  return [
    field("projectType", "Project type", "select", {
      required: true,
      width: "half",
      options: [
        option("private-collection", "Private collection"),
        option("retail-showcase", "Retail showcase"),
        option("gallery-museum", "Gallery / museum"),
        option("showroom-hospitality", "Showroom / hospitality"),
        option("launch-event", "Launch / event"),
      ],
    }),
    field("projectPath", "Project context", "radio", {
      required: true,
      width: "half",
      options: [
        option("new-build", "New build"),
        option("retrofit", "Retrofit"),
        option("event-installation", "Event installation"),
      ],
    }),
    field("venueType", "Venue type", "select", {
      required: true,
      width: "half",
      options: [
        option("boutique", "Boutique / retail"),
        option("private-residence", "Private residence"),
        option("gallery", "Gallery"),
        option("museum", "Museum"),
        option("showroom", "Showroom"),
        option("hospitality", "Hospitality"),
        option("event-space", "Event space"),
      ],
    }),
    projectStageField(),
    projectTimelineField(),
  ];
}

function hologramObjectFields() {
  return [
    field("objectType", "Object type", "select", {
      required: true,
      width: "half",
      options: [
        option("watch-jewelry", "Watch / jewelry"),
        option("sculpture-art", "Sculpture / art object"),
        option("speaker-design-object", "Speaker / design object"),
        option("product-launch-item", "Product launch item"),
        option("museum-artefact", "Museum artefact"),
        option("other", "Other"),
      ],
    }),
    field("objectDimensions", "Object dimensions", "text", {
      required: true,
      width: "half",
      placeholder: "Approximate object size",
    }),
    field("displayFootprint", "Vitrine / display footprint", "text", {
      required: true,
      width: "half",
      placeholder: "Cabinet footprint or allocated display zone",
    }),
    field("viewingDistance", "Viewing distance", "text", {
      width: "half",
      placeholder: "Typical guest or viewer distance",
    }),
    field("ambientLightLevel", "Ambient light level", "select", {
      required: true,
      width: "half",
      options: [
        option("controlled-low", "Controlled / low light"),
        option("balanced-interior", "Balanced interior"),
        option("bright-retail", "Bright retail / showroom"),
        option("event-lighting", "Event lighting"),
      ],
    }),
    field("glareConcern", "Reflection or glare concern", "radio", {
      required: true,
      width: "half",
      options: [
        option("low", "Low"),
        option("moderate", "Moderate"),
        option("high", "High"),
        option("unknown", "Unknown"),
      ],
    }),
    attachmentPlaceholderField("Location photos", "sitePhotoUploadPlaceholder"),
    attachmentPlaceholderField("Plan or display sketch", "planUploadPlaceholder"),
  ];
}

function hologramExperienceFields() {
  return [
    field("technologyInterest", "Technology interest", "select", {
      required: true,
      width: "half",
      options: [
        option("hologram-vitrine", "Hologram Vitrine"),
        option("hologram-light-field", "Hologram Light Field"),
        option("help-me-choose", "Help me choose"),
      ],
    }),
    field("primaryUseCase", "Primary use case", "multi-select", {
      required: true,
      width: "full",
      options: [
        option("object-storytelling", "Object storytelling"),
        option("launch-reveal", "Launch reveal"),
        option("collection-interpretation", "Collection interpretation"),
        option("retail-follow-up", "Retail visitor follow-up"),
        option("immersive-showcase", "Immersive showcase"),
      ],
    }),
    field("interactionNeed", "Interaction need", "radio", {
      required: true,
      width: "half",
      options: [
        option("none", "No interaction"),
        option("guided-trigger", "Guided trigger / reveal"),
        option("rfid-sensor", "RFID / sensor cue"),
        option("touch-guidance", "Touch / guided visitor flow"),
        option("undecided", "Undecided"),
      ],
    }),
    field("contentMode", "Presentation behavior", "radio", {
      required: true,
      width: "half",
      options: [
        option("prerecorded", "Prerecorded sequence"),
        option("live-triggered", "Live-triggered sequence"),
        option("mixed", "Mixed"),
        option("needs-guidance", "Needs guidance"),
      ],
    }),
    field("audioIntegrationNeed", "Audio integration need", "radio", {
      width: "half",
      options: [
        option("none", "No audio"),
        option("ambient-layer", "Ambient layer"),
        option("narration-voiceover", "Narration / voiceover"),
        option("full-sync", "Full synchronized audio"),
      ],
    }),
    field("priorityBalance", "Transparency vs content intensity", "select", {
      required: true,
      width: "half",
      options: [
        option("object-first", "Object-first / subtle light layer"),
        option("balanced", "Balanced object and content"),
        option("content-first", "Content intensity first"),
        option("needs-guidance", "Needs guidance"),
      ],
    }),
    field("networkSecurityConstraints", "Network or privacy constraints", "textarea", {
      width: "full",
      placeholder: "Share any security rules, closed-network needs, VIP/privacy limits or control constraints.",
    }),
    field("stakeholders", "Stakeholders already involved", "multi-select", {
      width: "full",
      options: [
        option("architect", "Architect"),
        option("creative-agency", "Creative agency"),
        option("integrator", "Integrator"),
        option("event-team", "Event team"),
        option("museum-curator", "Museum / curator"),
        option("retail-brand-team", "Retail / brand team"),
      ],
    }),
    budgetBandField(),
    dealerPreferenceField(),
    field("privacyRequest", "Privacy / NDA request", "checkbox", {
      width: "half",
      helperText: "Use this when the project should stay under NDA or elevated privacy handling.",
    }),
    field("projectBrief", "Project brief", "textarea", {
      width: "full",
      placeholder: "Share the object, space, story arc, content expectations, lighting constraints and service goals.",
    }),
  ];
}

function pictorialIdentityFields() {
  return [
    ...contactFields(),
    field("companyOrStudio", "Company / studio / family office", "text", {
      width: "half",
      placeholder: "Optional company, design studio or family office",
    }),
    phoneField(true),
    field("preferredContactMethod", "Preferred contact method", "radio", {
      required: true,
      width: "half",
      options: [
        option("email", "Email"),
        option("phone", "Phone"),
        option("whatsapp", "WhatsApp"),
        option("signal", "Signal"),
      ],
    }),
    ...locationFields(),
  ];
}

function pictorialProjectFields() {
  return [
    field("projectType", "Project type", "select", {
      required: true,
      width: "half",
      options: [
        option("private-residence", "Private residence"),
        option("hospitality-suite", "Hospitality suite"),
        option("gallery-room", "Gallery room"),
        option("design-office", "Design-led office"),
        option("collector-project", "Collector project"),
      ],
    }),
    field("projectPath", "Project context", "radio", {
      required: true,
      width: "half",
      options: [
        option("new-build", "New build"),
        option("retrofit", "Retrofit"),
        option("fit-out", "Interior fit-out"),
      ],
    }),
    field("displayCount", "Number of displays", "select", {
      required: true,
      width: "half",
      options: [
        option("single", "Single display"),
        option("two-three", "Two to three"),
        option("four-plus", "Four or more"),
        option("undecided", "Undecided"),
      ],
    }),
    field("roomType", "Room type", "select", {
      required: true,
      width: "half",
      options: [
        option("living-room", "Living room"),
        option("study-library", "Study / library"),
        option("suite-bedroom", "Suite / bedroom"),
        option("gallery-salon", "Gallery / salon"),
        option("office-hospitality", "Office / hospitality"),
      ],
    }),
    projectStageField(),
    projectTimelineField(),
  ];
}

function pictorialWallFields() {
  return [
    field("preferredOrientation", "Preferred orientation", "radio", {
      required: true,
      width: "half",
      options: [
        option("landscape", "Landscape"),
        option("portrait", "Portrait"),
        option("square", "Square"),
        option("undecided", "Undecided"),
      ],
    }),
    field("approximateSizes", "Approximate sizes", "text", {
      required: true,
      width: "half",
      placeholder: "Display or wall opening dimensions",
    }),
    field("wallType", "Wall type", "select", {
      required: true,
      width: "half",
      options: [
        option("solid-wall", "Solid wall"),
        option("millwork-panel", "Millwork / paneling"),
        option("stone-surface", "Stone / specialty finish"),
        option("partition", "Partition / lightweight wall"),
        option("undecided", "Undecided"),
      ],
    }),
    field("ambientLightLevel", "Ambient light level", "select", {
      required: true,
      width: "half",
      options: [
        option("controlled-low", "Controlled / low light"),
        option("balanced-interior", "Balanced interior"),
        option("bright-daylight", "Bright daylight"),
        option("gallery-lighting", "Gallery / accent lighting"),
      ],
    }),
    field("directSunExposure", "Direct sun exposure", "radio", {
      required: true,
      width: "half",
      options: [
        option("no", "No"),
        option("limited", "Limited / partial"),
        option("yes", "Yes"),
        option("unknown", "Unknown"),
      ],
    }),
    field("mountingContext", "Wall, frame or concealment context", "textarea", {
      width: "full",
      placeholder: "Share wall finish, recess, frame depth expectations, cable path and service-access constraints.",
    }),
    attachmentPlaceholderField("Interior photos", "interiorPhotoUploadPlaceholder"),
    attachmentPlaceholderField("Plan or wall elevation", "planUploadPlaceholder"),
  ];
}

function pictorialCurationFields() {
  return [
    field("contentIntent", "Content intent", "multi-select", {
      required: true,
      width: "full",
      options: [
        option("classic-art", "Classic art"),
        option("contemporary-art", "Contemporary art"),
        option("photography", "Photography"),
        option("subtle-motion", "Subtle motion art"),
        option("private-collection", "Private collection"),
        option("commissioned-work", "Commissioned work"),
      ],
    }),
    field("rightsContext", "Rights context", "select", {
      required: true,
      width: "half",
      options: [
        option("private-display", "Private display"),
        option("hospitality-display", "Hospitality display"),
        option("commercial-display", "Commercial display"),
        option("public-display", "Public display"),
        option("needs-guidance", "Needs guidance"),
      ],
    }),
    field("finishPreference", "Finish preference", "select", {
      width: "half",
      options: [
        option("blackened-metal", "Blackened metal"),
        option("dark-walnut", "Dark walnut / brown timber"),
        option("light-beige-frame", "Light beige / stone-toned frame"),
        option("custom-match", "Custom interior match"),
        option("undecided", "Undecided"),
      ],
    }),
    field("schedulingNeed", "Scheduling or playlist need", "radio", {
      width: "half",
      options: [
        option("none", "No"),
        option("simple-schedules", "Simple schedules"),
        option("multi-scene-playlists", "Multi-scene playlists"),
        option("needs-guidance", "Needs guidance"),
      ],
    }),
    field("offlineRequirement", "Offline requirement", "radio", {
      width: "half",
      options: [
        option("required", "Required"),
        option("preferred", "Preferred"),
        option("not-needed", "Not needed"),
        option("unknown", "Unknown"),
      ],
    }),
    field("controlScope", "Control context", "multi-select", {
      width: "full",
      options: [
        option("single-room", "Single room"),
        option("multi-room", "Multi-room"),
        option("lighting-scenes", "Lighting scenes"),
        option("fleet-management", "Fleet / multi-location"),
        option("concierge-operation", "Concierge / staff operation"),
      ],
    }),
    field("stakeholders", "Stakeholders already involved", "multi-select", {
      width: "full",
      options: [
        option("architect", "Architect"),
        option("interior-designer", "Interior designer"),
        option("integrator", "Integrator"),
        option("art-advisor", "Art advisor / curator"),
        option("hospitality-operator", "Hospitality operator"),
      ],
    }),
    budgetBandField(),
    dealerPreferenceField(),
    field("privacyRequest", "Privacy / NDA request", "checkbox", {
      width: "half",
      helperText: "Use this when the project should stay under NDA or elevated privacy handling.",
    }),
    field("projectBrief", "Project brief", "textarea", {
      width: "full",
      placeholder: "Share the room mood, preferred art behavior, rights constraints, wall finish context and any known design limits.",
    }),
  ];
}

function exhibitionIdentityFields() {
  return [
    ...contactFields(),
    field("organization", "Organization / institution / brand", "text", {
      width: "half",
      placeholder: "Museum, gallery, brand, hospitality group or design studio",
    }),
    phoneField(true),
    field("preferredContactMethod", "Preferred contact method", "radio", {
      required: true,
      width: "half",
      options: [
        option("email", "Email"),
        option("phone", "Phone"),
        option("whatsapp", "WhatsApp"),
        option("signal", "Signal"),
      ],
    }),
    ...locationFields(),
  ];
}

function exhibitionProjectFields() {
  return [
    field("venueType", "Venue type", "select", {
      required: true,
      width: "half",
      options: [
        option("museum", "Museum"),
        option("gallery", "Gallery"),
        option("luxury-showroom", "Luxury showroom"),
        option("hospitality", "Hospitality"),
        option("experience-center", "Experience center"),
        option("lobby-public", "Lobby / public knowledge surface"),
        option("collector-space", "Collector / private public-facing space"),
      ],
    }),
    field("projectPath", "Project context", "radio", {
      required: true,
      width: "half",
      options: [
        option("new-build", "New build"),
        option("retrofit", "Retrofit"),
        option("fit-out", "Interior fit-out"),
        option("traveling-program", "Traveling / temporary program"),
      ],
    }),
    field("openingDate", "Opening date", "date", {
      width: "half",
    }),
    projectStageField(),
    projectTimelineField(),
  ];
}

function exhibitionPublicUseFields() {
  return [
    field("unitCount", "Unit count", "select", {
      required: true,
      width: "half",
      options: [
        option("one", "One"),
        option("two-three", "Two to three"),
        option("four-plus", "Four or more"),
        option("phased-rollout", "Phased rollout"),
      ],
    }),
    field("audienceVolume", "Audience volume", "select", {
      required: true,
      width: "half",
      options: [
        option("guided-small", "Guided / low-volume"),
        option("steady-public", "Steady public traffic"),
        option("high-footfall", "High footfall"),
        option("event-peaks", "Event-driven peaks"),
      ],
    }),
    field("languageCount", "Language count", "select", {
      required: true,
      width: "half",
      options: [
        option("single", "Single language"),
        option("two-three", "Two to three"),
        option("four-plus", "Four or more"),
        option("needs-guidance", "Needs guidance"),
      ],
    }),
    field("accessibilityPriorities", "Accessibility priorities", "multi-select", {
      width: "full",
      options: [
        option("wheelchair-reach", "Wheelchair reach / approach"),
        option("high-contrast", "High-contrast readability"),
        option("large-type", "Large type / legibility"),
        option("audio-support", "Audio / narration support"),
        option("multi-user-flow", "Multi-user public flow"),
      ],
    }),
    field("securityCleaningConstraints", "Security and cleaning constraints", "textarea", {
      width: "full",
      placeholder: "Share public-use, cleaning, security, vandal-resistance or staff-operations constraints.",
    }),
    attachmentPlaceholderField("Site photos", "sitePhotoUploadPlaceholder"),
    attachmentPlaceholderField("Drawings or plans", "planUploadPlaceholder"),
  ];
}

function exhibitionExperienceFields() {
  return [
    field("contentIntent", "Content intent", "multi-select", {
      required: true,
      width: "full",
      options: [
        option("collection-interpretation", "Collection interpretation"),
        option("brand-storytelling", "Brand storytelling"),
        option("wayfinding", "Wayfinding / guidance"),
        option("product-catalog", "Product catalog / browse"),
        option("visitor-follow-up", "Visitor follow-up"),
        option("event-mode", "Event / seasonal mode"),
      ],
    }),
    field("offlineRequirement", "Offline requirement", "radio", {
      required: true,
      width: "half",
      options: [
        option("required", "Required"),
        option("preferred", "Preferred"),
        option("not-needed", "Not needed"),
        option("unknown", "Unknown"),
      ],
    }),
    field("analyticsNeed", "Analytics need", "radio", {
      required: true,
      width: "half",
      options: [
        option("none", "No analytics"),
        option("basic", "Basic usage analytics"),
        option("advanced", "Advanced reporting"),
        option("needs-guidance", "Needs guidance"),
      ],
    }),
    field("integrationNeeds", "Integration needs", "multi-select", {
      width: "full",
      options: [
        option("site-control", "Site and content control"),
        option("visitor-follow-up", "Visitor follow-up"),
        option("ticketing-wayfinding", "Ticketing / wayfinding"),
        option("asset-management", "Media / asset management"),
        option("closed-network", "Closed-network / security review"),
      ],
    }),
    field("stakeholders", "Stakeholders already involved", "multi-select", {
      width: "full",
      options: [
        option("architect", "Architect"),
        option("exhibition-designer", "Exhibition designer"),
        option("integrator", "Integrator"),
        option("museum-curator", "Museum / curator"),
        option("brand-team", "Brand / marketing team"),
        option("operations-team", "Operations / facilities"),
      ],
    }),
    budgetBandField(),
    field("privacyRequest", "Privacy / NDA request", "checkbox", {
      width: "half",
      helperText: "Use this when the project should stay under NDA or elevated privacy handling.",
    }),
    field("projectBrief", "Project brief", "textarea", {
      width: "full",
      placeholder: "Share exhibit goals, user journey, content density, service expectations and any known integration limits.",
    }),
  ];
}

export function createMockDirections(locale: SiteLocale): CmsProductDirection[] {
  const directions: CmsProductDirection[] = [
    {
      id: "dir-vision-max",
      slug: "vision-max",
      name: "Vision MAX",
      shortDescription: "Turnkey private cinema architecture: screen, projection, loudspeakers, electronics, seating, light and calibration shaped as one room.",
      routePath: "/vision-max",
      order: 10,
      status: "published",
      seo: seo("Vision MAX | Montelar", "Turnkey private cinema architecture with screen, projection, loudspeakers, electronics, seating, light and calibration shaped as one room.", "/vision-max", locale),
    },
    {
      id: "dir-hi-end-audio",
      slug: "hi-end-audio",
      name: "Hi-end Audio",
      shortDescription: "Loudspeakers, source components, amplification and cable systems treated as one listening-room discipline.",
      routePath: "/audio",
      order: 20,
      status: "published",
      seo: seo("Hi-end Audio | Montelar", "Montelar hi-end audio: loudspeakers, source components, amplification and cable systems treated as one listening-room discipline.", "/audio", locale),
    },
    {
      id: "dir-living-glass",
      slug: "living-glass",
      name: "Living Glass",
      shortDescription: "Transparent media surfaces that stay part of glass, furniture or partitions before they read as a screen.",
      routePath: "/invisible-display",
      order: 30,
      status: "published",
      seo: seo("Living Glass | Montelar", "Transparent media surfaces for residential, gallery and branded interiors where glass and display behavior are designed together.", "/invisible-display", locale),
    },
    {
      id: "dir-hologram",
      slug: "hologram",
      name: "Hologram",
      shortDescription: "Physical vitrines and spatial light presentations for objects, collections, launches and luxury retail.",
      routePath: "/hologram",
      order: 40,
      status: "published",
      seo: seo("Hologram | Montelar", "Montelar hologram vitrines and spatial presentations for objects, collections, launches and luxury retail.", "/hologram", locale),
    },
    {
      id: "dir-pictorial-art-display",
      slug: "pictorial-art-display",
      name: "Pictorial Art Display",
      shortDescription: "Framed digital art objects where image, wall finish, rights and room light are specified together.",
      routePath: "/pictorial-art-display",
      order: 50,
      status: "published",
      seo: seo("Pictorial Art Display | Montelar", "Framed digital art objects for private interiors, galleries and curated media-art spaces.", "/pictorial-art-display", locale),
    },
    {
      id: "dir-display-for-exhibition",
      slug: "display-for-exhibition",
      name: "Exhibition Displays",
      shortDescription: "Embedded touch walls, tables and information rails for exhibitions, museums, showrooms and hospitality.",
      routePath: "/exhibition-displays",
      order: 60,
      status: "published",
      seo: seo("Exhibition Displays | Montelar", "Embedded touch walls, tables and information rails for premium exhibitions, museums, showrooms and hospitality spaces.", "/exhibition-displays", locale),
    },
  ];

  const localizedCopy = getDirectionCopy(locale);

  if (!localizedCopy) {
    return directions;
  }

  return directions.map((direction) => {
    const localized = localizedCopy[direction.slug];

    if (!localized) {
      return direction;
    }

    return {
      ...direction,
      shortDescription: localized.shortDescription,
      seo: seo(localized.seoTitle, localized.seoDescription, direction.routePath, locale),
    };
  });
}

export function createMockCategories(locale: SiteLocale): CmsProductCategory[] {
  const categories: CmsProductCategory[] = [
    {
      id: "cat-speakers",
      slug: "speakers",
      directionSlug: "hi-end-audio",
      label: "Speakers",
      description: "Reference loudspeaker programs for listening rooms where scale and restraint matter together.",
      routePath: "/audio/speakers",
      order: 10,
      status: "published",
    },
    {
      id: "cat-streamers",
      slug: "streamers",
      directionSlug: "hi-end-audio",
      label: "Streamers",
      description: "Network source components for a precise and serviceable digital playback path.",
      routePath: "/audio/streamers",
      order: 20,
      status: "published",
    },
    {
      id: "cat-dac",
      slug: "dac",
      directionSlug: "hi-end-audio",
      label: "DAC",
      description: "Dedicated conversion stages for separated reference systems.",
      routePath: "/audio/dac",
      order: 30,
      status: "published",
    },
    {
      id: "cat-amplifiers",
      slug: "amplifiers",
      directionSlug: "hi-end-audio",
      label: "Amplifiers",
      description: "Integrated and separated amplification platforms.",
      routePath: "/audio/amplifiers",
      order: 40,
      status: "published",
    },
    {
      id: "cat-perfect-conductors",
      slug: "perfect-conductors",
      directionSlug: "hi-end-audio",
      label: "Perfect Conductors",
      description: "Cable systems and material programs for signal and power delivery.",
      routePath: "/audio/perfect-conductors",
      order: 50,
      status: "published",
    },
  ];

  const localizedCopy = getCategoryCopy(locale);

  if (!localizedCopy) {
    return categories;
  }

  return categories.map((category) => {
    const localized = localizedCopy[category.slug];

    return localized
      ? {
          ...category,
          label: localized.label,
          description: localized.description,
        }
      : category;
  });
}

export function createMockPages(locale: SiteLocale): CmsPage[] {
  const pages: CmsPage[] = [
    {
      id: "page-brand",
      slug: "brand",
      title: "Brand",
      navigationLabel: "Brand",
      heroSummary: "Montelar quiet luxury: precision, form, material and calm presence in the room.",
      routePath: "/brand",
      pageFamily: "brand-editorial",
      showInHeader: true,
      showInFooter: true,
      navigationOrder: 70,
      status: "published",
      seo: seo("Brand | Montelar", "Montelar quiet luxury: precision, form, material and calm presence in the room.", "/brand", locale),
    },
    {
      id: "page-technology",
      slug: "technology",
      title: "Technology",
      heroSummary: "Signal, control, display and integration principles behind Montelar rooms.",
      routePath: "/technology",
      pageFamily: "technology-editorial",
      showInHeader: false,
      showInFooter: true,
      navigationOrder: 80,
      status: "published",
      seo: seo("Technology | Montelar", "Signal, control, display and integration principles behind Montelar rooms.", "/technology", locale),
    },
    {
      id: "page-craftsmanship",
      slug: "craftsmanship",
      title: "Craftsmanship",
      heroSummary: "Materials, finishing, installation tolerances and service discipline for systems built to last.",
      routePath: "/craftsmanship",
      pageFamily: "craftsmanship-editorial",
      showInHeader: false,
      showInFooter: true,
      navigationOrder: 90,
      status: "published",
      seo: seo("Craftsmanship | Montelar", "Materials, finishing, installation tolerances and service discipline for systems built to last.", "/craftsmanship", locale),
    },
    {
      id: "page-projects",
      slug: "projects",
      title: "Projects",
      navigationLabel: "Projects",
      heroSummary: "Residences, galleries, showrooms and private rooms where image, sound and light become one environment.",
      routePath: "/projects",
      pageFamily: "projects",
      showInHeader: true,
      showInFooter: true,
      navigationOrder: 100,
      status: "published",
      seo: seo("Projects | Montelar", "Residences, galleries, showrooms and private rooms where image, sound and light become one environment.", "/projects", locale),
    },
    {
      id: "page-journal",
      slug: "journal",
      title: "Journal",
      heroSummary: "Editorial notes on systems, materials, installations and the culture of quiet luxury.",
      routePath: "/journal",
      pageFamily: "journal-index",
      showInHeader: false,
      showInFooter: true,
      navigationOrder: 110,
      status: "published",
      seo: seo("Journal | Montelar", "Editorial notes on systems, materials, installations and the culture of quiet luxury.", "/journal", locale),
    },
    {
      id: "page-downloads",
      slug: "downloads",
      title: "Downloads",
      heroSummary: "Brochures, specifications and project documents for private review.",
      routePath: "/downloads",
      pageFamily: "downloads",
      showInHeader: false,
      showInFooter: true,
      navigationOrder: 120,
      status: "published",
      seo: seo("Downloads | Montelar", "Brochures, specifications and project documents for private review.", "/downloads", locale),
    },
    {
      id: "page-contact",
      slug: "contact",
      title: "Contact",
      navigationLabel: "Contact",
      heroSummary: "Direct contact for private consultation, regional partnership or project conversation.",
      routePath: "/contact",
      pageFamily: "contact",
      showInHeader: true,
      showInFooter: true,
      navigationOrder: 130,
      status: "published",
      seo: seo("Contact | Montelar", "Direct contact for private consultation, regional partnership or project conversation.", "/contact", locale),
    },
  ];

  const localizedCopy = getPageCopy(locale);

  if (!localizedCopy) {
    return pages;
  }

  return pages.map((page) => {
    const localized = localizedCopy[page.slug];

    return localized
      ? {
          ...page,
          title: localized.title,
          ...(localized.navigationLabel ?? page.navigationLabel
            ? {
                navigationLabel:
                  localized.navigationLabel ?? page.navigationLabel,
              }
            : {}),
          heroSummary: localized.heroSummary,
          seo: seo(localized.seoTitle, localized.seoDescription, page.routePath, locale),
        }
      : page;
  });
}

export function createMockProducts(locale: SiteLocale): CmsProduct[] {
  const products: CmsProduct[] = [
    {
      id: "prod-vision-max-premium",
      slug: "vision-max-premium",
      name: "Vision MAX Premium",
      shortDescription: "Private cinema system for a specific room: screen, projector path, loudspeakers, electronics, seating and control.",
      directionSlug: "vision-max",
      routePath: "/products/vision-max-premium",
      inquiryRoutePath: "/request/vision-max-premium",
      availabilityMode: "by-request",
      pdpSectionPlan: ["hero", "positioning", "room-fit", "system-highlights", "inquiry"],
      status: "published",
      seo: seo("Vision MAX Premium | Montelar", "Private cinema system for a specific room: screen, projector path, loudspeakers, electronics, seating and control.", "/products/vision-max-premium", locale),
    },
    {
      id: "prod-vision-max-lux",
      slug: "vision-max-lux",
      name: "Vision MAX LUX",
      shortDescription: "Flagship Vision MAX architecture for estates, private screening suites and VIP rooms with lifecycle service expectations.",
      directionSlug: "vision-max",
      routePath: "/products/vision-max-lux",
      inquiryRoutePath: "/request/vision-max-lux",
      availabilityMode: "by-request",
      pdpSectionPlan: ["hero", "space-archetypes", "engineering-depth", "lifecycle-service", "inquiry"],
      status: "published",
      seo: seo("Vision MAX LUX | Montelar", "Flagship Vision MAX architecture for estates, private screening suites and VIP rooms with lifecycle service expectations.", "/products/vision-max-lux", locale),
    },
    {
      id: "prod-living-glass-oled",
      slug: "living-glass-oled",
      name: "Living Glass OLED",
      shortDescription: "Transparent media surface for glass, partitions, vitrines or furniture where image and architecture must remain balanced.",
      directionSlug: "living-glass",
      routePath: "/products/living-glass-oled",
      inquiryRoutePath: "/request/living-glass-oled",
      availabilityMode: "by-request",
      pdpSectionPlan: ["hero", "architectural-integration", "content-mode", "use-cases", "inquiry"],
      status: "published",
      seo: seo("Living Glass OLED | Montelar", "Transparent media surface for glass, partitions, vitrines or furniture where image and architecture must remain balanced.", "/products/living-glass-oled", locale),
    },
    {
      id: "prod-pictorial-canvas",
      slug: "pictorial-canvas",
      name: "Pictorial Canvas",
      shortDescription: "Framed digital art object for wall integration, curated media rights and calm moving-image presence.",
      directionSlug: "pictorial-art-display",
      routePath: "/products/pictorial-canvas",
      inquiryRoutePath: "/request/pictorial-canvas",
      availabilityMode: "by-request",
      pdpSectionPlan: ["hero", "frame-language", "content-curation", "placement", "inquiry"],
      status: "published",
      seo: seo("Pictorial Canvas | Montelar", "Framed digital art object for wall integration, curated media rights and calm moving-image presence.", "/products/pictorial-canvas", locale),
    },
    {
      id: "prod-exhibition-wall",
      slug: "exhibition-wall",
      name: "Exhibition Wall",
      shortDescription: "Embedded touch wall for exhibitions, brand spaces and guided visitor journeys where content and maintenance matter.",
      directionSlug: "display-for-exhibition",
      routePath: "/products/exhibition-wall",
      inquiryRoutePath: "/request/exhibition-wall",
      availabilityMode: "by-request",
      pdpSectionPlan: ["hero", "touch-storytelling", "space-fit", "integration-notes", "inquiry"],
      status: "published",
      seo: seo("Exhibition Wall | Montelar", "Embedded touch wall for exhibitions, brand spaces and guided visitor journeys where content and maintenance matter.", "/products/exhibition-wall", locale),
    },
    {
      id: "prod-exhibition-table",
      slug: "exhibition-table",
      name: "Exhibition Table",
      shortDescription: "Furniture-grade multitouch table for galleries, salons and showrooms where interaction stays composed.",
      directionSlug: "display-for-exhibition",
      routePath: "/products/exhibition-table",
      inquiryRoutePath: "/request/exhibition-table",
      availabilityMode: "by-request",
      pdpSectionPlan: ["hero", "tabletop-storytelling", "furniture-fit", "service-notes", "inquiry"],
      status: "published",
      seo: seo("Exhibition Table | Montelar", "Furniture-grade multitouch table for galleries, salons and showrooms where interaction stays composed.", "/products/exhibition-table", locale),
    },
    {
      id: "prod-exhibition-rail",
      slug: "exhibition-rail",
      name: "Exhibition Rail",
      shortDescription: "Embedded information rail for vitrines, walls and exhibition paths with multilingual reading and service constraints.",
      directionSlug: "display-for-exhibition",
      routePath: "/products/exhibition-rail",
      inquiryRoutePath: "/request/exhibition-rail",
      availabilityMode: "by-request",
      pdpSectionPlan: ["hero", "embedded-interpretation", "placement-fit", "maintenance-notes", "inquiry"],
      status: "published",
      seo: seo("Exhibition Rail | Montelar", "Embedded information rail for vitrines, walls and exhibition paths with multilingual reading and service constraints.", "/products/exhibition-rail", locale),
    },
    {
      id: "prod-monolith-reference",
      slug: "monolith-reference",
      name: "Monolith Reference",
      shortDescription: "Reference loudspeaker for listening rooms where cabinet scale, driver geometry, placement and interior presence matter together.",
      directionSlug: "hi-end-audio",
      categorySlug: "speakers",
      routePath: "/products/monolith-reference",
      inquiryRoutePath: "/request/monolith-reference",
      availabilityMode: "by-request",
      pdpSectionPlan: ["hero", "acoustic-architecture", "room-fit", "finish-language", "inquiry"],
      status: "published",
      seo: seo("Monolith Reference | Montelar", "Reference loudspeaker for listening rooms where cabinet scale, driver geometry, placement and interior presence matter together.", "/products/monolith-reference", locale),
    },
    {
      id: "prod-nexus-reference-hub",
      slug: "nexus-reference-hub",
      name: "Nexus Reference Hub",
      shortDescription: "Reference network source and control component for digital playback that must stay precise, calm and serviceable.",
      directionSlug: "hi-end-audio",
      categorySlug: "streamers",
      routePath: "/products/nexus-reference-hub",
      inquiryRoutePath: "/request/nexus-reference-hub",
      availabilityMode: "by-request",
      pdpSectionPlan: ["hero", "source-architecture", "control-layer", "integration-notes", "inquiry"],
      status: "published",
      seo: seo("Nexus Reference Hub | Montelar", "Reference network source and control component for digital playback that must stay precise, calm and serviceable.", "/products/nexus-reference-hub", locale),
    },
    {
      id: "prod-prism-reference-dac",
      slug: "prism-reference-dac",
      name: "Prism Reference DAC",
      shortDescription: "Standalone DAC for separated reference systems and private demonstrations where conversion is treated as its own stage.",
      directionSlug: "hi-end-audio",
      categorySlug: "dac",
      routePath: "/products/prism-reference-dac",
      inquiryRoutePath: "/request/prism-reference-dac",
      availabilityMode: "by-request",
      pdpSectionPlan: ["hero", "conversion-core", "clock-power", "system-fit", "inquiry"],
      status: "published",
      seo: seo("Prism Reference DAC | Montelar", "Standalone DAC for separated reference systems and private demonstrations where conversion is treated as its own stage.", "/products/prism-reference-dac", locale),
    },
    {
      id: "prod-dac",
      slug: "dac",
      name: "Montelar Reference DAC",
      shortDescription: "Flagship multibit DAC where digital conversion is built as a full architecture of musical space \u2014 precise, stable and continuous.",
      directionSlug: "hi-end-audio",
      categorySlug: "dac",
      routePath: "/products/dac",
      inquiryRoutePath: "/request/dac",
      availabilityMode: "by-request",
      pdpSectionPlan: ["hero", "conversion-architecture", "analog-stage", "power", "clocking", "connections", "inquiry"],
      status: "published",
      seo: seo("Montelar Reference DAC | Montelar", "\u0424\u043b\u0430\u0433\u043c\u0430\u043d\u0441\u043a\u0438\u0439 \u043c\u0443\u043b\u044c\u0442\u0438\u0431\u0438\u0442-\u0426\u0410\u041f Montelar Reference DAC \u2014 579 990 \u20bd.", "/products/dac", locale),
    },
    {
      id: "prod-streamer-montelar-aurender",
      slug: "streamer-montelar-aurender",
      name: "Montelar Extremo Stream",
      shortDescription: "Референсный сетевой аудиостример Montelar Extremo Stream — изолированная цифровая платформа: OCXO clock, дисциплина питания, хранилище до 16 TB.",
      directionSlug: "hi-end-audio",
      categorySlug: "streamers",
      routePath: "/products/streamer-montelar-aurender",
      inquiryRoutePath: "/request/streamer-montelar-aurender",
      availabilityMode: "by-request",
      pdpSectionPlan: ["hero", "source-architecture", "clock-power", "control-layer", "integration-notes", "inquiry"],
      status: "published",
      seo: seo("Montelar Extremo Stream | Montelar", "Референсный сетевой стример Montelar Extremo Stream — от 699 990 ₽.", "/products/streamer-montelar-aurender", locale),
    },
    {
      id: "prod-streamer-ads-ex-roon",
      slug: "streamer-ads-ex-roon",
      name: "Extremo Source",
      shortDescription: "AUDIO DATA SCIENCE Extremo Source — сетевой источник ультимативного качества на базе Roon, AirPlay и UPnP/DLNA: гибридный процессор APU + NPU, питание на 13 фаз, хранилище до 24 TB.",
      directionSlug: "hi-end-audio",
      categorySlug: "streamers",
      routePath: "/products/streamer-ads-ex-roon",
      inquiryRoutePath: "/request/streamer-ads-ex-roon",
      availabilityMode: "by-request",
      pdpSectionPlan: ["hero", "compute-platform", "power-architecture", "clocking", "storage-outputs", "inquiry"],
      status: "published",
      seo: seo("Extremo Source | Montelar", "AUDIO DATA SCIENCE Extremo Source — сетевой источник на APU+NPU, OCXO, до 24 TB. От 1 299 000 ₽.", "/products/streamer-ads-ex-roon", locale),
    },
    {
      id: "prod-acoustics",
      slug: "acoustics",
      name: "Montelar Loudspeaker System",
      shortDescription: "Многополосная акустическая система Montelar — скорость, натуральность и широкий динамический диапазон: крупный АМТ-твитер, широкополосник 3 Lines+ и четыре низкочастотных драйвера на углеродном волокне.",
      directionSlug: "hi-end-audio",
      categorySlug: "speakers",
      routePath: "/products/acoustics",
      inquiryRoutePath: "/request/acoustics",
      availabilityMode: "by-request",
      pdpSectionPlan: ["hero", "driver-architecture", "phase-integrity", "crossover", "inquiry"],
      status: "published",
      seo: seo("Montelar Loudspeaker System | Montelar", "Многополосная акустическая система Montelar — АМТ-твитер, 3 Lines+, 4× углеволоконный НЧ, кроссовер Litz / Jensen / WBT. 790 990 ₽.", "/products/acoustics", locale),
    },
    {
      id: "prod-vela-integrated-amplifier",
      slug: "vela-integrated-amplifier",
      name: "Vela Integrated Amplifier",
      shortDescription: "Integrated amplifier for refined stereo systems where loudspeaker control, material presence and room placement are considered together.",
      directionSlug: "hi-end-audio",
      categorySlug: "amplifiers",
      routePath: "/products/vela-integrated-amplifier",
      inquiryRoutePath: "/request/vela-integrated-amplifier",
      availabilityMode: "by-request",
      pdpSectionPlan: ["hero", "amplification-platform", "system-pairing", "finish-language", "inquiry"],
      status: "published",
      seo: seo("Vela Integrated Amplifier | Montelar", "Integrated amplifier for refined stereo systems where loudspeaker control, material presence and room placement are considered together.", "/products/vela-integrated-amplifier", locale),
    },
    {
      id: "prod-prima-materia-lux-speaker",
      slug: "prima-materia-lux-speaker",
      name: "Prima Materia LUX Speaker",
      shortDescription: "Prima Materia speaker cable for reference systems, specified by length, connectors, cable path and listening context.",
      directionSlug: "hi-end-audio",
      categorySlug: "perfect-conductors",
      lineSlug: "prima-materia",
      routePath: "/products/prima-materia-lux-speaker",
      inquiryRoutePath: "/request/prima-materia-lux-speaker",
      availabilityMode: "by-request",
      pdpSectionPlan: ["hero", "material-story", "system-fit", "configuration-notes", "inquiry"],
      status: "published",
      seo: seo("Prima Materia LUX Speaker | Montelar", "Prima Materia speaker cable for reference systems, specified by length, connectors, cable path and listening context.", "/products/prima-materia-lux-speaker", locale),
    },
    {
      id: "prod-conductor-clock",
      slug: "conductor-clock",
      name: "Montelar Reference Digital BNC",
      shortDescription: "Цифровой коаксиальный кабель референсного класса BNC/RCA — длиннокристаллическая медь 99.999997%, серебряное покрытие, 7-проводниковая архитектура и тефлоновый диэлектрик DuPont для транспортов, ЦАП и внешних clock-генераторов.",
      directionSlug: "hi-end-audio",
      categorySlug: "perfect-conductors",
      routePath: "/products/conductor-clock",
      inquiryRoutePath: "/request/conductor-clock",
      availabilityMode: "by-request",
      pdpSectionPlan: ["hero", "material-story", "finish-language", "system-fit", "inquiry"],
      status: "published",
      seo: seo("Montelar Reference Digital BNC | Montelar", "Референсный цифровой коаксиальный кабель Montelar Reference Digital BNC/RCA — медь 99.999997%, серебро, тефлон DuPont. 129 990 ₽.", "/products/conductor-clock", locale),
    },
    {
      id: "prod-conductor-cables",
      slug: "conductor-cables",
      name: "Montelar Reference AC Architecture",
      shortDescription: "Силовые кабели референсного класса Montelar Power Collection — монокристаллические проводники XPOCC/OCC и чистое серебро, двойной тефлоновый диэлектрик и многослойное шуморассеивание. Три модели: Reference Grey, Extremo Power и флагман Solution AG11.",
      directionSlug: "hi-end-audio",
      categorySlug: "perfect-conductors",
      routePath: "/products/conductor-cables",
      inquiryRoutePath: "/request/conductor-cables",
      availabilityMode: "by-request",
      pdpSectionPlan: ["hero", "material-story", "finish-language", "system-fit", "inquiry"],
      status: "published",
      seo: seo("Montelar Reference AC Architecture | Montelar", "Силовые кабели Montelar Reference AC Architecture — монокристалл, чистое серебро, тефлон, многослойное шуморассеивание. Reference Grey / Extremo Power / Solution AG11. От 109 990 ₽.", "/products/conductor-cables", locale),
    },
    {
      id: "prod-conductor-processor",
      slug: "conductor-processor",
      name: "Montelar Audio Signal Processor",
      shortDescription: "Полностью аналоговый модуль тонкой настройки тракта Montelar Magic Science — включается в разрыв между компонентами по RCA или XLR. Без внешнего питания, gunmetal-корпус с карбоновыми вставками и золотым разъёмом. Стереокомплект из двух устройств для систем высокого класса.",
      directionSlug: "hi-end-audio",
      categorySlug: "perfect-conductors",
      routePath: "/products/conductor-processor",
      inquiryRoutePath: "/request/conductor-processor",
      availabilityMode: "by-request",
      pdpSectionPlan: ["hero", "material-story", "finish-language", "system-fit", "inquiry"],
      status: "published",
      seo: seo("Montelar Audio Signal Processor | Montelar", "Montelar Audio Signal Processor «Magic Science» — полностью аналоговый модуль тонкой настройки аналогового тракта (RCA/XLR), без внешнего питания. Стереокомплект из двух устройств. 169 990 ₽.", "/products/conductor-processor", locale),
    },
  ];

  const localizedCopy = getProductDescriptionCopy(locale);

  if (!localizedCopy) {
    return products;
  }

  return products.map((product) => {
    const shortDescription = localizedCopy[product.slug];

    return shortDescription
      ? {
          ...product,
          shortDescription,
          seo: seo(`${product.name} | Montelar`, shortDescription, product.routePath, locale),
        }
      : product;
  });
}

export function createMockInquiryForms(locale: SiteLocale): CmsProductInquiryForm[] {
  const notificationConfigByProductSlug: Record<
    string,
    { recipients: string[]; templateKey: string }
  > = {
    "vision-max-premium": {
      recipients: ["vision.concierge@montelar.internal", "owner.concierge@montelar.internal"],
      templateKey: "lead-vision-max",
    },
    "vision-max-lux": {
      recipients: ["vision.concierge@montelar.internal", "owner.concierge@montelar.internal"],
      templateKey: "lead-vision-max",
    },
    "living-glass-oled": {
      recipients: ["vision.concierge@montelar.internal"],
      templateKey: "lead-living-glass",
    },
    "hologram-vitrine": {
      recipients: ["creative.concierge@montelar.internal"],
      templateKey: "lead-hologram",
    },
    "pictorial-canvas": {
      recipients: ["creative.concierge@montelar.internal"],
      templateKey: "lead-pictorial-art",
    },
    "exhibition-wall": {
      recipients: ["projects.concierge@montelar.internal"],
      templateKey: "lead-exhibition",
    },
    "exhibition-table": {
      recipients: ["projects.concierge@montelar.internal"],
      templateKey: "lead-exhibition",
    },
    "exhibition-rail": {
      recipients: ["projects.concierge@montelar.internal"],
      templateKey: "lead-exhibition",
    },
  };

  const forms: Array<
    Omit<
      CmsProductInquiryForm,
      "submissionChannel" | "notificationEmails" | "notificationTemplateKey" | "consentProfile" | "consentText"
    >
  > = [
    {
      id: `form-monolith-reference-${locale}`,
      slug: `monolith-reference-${locale}`,
      productSlug: "monolith-reference",
      locale,
      formMode: "private-audition",
      title: "Request Monolith Reference consultation",
      description: "Share room scale, system context and installation intent for a private consultation.",
      submitLabel: "Request private consultation",
      successTitle: "Request captured",
      successMessage: "The request was saved for a focused Montelar consultation.",
      fields: [
        ...audioIdentityFields(),
        field("inquiryType", "Inquiry type", "select", {
          required: true,
          width: "half",
          options: [
            option("private-listening", "Private listening"),
            option("room-integration", "Room integration"),
            option("specification-request", "Specification request"),
            option("atelier-finish", "Atelier finish"),
          ],
        }),
        field("roomType", "Room type", "select", {
          required: true,
          width: "half",
          options: [
            option("dedicated-listening-room", "Dedicated listening room"),
            option("living-room", "Living room"),
            option("multi-use-salon", "Multi-use salon"),
          ],
        }),
        field("roomSize", "Approximate room size", "text", {
          required: true,
          width: "half",
          placeholder: "Room dimensions or listening area",
        }),
        field("currentSystem", "Current or planned system", "textarea", {
          required: true,
          width: "full",
          placeholder: "Amplifier, sources, speakers or the intended new system",
        }),
        field("listeningPriority", "Listening priority", "select", {
          required: true,
          width: "half",
          options: [
            option("music", "Music"),
            option("cinema", "Cinema"),
            option("mixed", "Mixed"),
            option("design-object", "Design object"),
            option("project-integration", "Project integration"),
          ],
        }),
        field("amplificationStatus", "Amplification status", "text", {
          width: "half",
          placeholder: "Current amplifier or planned matching direction",
        }),
        field("finishInterest", "Finish interest", "text", {
          width: "half",
          placeholder: "Wood, lacquer, metal detail or undecided",
        }),
        field("systemGoal", "System goal", "textarea", {
          required: true,
          width: "full",
          placeholder: "Reference listening, signature interior, upgrade path...",
        }),
        budgetBandField(),
        field("timeline", "Project timeline", "select", {
          width: "half",
          options: [
            option("0-3-months", "0-3 months"),
            option("3-6-months", "3-6 months"),
            option("planning-phase", "Planning phase"),
          ],
        }),
        dealerPreferenceField(),
        attachmentPlaceholderField("Room plans or photos", "roomAttachments"),
        consentField(),
      ],
      fieldKeys: [
        "fullName",
        "email",
        "phone",
        "country",
        "city",
        "preferredLanguage",
        "inquiryType",
        "roomType",
        "roomSize",
        "currentSystem",
        "listeningPriority",
        "amplificationStatus",
        "finishInterest",
        "systemGoal",
        "budgetBand",
        "timeline",
        "dealerPreference",
        "roomAttachments",
        "consent",
      ],
      status: "published",
    },
    {
      id: `form-nexus-reference-hub-${locale}`,
      slug: `nexus-reference-hub-${locale}`,
      productSlug: "nexus-reference-hub",
      locale,
      formMode: "product-inquiry",
      title: "Discuss Nexus Reference Hub",
      description: "Share source-system goals, control expectations and integration context.",
      submitLabel: "Request advisor contact",
      successTitle: "Inquiry captured",
      successMessage: "Montelar can continue the next advisory step with this context.",
      fields: [
        ...audioIdentityFields(),
        field("systemRole", "System role", "select", {
          required: true,
          width: "half",
          options: [
            option("primary-source", "Primary source"),
            option("multi-room-hub", "Multi-room hub"),
            option("showcase-system", "Showcase system"),
          ],
        }),
        field("sourceUse", "Source use", "textarea", {
          required: true,
          width: "half",
          placeholder: "Streaming services, local library, external transports...",
        }),
        field("outputUse", "Output use", "select", {
          width: "half",
          options: [
            option("direct-amplifier-feed", "Direct amplifier feed"),
            option("external-dac-feed", "External DAC feed"),
            option("processor-integration", "Processor / system integration"),
            option("undecided", "Undecided"),
          ],
        }),
        field("digitalSources", "Digital sources needed", "multi-select", {
          width: "half",
          options: [
            option("streaming-services", "Streaming services"),
            option("network-library", "Network library"),
            option("tv-media", "TV / media server"),
            option("transport", "CD / digital transport"),
            option("cinema-processor", "Cinema processor"),
          ],
        }),
        field("controlSystem", "Control or automation system", "text", {
          width: "half",
          placeholder: "Crestron, Control4, custom stack...",
        }),
        field("installationContext", "Installation context", "textarea", {
          width: "full",
          placeholder: "Reference room, private cinema, flagship residence or showcase project",
        }),
        field("timeline", "Project timeline", "select", {
          width: "half",
          options: [
            option("immediate", "Immediate sourcing"),
            option("quarter", "This quarter"),
            option("research", "Research stage"),
          ],
        }),
        dealerPreferenceField(),
        attachmentPlaceholderField(),
        consentField(),
      ],
      fieldKeys: [
        "fullName",
        "email",
        "phone",
        "country",
        "city",
        "preferredLanguage",
        "systemRole",
        "sourceUse",
        "outputUse",
        "digitalSources",
        "controlSystem",
        "installationContext",
        "timeline",
        "dealerPreference",
        "attachments",
        "consent",
      ],
      status: "published",
    },
    {
      id: `form-prism-reference-dac-${locale}`,
      slug: `prism-reference-dac-${locale}`,
      productSlug: "prism-reference-dac",
      locale,
      formMode: "private-demo",
      title: "Request Prism Reference DAC guidance",
      description: "Share conversion priorities, system context and audition intent.",
      submitLabel: "Request system consultation",
      successTitle: "Request captured",
      successMessage: "The product inquiry was saved for system consultation.",
      fields: [
        ...audioIdentityFields(),
        field("timezone", "Timezone", "text", {
          width: "half",
          placeholder: "CET, GST, JST...",
        }),
        field("clientType", "Client type", "select", {
          width: "half",
          options: [
            option("owner", "Owner"),
            option("dealer", "Dealer"),
            option("architect", "Architect"),
            option("integrator", "Integrator"),
            option("showroom", "Showroom"),
            option("other", "Other"),
          ],
        }),
        field("currentSource", "Current source / transport / server", "text", {
          required: true,
          width: "half",
          placeholder: "Streamer, transport, server or mixed stack",
        }),
        field("currentSystem", "Current DAC / preamp / amplifier / speakers", "textarea", {
          width: "full",
          placeholder: "Current conversion and connected system",
        }),
        field("systemRole", "Desired DAC role", "select", {
          required: true,
          width: "half",
          options: [
            option("reference-dac", "Reference DAC"),
            option("direct-to-amplifier", "Direct-to-amplifier DAC"),
            option("external-clock-system", "External-clock system"),
            option("mixed-cinema-stereo", "Mixed cinema / stereo path"),
            option("undecided", "Undecided"),
          ],
        }),
        field("outputMode", "Output mode", "radio", {
          width: "half",
          options: [
            option("fixed-output", "Fixed output"),
            option("variable-output", "Variable output"),
            option("preamp-integration", "Preamp integration"),
            option("undecided", "Undecided"),
          ],
        }),
        field("digitalInputs", "Digital inputs needed", "multi-select", {
          width: "half",
          options: [
            option("usb", "USB"),
            option("aes-ebu", "AES/EBU"),
            option("coaxial", "Coaxial"),
            option("optical", "Optical"),
            option("network-source", "Network source"),
          ],
        }),
        field("externalClockInterest", "External clock interest", "radio", {
          width: "half",
          options: [
            option("yes-current-clock", "Yes, current clock exists"),
            option("yes-open", "Yes, open to a clock path"),
            option("no", "No"),
            option("undecided", "Undecided"),
          ],
        }),
        field("placement", "Placement", "select", {
          width: "half",
          options: [
            option("rack", "Rack"),
            option("shelf", "Shelf"),
            option("console", "Console"),
            option("furniture", "Furniture integration"),
          ],
        }),
        field("serviceConstraints", "Heat, cable access and service constraints", "textarea", {
          width: "full",
          placeholder: "Ventilation, rear access, furniture depth or service limitations",
        }),
        field("timeline", "Audition timeline", "select", {
          width: "half",
          options: [
            option("this-month", "This month"),
            option("next-quarter", "Next quarter"),
            option("exploration", "Early exploration"),
          ],
        }),
        attachmentPlaceholderField(),
        consentField(),
      ],
      fieldKeys: [
        "fullName",
        "email",
        "phone",
        "country",
        "city",
        "preferredLanguage",
        "timezone",
        "clientType",
        "currentSource",
        "currentSystem",
        "systemRole",
        "outputMode",
        "digitalInputs",
        "externalClockInterest",
        "placement",
        "serviceConstraints",
        "timeline",
        "attachments",
        "consent",
      ],
      status: "published",
    },
    {
      id: `form-vela-integrated-amplifier-${locale}`,
      slug: `vela-integrated-amplifier-${locale}`,
      productSlug: "vela-integrated-amplifier",
      locale,
      formMode: "private-demo",
      title: "Configure Vela Integrated Amplifier",
      description: "Share speaker pairing, room context and installation intent.",
      submitLabel: "Request system consultation",
      successTitle: "Request captured",
      successMessage: "The amplifier request was saved for a system consultation.",
      fields: [
        ...audioIdentityFields(),
        field("productInterest", "Product interest", "select", {
          required: true,
          width: "half",
          options: [
            option("vela-integrated-amplifier", "Vela Integrated Amplifier"),
            option("vela-integrated-signature", "Vela Integrated Signature"),
            option("other-amplifier", "Other amplifier"),
            option("undecided", "Undecided"),
          ],
        }),
        field("roomType", "Room type", "select", {
          width: "half",
          options: [
            option("dedicated-room", "Dedicated room"),
            option("living-space", "Living space"),
            option("hybrid-space", "Hybrid entertaining space"),
          ],
        }),
        field("roomSize", "Room size", "text", {
          width: "half",
          placeholder: "Approximate dimensions",
        }),
        field("listeningDistance", "Listening distance", "text", {
          width: "half",
          placeholder: "Approximate seat-to-speaker distance",
        }),
        field("speakerPairing", "Current speakers or planned speaker upgrade", "text", {
          required: true,
          width: "half",
          placeholder: "Current or planned loudspeakers",
        }),
        field("sourceChain", "Current source / DAC / streamer / turntable", "textarea", {
          width: "full",
          placeholder: "Describe the current or intended source chain",
        }),
        field("desiredSimplification", "Desired simplification", "select", {
          width: "half",
          options: [
            option("fewer-boxes", "Fewer boxes"),
            option("better-speaker-control", "Better speaker control"),
            option("new-montelar-system", "New Montelar system"),
            option("upgrade-path", "Upgrade path"),
          ],
        }),
        field("inputNeeds", "Input needs", "multi-select", {
          width: "half",
          options: [
            option("analog", "Analog"),
            option("digital-module", "Digital module interest"),
            option("phono", "Phono interest"),
            option("balanced", "Balanced"),
            option("single-ended", "Single-ended"),
            option("subwoofer", "Subwoofer / pre-out"),
            option("automation", "Trigger / automation"),
          ],
        }),
        field("placement", "Placement", "select", {
          width: "half",
          options: [
            option("console", "Console"),
            option("shelf", "Shelf"),
            option("rack", "Rack"),
            option("visible-object", "Visible object"),
            option("concealed-installation", "Concealed installation"),
          ],
        }),
        field("finishInterest", "Finish or material direction", "text", {
          width: "half",
          placeholder: "Metal, wood, lacquer or undecided",
        }),
        budgetBandField(),
        field("timeline", "Project timeline", "select", {
          width: "half",
          options: [
            option("current-project", "Current project"),
            option("next-season", "Next season"),
            option("research", "Research stage"),
          ],
        }),
        dealerPreferenceField(),
        field("privateListeningInterest", "Private listening interest", "radio", {
          width: "half",
          options: [
            option("yes", "Yes"),
            option("later", "Later in the process"),
            option("not-needed", "Not needed"),
          ],
        }),
        attachmentPlaceholderField(),
        consentField(),
      ],
      fieldKeys: [
        "fullName",
        "email",
        "phone",
        "country",
        "city",
        "preferredLanguage",
        "productInterest",
        "roomType",
        "roomSize",
        "listeningDistance",
        "speakerPairing",
        "sourceChain",
        "desiredSimplification",
        "inputNeeds",
        "placement",
        "finishInterest",
        "budgetBand",
        "timeline",
        "dealerPreference",
        "privateListeningInterest",
        "attachments",
        "consent",
      ],
      status: "published",
    },
    {
      id: `form-vision-max-premium-${locale}`,
      slug: `vision-max-premium-${locale}`,
      productSlug: "vision-max-premium",
      locale,
      formMode: "project-consultation",
      title: "Configure Vision MAX Premium",
      description: "Capture room, seating, acoustic and integration context for the private cinema consultation.",
      submitLabel: "Request private cinema consultation",
      successTitle: "Request captured",
      successMessage: "The Vision MAX Premium brief was saved; an advisor can continue with room, seating and privacy context.",
      fields: [
        ...cinemaIdentityFields(),
        field("projectType", "Project type", "select", {
          required: true,
          width: "half",
          options: [
            option("private-cinema", "Private cinema"),
            option("media-room", "Media room"),
            option("estate-renovation", "Estate renovation"),
          ],
        }),
        field("residenceType", "Residence type", "select", {
          width: "half",
          options: [
            option("villa", "Villa"),
            option("apartment", "Apartment"),
            option("estate", "Estate residence"),
            option("lounge-upgrade", "Lounge / media-room upgrade"),
          ],
        }),
        ...cinemaCoordinationFields(),
        ...cinemaRoomFields(),
        ...cinemaExperienceFields(),
        field("aestheticPriorities", "Aesthetic or concealment priorities", "textarea", {
          width: "full",
          placeholder: "Materials, visibility limits, lounge feel, acoustic treatment or other aesthetic priorities.",
        }),
        field("annualTuningInterest", "Annual tuning interest", "radio", {
          width: "half",
          options: [
            option("included-now", "Discuss at project start"),
            option("later", "Consider later"),
            option("not-sure", "Not sure yet"),
          ],
        }),
        consentField(),
      ],
      fieldKeys: [
        "fullName",
        "email",
        "companyOrOffice",
        "phone",
        "preferredContactMethod",
        "country",
        "city",
        "preferredLanguage",
        "projectType",
        "residenceType",
        "newBuildOrRetrofit",
        "projectStage",
        "timeline",
        "budgetBand",
        "stakeholders",
        "roomType",
        "roomDimensions",
        "ceilingHeight",
        "seatCount",
        "equipmentRoomAvailability",
        "planUploadPlaceholder",
        "photoUploadPlaceholder",
        "displayPreference",
        "audioAmbition",
        "primaryUseCases",
        "supportLevel",
        "siteVisitInterest",
        "privacyRequest",
        "dealerPreference",
        "projectBrief",
        "aestheticPriorities",
        "annualTuningInterest",
        "consent",
      ],
      status: "published",
    },
    {
      id: `form-vision-max-lux-${locale}`,
      slug: `vision-max-lux-${locale}`,
      productSlug: "vision-max-lux",
      locale,
      formMode: "senior-project-consultation",
      title: "Configure Vision MAX LUX",
      description: "Share flagship cinema room, stakeholder and lifecycle-service context.",
      submitLabel: "Request senior consultation",
      successTitle: "Request captured",
      successMessage: "The Vision MAX LUX brief was saved for senior consultation.",
      fields: [
        ...cinemaIdentityFields(),
        field("projectType", "Project type", "select", {
          required: true,
          width: "half",
          options: [
            option("estate-cinema", "Estate cinema"),
            option("collector-room", "Collector screening room"),
            option("yacht-suite", "Yacht screening suite"),
            option("hospitality-vip", "Hospitality VIP room"),
            option("flagship-private-cinema", "Flagship private cinema"),
          ],
        }),
        field("executionRegion", "Project execution region", "text", {
          width: "half",
          placeholder: "Country or region of delivery",
        }),
        ...cinemaCoordinationFields(),
        ...cinemaRoomFields(),
        ...cinemaExperienceFields(),
        field("documentationDepth", "Documentation and lifecycle depth", "select", {
          required: true,
          width: "half",
          options: [
            option("concept-package", "Concept package"),
            option("engineering-coordination", "Engineering coordination"),
            option("full-lifecycle", "Full lifecycle support"),
            option("needs-guidance", "Needs guidance"),
          ],
        }),
        field("customConstraints", "Custom finishes or operational constraints", "textarea", {
          width: "full",
          placeholder: "Share hospitality, yacht, acoustic, privacy, service-access or bespoke-finish constraints.",
        }),
        field("seniorRoutingFlag", "Senior consultation required", "checkbox", {
          width: "half",
          helperText: "Keeps this flagship tier aligned with a higher-touch advisory profile.",
        }),
        consentField(),
      ],
      fieldKeys: [
        "fullName",
        "email",
        "companyOrOffice",
        "phone",
        "preferredContactMethod",
        "country",
        "city",
        "preferredLanguage",
        "projectType",
        "executionRegion",
        "newBuildOrRetrofit",
        "projectStage",
        "timeline",
        "budgetBand",
        "stakeholders",
        "roomType",
        "roomDimensions",
        "ceilingHeight",
        "seatCount",
        "equipmentRoomAvailability",
        "planUploadPlaceholder",
        "photoUploadPlaceholder",
        "displayPreference",
        "audioAmbition",
        "primaryUseCases",
        "supportLevel",
        "siteVisitInterest",
        "privacyRequest",
        "dealerPreference",
        "projectBrief",
        "documentationDepth",
        "customConstraints",
        "seniorRoutingFlag",
        "consent",
      ],
      status: "published",
    },
    {
      id: `form-living-glass-oled-${locale}`,
      slug: `living-glass-oled-${locale}`,
      productSlug: "living-glass-oled",
      locale,
      formMode: "product-inquiry",
      title: "Discuss Living Glass OLED",
      description: "Share architectural glazing context, light conditions and desired integration depth.",
      submitLabel: "Request a site survey",
      successTitle: "Consultation brief captured",
      successMessage: "The Living Glass brief was saved for a focused Montelar response.",
      fields: [
        ...livingGlassIdentityFields(),
        ...livingGlassProjectFields(),
        ...livingGlassSurfaceFields(),
        ...livingGlassExperienceFields(),
        field("privacyRequest", "Privacy / NDA request", "checkbox", {
          width: "half",
          helperText: "Use this when the project should stay under NDA or elevated privacy handling.",
        }),
        consentField(),
      ],
      fieldKeys: [
        "fullName",
        "email",
        "companyOrStudio",
        "phone",
        "preferredContactMethod",
        "country",
        "city",
        "preferredLanguage",
        "projectType",
        "projectPath",
        "projectStage",
        "timeline",
        "surfaceType",
        "approximateDimensions",
        "mountingContext",
        "daylightLevel",
        "directSunExposure",
        "sitePhotoUploadPlaceholder",
        "planUploadPlaceholder",
        "primaryUseCase",
        "transparencyPriority",
        "interactivityNeed",
        "integrationNeeds",
        "stakeholders",
        "budgetBand",
        "dealerPreference",
        "siteSurveyInterest",
        "projectBrief",
        "privacyRequest",
        "consent",
      ],
      status: "published",
    },
    {
      id: `form-hologram-vitrine-${locale}`,
      slug: `hologram-vitrine-${locale}`,
      productSlug: "hologram-vitrine",
      locale,
      formMode: "project-consultation",
      title: "Discuss Hologram Vitrine",
      description: "Share object, environment and integration context.",
      submitLabel: "Request object-storytelling consultation",
      successTitle: "Consultation brief captured",
      successMessage: "The Hologram Vitrine brief was saved for an object-scenario consultation.",
      fields: [
        ...hologramIdentityFields(),
        ...hologramProjectFields(),
        ...hologramObjectFields(),
        ...hologramExperienceFields(),
        consentField(),
      ],
      fieldKeys: [
        "fullName",
        "email",
        "companyOrBrand",
        "phone",
        "preferredContactMethod",
        "country",
        "city",
        "preferredLanguage",
        "projectType",
        "projectPath",
        "venueType",
        "projectStage",
        "timeline",
        "objectType",
        "objectDimensions",
        "displayFootprint",
        "viewingDistance",
        "ambientLightLevel",
        "glareConcern",
        "sitePhotoUploadPlaceholder",
        "planUploadPlaceholder",
        "technologyInterest",
        "primaryUseCase",
        "interactionNeed",
        "contentMode",
        "audioIntegrationNeed",
        "priorityBalance",
        "networkSecurityConstraints",
        "stakeholders",
        "budgetBand",
        "dealerPreference",
        "privacyRequest",
        "projectBrief",
        "consent",
      ],
      status: "published",
    },
    {
      id: `form-pictorial-canvas-${locale}`,
      slug: `pictorial-canvas-${locale}`,
      productSlug: "pictorial-canvas",
      locale,
      formMode: "project-consultation",
      title: "Discuss Pictorial Canvas",
      description: "Share wall context, curation intent and rights-aware integration depth.",
      submitLabel: "Request art-display consultation",
      successTitle: "Consultation brief captured",
      successMessage: "The Pictorial Canvas brief was saved for a curatorial Montelar consultation.",
      fields: [
        ...pictorialIdentityFields(),
        ...pictorialProjectFields(),
        ...pictorialWallFields(),
        ...pictorialCurationFields(),
        consentField(),
      ],
      fieldKeys: [
        "fullName",
        "email",
        "companyOrStudio",
        "phone",
        "preferredContactMethod",
        "country",
        "city",
        "preferredLanguage",
        "projectType",
        "projectPath",
        "displayCount",
        "roomType",
        "projectStage",
        "timeline",
        "preferredOrientation",
        "approximateSizes",
        "wallType",
        "ambientLightLevel",
        "directSunExposure",
        "mountingContext",
        "interiorPhotoUploadPlaceholder",
        "planUploadPlaceholder",
        "contentIntent",
        "rightsContext",
        "finishPreference",
        "schedulingNeed",
        "offlineRequirement",
        "controlScope",
        "stakeholders",
        "budgetBand",
        "dealerPreference",
        "privacyRequest",
        "projectBrief",
        "consent",
      ],
      status: "published",
    },
    {
      id: `form-exhibition-wall-${locale}`,
      slug: `exhibition-wall-${locale}`,
      productSlug: "exhibition-wall",
      locale,
      formMode: "senior-project-consultation",
      title: "Discuss Exhibition Wall",
      description: "Share wall-scale public-use, content and integration context.",
      submitLabel: "Request wall consultation",
      successTitle: "Consultation brief captured",
      successMessage: "The Exhibition Wall brief was saved for a project consultation.",
      fields: [
        ...exhibitionIdentityFields(),
        ...exhibitionProjectFields(),
        ...exhibitionPublicUseFields(),
        field("approximateWallSize", "Approximate wall size", "text", {
          required: true,
          width: "half",
          placeholder: "Width x height or allocated wall zone",
        }),
        field("viewingDistance", "Viewing distance", "text", {
          width: "half",
          placeholder: "Typical guest distance from the wall",
        }),
        field("ambientLightLevel", "Ambient light level", "select", {
          required: true,
          width: "half",
          options: [
            option("controlled-low", "Controlled / low light"),
            option("balanced-interior", "Balanced interior"),
            option("bright-public", "Bright public interior"),
            option("window-adjacent", "Adjacent to glazing / daylight"),
          ],
        }),
        field("mountingContext", "Wall structure and service context", "textarea", {
          width: "full",
          placeholder: "Share wall build-up, seams, recess, service access, ventilation and adjacent architecture.",
        }),
        ...exhibitionExperienceFields(),
        consentField(),
      ],
      fieldKeys: [
        "fullName",
        "email",
        "organization",
        "phone",
        "preferredContactMethod",
        "country",
        "city",
        "preferredLanguage",
        "venueType",
        "projectPath",
        "openingDate",
        "projectStage",
        "timeline",
        "unitCount",
        "audienceVolume",
        "languageCount",
        "accessibilityPriorities",
        "securityCleaningConstraints",
        "sitePhotoUploadPlaceholder",
        "planUploadPlaceholder",
        "approximateWallSize",
        "viewingDistance",
        "ambientLightLevel",
        "mountingContext",
        "contentIntent",
        "offlineRequirement",
        "analyticsNeed",
        "integrationNeeds",
        "stakeholders",
        "budgetBand",
        "privacyRequest",
        "projectBrief",
        "consent",
      ],
      status: "published",
    },
    {
      id: `form-exhibition-table-${locale}`,
      slug: `exhibition-table-${locale}`,
      productSlug: "exhibition-table",
      locale,
      formMode: "project-consultation",
      title: "Discuss Exhibition Table",
      description: "Share furniture-scale interaction, room use and content context.",
      submitLabel: "Request table consultation",
      successTitle: "Consultation brief captured",
      successMessage: "The Exhibition Table brief was saved for a project consultation.",
      fields: [
        ...exhibitionIdentityFields(),
        ...exhibitionProjectFields(),
        ...exhibitionPublicUseFields(),
        field("approximateFootprint", "Approximate footprint", "text", {
          required: true,
          width: "half",
          placeholder: "Length x width or allocated furniture zone",
        }),
        field("postureMode", "Standing or seated use", "radio", {
          required: true,
          width: "half",
          options: [
            option("standing", "Standing"),
            option("seated", "Seated"),
            option("mixed", "Mixed"),
          ],
        }),
        field("objectInteractionNeed", "Object or token interaction need", "radio", {
          width: "half",
          options: [
            option("none", "No"),
            option("optional", "Optional / ready for later"),
            option("required", "Required"),
            option("needs-guidance", "Needs guidance"),
          ],
        }),
        field("finishPreference", "Finish preference", "select", {
          width: "half",
          options: [
            option("dark-walnut", "Dark walnut / brown timber"),
            option("blackened-metal", "Blackened metal"),
            option("stone-top", "Stone / mineral top"),
            option("custom-match", "Custom interior match"),
            option("undecided", "Undecided"),
          ],
        }),
        ...exhibitionExperienceFields(),
        consentField(),
      ],
      fieldKeys: [
        "fullName",
        "email",
        "organization",
        "phone",
        "preferredContactMethod",
        "country",
        "city",
        "preferredLanguage",
        "venueType",
        "projectPath",
        "openingDate",
        "projectStage",
        "timeline",
        "unitCount",
        "audienceVolume",
        "languageCount",
        "accessibilityPriorities",
        "securityCleaningConstraints",
        "sitePhotoUploadPlaceholder",
        "planUploadPlaceholder",
        "approximateFootprint",
        "postureMode",
        "objectInteractionNeed",
        "finishPreference",
        "contentIntent",
        "offlineRequirement",
        "analyticsNeed",
        "integrationNeeds",
        "stakeholders",
        "budgetBand",
        "privacyRequest",
        "projectBrief",
        "consent",
      ],
      status: "published",
    },
    {
      id: `form-exhibition-rail-${locale}`,
      slug: `exhibition-rail-${locale}`,
      productSlug: "exhibition-rail",
      locale,
      formMode: "technical-qualification",
      title: "Discuss Exhibition Rail",
      description: "Share embedded-surface, readability and maintenance context.",
      submitLabel: "Request embedded-display review",
      successTitle: "Consultation brief captured",
      successMessage: "The Exhibition Rail brief was saved for a project consultation.",
      fields: [
        ...exhibitionIdentityFields(),
        ...exhibitionProjectFields(),
        ...exhibitionPublicUseFields(),
        field("approximateLength", "Approximate length or footprint", "text", {
          required: true,
          width: "half",
          placeholder: "Rail length, case span or allocated zone",
        }),
        field("mountingContext", "Mounting context", "select", {
          required: true,
          width: "half",
          options: [
            option("wall-integrated", "Wall integrated"),
            option("case-integrated", "Case / vitrine integrated"),
            option("pedestal-object", "Pedestal / object base"),
            option("furniture-millwork", "Furniture / millwork"),
            option("needs-guidance", "Needs guidance"),
          ],
        }),
        field("readingDistance", "Reading distance", "text", {
          width: "half",
          placeholder: "Typical close-view distance",
        }),
        field("contentDensity", "Content density", "select", {
          required: true,
          width: "half",
          options: [
            option("short-labels", "Short labels / prompts"),
            option("mixed-labels", "Mixed labels and stories"),
            option("dense-interpretation", "Dense interpretation"),
            option("visitor-guidance", "Visitor guidance focused"),
          ],
        }),
        ...exhibitionExperienceFields(),
        consentField(),
      ],
      fieldKeys: [
        "fullName",
        "email",
        "organization",
        "phone",
        "preferredContactMethod",
        "country",
        "city",
        "preferredLanguage",
        "venueType",
        "projectPath",
        "openingDate",
        "projectStage",
        "timeline",
        "unitCount",
        "audienceVolume",
        "languageCount",
        "accessibilityPriorities",
        "securityCleaningConstraints",
        "sitePhotoUploadPlaceholder",
        "planUploadPlaceholder",
        "approximateLength",
        "mountingContext",
        "readingDistance",
        "contentDensity",
        "contentIntent",
        "offlineRequirement",
        "analyticsNeed",
        "integrationNeeds",
        "stakeholders",
        "budgetBand",
        "privacyRequest",
        "projectBrief",
        "consent",
      ],
      status: "published",
    },
    {
      id: `form-prima-materia-lux-speaker-${locale}`,
      slug: `prima-materia-lux-speaker-${locale}`,
      productSlug: "prima-materia-lux-speaker",
      locale,
      formMode: "private-demo",
      title: "Request Prima Materia LUX Speaker guidance",
      description: "Capture system context, cable length expectations and audition intent for a focused Montelar consultation.",
      submitLabel: "Request advisor contact",
      successTitle: "Request captured",
      successMessage: "The request was saved for Montelar follow-up.",
      fields: [
        ...audioIdentityFields(),
        field("amplifierModel", "Amplifier model", "text", {
          required: true,
          width: "half",
          placeholder: "Current or planned amplifier",
        }),
        field("speakerModel", "Speaker model", "text", {
          required: true,
          width: "half",
          placeholder: "Current or planned loudspeakers",
        }),
        field("systemRole", "System role", "select", {
          required: true,
          width: "half",
          options: [
            option("new-reference-system", "New reference system"),
            option("system-upgrade", "System upgrade"),
            option("dealer-project", "Dealer project"),
          ],
        }),
        field("connectorPreference", "Connector preference", "radio", {
          width: "half",
          options: [
            option("banana", "Banana"),
            option("spade", "Spade"),
            option("undecided", "Undecided"),
          ],
        }),
        field("wiringNeed", "Single-wire / bi-wire need", "radio", {
          width: "half",
          options: [
            option("single-wire", "Single-wire"),
            option("bi-wire", "Bi-wire"),
            option("jumper", "Jumper / undecided"),
          ],
        }),
        field("lengthNeed", "Required length per side", "text", {
          width: "half",
          placeholder: "Approximate run length",
        }),
        field("currentCableSet", "Current cable set and reason for change", "textarea", {
          width: "full",
          placeholder: "Current speaker cable and why you are reconsidering it",
        }),
        field("routingConstraints", "Room use and cable path constraints", "textarea", {
          width: "full",
          placeholder: "Floor path, wall access, visible run limits or service constraints",
        }),
        field("dealerStatus", "Dealer / audition preference", "radio", {
          width: "half",
          options: [
            option("private-client", "Private client"),
            option("architect", "Architect / designer"),
            option("dealer", "Dealer / integrator"),
          ],
        }),
        budgetBandField(),
        field("timeline", "Timeline", "select", {
          width: "half",
          options: [
            option("active-project", "Active project"),
            option("next-quarter", "Next quarter"),
            option("exploration", "Early exploration"),
          ],
        }),
        attachmentPlaceholderField(),
        consentField(),
      ],
      fieldKeys: [
        "fullName",
        "email",
        "phone",
        "country",
        "city",
        "preferredLanguage",
        "amplifierModel",
        "speakerModel",
        "systemRole",
        "connectorPreference",
        "wiringNeed",
        "lengthNeed",
        "currentCableSet",
        "routingConstraints",
        "dealerStatus",
        "budgetBand",
        "timeline",
        "attachments",
        "consent",
      ],
      status: "published",
    },
  ];

  return forms.map((form): CmsProductInquiryForm => {
    const consentField = form.fields.find((field) => field.fieldType === "consent");
    const notificationConfig = notificationConfigByProductSlug[form.productSlug] ?? {
      recipients: ["audio.concierge@montelar.internal"],
      templateKey: "lead-audio",
    };
    const localizedMeta = getFormMetaCopy(locale)?.[form.productSlug] ?? null;
    const localizedForm = localizeInquiryFormRuntimeCopy(
      {
        ...form,
        ...(localizedMeta
          ? {
              title: localizedMeta.title,
              description: localizedMeta.description,
              submitLabel: localizedMeta.submitLabel,
              successTitle: localizedMeta.successTitle,
              successMessage: localizedMeta.successMessage,
            }
          : {}),
        submissionChannel: "cms-lead-plus-email",
        notificationEmails: notificationConfig.recipients,
        notificationTemplateKey: notificationConfig.templateKey,
        consentProfile: "product-inquiry-default",
        consentText:
          consentField?.label ?? "I agree to the privacy review and advisory follow-up.",
      },
      locale,
    );

    return localizedForm;
  });
}
