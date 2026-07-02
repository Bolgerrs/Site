"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { usePathname } from "next/navigation";
import { getPathLocale, stripLocaleFromPathname, type SiteLocale } from "@/config/i18n";
import { withLocale } from "@/config/site-routes";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { SloganComposition } from "@/components/slogan-composition";
import { getLocaleCopy } from "@/lib/copy/site-copy";
import type {
  CmsPage,
  CmsProduct,
  CmsProductCategory,
  CmsProductDirection,
} from "@/lib/cms/types";

type SiteHeaderProps = {
  audioCategories: CmsProductCategory[];
  editorialPages: CmsPage[];
  featuredProducts: CmsProduct[];
  launchDirections: CmsProductDirection[];
  locale: SiteLocale;
};

type NavigationBranchKey = "products" | "atelier" | "resources" | "contact";

type NavigationCard = {
  description: string;
  href: string;
  id: string;
  label: string;
  meta?: string;
};

type NavigationBranch = {
  description: string;
  id: NavigationBranchKey;
  items: NavigationCard[];
  label: string;
  matchPrefixes: string[];
  title: string;
};

type ProductMenuLink = {
  categorySlug?: string;
  description?: string;
  href: string;
  id: string;
  label: string;
  meta?: string;
  slug?: string;
};

type ProductMenuDirection = {
  description: string;
  families: ProductMenuLink[];
  href: string;
  id: string;
  inquiryHref: string;
  label: string;
  products: ProductMenuLink[];
  slug: string;
  title: string;
};

