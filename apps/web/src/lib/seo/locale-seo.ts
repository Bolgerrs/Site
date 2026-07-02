import type { SiteLocale } from "@/config/i18n";
import { getLocaleCopy } from "@/lib/copy/site-copy";

type SeoLocaleCopy = {
  en: string[];
  de?: string[];
  es?: string[];
  fr?: string[];
  ja?: string[];
  ru?: string[];
  zh?: string[];
};

function localizedKeywords(locale: SiteLocale, copy: SeoLocaleCopy) {
  return getLocaleCopy(locale, copy);
}

export function mergeSeoKeywords(...keywordSets: Array<readonly string[] | undefined>) {
  return Array.from(
    new Set(keywordSets.flatMap((keywordSet) => keywordSet ?? []).filter(Boolean)),
  );
}

export function getDefaultSeoDescription(locale: SiteLocale) {
  return getLocaleCopy(locale, {
    en: "Quiet Montelar systems for image, sound and spatial design.",
    de: "Stille Montelar Systeme für Bild, Klang und räumliches Design.",
    es: "Sistemas Montelar serenos para imagen, sonido y diseño espacial.",
    fr: "Systèmes Montelar calmes pour l'image, le son et le design spatial.",
    zh: "面向图像、声音与空间设计的 Montelar 安静系统。",
    ja: "映像、音、空間デザインのための静かな Montelar システム。",
    ru: "Спокойные системы Montelar для изображения, звука и пространственного дизайна.",
  });
}

export function getBaseSeoKeywords(locale: SiteLocale) {
  return localizedKeywords(locale, {
    en: ["Montelar", "quiet luxury", "image sound space"],
    de: ["Montelar", "stiller Luxus", "Bild Klang Raum"],
    es: ["Montelar", "lujo silencioso", "imagen sonido espacio"],
    fr: ["Montelar", "luxe discret", "image son espace"],
    zh: ["Montelar", "静奢", "高端科技", "图像 声音 设计"],
    ja: ["Montelar", "静かなラグジュアリー", "画像 音 空間"],
    ru: ["Montelar", "тихая роскошь", "изображение звук пространство"],
  });
}

export function getHomeSeoKeywords(locale: SiteLocale) {
  return mergeSeoKeywords(
    getBaseSeoKeywords(locale),
    localizedKeywords(locale, {
      en: ["private cinema", "hi-end audio", "spatial display"],
      de: ["privates Kino", "Hi-end-Audio", "räumliche Displays"],
      es: ["cine privado", "hi-end audio", "displays espaciales"],
      fr: ["cinéma privé", "audio hi-end", "affichage spatial"],
      zh: ["私人影院", "Hi-end 音频", "空间显示"],
      ja: ["プライベートシネマ", "Hi-end オーディオ", "空間ディスプレイ"],
      ru: ["приватный кинотеатр", "hi-end аудио", "пространственные дисплеи"],
    }),
  );
}

