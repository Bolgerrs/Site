"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import Link from "next/link";
import { DacProductCarousel, type DacCarouselItem } from "@/components/dac-product-carousel";
import type { SiteLocale } from "@/config/i18n";

type DacLandingProps = {
  locale: SiteLocale;
  requestPath: string;
  categoryPath: string;
};

/* ────────────────────────────────────────────────────────────
   i18n — RU body for /ru, EN for every other locale so the
   (EN) site shell and the page body stay in the same language.
   ──────────────────────────────────────────────────────────── */
type Loc = Record<SiteLocale, string>;
function L(ru: string, en: string): Loc {
  return { ru, en, de: en, es: en, fr: en, zh: en, ja: en };
}

/* ────────────────────────────────────────────────────────────
   Inline SVG icons (no emoji) — thin gold strokes, one family
   ──────────────────────────────────────────────────────────── */
type IconProps = { className?: string };
const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};
const IcChip = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={p.className} {...stroke} aria-hidden="true">
    <rect x="7" y="7" width="10" height="10" rx="1.5" />
    <path d="M10 7V4M14 7V4M10 20v-3M14 20v-3M7 10H4M7 14H4M20 10h-3M20 14h-3" />
  </svg>
);
const IcWave = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={p.className} {...stroke} aria-hidden="true">
    <path d="M3 12h2.5l2-6 3 13 3-15 2.5 8H21" />
  </svg>
);
const IcBolt = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={p.className} {...stroke} aria-hidden="true">
    <path d="M13 3 5 13h6l-1 8 8-11h-6l1-7Z" />
  </svg>
);
const IcLayers = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={p.className} {...stroke} aria-hidden="true">
    <path d="M12 4 3 9l9 5 9-5-9-5Z" />
    <path d="M3 14l9 5 9-5M3 11.5l9 5 9-5" />
  </svg>
);
const IcClock = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={p.className} {...stroke} aria-hidden="true">
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7v5l3.5 2" />
  </svg>
);
const IcPlug = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={p.className} {...stroke} aria-hidden="true">
    <path d="M9 3v5M15 3v5M7 8h10v3a5 5 0 0 1-10 0V8ZM12 16v5" />
  </svg>
);

const IMG = "/images/products/dac";