function normalizePath(pathname: string) {
  if (pathname !== "/" && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

function matchesPath(pathname: string, href: string) {
  const normalizedPath = normalizePath(pathname);
  const normalizedHref = normalizePath(href);

  if (normalizedHref === "/") {
    return normalizedPath === "/";
  }

  return normalizedPath === normalizedHref || normalizedPath.startsWith(`${normalizedHref}/`);
}

function getBranchFromPath(pathname: string, branches: NavigationBranch[]) {
  return (
    branches.find((branch) =>
      branch.matchPrefixes.some((prefix) => matchesPath(pathname, prefix)),
    )?.id ?? null
  );
}

function getAudioCategoryMenuLabel(
  slug: string | undefined,
  fallback: string,
  locale: SiteLocale,
) {
  switch (slug) {
    case "speakers":
      return getLocaleCopy(locale, {
        en: "Speakers",
        de: "Lautsprecher",
        es: "Altavoces",
        fr: "Enceintes",
        zh: "扬声器",
        ja: "スピーカー",
        ru: "Акустика",
      });
    case "streamers":
      return getLocaleCopy(locale, {
        en: "Streamers",
        de: "Streamer",
        es: "Streamers",
        fr: "Streamers",
        zh: "流媒体播放器",
        ja: "ストリーマー",
        ru: "Стримеры",
      });
    case "dac":
      return getLocaleCopy(locale, {
        en: "DAC",
        de: "DAC",
        es: "DAC",
        fr: "DAC",
        zh: "DAC",
        ja: "DAC",
        ru: "ЦАП",
      });
    case "amplifiers":
      return getLocaleCopy(locale, {
        en: "Amplifiers",
        de: "Verstärker",
        es: "Amplificadores",
        fr: "Amplificateurs",
        zh: "放大器",
        ja: "アンプ",
        ru: "Усилители",
      });
    case "perfect-conductors":
      return "Perfect Conductors / Prima Materia";
    default:
      return fallback;
  }
}

export function SiteHeader({
  audioCategories,
  editorialPages,
  featuredProducts,
  launchDirections,
  locale,
}: SiteHeaderProps) {
  const pathname = usePathname();
  const uiLocale = getPathLocale(pathname || "") ?? locale;
  const currentPath = normalizePath(stripLocaleFromPathname(pathname || "/"));
  const atelierPages = editorialPages.filter((page) =>
    ["brand", "technology", "craftsmanship"].includes(page.slug),
  );
  const resourcePages = editorialPages.filter((page) =>
    ["journal", "downloads"].includes(page.slug),
  );

  const contactPage =
    editorialPages.find((page) => page.slug === "contact") ?? null;
  const brandPage =
    editorialPages.find((page) => page.slug === "brand") ?? null;
  const projectsPage =
    editorialPages.find((page) => page.slug === "projects") ?? null;
  const productDirectionLabel = getLocaleCopy(uiLocale, {
    en: "System direction",
    de: "Systemrichtung",
    es: "Dirección de sistema",
    fr: "Direction système",
    zh: "系统方向",
    ja: "システム方向",
    ru: "Системное направление",
  });
  const productInquiryLabel = getLocaleCopy(uiLocale, {
    en: "Request consultation",
    de: "Beratung anfragen",
    es: "Solicitar consulta",
    fr: "Demander une consultation",
    zh: "申请咨询",
    ja: "相談を依頼する",
    ru: "Запросить консультацию",
  });

  const productCards: NavigationCard[] = launchDirections.map((direction) => {
    const featuredProduct =
      featuredProducts.find((product) => product.directionSlug === direction.slug) ?? null;

    return {
      id: direction.id,
      label: direction.navigationLabel ?? direction.name,
      href: direction.routePath,
      description: direction.shortDescription,
      ...(featuredProduct
        ? {
            meta: getLocaleCopy(uiLocale, {
              en: `Request: ${featuredProduct.name}`,
              de: `Anfrage: ${featuredProduct.name}`,
              es: `Solicitud: ${featuredProduct.name}`,
              fr: `Demande : ${featuredProduct.name}`,
              zh: `咨询：${featuredProduct.name}`,
              ja: `問い合わせ: ${featuredProduct.name}`,
              ru: `Заявка: ${featuredProduct.name}`,
            }),
          }
        : {}),
    };
  });
  const productMenuDirections: ProductMenuDirection[] = launchDirections.map(
    (direction) => {
      const directionProducts = featuredProducts.filter(
        (product) => product.directionSlug === direction.slug,
      );
      const directionFamilies =
        direction.slug === "hi-end-audio"
          ? audioCategories.map((category) => ({
              id: category.id,
              slug: category.slug,
              label: getAudioCategoryMenuLabel(category.slug, category.label, uiLocale),
              href: category.routePath,
              description: category.description,
              meta: productDirectionLabel,
            }))
          : [];
      const firstProduct = directionProducts[0] ?? null;

      return {
        id: direction.id,
        slug: direction.slug,
        label: direction.navigationLabel ?? direction.name,
        href: direction.routePath,
        title: getLocaleCopy(uiLocale, {
          en: `${direction.navigationLabel ?? direction.name} for the room`,
          de: `${direction.navigationLabel ?? direction.name} im Raum`,
          es: `${direction.navigationLabel ?? direction.name} para el espacio`,
          fr: `${direction.navigationLabel ?? direction.name} dans l'espace`,
          zh: `${direction.navigationLabel ?? direction.name} 的空间方案`,
          ja: `${direction.navigationLabel ?? direction.name} と空間`,
          ru: `${direction.navigationLabel ?? direction.name}: пространство и система`,
        }),
        description: direction.shortDescription,
        families: [
          ...directionFamilies,
        ],
        products: directionProducts.map((product) => ({
          id: product.id,
          label: product.name,
          href: product.routePath,
          description: product.shortDescription,
          meta: getLocaleCopy(uiLocale, {
            en: "Private review",
            de: "Private Prüfung",
            es: "Revisión privada",
            fr: "Revue privée",
            zh: "私人审阅",
            ja: "個別検討",
            ru: "Частный разбор",
          }),
          ...(product.categorySlug ? { categorySlug: product.categorySlug } : {}),
        })),
        inquiryHref: firstProduct?.inquiryRoutePath ?? contactPage?.routePath ?? "/contact",
      };
    },
  );

  const contactCards: NavigationCard[] = [
    {
      id: "contact-main",
      label: getLocaleCopy(uiLocale, {
        en: "Headquarters and consultation",
        de: "Zentrale und Beratung",
        es: "Consulta y contacto central",
        fr: "Consultation et contact central",
        zh: "总部与咨询",
        ja: "本部とコンサルテーション",
        ru: "Консультация и центральный контакт",
      }),
      href: contactPage?.routePath ?? "/contact",
      description:
        contactPage?.heroSummary ??
        getLocaleCopy(uiLocale, {
          en: "Private consultations, partner requests and regional follow-up begin from one controlled entry point.",
          de: "Leiten Sie private Beratungen, Partneranfragen und regionale Nachverfolgung über einen kontrollierten Einstieg.",
          es: "Canalice consultas privadas, solicitudes de socios y seguimiento regional desde un único punto de entrada controlado.",
          fr: "Orientez les consultations privées, les demandes partenaires et le suivi régional depuis un point d'entrée contrôlé unique.",
          zh: "通过一个受控入口统一承接私享咨询、合作伙伴请求与区域跟进。",
          ja: "個別相談、パートナー依頼、地域フォローを一つの管理された入口から受け止めます。",
          ru: "Ведите приватные консультации, партнерские запросы и региональное сопровождение через одну управляемую точку входа.",
        }),
      meta: getLocaleCopy(uiLocale, {
        en: "Direct contact",
        de: "Direkter Kontakt",
        es: "Contacto directo",
        fr: "Contact direct",
        zh: "直接联系",
        ja: "直接連絡",
        ru: "Прямой контакт",
      }),
    },
    {
      id: "contact-projects",
      label: getLocaleCopy(uiLocale, {
        en: "Project brief",
        de: "Projektbriefing",
        es: "Brief de proyecto",
        fr: "Brief projet",
        zh: "项目简报",
        ja: "プロジェクトブリーフ",
        ru: "Проектный бриф",
      }),
      href: projectsPage?.routePath ?? "/projects",
      description:
        projectsPage?.heroSummary ??
        getLocaleCopy(uiLocale, {
          en: "Start residential, gallery, showroom and hospitality discussions before choosing a single product.",
          de: "Starten Sie Gespraeche zu Wohn-, Galerie-, Showroom- und Hospitality-Projekten, bevor ein einzelnes Produkt gewaehlt wird.",
          es: "Inicie conversaciones sobre residencias, galerias, showrooms y hospitality antes de elegir un producto concreto.",
          fr: "Lancez les echanges autour de residences, galeries, showrooms et hospitality avant de choisir un produit precis.",
          zh: "先开启住宅、画廊、展厅与酒店场景讨论，再选择具体产品。",
          ja: "具体製品を選ぶ前に、住宅、ギャラリー、ショールーム、ホスピタリティ案件の対話を始めます。",
          ru: "Запускайте обсуждения по резиденциям, галереям, шоурумам и hospitality-проектам до выбора конкретного продукта.",
        }),
      meta: getLocaleCopy(uiLocale, {
        en: "Project dialogue",
        de: "Projektgespräch",
        es: "Diálogo de proyecto",
        fr: "Dialogue projet",
        zh: "项目沟通",
        ja: "プロジェクト相談",
        ru: "Проектный диалог",
      }),
    },
    ...featuredProducts.slice(0, 3).map((product) => ({
      id: `contact-${product.id}`,
      label: product.name,
      href: product.inquiryRoutePath,
      description: product.shortDescription,
      meta: getLocaleCopy(uiLocale, {
        en: "Product inquiry",
        de: "Produktanfrage",
        es: "Solicitud de producto",
        fr: "Demande produit",
        zh: "产品咨询",
        ja: "製品問い合わせ",
        ru: "Заявка по продукту",
      }),
    })),
  ];

  const branches: NavigationBranch[] = [
    {
      id: "products",
      label: getLocaleCopy(uiLocale, { en: "Products", de: "Produkte", es: "Productos", fr: "Produits", zh: "产品", ja: "製品", ru: "Продукты" }),
      title: getLocaleCopy(uiLocale, {
        en: "Product directions shaped as systems",
        de: "Produktrichtungen als Systeme gestaltet",
        es: "Direcciones de producto concebidas como sistemas",
        fr: "Directions produit conçues comme des systèmes",
        zh: "以系统方式塑造的产品方向",
        ja: "システムとして設計された製品ディレクション",
        ru: "Продуктовые направления как системы",
      }),
      description:
        getLocaleCopy(uiLocale, {
          en: "Move from cinema, audio and spatial display directions into a clear private consultation.",
          de: "Von Kino, Audio und raeumlichen Displays fuehrt der Weg direkt in eine klare private Beratung.",
          es: "Pase de cine, audio y display espacial a una consulta privada clara.",
          fr: "Passez du cinema, de l'audio et de l'affichage spatial vers une consultation privee claire.",
          zh: "从影院、音频与空间显示方向进入清晰的私享咨询。",
          ja: "シネマ、オーディオ、空間ディスプレイから明確なプライベート相談へ進みます。",
          ru: "Перейдите от кино, аудио и пространственных дисплеев к понятной частной консультации.",
        }),
      matchPrefixes: [
        "/vision-max",
        "/audio",
        "/invisible-display",
        "/hologram",
        "/pictorial-art-display",
        "/exhibition-displays",
        "/products",
        "/request",
      ],
      items: productCards,
    },
    {
      id: "atelier",
      label: getLocaleCopy(uiLocale, { en: "Atelier", de: "Atelier", es: "Atelier", fr: "Atelier", zh: "工坊", ja: "アトリエ", ru: "Ателье" }),
      title: getLocaleCopy(uiLocale, {
        en: "Brand proof, technology and craft",
        de: "Markenbeweis, Technologie und Handwerk",
        es: "Marca, tecnología y oficio",
        fr: "Preuve de marque, technologie et savoir-faire",
        zh: "品牌证明、技术与工艺",
        ja: "ブランドの証明、技術、クラフト",
        ru: "Бренд, технологии и ремесло",
      }),
      description:
        getLocaleCopy(uiLocale, {
          en: "Brand, technology and craft are held together as one quiet proof of authorship, engineering discipline and finish.",
          de: "Marke, Technologie und Handwerk bilden einen ruhigen Beweis für Autorenschaft, Ingenieursdisziplin und Ausführung.",
          es: "Marca, tecnología y oficio se reúnen como una prueba serena de autoría, disciplina de ingeniería y acabado.",
          fr: "Marque, technologie et savoir-faire forment une preuve calme d'auteur, de rigueur d'ingénierie et de finition.",
          zh: "品牌、技术与工艺被统一为一种安静的证明，体现作者性、工程纪律与完成度。",
          ja: "ブランド、技術、クラフトを一体として見せ、作者性、技術規律、仕上げの質を静かに証明します。",
          ru: "Бренд, технологии и ремесло собраны в одно спокойное доказательство авторства, инженерной дисциплины и уровня отделки.",
        }),
      matchPrefixes: ["/brand", "/technology", "/craftsmanship"],
      items: atelierPages.map((page) => ({
        id: page.id,
        label: page.navigationLabel ?? page.title,
        href: page.routePath,
        description:
          page.heroSummary ??
          getLocaleCopy(uiLocale, {
            en: "Brand authorship, material thinking and engineering culture shape the Montelar point of view.",
            de: "Markenerzählung, Materialdenken und Ingenieurskultur formen den Montelar Blick.",
            es: "La autoria de marca, el pensamiento material y la cultura de ingenieria definen la mirada de Montelar.",
            fr: "Le récit de marque, la pensée matière et la culture d'ingénierie façonnent le regard Montelar.",
            zh: "品牌叙事、材料观与工程文化共同构成 Montelar 的视角。",
            ja: "ブランドの物語、素材への視点、エンジニアリング文化が Montelar の視座を形づくります。",
            ru: "Авторство бренда, материал и инженерная культура формируют точку зрения Montelar.",
          }),
        meta: getLocaleCopy(uiLocale, {
          en: "Brand chapter",
          de: "Markenkapitel",
          es: "Capítulo de marca",
          fr: "Chapitre de marque",
          zh: "品牌章节",
          ja: "ブランド章",
          ru: "Глава бренда",
        }),
      })),
    },
    {
      id: "resources",
      label: getLocaleCopy(uiLocale, { en: "Resources", de: "Ressourcen", es: "Recursos", fr: "Ressources", zh: "资源", ja: "資料", ru: "Ресурсы" }),
      title: getLocaleCopy(uiLocale, {
        en: "Editorial and document access",
        de: "Editorial- und Dokumentenzugang",
        es: "Acceso editorial y documental",
        fr: "Accès éditorial et documentaire",
        zh: "编辑内容与文档入口",
        ja: "エディトリアルとドキュメントへの導線",
        ru: "Редакционные материалы и документы",
      }),
      description:
        getLocaleCopy(uiLocale, {
          en: "Journal notes, brochures and project documents support the main consultation without crowding it.",
          de: "Journal, Downloads und technische Referenzen bleiben als ruhige Begleitschichten rund um das Hauptgespräch verfügbar.",
          es: "Journal, descargas y referencias técnicas permanecen disponibles como capas de apoyo serenas alrededor de la conversación principal.",
          fr: "Journal, téléchargements et références techniques restent disponibles comme des couches d'appui calmes autour de la conversation principale.",
          zh: "日志、下载与技术参考作为安静的支持层，围绕主要沟通始终可达。",
          ja: "ジャーナル、ダウンロード、技術資料は、主たる対話を支える静かな層として用意されます。",
          ru: "Журнал, брошюры и проектные документы поддерживают консультацию, не перегружая первый выбор.",
        }),
      matchPrefixes: ["/journal", "/downloads"],
      items: resourcePages.map((page) => ({
        id: page.id,
        label: page.navigationLabel ?? page.title,
        href: page.routePath,
        description:
          page.heroSummary ??
          getLocaleCopy(uiLocale, {
            en: "Specifications, notes and reference material remain close at hand for deeper review.",
            de: "Spezifikationen, Notizen und Referenzmaterial bleiben für eine vertiefte Betrachtung in Reichweite.",
            es: "Especificaciones, notas y material de referencia permanecen a mano para una revisión más profunda.",
            fr: "Spécifications, notes et matériaux de référence restent à portée pour une lecture plus approfondie.",
            zh: "规格、说明与参考资料始终近在手边，便于深入查看。",
            ja: "仕様、ノート、参照資料をすぐ手の届く場所に置き、より深い確認へつなげます。",
            ru: "Спецификации, заметки и справочные материалы остаются под рукой для более глубокого изучения.",
          }),
        meta: getLocaleCopy(uiLocale, {
          en: "Reference material",
          de: "Referenzmaterial",
          es: "Material de referencia",
          fr: "Matière de référence",
          zh: "参考资料",
          ja: "参照資料",
          ru: "Справочный материал",
        }),
      })),
    },
    {
      id: "contact",
      label: getLocaleCopy(uiLocale, { en: "Contact", de: "Kontakt", es: "Contacto", fr: "Contact", zh: "联系", ja: "コンタクト", ru: "Контакты" }),
      title: getLocaleCopy(uiLocale, {
        en: "Consultation, projects and regional partners",
        de: "Beratung, Projekte und regionale Partner",
        es: "Consulta, proyectos y socios regionales",
        fr: "Consultation, projets et partenaires régionaux",
        zh: "咨询、项目与区域伙伴",
        ja: "相談、プロジェクト、地域パートナー",
        ru: "Консультации, проекты и региональные партнеры",
      }),
      description:
        getLocaleCopy(uiLocale, {
          en: "Consultation, project intake and regional follow-up stay visible as one composed point of contact.",
          de: "Beratung, Projektaufnahme und regionale Begleitung bleiben als ein gemeinsamer Kontaktpunkt sichtbar.",
          es: "La consulta, el intake de proyectos y el seguimiento regional permanecen visibles como un único punto de contacto compuesto.",
          fr: "Consultation, prise de brief projet et suivi régional restent visibles comme un point de contact unique et composé.",
          zh: "咨询、项目提交与区域跟进作为一个统一的联系入口始终可见。",
          ja: "相談、プロジェクト受付、地域フォローアップを一つの統合された接点として見えるように保ちます。",
          ru: "Консультация, проектный бриф и региональное сопровождение остаются видимыми как единая точка контакта.",
        }),
      matchPrefixes: ["/contact"],
      items: contactCards,
    },
  ];

  const [desktopOpenBranch, setDesktopOpenBranch] =
    useState<NavigationBranchKey | null>(null);
  const [mobileOpenBranch, setMobileOpenBranch] =
    useState<NavigationBranchKey | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileClosing, setMobileClosing] = useState(false);
  const [mobileProductDirectionSlug, setMobileProductDirectionSlug] =
    useState<string | null>(null);
  const [mobileProductFamilySlug, setMobileProductFamilySlug] =
    useState<string | null>(null);
  const [mobileDrawerProductPanelExperiment, setMobileDrawerProductPanelExperiment] =
    useState(true);
  const [selectedProductDirectionSlug, setSelectedProductDirectionSlug] =
    useState<string | null>(null);
  const [selectedProductFamilySlug, setSelectedProductFamilySlug] =
    useState<string | null>(null);
  const activeBranch = getBranchFromPath(currentPath, branches);
  const desktopBranches = branches.filter((branch) => branch.id === "products");
  const isHomepage = currentPath === "/";
  const activeDesktopBranch =
    branches.find((branch) => branch.id === desktopOpenBranch) ?? null;
  const activeMobileBranch =
    branches.find((branch) => branch.id === mobileOpenBranch) ?? null;
  const selectedProductDirection =
    selectedProductDirectionSlug
      ? productMenuDirections.find(
          (direction) => direction.slug === selectedProductDirectionSlug,
        ) ?? null
      : null;
  const mobileSelectedProductDirection =
    mobileProductDirectionSlug
      ? productMenuDirections.find(
          (direction) => direction.slug === mobileProductDirectionSlug,
        ) ?? null
      : null;
  const mobileSelectedProductFamilies =
    mobileSelectedProductDirection?.families.filter((family) => family.slug !== "__overview") ?? [];
  const mobileSelectedProductFamily =
    mobileSelectedProductFamilies.find(
      (family) => (family.slug ?? family.id) === mobileProductFamilySlug,
    ) ?? null;
  const mobileProductPanelItems = mobileSelectedProductDirection
    ? mobileSelectedProductFamilies.length > 0
      ? mobileSelectedProductFamily
        ? mobileSelectedProductDirection.products.filter(
            (product) => product.categorySlug === mobileSelectedProductFamily.slug,
          )
        : []
      : mobileSelectedProductDirection.products
    : [];
  const mobileProductPanelFallbackLink =
    mobileSelectedProductFamily && mobileProductPanelItems.length === 0
      ? mobileSelectedProductFamily
      : null;
  const mobileProductPanelTitle =
    mobileSelectedProductFamily?.label ?? mobileSelectedProductDirection?.label ?? null;
  const mobileProductPanelShowsProducts =
    Boolean(mobileSelectedProductFamily) ||
    Boolean(mobileSelectedProductDirection && mobileSelectedProductFamilies.length === 0);
  const selectedProductFamily =
    selectedProductDirection?.families.find(
      (family) => (family.slug ?? family.id) === selectedProductFamilySlug,
    ) ?? null;
  const selectedProductHasFamilyLayer =
    selectedProductDirection ? selectedProductDirection.families.length > 1 : false;
  const selectedFamilyProducts =
    selectedProductDirection && selectedProductFamily
      ? selectedProductFamily.slug === "__overview"
        ? selectedProductDirection.products
        : selectedProductDirection.products.filter(
            (product) => product.categorySlug === selectedProductFamily.slug,
          )
      : [];
  const productPanelState = selectedProductDirection
    ? selectedProductHasFamilyLayer && selectedProductFamily
      ? " has-family"
      : " has-direction"
    : "";
  const mobileNavigationVisible = mobileOpen || mobileClosing;
  const mobileClosingTimerRef = useRef<number | null>(null);

  function openDesktopBranch(branchId: NavigationBranchKey) {
    setDesktopOpenBranch(branchId);
    if (branchId === "products") {
      // Default-select the first direction so the panel opens at a stable
      // 2-column width; hovering a direction swaps content without a width jump.
      setSelectedProductDirectionSlug(productMenuDirections[0]?.slug ?? null);
      setSelectedProductFamilySlug(null);
    }
  }

  function closeDesktopNavigation() {
    setDesktopOpenBranch(null);
    setSelectedProductDirectionSlug(null);
    setSelectedProductFamilySlug(null);
  }

  function closeMobileNavigation() {
    if (mobileClosingTimerRef.current) {
      window.clearTimeout(mobileClosingTimerRef.current);
      mobileClosingTimerRef.current = null;
    }

    if (mobileOpen) {
      setMobileClosing(true);
      mobileClosingTimerRef.current = window.setTimeout(() => {
        setMobileClosing(false);
        mobileClosingTimerRef.current = null;
      }, 680);
    } else {
      setMobileClosing(false);
    }

    setMobileOpen(false);
    setMobileOpenBranch(null);
    setMobileProductDirectionSlug(null);
    setMobileProductFamilySlug(null);
  }

  function scrollHomepageToHero() {
    const targetTop = 0;
    const startTop = window.scrollY;
    const distance = targetTop - startTop;

    if (Math.abs(distance) < 2) {
      return;
    }

    const duration = Math.min(360, Math.max(180, Math.abs(distance) * 0.12));
    const startTime = window.performance.now();

    const animate = (time: number) => {
      const progress = Math.min(1, (time - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      window.scrollTo(0, startTop + distance * eased);

      if (progress < 1) {
        window.requestAnimationFrame(animate);
      }
    };

    window.requestAnimationFrame(animate);
  }

  function handleBrandClick(event: MouseEvent<HTMLAnchorElement>) {
    closeDesktopNavigation();
    if (mobileOpen || mobileClosing) {
      closeMobileNavigation();
    }

    const clickedPath = normalizePath(stripLocaleFromPathname(window.location.pathname || "/"));

    if (clickedPath !== "/") {
      return;
    }

    event.preventDefault();
    scrollHomepageToHero();
  }

  function openMobileNavigation() {
    if (mobileClosingTimerRef.current) {
      window.clearTimeout(mobileClosingTimerRef.current);
      mobileClosingTimerRef.current = null;
    }

    setMobileClosing(false);
    setMobileOpen(true);
    setMobileOpenBranch(null);
    setMobileProductFamilySlug(null);
  }

  useEffect(() => {
    const shouldKeepMobileNavOpen =
      window.sessionStorage.getItem("montelar-mobile-nav-open-after-locale") === "true";

    if (shouldKeepMobileNavOpen) {
      window.sessionStorage.removeItem("montelar-mobile-nav-open-after-locale");
      const frame = window.requestAnimationFrame(() => {
        setMobileClosing(false);
        setMobileOpen(true);
        setMobileOpenBranch(null);
        setMobileProductFamilySlug(null);
      });
      return () => window.cancelAnimationFrame(frame);
    }
    return undefined;
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextExperimentState = params.get("drawerExperiment") !== "classic";
    const frame = window.requestAnimationFrame(() => {
      setMobileDrawerProductPanelExperiment(nextExperimentState);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (mobileClosingTimerRef.current) {
          window.clearTimeout(mobileClosingTimerRef.current);
          mobileClosingTimerRef.current = null;
        }
        if (mobileOpen) {
          setMobileClosing(true);
          mobileClosingTimerRef.current = window.setTimeout(() => {
            setMobileClosing(false);
            mobileClosingTimerRef.current = null;
          }, 680);
        } else {
          setMobileClosing(false);
        }
        setMobileOpen(false);
        setMobileOpenBranch(null);
        setMobileProductDirectionSlug(null);
        setMobileProductFamilySlug(null);
        setDesktopOpenBranch(null);
        setSelectedProductDirectionSlug(null);
        setSelectedProductFamilySlug(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  useEffect(() => {
    return () => {
      if (mobileClosingTimerRef.current) {
        window.clearTimeout(mobileClosingTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    document.body.dataset.mobileNavOpen = mobileOpen ? "true" : "false";
    document.body.dataset.mobileNavClosing = mobileClosing ? "true" : "false";

    return () => {
      delete document.body.dataset.mobileNavOpen;
      delete document.body.dataset.mobileNavClosing;
    };
  }, [mobileOpen, mobileClosing]);

  return (
    <header
      className={`shell-header${isHomepage ? " is-home-header" : ""}`}
      data-qa="site-header"
    >
      <div className="site-header-bar">
        <Link
          aria-label={getLocaleCopy(uiLocale, {
            en: "Contact Montelar",
            de: "Montelar kontaktieren",
            es: "Contactar con Montelar",
            fr: "Contacter Montelar",
            zh: "联系 Montelar",
            ja: "Montelar に連絡",
            ru: "Связаться с Montelar",
          })}
          className="header-phone-link header-phone-link--mobile"
          href={withLocale(contactPage?.routePath ?? "/contact", uiLocale)}
          onClick={closeDesktopNavigation}
        >
          <svg
            aria-hidden="true"
            className="header-phone-icon"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="M12 3.6a8.4 8.4 0 1 0 0 16.8 8.4 8.4 0 0 0 0-16.8Z"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.55"
            />
            <path
              d="M3.9 12h16.2M12 3.6c2.1 2.2 3.2 5 3.2 8.4s-1.1 6.2-3.2 8.4c-2.1-2.2-3.2-5-3.2-8.4s1.1-6.2 3.2-8.4Z"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.55"
            />
          </svg>
        </Link>

        <div className="header-brand-block">
          <p className="eyebrow">{getLocaleCopy(uiLocale, {
            en: "Quiet luxury",
              de: "Stiller Luxus",
              es: "Lujo silencioso",
              fr: "Luxe discret",
              zh: "静奢",
              ja: "静かなラグジュアリー",
              ru: "Тихая роскошь",
            })}</p>
          <Link
            aria-label="Montelar"
            className="brand-mark"
            href={withLocale("/", uiLocale)}
            onClick={handleBrandClick}
          >
            <img
              alt="Montelar"
              className="brand-logo-image brand-logo-image--desktop"
              decoding="sync"
              draggable={false}
              fetchPriority="high"
              height={414}
              loading="eager"
              src="/images/brand/montelar-logo-gold-20260511.webp"
              translate="no"
              width={1826}
            />
            <img
              alt="Montelar"
              className="brand-logo-image brand-logo-image--mobile"
              decoding="sync"
              draggable={false}
              fetchPriority="high"
              height={150}
              loading="eager"
              src="/images/brand/montelar-wordmark-gold-20260515.webp"
              translate="no"
              width={1319}
            />
          </Link>
          <SloganComposition className="brand-slogan-composition" locale={uiLocale} />
          <p className="brand-copy">
            {getLocaleCopy(uiLocale, {
            en: "Systems for private cinema, reference sound and spatial media, composed around the room.",
              de: "Systeme für privates Kino, Referenzklang und räumliche Medien, um den Raum herum komponiert.",
              es: "Sistemas para cine privado, sonido de referencia y medios espaciales, compuestos alrededor del espacio.",
              fr: "Systèmes pour cinéma privé, son de référence et médias spatiaux, composés autour du lieu.",
              zh: "围绕空间组织的私人影院、参考级声音与空间媒体系统。",
              ja: "空間を中心に構成するプライベートシネマ、リファレンスサウンド、空間メディアのシステム。",
              ru: "Системы частного кинотеатра, референсного звука и пространственных медиа, собранные вокруг комнаты.",
            })}
          </p>
        </div>

        <div className="header-action-stack">
          <Link
            aria-label={getLocaleCopy(uiLocale, {
              en: "Contact Montelar",
              de: "Montelar kontaktieren",
              es: "Contactar con Montelar",
              fr: "Contacter Montelar",
              zh: "联系 Montelar",
              ja: "Montelar に連絡",
              ru: "Связаться с Montelar",
            })}
            className="header-phone-link header-phone-link--desktop"
            href={withLocale(contactPage?.routePath ?? "/contact", uiLocale)}
            onClick={closeDesktopNavigation}
          >
            <svg
              aria-hidden="true"
              className="header-phone-icon"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                d="M7.2 4.9 9.1 4c.8-.3 1.7.1 2 .9l.7 1.9c.2.6 0 1.3-.5 1.7l-1.1.9c.9 1.8 2.4 3.3 4.2 4.2l.9-1.1c.4-.5 1.1-.7 1.7-.5l1.9.7c.8.3 1.2 1.2.9 2l-.9 1.9c-.3.6-.9 1-1.6 1C11.1 17.5 6.5 12.9 6.5 6.7c0-.7.4-1.3 1-1.6Z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.7"
              />
            </svg>
          </Link>

          <div className="shell-chip-row">
            <span className="shell-chip">{getLocaleCopy(uiLocale, {
              en: "Locale",
              de: "Sprache",
              es: "Idioma",
              fr: "Langue",
              zh: "语言",
              ja: "言語",
              ru: "Язык",
            })} {uiLocale.toUpperCase()}</span>
            <span className="shell-chip">{getLocaleCopy(uiLocale, {
              en: "Private systems",
              de: "Private Systeme",
              es: "Sistemas privados",
              fr: "Systèmes privés",
              zh: "私享系统",
              ja: "プライベートシステム",
              ru: "Частные системы",
            })}</span>
          </div>

          <LocaleSwitcher className="header-locale-switcher" locale={uiLocale} />

          <div className="header-cta-row">
            <Link
              className="header-cta"
              href={withLocale(contactPage?.routePath ?? "/contact", uiLocale)}
              onClick={closeDesktopNavigation}
            >
              {getLocaleCopy(uiLocale, {
                en: "Request consultation",
                de: "Beratung anfragen",
                es: "Solicitar consulta",
                fr: "Demander une consultation",
                zh: "申请咨询",
                ja: "相談を依頼する",
                ru: "Консультация",
              })}
            </Link>
            <button
              aria-controls="mobile-site-navigation"
              aria-expanded={mobileOpen}
              aria-label={getLocaleCopy(uiLocale, {
                en: "Open menu",
                de: "Menü öffnen",
                es: "Abrir menú",
                fr: "Ouvrir le menu",
                zh: "打开菜单",
                ja: "メニューを開く",
                ru: "Открыть меню",
              })}
              className="mobile-nav-toggle"
              data-qa="mobile-nav-toggle"
              onClick={() => {
                if (mobileOpen) {
                  closeMobileNavigation();
                } else {
                  openMobileNavigation();
                }
              }}
              type="button"
            >
              <img
                alt=""
                aria-hidden="true"
                className="mobile-nav-toggle-mark"
                decoding="sync"
                draggable={false}
                fetchPriority="high"
                height={379}
                loading="eager"
                src="/images/brand/montelar-symbol-gold-20260515.webp"
                width={387}
              />
              <span className="sr-only">
                {getLocaleCopy(uiLocale, {
                  en: "Menu",
                  de: "Menü",
                  es: "Menú",
                  fr: "Menu",
                  zh: "菜单",
                  ja: "メニュー",
                  ru: "Меню",
                })}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div
        className="desktop-nav-frame"
        onMouseEnter={() => {
          if (activeDesktopBranch?.id === "products") {
            setSelectedProductDirectionSlug(null);
          }
        }}
        onMouseLeave={() => {
          setDesktopOpenBranch(null);
          setSelectedProductDirectionSlug(null);
          setSelectedProductFamilySlug(null);
        }}
      >
        <nav aria-label="Primary" className="desktop-nav" data-qa="desktop-nav">
          {desktopBranches.map((branch) => {
            const isActive = activeBranch === branch.id;
            const isOpen = activeDesktopBranch?.id === branch.id;

            return (
              <button
                aria-controls={`desktop-branch-${branch.id}`}
                aria-expanded={isOpen}
                className={`desktop-nav-trigger${isActive ? " is-active" : ""}`}
                data-qa={`nav-trigger-${branch.id}`}
                key={branch.id}
                onClick={() => openDesktopBranch(branch.id)}
                onFocus={() => openDesktopBranch(branch.id)}
                onMouseEnter={() => openDesktopBranch(branch.id)}
                type="button"
              >
                {branch.label}
              </button>
            );
          })}

          <Link
            className={`desktop-nav-link${matchesPath(currentPath, brandPage?.routePath ?? "/brand") ? " is-active" : ""}`}
            data-qa="nav-link-brand"
            href={withLocale(brandPage?.routePath ?? "/brand", uiLocale)}
            onClick={closeDesktopNavigation}
            onFocus={closeDesktopNavigation}
            onMouseEnter={closeDesktopNavigation}
          >
            {getLocaleCopy(uiLocale, {
              en: "Brand",
              de: "Marke",
              es: "Marca",
              fr: "Marque",
              zh: "品牌",
              ja: "ブランド",
              ru: "Бренд",
            })}
          </Link>

          <Link
            className={`desktop-nav-link${matchesPath(currentPath, "/projects") ? " is-active" : ""}`}
            data-qa="nav-link-projects"
            href={withLocale(projectsPage?.routePath ?? "/projects", uiLocale)}
            onClick={closeDesktopNavigation}
            onFocus={closeDesktopNavigation}
            onMouseEnter={closeDesktopNavigation}
          >
            {getLocaleCopy(uiLocale, {
              en: "Projects",
              de: "Projekte",
              es: "Proyectos",
              fr: "Projets",
              zh: "项目",
              ja: "プロジェクト",
              ru: "Проекты",
            })}
          </Link>

          <Link
            className={`desktop-nav-link${activeBranch === "contact" ? " is-active" : ""}`}
            data-qa="nav-link-contact"
            href={withLocale(contactPage?.routePath ?? "/contact", uiLocale)}
            onClick={closeDesktopNavigation}
            onFocus={closeDesktopNavigation}
            onMouseEnter={closeDesktopNavigation}
          >
            {getLocaleCopy(uiLocale, {
              en: "Contact",
              de: "Kontakt",
              es: "Contacto",
              fr: "Contact",
              zh: "联系",
              ja: "コンタクト",
              ru: "Контакты",
            })}
          </Link>
        </nav>

        {activeDesktopBranch?.id === "products" ? (
          <section
            className={`product-mega-panel${productPanelState}`}
            data-qa="desktop-panel-products"
            id="desktop-branch-products"
          >
            <div className="product-mega-rail" role="list">
              {productMenuDirections.map((direction) => {
                const isSelected = selectedProductDirection?.slug === direction.slug;

                return (
                  <Link
                    className={`product-mega-rail-item${isSelected ? " is-selected" : ""}`}
                    href={withLocale(direction.href, uiLocale)}
                    key={direction.id}
                    onClick={closeDesktopNavigation}
                    onFocus={() => {
                      setSelectedProductDirectionSlug(direction.slug);
                      setSelectedProductFamilySlug(null);
                    }}
                    onMouseEnter={() => {
                      setSelectedProductDirectionSlug(direction.slug);
                      setSelectedProductFamilySlug(null);
                    }}
                  >
                    <span className="product-mega-rail-label">{direction.label}</span>
                    <span className="product-mega-rail-copy">{direction.description}</span>
                  </Link>
                );
              })}
            </div>

            {selectedProductDirection ? (
              <div className="product-mega-rail product-mega-subcategory-column" role="list">
                {selectedProductHasFamilyLayer ? (
                  selectedProductDirection.families.map((item) => {
                    const familySlug = item.slug ?? item.id;
                    const isFamilySelected =
                      selectedProductFamilySlug === familySlug;

                    return (
                      <Link
                        className={`product-mega-rail-item product-mega-family-trigger${isFamilySelected ? " is-selected" : ""}`}
                        href={withLocale(item.href, uiLocale)}
                        key={item.id}
                        onClick={closeDesktopNavigation}
                        onFocus={() => setSelectedProductFamilySlug(familySlug)}
                        onMouseEnter={() => setSelectedProductFamilySlug(familySlug)}
                      >
                        <span className="product-mega-rail-label">
                          {item.label}
                        </span>
                      </Link>
                    );
                  })
                ) : selectedProductDirection.products.length > 0 ? (
                  <>
                    {selectedProductDirection.products.map((item) => (
                      <Link
                        className="product-mega-rail-item product-mega-product-trigger"
                        href={withLocale(item.href, uiLocale)}
                        key={item.id}
                        onClick={closeDesktopNavigation}
                      >
                        <span className="product-mega-rail-label">{item.label}</span>
                      </Link>
                    ))}
                  </>
                ) : (
                  selectedProductDirection.families.map((item) => (
                    <Link
                      className="product-mega-rail-item product-mega-family-trigger"
                      href={withLocale(item.href, uiLocale)}
                      key={item.id}
                      onClick={closeDesktopNavigation}
                    >
                      <span className="product-mega-rail-label">{item.label}</span>
                    </Link>
                  ))
                )}
              </div>
            ) : null}

            {selectedProductDirection && selectedProductHasFamilyLayer && selectedProductFamily ? (
              <div className="product-mega-rail product-mega-product-column product-mega-products-cascade">
                <div className="product-mega-link-list product-mega-products-list">
                  {selectedFamilyProducts.map((item) => (
                    <Link
                      className="product-mega-rail-item product-mega-product-trigger"
                      href={withLocale(item.href, uiLocale)}
                      key={item.id}
                      onClick={closeDesktopNavigation}
                    >
                      <span className="product-mega-rail-label">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : activeDesktopBranch ? (
          <section
            className="nav-branch-panel"
            data-qa={`desktop-panel-${activeDesktopBranch.id}`}
            id={`desktop-branch-${activeDesktopBranch.id}`}
          >
            <div className="nav-branch-intro">
              <p className="eyebrow">{activeDesktopBranch.label}</p>
              <p className="nav-branch-title">{activeDesktopBranch.title}</p>
              <p className="nav-branch-copy">{activeDesktopBranch.description}</p>
            </div>

            <div className="nav-branch-grid">
              {activeDesktopBranch.items.map((item) => (
                <Link
                  className="nav-branch-card"
                  href={withLocale(item.href, uiLocale)}
                  key={item.id}
                  onClick={closeDesktopNavigation}
                >
                  <span className="nav-branch-card-label">{item.label}</span>
                  <span className="nav-branch-card-description">
                    {item.description}
                  </span>
                  {item.meta ? (
                    <span className="nav-branch-card-meta">{item.meta}</span>
                  ) : null}
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <div className="header-presence-rail">
            <p className="eyebrow">{getLocaleCopy(uiLocale, {
              en: "Image, sound, design",
              de: "Bild, Klang, Design",
              es: "Imagen, sonido, diseno",
              fr: "Image, son, design",
              zh: "影像、声音与设计",
              ja: "映像、音、デザイン",
              ru: "Изображение, звук, дизайн",
            })}</p>
            <p className="shell-context-copy">
              {getLocaleCopy(uiLocale, {
                en: "Private cinema, reference audio, transparent media, hologram objects and exhibition surfaces stay close to the consultation path.",
                de: "Privates Kino, Referenz-Audio, transparente Medien, Hologrammobjekte und Ausstellungsflächen bleiben nah an der Beratung.",
                es: "Cine privado, audio de referencia, medios transparentes, objetos holográficos y superficies expositivas se mantienen cerca de la consulta.",
                fr: "Cinéma privé, audio de référence, médias transparents, objets holographiques et surfaces d'exposition restent proches de la consultation.",
                zh: "私人影院、参考级音响、透明媒介、全息对象与展陈表面，都与私享咨询保持紧密衔接。",
                ja: "プライベートシネマ、リファレンスオーディオ、透明メディア、ホログラム、展示面が相談の流れに近く収まります。",
                ru: "Частный кинотеатр, референсное аудио, прозрачные медиа, голограммные объекты и выставочные поверхности остаются рядом с консультацией.",
              })}
            </p>
          </div>
        )}
      </div>

      <div
        className={`mobile-nav-drawer${mobileOpen ? " is-open" : ""}${mobileClosing ? " is-closing" : ""}${mobileDrawerProductPanelExperiment ? " is-product-panel-experiment" : ""}`}
        data-qa="mobile-nav-drawer"
        id="mobile-site-navigation"
      >
        <div className="mobile-nav-header">
          <div className="mobile-nav-brand-lockup">
            <Link
              aria-label="Montelar"
              className="mobile-nav-brand-logo"
              href={withLocale("/", uiLocale)}
              onClick={closeMobileNavigation}
            >
              <img
                alt="Montelar"
                className="mobile-nav-logo-image"
                decoding="sync"
                draggable={false}
                fetchPriority="high"
                height={150}
                loading="eager"
                src="/images/brand/montelar-wordmark-gold-20260515.webp"
                translate="no"
                width={1319}
              />
            </Link>
          </div>
        </div>

        <nav aria-label={getLocaleCopy(uiLocale, {
          en: "Mobile primary",
          de: "Mobile Hauptnavigation",
          es: "Navegación móvil principal",
          fr: "Navigation mobile principale",
          zh: "移动主导航",
          ja: "モバイルメインナビゲーション",
          ru: "Основная мобильная навигация",
        })} className={`mobile-nav-list${activeMobileBranch ? " has-open-branch" : ""}${mobileProductDirectionSlug ? " has-product-direction" : ""}`}>
          {activeMobileBranch ? (
            <div className="mobile-branch-layer" id={`mobile-branch-${activeMobileBranch.id}`}>
              {mobileSelectedProductDirection ? (
                <>
                  <button
                    className="mobile-layer-back"
                    onClick={() => setMobileProductDirectionSlug(null)}
                    type="button"
                  >
                    <span aria-hidden="true">‹</span>
                    <span>{activeMobileBranch.label}</span>
                  </button>
                  <p className="mobile-layer-title">
                    {mobileSelectedProductDirection.label}
                  </p>
                  <div className="mobile-nav-link-list mobile-product-direction-links">
                    {mobileSelectedProductDirection.families.map((item) => (
                      <Link
                        className={`mobile-nav-link${item.slug === "__overview" ? " mobile-product-overview-link" : ""}`}
                        href={withLocale(item.href, uiLocale)}
                        key={item.id}
                        onClick={closeMobileNavigation}
                      >
                        <span className="nav-branch-card-label">
                          {item.label}
                        </span>
                      </Link>
                    ))}
                    {mobileSelectedProductDirection.families.length <= 1
                      ? mobileSelectedProductDirection.products.slice(0, 4).map((item) => (
                          <Link
                            className="mobile-nav-link mobile-product-link"
                            href={withLocale(item.href, uiLocale)}
                            key={item.id}
                            onClick={closeMobileNavigation}
                          >
                            <span className="nav-branch-card-label">
                              {item.label}
                            </span>
                          </Link>
                        ))
                      : null}
                  </div>
                </>
              ) : (
                <>
                  <button
                    className="mobile-layer-back"
                    onClick={() => {
                      setMobileOpenBranch(null);
                      setMobileProductDirectionSlug(null);
                      setMobileProductFamilySlug(null);
                    }}
                    type="button"
                  >
                    <span aria-hidden="true">‹</span>
                    <span>{getLocaleCopy(uiLocale, {
                      en: "Menu",
                      de: "Menü",
                      es: "Menú",
                      fr: "Menu",
                      zh: "菜单",
                      ja: "メニュー",
                      ru: "Меню",
                    })}</span>
                  </button>
                  <p className="mobile-layer-title">{activeMobileBranch.label}</p>
                  {activeMobileBranch.id === "products" ? (
                    <div className="mobile-product-direction-list">
                      {productMenuDirections.map((direction) => (
                        <button
                          className="mobile-product-direction-button"
                          key={direction.id}
                          onClick={() => {
                            setMobileProductDirectionSlug(direction.slug);
                            setMobileProductFamilySlug(null);
                          }}
                          type="button"
                        >
                          <span>{direction.label}</span>
                          <span aria-hidden="true">›</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="mobile-nav-link-list">
                      {activeMobileBranch.items.map((item) => (
                        <Link
                          className="mobile-nav-link"
                          href={withLocale(item.href, uiLocale)}
                          key={item.id}
                          onClick={closeMobileNavigation}
                        >
                          <span className="nav-branch-card-label">
                            {item.label}
                          </span>
                          {item.meta ? (
                            <span className="nav-branch-card-meta">{item.meta}</span>
                          ) : null}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <>
              <div
                className="mobile-product-accordion"
                data-qa="mobile-product-browser"
              >
                {productMenuDirections.map((direction) => {
                  const isDirectionOpen = mobileProductDirectionSlug === direction.slug;
                  const directionFamilies = direction.families.filter(
                    (family) => family.slug !== "__overview",
                  );

	                  return (
	                    <section
	                      className={`mobile-product-accordion-item${directionFamilies.length > 0 ? " has-families" : " has-direct-products"}${isDirectionOpen ? " is-open" : ""}`}
	                      key={direction.id}
	                    >
                      {["hologram", "pictorial-art-display", "living-glass"].includes(direction.slug) ? (
                        <Link
                          className="mobile-product-accordion-trigger"
                          href={withLocale(direction.href, uiLocale)}
                          onClick={closeMobileNavigation}
                        >
                          <span>{direction.label}</span>
                          <span aria-hidden="true">›</span>
                        </Link>
                      ) : (
                      <button
                        aria-expanded={isDirectionOpen}
	                        className="mobile-product-accordion-trigger"
	                        onClick={() => {
	                          const firstFamily = directionFamilies[0];
	                          const firstFamilyKey = firstFamily?.slug ?? firstFamily?.id ?? null;

	                          setMobileProductDirectionSlug(
	                            isDirectionOpen && directionFamilies.length > 0 && !mobileDrawerProductPanelExperiment
	                              ? null
	                              : direction.slug,
	                          );
	                          setMobileProductFamilySlug(
	                            mobileDrawerProductPanelExperiment && firstFamilyKey ? firstFamilyKey : null,
	                          );
	                        }}
                        type="button"
                      >
                        <span>{direction.label}</span>
                        <span aria-hidden="true">›</span>
                      </button>
                      )}

	                      {isDirectionOpen && (!mobileDrawerProductPanelExperiment || directionFamilies.length > 0) ? (
	                        <div className="mobile-product-accordion-panel">
                          {directionFamilies.length > 0 ? (
                            directionFamilies.map((family) => {
                              const familyKey = family.slug ?? family.id;
                              const isFamilyOpen = mobileProductFamilySlug === familyKey;
                              const familyProducts = direction.products.filter(
                                (product) => product.categorySlug === family.slug,
                              );

                              return (
                                <div
                                  className={`mobile-product-accordion-group${isFamilyOpen ? " is-open" : ""}`}
                                  key={family.id}
                                >
                                  <button
	                                    aria-expanded={isFamilyOpen}
	                                    className="mobile-product-accordion-subtrigger"
	                                    onClick={() =>
	                                      setMobileProductFamilySlug(
	                                        isFamilyOpen && !mobileDrawerProductPanelExperiment ? null : familyKey,
	                                      )
	                                    }
	                                    type="button"
                                  >
                                    <span>{family.label}</span>
                                    <span aria-hidden="true">›</span>
                                  </button>

                                  {isFamilyOpen && !mobileDrawerProductPanelExperiment ? (
                                    <div className="mobile-product-accordion-products">
                                      {familyProducts.length > 0 ? (
                                        familyProducts.map((product) => (
                                          <Link
                                            className="mobile-product-accordion-link"
                                            href={withLocale(product.href, uiLocale)}
                                            key={product.id}
                                            onClick={closeMobileNavigation}
                                          >
                                            <span>{product.label}</span>
                                          </Link>
                                        ))
                                      ) : (
                                        <Link
                                          className="mobile-product-accordion-link"
                                          href={withLocale(family.href, uiLocale)}
                                          onClick={closeMobileNavigation}
                                        >
                                          <span>{family.label}</span>
                                        </Link>
                                      )}
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })
                          ) : (
                            mobileDrawerProductPanelExperiment ? null : direction.products.map((product) => (
                              <Link
                                className="mobile-product-accordion-link"
                                href={withLocale(product.href, uiLocale)}
                                key={product.id}
                                onClick={closeMobileNavigation}
                              >
                                <span>{product.label}</span>
                              </Link>
                            ))
                          )}
                        </div>
                      ) : null}
                    </section>
                  );
	                })}
	              </div>
              {mobileDrawerProductPanelExperiment ? (
                <aside
                  aria-label={getLocaleCopy(uiLocale, {
                    en: "Products",
                    de: "Produkte",
                    es: "Productos",
                    fr: "Produits",
                    zh: "产品",
                    ja: "製品",
                    ru: "Продукты",
                  })}
                  className={`mobile-product-side-panel${mobileProductPanelTitle ? " has-selection" : " is-empty"}`}
                >
                  {mobileProductPanelTitle ? (
                    <>
                      <p className="mobile-product-side-panel-kicker">
	                        {mobileProductPanelShowsProducts
	                          ? getLocaleCopy(uiLocale, {
	                              en: "Products",
	                              de: "Produkte",
	                              es: "Productos",
	                              fr: "Produits",
	                              zh: "产品",
	                              ja: "製品",
	                              ru: "Продукты",
	                            })
	                          : getLocaleCopy(uiLocale, {
	                              en: "Selection",
	                              de: "Auswahl",
	                              es: "Selección",
	                              fr: "Sélection",
	                              zh: "精选",
	                              ja: "セレクション",
	                              ru: "Выбор",
	                            })}
                      </p>
                      <p className="mobile-product-side-panel-title">{mobileProductPanelTitle}</p>
                      <div className="mobile-product-side-panel-links">
                        {mobileProductPanelItems.length > 0 ? (
                          mobileProductPanelItems.map((product) => (
                            <Link
                              className="mobile-product-side-panel-link"
                              href={withLocale(product.href, uiLocale)}
                              key={product.id}
                              onClick={closeMobileNavigation}
                            >
                              <span>{product.label}</span>
                            </Link>
                          ))
                        ) : mobileProductPanelFallbackLink ? (
                          <Link
                            className="mobile-product-side-panel-link"
                            href={withLocale(mobileProductPanelFallbackLink.href, uiLocale)}
                            onClick={closeMobileNavigation}
                          >
                            <span>{mobileProductPanelFallbackLink.label}</span>
                          </Link>
                        ) : (
                          <span className="mobile-product-side-panel-empty">
                            {getLocaleCopy(uiLocale, {
                              en: "Products in this family",
                              de: "Produkte dieser Familie",
                              es: "Productos de esta familia",
                              fr: "Produits de cette famille",
                              zh: "该系列的产品",
                              ja: "このファミリーの製品",
                              ru: "Продукты этой семьи",
                            })}
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <span className="mobile-product-side-panel-empty">
                      {getLocaleCopy(uiLocale, {
                        en: "Cinema, audio and media systems",
                        de: "Kino-, Audio- und Mediensysteme",
                        es: "Sistemas de cine, audio y medios",
                        fr: "Systemes cinema, audio et medias",
                        zh: "影院、音响与媒介系统",
                        ja: "シネマ、オーディオ、メディアシステム",
                        ru: "Кино, звук и медиа-системы",
                      })}
                    </span>
                  )}
                </aside>
              ) : null}
            </>
          )}
        </nav>



        <div
          aria-label={getLocaleCopy(uiLocale, {
            en: "Mobile secondary navigation",
            de: "Mobile Sekundärnavigation",
            es: "Navegación móvil secundaria",
            fr: "Navigation mobile secondaire",
            zh: "移动辅助导航",
            ja: "モバイル補助ナビゲーション",
            ru: "Дополнительная мобильная навигация",
          })}
          className="mobile-nav-bottom-links"
        >
          <Link
            className={`mobile-nav-bottom-link${matchesPath(currentPath, brandPage?.routePath ?? "/brand") ? " is-active" : ""}`}
            href={withLocale(brandPage?.routePath ?? "/brand", uiLocale)}
            onClick={closeMobileNavigation}
          >
            {getLocaleCopy(uiLocale, {
              en: "Brand",
              de: "Marke",
              es: "Marca",
              fr: "Marque",
              zh: "品牌",
              ja: "ブランド",
              ru: "Бренд",
            })}
          </Link>
          <Link
            className={`mobile-nav-bottom-link${matchesPath(currentPath, "/projects") ? " is-active" : ""}`}
            href={withLocale(projectsPage?.routePath ?? "/projects", uiLocale)}
            onClick={closeMobileNavigation}
          >
            {getLocaleCopy(uiLocale, {
              en: "Projects",
              de: "Projekte",
              es: "Proyectos",
              fr: "Projets",
              zh: "项目",
              ja: "プロジェクト",
              ru: "Проекты",
            })}
          </Link>
          <Link
            className={`mobile-nav-bottom-link${activeBranch === "contact" ? " is-active" : ""}`}
            href={withLocale(contactPage?.routePath ?? "/contact", uiLocale)}
            onClick={closeMobileNavigation}
          >
            {getLocaleCopy(uiLocale, {
              en: "Contact",
              de: "Kontakt",
              es: "Contacto",
              fr: "Contact",
              zh: "联系",
              ja: "コンタクト",
              ru: "Контакты",
            })}
          </Link>
        </div>
      </div>

      <button
        aria-hidden={!mobileNavigationVisible}
        className={`mobile-nav-backdrop${mobileOpen ? " is-open" : ""}${mobileClosing ? " is-closing" : ""}`}
        onClick={closeMobileNavigation}
        tabIndex={mobileNavigationVisible ? 0 : -1}
        type="button"
      >
        <span className="sr-only">{getLocaleCopy(uiLocale, {
          en: "Close mobile navigation",
          de: "Mobile Navigation schließen",
          es: "Cerrar navegación móvil",
          fr: "Fermer la navigation mobile",
          zh: "关闭移动导航",
          ja: "モバイルナビゲーションを閉じる",
          ru: "Закрыть мобильную навигацию",
        })}</span>
      </button>
    </header>
  );
}