export function getDirectionSeoKeywords(
  locale: SiteLocale,
  directionSlug: string,
  directionName?: string,
) {
  const directionKeywords = (() => {
    switch (directionSlug) {
      case "hi-end-audio":
        return localizedKeywords(locale, {
          en: ["hi-end audio", "luxury audio", "speakers", "amplifiers"],
          de: ["Hi-end-Audio", "Luxus-Audio", "Lautsprecher", "Verstärker"],
          es: ["hi-end audio", "audio de lujo", "altavoces", "amplificadores"],
          fr: ["audio hi-end", "audio de luxe", "enceintes", "amplificateurs"],
          zh: ["Hi-end 音频", "奢华音响", "扬声器", "放大系统"],
          ja: ["Hi-end オーディオ", "ラグジュアリーオーディオ", "スピーカー", "増幅システム"],
          ru: ["hi-end аудио", "люкс аудио", "акустика", "усилители"],
        });
      case "vision-max":
        return localizedKeywords(locale, {
          en: ["private cinema", "home cinema", "immersive screening"],
          de: ["privates Kino", "Heimkino", "immersive Vorführung"],
          es: ["cine privado", "cine en casa", "proyección inmersiva"],
          fr: ["cinéma privé", "home cinéma", "projection immersive"],
          zh: ["私人影院", "家庭影院", "沉浸式放映"],
          ja: ["プライベートシネマ", "ホームシネマ", "没入型上映"],
          ru: ["приватный кинотеатр", "домашний кинотеатр", "иммерсивный показ"],
        });
      case "living-glass":
        return localizedKeywords(locale, {
          en: ["transparent display", "glass display", "interior display"],
          de: ["transparentes Display", "Glas-Display", "Interior-Display"],
          es: ["display transparente", "display de vidrio", "display interior"],
          fr: ["affichage transparent", "écran en verre", "affichage intérieur"],
          zh: ["透明显示", "玻璃显示", "室内显示"],
          ja: ["透明ディスプレイ", "ガラスディスプレイ", "インテリアディスプレイ"],
          ru: ["прозрачный дисплей", "стеклянный дисплей", "интерьерный дисплей"],
        });
      case "hologram":
        return localizedKeywords(locale, {
          en: ["hologram", "spatial presentation", "retail display"],
          de: ["Hologramm", "räumliche Präsentation", "Retail-Display"],
          es: ["holograma", "presentación espacial", "display retail"],
          fr: ["hologramme", "présentation spatiale", "affichage retail"],
          zh: ["全息", "空间展示", "零售展示"],
          ja: ["ホログラム", "空間プレゼンテーション", "リテールディスプレイ"],
          ru: ["голограмма", "пространственная презентация", "ритейл-дисплей"],
        });
      case "pictorial-art-display":
        return localizedKeywords(locale, {
          en: ["digital art display", "art display", "framed digital art"],
          de: ["Digital-Art-Display", "Kunstdisplay", "gerahmte digitale Kunst"],
          es: ["display de arte digital", "display artístico", "arte digital enmarcado"],
          fr: ["affichage d'art numérique", "display artistique", "art numérique encadré"],
          zh: ["数字艺术显示", "艺术显示", "装框数字艺术"],
          ja: ["デジタルアートディスプレイ", "アートディスプレイ", "額装デジタルアート"],
          ru: ["цифровая арт-панель", "арт-дисплей", "рамочная digital art система"],
        });
      case "display-for-exhibition":
        return localizedKeywords(locale, {
          en: ["exhibition display", "touch display", "showroom display"],
          de: ["Ausstellungsdisplay", "Touch-Display", "Showroom-Display"],
          es: ["display para exposición", "display táctil", "display para showroom"],
          fr: ["display d'exposition", "display tactile", "display showroom"],
          zh: ["展览显示", "触控显示", "展厅显示"],
          ja: ["展示用ディスプレイ", "タッチディスプレイ", "ショールームディスプレイ"],
          ru: ["выставочный дисплей", "сенсорный дисплей", "дисплей для шоурума"],
        });
      default:
        return [];
    }
  })();

  return mergeSeoKeywords(
    getBaseSeoKeywords(locale),
    directionKeywords,
    directionName ? [directionName] : undefined,
  );
}

export function getCategorySeoKeywords(
  locale: SiteLocale,
  categoryName?: string,
  directionName?: string,
) {
  return mergeSeoKeywords(
    getBaseSeoKeywords(locale),
    localizedKeywords(locale, {
      en: ["audio category", "luxury audio catalog"],
      de: ["Audio-Kategorie", "Luxus-Audio-Katalog"],
      es: ["categoría de audio", "catálogo de audio de lujo"],
      fr: ["catégorie audio", "catalogue audio de luxe"],
      zh: ["音频分类", "高端音频目录"],
      ja: ["オーディオカテゴリ", "ラグジュアリーオーディオカタログ"],
      ru: ["аудио категория", "каталог люкс аудио"],
    }),
    categoryName ? [categoryName] : undefined,
    directionName ? [directionName] : undefined,
  );
}

export function getProductSeoKeywords(locale: SiteLocale, productName?: string) {
  return mergeSeoKeywords(
    getBaseSeoKeywords(locale),
    localizedKeywords(locale, {
      en: ["product detail", "luxury product", "design technology"],
      de: ["Produktdetail", "Luxusprodukt", "Designtechnologie"],
      es: ["detalle de producto", "producto de lujo", "tecnología de diseño"],
      fr: ["fiche produit", "produit de luxe", "technologie design"],
      zh: ["产品详情", "高端产品", "设计科技"],
      ja: ["製品詳細", "ラグジュアリー製品", "デザイン技術"],
      ru: ["карточка продукта", "люкс продукт", "дизайн технологии"],
    }),
    productName ? [productName] : undefined,
  );
}

export function getRequestSeoKeywords(locale: SiteLocale, productName?: string) {
  return mergeSeoKeywords(
    getBaseSeoKeywords(locale),
    localizedKeywords(locale, {
      en: ["product inquiry", "luxury consultation", "request product"],
      de: ["Produktanfrage", "Luxus-Beratung", "Produkt anfragen"],
      es: ["solicitud de producto", "consulta de lujo", "solicitar producto"],
      fr: ["demande produit", "consultation luxe", "demander le produit"],
      zh: ["产品咨询", "高端咨询", "提交需求"],
      ja: ["製品問い合わせ", "ラグジュアリー相談", "製品リクエスト"],
      ru: ["заявка по продукту", "люкс консультация", "запрос по продукту"],
    }),
    productName ? [productName] : undefined,
  );
}