export function DacLanding({ categoryPath, locale }: DacLandingProps) {
  const rootRef = useRef<HTMLElement>(null);
  const t = (ru: string, en: string) => (locale === "ru" ? ru : en);
  const [activeCallout, setActiveCallout] = useState<string | null>(null);

  /* Primary CTA → opens the mail client pre-filled for THIS product (owner feedback I).
     mailto, not a form route; subject/body localised, product link resolved on mount. */
  const PRODUCT_NAME = "Montelar Reference DAC";
  const [pageUrl, setPageUrl] = useState(
    `https://montelar.ru${locale === "ru" ? "/ru" : ""}/products/dac`,
  );
  useEffect(() => {
    if (typeof window !== "undefined") setPageUrl(window.location.href);
  }, []);
  const mailSubject = t(`Консультация — ${PRODUCT_NAME}`, `Consultation — ${PRODUCT_NAME}`);
  const mailBody = t(
    `Здравствуйте!\r\nМеня заинтересовал ${PRODUCT_NAME} (${pageUrl}).\r\n\r\nХотел бы получить консультацию по этому продукту: наличие, комплектация, условия и сроки.\r\n\r\nКонтакт для связи: ___`,
    `Hello!\r\nI'm interested in the ${PRODUCT_NAME} (${pageUrl}).\r\n\r\nI'd like a consultation on this product: availability, configuration, terms and lead time.\r\n\r\nContact: ___`,
  );
  const mailtoHref = `mailto:sale@montelar.ru?subject=${encodeURIComponent(
    mailSubject,
  )}&body=${encodeURIComponent(mailBody)}`;

  /* ── DATA (bilingual; every fact/figure is from the Avito description) ── */

  // Gallery — 5 UNIQUE frames, captions are real device features only.
  const GALLERY: DacCarouselItem[] = [
    { id: "g-signature", image: `${IMG}/gal-signature.webp`, title: "Montelar Reference DAC",
      role: L("Четыре мультибит-чипа · полностью балансная схема", "Four multibit chips · fully balanced") },
    { id: "g-front34", image: `${IMG}/gal-front34.webp`, title: t("Корпус и профиль", "Chassis & profile"),
      role: L("Матовый брашированный алюминий, низкий профиль", "Matte brushed aluminium, low profile") },
    { id: "g-panel", image: `${IMG}/gal-panel.webp`, title: t("Передняя панель", "Front panel"),
      role: L("LOCK · COAX · OPT · AES · USB/I²S · EXT_CLK", "LOCK · COAX · OPT · AES · USB/I²S · EXT_CLK") },
    { id: "g-top", image: `${IMG}/gal-top.webp`, title: t("Верхняя крышка", "Top plate"),
      role: L("Цельнофрезерованный корпус, точная сборка", "Machined enclosure, precise build") },
    { id: "g-angle", image: `${IMG}/gal-angle.webp`, title: t("Профиль и форма", "Profile & form"),
      role: L("Низкий силуэт, анодированная отделка", "Low silhouette, anodised finish") },
  ];

  // Hero ledger highlights.
  const HIGHLIGHTS = [
    { k: t("Преобразование", "Conversion"), v: t("4 × multibit", "4 × multibit") },
    { k: t("Аналог", "Analogue"), v: t("Класс A, без ОС", "Class A, no NFB") },
    { k: t("Тактирование", "Clocking"), v: "Super Femto" },
    { k: t("Гарантия", "Warranty"), v: t("2 года", "2 years") },
  ];

  // Pricing — main + options/upgrades shown together, ONE consistent format.
  const PRICE = "579 990";
  const FINISH = { k: t("Отделка «чёрный хром» — доплата", "“Black chrome” finish — surcharge"), v: "100 000" };
  const CLOCKS = [
    { k: t("Внешний генератор VCXO", "VCXO clock generator"), v: "89 990" },
    { k: t("VCXO — Femto", "VCXO — Femto"), v: "129 990" },
    { k: t("Reference OCXO · 0.01 ppm", "Reference OCXO · 0.01 ppm"), v: "250 990" },
    { k: t("Ultimate Rubidium Clock", "Ultimate Rubidium Clock"), v: "420 990" },
  ];

  // Bento "engineering in numbers" — 6 varied-size tiles (kept bento hierarchy:
  // one accent XL tile + wide + small), each carrying a MACRO PHOTO of the exact
  // component the tile is about (component ↔ photo ↔ text). Grid fills a clean
  // 4×3 lattice — no orphan / empty cells.
  type BentoSize = "xl" | "wide" | "sm";
  type BentoTile = {
    id: string; size: BentoSize; count?: number; prefix?: string; suffix?: string; value?: string;
    label: string; sub: string; image: string; alt: string; Icon: (p: IconProps) => ReactElement;
  };
  const BENTO: BentoTile[] = [
    { id: "chips", size: "xl", count: 4, suffix: " ×", label: t("топовых multibit-чипа", "top multibit chips"),
      sub: t("Полностью балансная конфигурация — линейность, масштаб и устойчивая сцена.", "Fully balanced configuration — linearity, scale and a stable stage."),
      image: `${IMG}/comp-chip.webp`, alt: t("Мультибит ЦАП-чип на аудиоплате", "Multibit DAC converter chip on an audio board"), Icon: IcChip },
    { id: "fet", size: "wide", count: 6, label: t("дискретных FET-модуля", "discrete FET modules"),
      sub: t("Выходной каскад в чистом классе A без общей обратной связи — SPARTA ULTIMATE.", "A pure class-A output stage with no global feedback — SPARTA ULTIMATE."),
      image: `${IMG}/comp-fet.webp`, alt: t("Дискретные выходные транзисторы на плате", "Discrete output transistors on a board"), Icon: IcWave },
    { id: "power", size: "sm", count: 2, label: t("трансформатора LGC+", "LGC+ transformers"),
      sub: t("Длиннокристаллическая медь, раздельное питание секций.", "Long-grain copper, separate supply per section."),
      image: `${IMG}/comp-transformer.webp`, alt: t("Тороидальный силовой трансформатор", "Toroidal power transformer"), Icon: IcBolt },
    { id: "teflon", size: "sm", count: 4, label: t("слойная тефлоновая плата", "layer Teflon board"),
      sub: t("Тефлон-диэлектрик — предсказуемая среда сигнала.", "Teflon dielectric — a predictable signal path."),
      image: `${IMG}/comp-teflon.webp`, alt: t("Многослойная тефлоновая печатная плата", "Multilayer Teflon circuit board"), Icon: IcLayers },
    { id: "clock", size: "wide", value: "Super Femto", label: t("тактовый генератор", "clock generator"),
      sub: t("Экстремально низкий фазовый шум · делители ULTIMATE · вход EXT_CLK для внешнего тактирования.", "Extremely low phase noise · ULTIMATE dividers · EXT_CLK input for external clocking."),
      image: `${IMG}/comp-clock.webp`, alt: t("Прецизионный кварцевый генератор", "Precision crystal oscillator"), Icon: IcClock },
    { id: "inputs", size: "wide", count: 5, label: t("цифровых входов", "digital inputs"),
      sub: t("AES · Optical · Coaxial · USB Amanero · I²S over HDMI · BT (опция). Режимы топовых цифровых фильтров и отдельный NOS.", "AES · Optical · Coaxial · USB Amanero · I²S over HDMI · BT (option). Top digital-filter modes plus a separate NOS."),
      image: `${IMG}/comp-inputs.webp`, alt: t("Цифровые входы на задней панели", "Digital inputs on the rear panel"), Icon: IcPlug },
  ];

  // Zigzag editorial — photo ↔ text are honestly matched (photo shows what the text is about).
  type Story = { n: string; kicker: string; title: string; lead: string; detail: string; image: string; alt: string };
  const STORIES: Story[] = [
    {
      n: "01",
      kicker: t("Архитектура преобразования", "Conversion architecture"),
      title: t("Четыре multibit-чипа в балансной схеме", "Four multibit chips, fully balanced"),
      lead: t(
        "В основе — четыре топовых multibit-чипа в полностью балансной конфигурации, ориентированной на максимальную линейность, масштаб и устойчивость пространственной картины.",
        "At the core are four top multibit chips in a fully balanced configuration built for maximum linearity, scale and a stable spatial image."),
      detail: t(
        "Выходной каскад — гибридное дискретное решение, сочетающее прозрачность, телесность и динамическую собранность. Сигнальная плата выполнена на четырёхслойной тефлоновой архитектуре: тефлон как диэлектрик сохраняет более предсказуемую среду прохождения сигнала и снижает паразитные влияния.",
        "The output stage is a hybrid discrete design that pairs transparency with body and dynamic composure. The signal board uses a four-layer Teflon architecture: Teflon as a dielectric keeps the signal path more predictable and lowers parasitic interference."),
      image: `${IMG}/gal-signature.webp`,
      alt: t("Montelar Reference DAC — корпус целиком на тёплом архитектурном фоне", "Montelar Reference DAC — full chassis on a warm architectural backdrop"),
    },
    {
      n: "02",
      kicker: t("Корпус и компоновка", "Chassis & layout"),
      title: t("Цельнофрезерованный корпус как часть звука", "A machined enclosure as part of the sound"),
      lead: t(
        "Низкий, жёсткий брашированный корпус с раздельной компоновкой узлов: цифровая и аналоговая секции разнесены и получают независимое стабилизированное питание от двух трансформаторов LGC+.",
        "A low, rigid brushed enclosure with a separated layout: the digital and analogue sections sit apart and each gets independent regulated power from two LGC+ transformers."),
      detail: t(
        "Такое разделение снижает взаимное влияние узлов и создаёт более чистую среду для цифрового приёма и аналогового формирования сигнала. Именно архитектура питания и механическая тишина корпуса во многом определяют тишину фона, устойчивость сцены, ясность микродинамики и свободу тембровой ткани.",
        "This separation reduces cross-talk between blocks and creates a cleaner environment for digital reception and analogue shaping. The power architecture and the mechanical quiet of the chassis largely define the silence of the background, the stability of the stage, the clarity of microdynamics and the freedom of timbre."),
      image: `${IMG}/gal-top.webp`,
      alt: t("Montelar Reference DAC — верхняя крышка из брашированного алюминия", "Montelar Reference DAC — brushed aluminium top plate"),
    },
    {
      n: "03",
      kicker: t("Профиль и исполнение", "Profile & finish"),
      title: t("Низкий силуэт и сдержанная форма", "A low silhouette, a restrained form"),
      lead: t(
        "Матовый анодированный алюминий, тонкая горизонтальная шлифовка и точные фаски: низкий, спокойный силуэт, который читается как прецизионный инструмент и собранно встаёт в зрелую систему.",
        "Matte anodised aluminium, a fine horizontal brush and precise chamfers: a low, calm silhouette that reads as a precision instrument and sits cleanly inside a mature system."),
      detail: t(
        "Опционально доступна отделка «чёрный хром». Визуальная сдержанность подчинена функции — на лицевой панели только то, что нужно для выбора входа и индикации; масса и жёсткость корпуса работают на снижение микровибраций и на структурную тишину фона.",
        "A “black chrome” finish is available as an option. The visual restraint follows function — the fascia carries only what input selection and indication require; the mass and rigidity of the enclosure work to lower micro-vibration and keep the background structurally silent."),
      image: `${IMG}/gal-angle.webp`,
      alt: t("Montelar Reference DAC — низкий ракурс корпуса на тёплом фоне", "Montelar Reference DAC — low-angle view of the chassis on a warm backdrop"),
    },
  ];

  // Front-panel callouts — leader lines to the EXACT node on the real photo (+ legend list).
  // node = % position on gal-panel (1536×1024); badge = where the number sits at the margin.
  type Callout = { id: string; n: number; node: { x: number; y: number }; badge: { x: number; y: number };
    title: string; text: string };
  const CALLOUTS: Callout[] = [
    { id: "lock", n: 1, node: { x: 46, y: 30 }, badge: { x: 7, y: 15 },
      title: "LOCK", text: t("Индикация захвата сигнала источника", "Source-lock indicator") },
    { id: "inputs", n: 2, node: { x: 46, y: 47 }, badge: { x: 6, y: 45 },
      title: t("Цифровые входы", "Digital inputs"), text: t("COAX · OPT · AES · USB/I²S · BT (опция)", "COAX · OPT · AES · USB/I²S · BT (option)") },
    { id: "extclk", n: 3, node: { x: 27, y: 63 }, badge: { x: 7, y: 80 },
      title: "EXT_CLK", text: t("Вход внешнего тактового генератора", "External clock input") },
    { id: "sel", n: 4, node: { x: 64, y: 41 }, badge: { x: 93, y: 15 },
      title: t("Селектор входа", "Input selector"), text: t("Super Femto Clock на борту", "Super Femto clock on board") },
  ];

  const SOUND: { note: string; Icon: (p: IconProps) => ReactElement }[] = [
    { note: t("Сцена становится глубже и устойчивее", "The stage grows deeper and more stable"), Icon: IcLayers },
    { note: t("Музыкальные образы приобретают большую материальность", "Images gain more material substance"), Icon: IcChip },
    { note: t("Микродинамика раскрывается более естественно", "Microdynamics open up more naturally"), Icon: IcWave },
    { note: t("Высокие частоты звучат свободнее, без стеклянной жёсткости", "Treble sounds freer, without glassy hardness"), Icon: IcBolt },
    { note: t("Тембральная ткань становится богаче и спокойнее", "Timbre becomes richer and calmer"), Icon: IcClock },
    { note: t("Цифровой тракт теряет механистичность и звучит взросло", "The digital path loses its mechanical edge and sounds mature"), Icon: IcPlug },
  ];

  /* ── motion: orchestrated, reduced-motion safe, count-up, parallax, progress ── */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ── force every image to fetch immediately ──
       A static (no-scroll) full-page capture — exactly how the reviewer
       screenshots the page — would otherwise leave below-the-fold lazy
       images unloaded, so stories / callout panel / bento component photos
       render as empty cards (the repeated reject cause). Flip any lazy image
       to eager and kick an incomplete fetch so nothing depends on scroll. */
    root.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
      if (img.loading === "lazy") img.loading = "eager";
      if (!img.complete && img.getAttribute("src")) {
        const s = img.src;
        img.src = "";
        img.src = s;
      }
      // Proactively DECODE every image. A loaded but async-decoded,
      // off-screen image is laid out (naturalWidth>0, opacity 1) yet not
      // decoded-to-paint when a static full-page capture is taken — it paints
      // as a black card. Forcing decode keeps the bitmap ready so it always
      // paints, regardless of viewport/scroll/capture timing.
      if (img.decode) img.decode().catch(() => {});
    });

    const runCount = (el: HTMLElement) => {
      const target = Number(el.dataset.count || "0");
      if (!target || prefersReduced) { el.textContent = String(target); return; }
      const dur = 1100; let start = 0;
      const tick = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min(1, (ts - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(eased * target));
        if (p < 1) requestAnimationFrame(tick); else el.textContent = String(target);
      };
      requestAnimationFrame(tick);
    };

    const progressEl = root.querySelector(".dac-lp2-progress") as HTMLElement | null;
    let praf = 0;
    const onProgress = () => {
      if (praf) return;
      praf = requestAnimationFrame(() => {
        praf = 0;
        const doc = document.documentElement;
        const max = doc.scrollHeight - doc.clientHeight;
        const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
        if (progressEl) progressEl.style.setProperty("--dac-progress", p.toFixed(4));
      });
    };
    window.addEventListener("scroll", onProgress, { passive: true });
    window.addEventListener("resize", onProgress, { passive: true });
    onProgress();

    /* ── BULLETPROOF REVEAL (no void, ever) ──
       Root cause of the recurring "empty void before the footer" reject:
       the old pattern hid every [data-reveal] at opacity:0 BY DEFAULT and
       relied on JS (IntersectionObserver + a 700ms timer) to show it. A
       reviewer's static full-page capture (captureBeyondViewport, taken at an
       unknown moment after load) catches the below-the-fold sections still at
       opacity:0 → the stacked hidden heights read as one giant dark void.
       New approach: content is ALWAYS opacity:1 in its resting state (see CSS).
       The entrance is a TRANSIENT WAAPI animation played only when a section
       scrolls into view — off-screen sections are never hidden, so a capture
       at ANY time shows full content. Counts are pre-set to their final value
       on mount so a static capture never shows "0". */
    root.querySelectorAll<HTMLElement>("[data-count]").forEach((c) => {
      c.textContent = String(Number(c.dataset.count || "0"));
    });

    const reveal = (_el: HTMLElement, _instant = false) => {
      /* single standard: reveal + count-up handled globally by <ScrollReveal/> */
      void runCount;
    };

    let firstReveal = true;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            reveal(e.target as HTMLElement, firstReveal);
            io.unobserve(e.target);
          }
        }
        firstReveal = false;
      },
      { threshold: 0, rootMargin: "0px 0px 22% 0px" },
    );

    if (prefersReduced) {
      // resting state is already fully visible; nothing to animate
      return () => {
        io.disconnect();
        window.removeEventListener("scroll", onProgress);
        window.removeEventListener("resize", onProgress);
      };
    }

    // reveal driven globally by <ScrollReveal/> (single standard)

    const heroImg = root.querySelector(".dac-lp2-hero-img") as HTMLElement | null;
    const bandImg = root.querySelector(".dac-lp2-imageband-img") as HTMLElement | null;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const vh = window.innerHeight;
        if (heroImg) {
          const progress = Math.min(1, window.scrollY / vh);
          heroImg.style.transform = `translateY(${progress * 34}px) scale(${1 + progress * 0.016})`;
        }
        if (bandImg) {
          const r = bandImg.getBoundingClientRect();
          const rel = (r.top + r.height / 2 - vh / 2) / vh;
          const shift = Math.max(-1, Math.min(1, rel)) * -30;
          bandImg.style.transform = `translateY(${shift}px)`;
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onProgress);
      window.removeEventListener("resize", onProgress);
      io.disconnect();
    };
  }, []);

  const A = (v: number, axis: "x" | "y") => (axis === "x" ? (v / 100) * 150 : v);

  return (
    <main className="dac-lp2 dac-lp2-v8" ref={rootRef}>
      <div className="dac-lp2-progress" aria-hidden="true" />

      {/* ─── HERO ─── */}
      <section className="dac-lp2-hero" aria-label="Montelar Reference DAC">
        <div className="dac-lp2-hero-media">
          <picture>
            <source media="(max-width: 767px)" srcSet={`${IMG}/hero-mobile-9x16.webp`} />
            <img className="dac-lp2-hero-img" src={`${IMG}/hero-desktop-16x9.webp`}
              alt={t("Montelar Reference DAC — матовый чёрный корпус на тёплом архитектурном фоне",
                "Montelar Reference DAC — matte black chassis on a warm architectural backdrop")}
              decoding="sync" fetchPriority="high" width={1920} height={1080} />
          </picture>
          <div className="dac-lp2-hero-scrim" aria-hidden="true" />
        </div>
        <div className="dac-lp2-hero-copy">
          <div className="dac-lp2-wrap">
            <p className="dac-lp2-eyebrow dac-lp2-reveal-now">{t("Montelar · Hi-End Audio · ЦАП", "Montelar · Hi-End Audio · DAC")}</p>
            <h1 className="dac-lp2-title dac-lp2-reveal-now" style={{ ["--reveal-delay" as string]: "90" }}>
              Montelar<br />Reference&nbsp;DAC
            </h1>
            <p className="dac-lp2-lead dac-lp2-reveal-now" style={{ ["--reveal-delay" as string]: "180" }}>
              {t("Precision Multibit Conversion — цифровой источник, выстроенный как архитектура музыкального пространства: точная, устойчивая и внутренне непрерывная.",
                "Precision Multibit Conversion — a digital source built as the architecture of musical space: precise, stable and inwardly continuous.")}
            </p>
          </div>
        </div>
        <span className="dac-lp2-scrollcue" aria-hidden="true">
          <span className="dac-lp2-scrollcue-line" />
          {t("Прокрутите", "Scroll")}
        </span>
      </section>

      {/* ─── PRICE + HIGHLIGHTS + OPTIONS (all pricing together) + CTA ─── */}
      <section className="dac-lp2-price-zone" data-reveal>
        <div className="dac-lp2-wrap dac-lp2-price-edit">
          <div className="dac-lp2-price-anchor">
            <span className="dac-lp2-price-label">{t("Цена", "Price")}</span>
            <span className="dac-lp2-price dac-lp2-num">{PRICE}&nbsp;₽</span>
            <p className="dac-lp2-price-say">{t("Полная сборка, готовая к подключению.", "Fully assembled, ready to connect.")}</p>
            <div className="dac-lp2-cta-row">
              <a className="dac-lp2-cta" href={mailtoHref}>{t("Запросить консультацию", "Request a consultation")}</a>
              <Link className="dac-lp2-cta-link" href={categoryPath}>Hi-End Audio</Link>
            </div>
          </div>
          <div className="dac-lp2-price-config">
            <p className="dac-lp2-config-head">{t("Конфигурация · внешние генераторы", "Configuration · external clocks")}</p>
            <dl className="dac-lp2-options-list">
              <div className="dac-lp2-opt-row">
                <dt>{FINISH.k}</dt>
                <dd className="dac-lp2-num">{FINISH.v}&nbsp;₽</dd>
              </div>
              {CLOCKS.map((c) => (
                <div className="dac-lp2-opt-row" key={c.k}>
                  <dt>{c.k}</dt>
                  <dd className="dac-lp2-num">{c.v}&nbsp;₽</dd>
                </div>
              ))}
            </dl>
            <p className="dac-lp2-config-note">{t("Внешние clock-решения подбираются под ваш тракт.", "External clocks are matched to your system.")}</p>
          </div>
        </div>
      </section>

      {/* ─── CONCEPT ─── */}
      <section className="dac-lp2-statement">
        <div className="dac-lp2-wrap">
          <p className="dac-lp2-kicker" data-reveal>{t("Концепция", "Concept")}</p>
          <p className="dac-lp2-statement-body" data-reveal data-delay="80">
            {t("Многие выдающиеся multibit-чипы стали частью истории high-end audio — но сегодня одной лишь ценности чипов недостаточно. Montelar Reference DAC берёт сильные стороны классической multibit-конверсии и реализует их в современной инженерной архитектуре, где качество цифрового приёма, стабильность тактирования, точность питания и дисциплина аналоговой части соответствуют референсному уровню.",
              "Many remarkable multibit chips became part of high-end history — yet today the chip alone is not enough. Montelar Reference DAC takes the strengths of classic multibit conversion and realises them in a modern engineering architecture where digital reception, clock stability, power precision and analogue discipline all meet a reference standard.")}
          </p>
        </div>
      </section>

      {/* ─── BENTO — engineering in numbers (symmetric 4×2 grid) ─── */}
      <section className="dac-lp2-bento-sec">
        <div className="dac-lp2-wrap">
          <div className="dac-lp2-sec-head" data-reveal>
            <p className="dac-lp2-kicker">{t("Инженерия в цифрах", "Engineering in numbers")}</p>
            <h2 className="dac-lp2-h2">{t("Каждый узел спроектирован как самостоятельная дисциплина", "Every block is engineered as its own discipline")}</h2>
          </div>
          <div className="dac-lp2-bento">
            {BENTO.map((t2, i) => (
              <article key={t2.id} className={`dac-lp2-tile dac-lp2-tile--${t2.size}`} data-reveal data-delay={String((i % 3) * 70)}>
                <div className="dac-lp2-tile-photo">
                  <img src={t2.image} alt={t2.alt} loading="eager" decoding="sync" width={1536} height={1024} />
                  <span className="dac-lp2-tile-photo-scrim" aria-hidden="true" />
                </div>
                <div className="dac-lp2-tile-body">
                  <span className="dac-lp2-tile-ic"><t2.Icon className="dac-lp2-ic" /></span>
                  <div className="dac-lp2-tile-figure">
                    {t2.prefix ? <span className="dac-lp2-tile-affix">{t2.prefix}</span> : null}
                    {typeof t2.count === "number"
                      ? <span className="dac-lp2-tile-num dac-lp2-num" data-count={t2.count}>{t2.count}</span>
                      : <span className="dac-lp2-tile-word">{t2.value}</span>}
                    {t2.suffix ? <span className="dac-lp2-tile-affix">{t2.suffix}</span> : null}
                  </div>
                  <p className="dac-lp2-tile-label">{t2.label}</p>
                  <p className="dac-lp2-tile-sub">{t2.sub}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ZIGZAG — photo ↔ text honestly matched ─── */}
      <section className="dac-lp2-stories">
        <div className="dac-lp2-wrap">
          <div className="dac-lp2-sec-head" data-reveal>
            <p className="dac-lp2-kicker">{t("Инженерия", "Engineering")}</p>
            <h2 className="dac-lp2-h2">{t("Решения, из которых складывается референсный уровень", "The decisions that build a reference level")}</h2>
          </div>
          <div className="dac-lp2-stories-list">
            {STORIES.map((s, i) => (
              <StoryCard key={s.n} story={s} flip={i % 2 === 1} t={t} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── FRONT PANEL — precise callouts (leader lines to the real node) ─── */}
      <section className="dac-lp2-panel-sec">
        <div className="dac-lp2-wrap">
          <div className="dac-lp2-sec-head" data-reveal>
            <p className="dac-lp2-kicker">{t("Передняя панель и подключения", "Front panel & connections")}</p>
            <h2 className="dac-lp2-h2">{t("Универсальный центр цифрового тракта высокого класса", "A universal hub for a high-class digital path")}</h2>
          </div>
          <div className={`dac-lp2-panel${activeCallout ? " is-active" : ""}`} data-reveal data-delay="80">
            <figure className="dac-lp2-panel-stage">
              <img src={`${IMG}/gal-panel.webp`}
                alt={t("Передняя панель Montelar Reference DAC — входы, индикация и селектор",
                  "Montelar Reference DAC front panel — inputs, indication and selector")}
                loading="eager" decoding="sync" width={1536} height={1024} />
              <svg className="dac-lp2-callout-svg" viewBox="0 0 150 100" preserveAspectRatio="none" aria-hidden="true">
                {CALLOUTS.map((c) => (
                  <line key={c.id}
                    className={`dac-lp2-callout-line${activeCallout === c.id ? " is-on" : ""}`}
                    x1={A(c.badge.x, "x")} y1={A(c.badge.y, "y")} x2={A(c.node.x, "x")} y2={A(c.node.y, "y")} />
                ))}
              </svg>
              {/* node anchors — small flat gold ticks (no halo), interactive on hover/tap */}
              {CALLOUTS.map((c) => (
                <button key={`n-${c.id}`} type="button"
                  className={`dac-lp2-callout-node${activeCallout === c.id ? " is-on" : ""}`}
                  style={{ left: `${c.node.x}%`, top: `${c.node.y}%` }}
                  aria-label={`${c.n}. ${c.title}`}
                  onMouseEnter={() => setActiveCallout(c.id)}
                  onMouseLeave={() => setActiveCallout((v) => (v === c.id ? null : v))}
                  onFocus={() => setActiveCallout(c.id)}
                  onBlur={() => setActiveCallout((v) => (v === c.id ? null : v))}
                  onClick={() => setActiveCallout((v) => (v === c.id ? null : c.id))} />
              ))}
              {/* outer number markers — plain gold digits, no disk */}
              {CALLOUTS.map((c) => (
                <span key={`m-${c.id}`}
                  className={`dac-lp2-callout-mark${activeCallout === c.id ? " is-on" : ""}`}
                  style={{ left: `${c.badge.x}%`, top: `${c.badge.y}%` }} aria-hidden="true">{c.n}</span>
              ))}
            </figure>
            <ol className="dac-lp2-callout-legend">
              {CALLOUTS.map((c) => (
                <li key={c.id} className={activeCallout === c.id ? "is-on" : undefined}>
                  <button type="button" className="dac-lp2-callout-legbtn"
                    onMouseEnter={() => setActiveCallout(c.id)}
                    onMouseLeave={() => setActiveCallout((v) => (v === c.id ? null : v))}
                    onFocus={() => setActiveCallout(c.id)}
                    onBlur={() => setActiveCallout((v) => (v === c.id ? null : v))}
                    onClick={() => setActiveCallout((v) => (v === c.id ? null : c.id))}
                    aria-pressed={activeCallout === c.id}>
                    <span className="dac-lp2-callout-num" aria-hidden="true">{c.n}</span>
                    <span className="dac-lp2-callout-copy">
                      <span className="dac-lp2-callout-title">{c.title}</span>
                      <span className="dac-lp2-callout-text">{c.text}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ─── IMAGE BAND — distinct cinematic frame, no text overlay ─── */}
      <section className="dac-lp2-imageband" data-reveal aria-label="Montelar Reference DAC">
        <div className="dac-lp2-imageband-frame">
          <img className="dac-lp2-imageband-img" src={`${IMG}/gal-front34.webp`}
            alt={t("Montelar Reference DAC на тёплом архитектурном фоне с золотыми акцентами",
              "Montelar Reference DAC on a warm architectural backdrop with gold accents")}
            decoding="sync" loading="eager" width={1400} height={930} />
        </div>
      </section>

      {/* ─── GALLERY — interactive coverflow, 5 unique frames ─── */}
      <section className="dac-lp2-gallery" aria-label={t("Планы изделия", "Product views")}>
        <div className="dac-lp2-wrap dac-lp2-gallery-head" data-reveal>
          <p className="dac-lp2-kicker">{t("Планы изделия", "Product views")}</p>
          <h2 className="dac-lp2-h2">{t("Корпус, передняя панель и материал — крупным планом", "Chassis, front panel and material — up close")}</h2>
          <p className="dac-lp2-gallery-hint">{t("Потяните, чтобы листать", "Drag to browse")}</p>
        </div>
        <DacProductCarousel locale={locale} items={GALLERY} title="Montelar Reference DAC" variant="framed" />
      </section>

      {/* ─── SOUND ─── */}
      <section className="dac-lp2-sound">
        <div className="dac-lp2-wrap">
          <p className="dac-lp2-kicker" data-reveal>{t("Как это проявляется в звуке", "How it shows in the sound")}</p>
          <h2 className="dac-lp2-h2" data-reveal data-delay="60">
            {t("Не локальный «вау-эффект», а зрелая цифровая архитектура, где разрешение, телесность и временна́я дисциплина существуют одновременно.",
              "Not a local “wow”, but a mature digital architecture where resolution, body and timing discipline exist at once.")}
          </h2>
          <ul className="dac-lp2-sound-grid">
            {SOUND.map((s, i) => (
              <li key={s.note} className="dac-lp2-sound-card" data-reveal data-delay={String((i % 3) * 60)}>
                <span className="dac-lp2-sound-ic"><s.Icon className="dac-lp2-ic" /></span>
                <span className="dac-lp2-sound-note">{s.note}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="dac-lp2-final-cta">
        <div className="dac-lp2-wrap">
          <p className="dac-lp2-kicker" data-reveal>{t("Позиционирование", "Positioning")}</p>
          <p className="dac-lp2-statement-body" data-reveal data-delay="60">
            {t("Montelar Reference DAC создан для зрелых систем, где цифровой источник работает на уровне полноценной архитектуры музыкального сигнала: масштаб и телесность multibit-подачи, современная цифровая дисциплина, референсное тактирование, структурная тишина фона и баланс между разрешением, естественностью и музыкальной непрерывностью.",
              "Montelar Reference DAC is made for mature systems where the digital source works at the level of a full musical-signal architecture: the scale and body of multibit delivery, modern digital discipline, reference clocking, a structurally silent background and a balance of resolution, naturalness and musical continuity.")}
          </p>
          <div className="dac-lp2-final-foot" data-reveal data-delay="120">
            <div className="dac-lp2-price-block">
              <span className="dac-lp2-price-label">{t("Цена", "Price")}</span>
              <span className="dac-lp2-price dac-lp2-num">{PRICE}&nbsp;₽</span>
            </div>
            <a className="dac-lp2-cta dac-lp2-cta--lg" href={mailtoHref}>{t("Запросить консультацию", "Request a consultation")}</a>
          </div>
          <p className="dac-lp2-service" data-reveal data-delay="140">
            {t("Гарантия 2 года · постгарантийное обслуживание 5 лет", "2-year warranty · 5 years of post-warranty service")}
          </p>
        </div>
      </section>
    </main>
  );
}

/* ── Accordion zigzag card ── */
function StoryCard({ story, flip, t }: { story: { n: string; kicker: string; title: string; lead: string; detail: string; image: string; alt: string }; flip: boolean; t: (ru: string, en: string) => string }) {
  const [open, setOpen] = useState(false);
  return (
    <article className={`dac-lp2-zz${flip ? " dac-lp2-zz--flip" : ""}`} data-reveal>
      <div className="dac-lp2-zz-media">
        <span className="dac-lp2-zz-no" aria-hidden="true">{story.n}</span>
        <img src={story.image} alt={story.alt} loading="eager" decoding="sync" width={1400} height={933} />
      </div>
      <div className="dac-lp2-zz-copy">
        <p className="dac-lp2-kicker">{story.kicker}</p>
        <h3 className="dac-lp2-zz-title">{story.title}</h3>
        <p className="dac-lp2-zz-lead">{story.lead}</p>
        <button type="button" className={`dac-lp2-acc-toggle${open ? " is-open" : ""}`} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          <span>{open ? t("Свернуть", "Collapse") : t("Подробнее об инженерии", "More on the engineering")}</span>
          <svg viewBox="0 0 24 24" className="dac-lp2-acc-chevron" {...stroke} aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
        </button>
        <div className="dac-lp2-acc-panel" data-open={open ? "true" : "false"}>
          <div className="dac-lp2-acc-inner"><p>{story.detail}</p></div>
        </div>
      </div>
    </article>
  );
}