export function getEditorialSeoKeywords(
  locale: SiteLocale,
  editorialSlug: string,
  pageTitle?: string,
) {
  const sectionKeywords = (() => {
    switch (editorialSlug) {
      case "brand":
        return localizedKeywords(locale, {
          en: ["brand story", "quiet luxury", "luxury brand"],
          de: ["Markengeschichte", "stiller Luxus", "Luxusmarke"],
          es: ["historia de marca", "lujo silencioso", "marca de lujo"],
          fr: ["histoire de marque", "luxe discret", "marque de luxe"],
          zh: ["品牌故事", "静奢", "高端品牌"],
          ja: ["ブランドストーリー", "静かなラグジュアリー", "ラグジュアリーブランド"],
          ru: ["история бренда", "тихая роскошь", "люкс бренд"],
        });
      case "technology":
        return localizedKeywords(locale, {
          en: ["system integration", "signal control", "display technology"],
          de: ["Systemintegration", "Signalsteuerung", "Display-Technologie"],
          es: ["integracion de sistemas", "control de senal", "tecnologia display"],
          fr: ["integration systeme", "controle du signal", "technologie d'affichage"],
          zh: ["系统集成", "信号控制", "显示技术"],
          ja: ["システム統合", "信号制御", "ディスプレイ技術"],
          ru: ["системная интеграция", "управление сигналом", "технологии изображения"],
        });
      case "craftsmanship":
        return localizedKeywords(locale, {
          en: ["craftsmanship", "materiality", "finishing"],
          de: ["Handwerk", "Materialität", "Finish"],
          es: ["artesanía", "materialidad", "acabados"],
          fr: ["savoir-faire", "matérialité", "finitions"],
          zh: ["工艺", "材质", "饰面"],
          ja: ["クラフツマンシップ", "素材感", "仕上げ"],
          ru: ["мастерство", "материальность", "отделка"],
        });
      case "projects":
        return localizedKeywords(locale, {
          en: ["projects", "installation", "case study"],
          de: ["Projekte", "Installation", "Fallstudie"],
          es: ["proyectos", "instalación", "caso de estudio"],
          fr: ["projets", "installation", "cas d'usage"],
          zh: ["项目", "安装案例", "案例研究"],
          ja: ["プロジェクト", "インスタレーション", "ケーススタディ"],
          ru: ["проекты", "инсталляция", "кейс"],
        });
      case "journal":
        return localizedKeywords(locale, {
          en: ["journal", "editorial", "launches"],
          de: ["Journal", "Editorial", "Launches"],
          es: ["journal", "editorial", "lanzamientos"],
          fr: ["journal", "éditorial", "lancements"],
          zh: ["期刊", "编辑内容", "发布动态"],
          ja: ["ジャーナル", "エディトリアル", "ローンチ"],
          ru: ["журнал", "редакционные материалы", "релизы"],
        });
      case "downloads":
        return localizedKeywords(locale, {
          en: ["downloads", "brochures", "technical documents"],
          de: ["Downloads", "Broschüren", "technische Dokumente"],
          es: ["descargas", "folletos", "documentos técnicos"],
          fr: ["téléchargements", "brochures", "documents techniques"],
          zh: ["下载", "宣传册", "技术文档"],
          ja: ["ダウンロード", "パンフレット", "技術資料"],
          ru: ["загрузки", "брошюры", "технические документы"],
        });
      case "contact":
        return localizedKeywords(locale, {
          en: ["contact", "dealer inquiry", "brand consultation"],
          de: ["Kontakt", "Händleranfrage", "Markenberatung"],
          es: ["contacto", "consulta dealer", "consulta de marca"],
          fr: ["contact", "demande revendeur", "consultation marque"],
          zh: ["联系", "经销咨询", "品牌咨询"],
          ja: ["コンタクト", "ディーラー問い合わせ", "ブランド相談"],
          ru: ["контакты", "запрос дилера", "консультация бренда"],
        });
      default:
        return [];
    }
  })();

  return mergeSeoKeywords(
    getBaseSeoKeywords(locale),
    sectionKeywords,
    pageTitle ? [pageTitle] : undefined,
  );
}

export function getLineSeoKeywords(locale: SiteLocale, lineName?: string) {
  return mergeSeoKeywords(
    getBaseSeoKeywords(locale),
    localizedKeywords(locale, {
      en: ["audio line", "cable line", "luxury cable system"],
      de: ["Audiolinie", "Kabellinie", "Luxus-Kabelsystem"],
      es: ["línea de audio", "línea de cable", "sistema de cable de lujo"],
      fr: ["ligne audio", "ligne de câbles", "système de câbles de luxe"],
      zh: ["音频产品线", "线材系列", "高端线材系统"],
      ja: ["オーディオライン", "ケーブルライン", "ラグジュアリーケーブルシステム"],
      ru: ["аудио линейка", "кабельная линейка", "люкс кабельная система"],
    }),
    lineName ? [lineName] : undefined,
  );
}
