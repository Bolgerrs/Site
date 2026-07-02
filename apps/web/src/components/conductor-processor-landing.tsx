"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import Link from "next/link";
import { DacProductCarousel, type DacCarouselItem } from "@/components/dac-product-carousel";
import type { SiteLocale } from "@/config/i18n";

type ConductorProcessorLandingProps = {
  locale: SiteLocale;
  requestPath: string;
  categoryPath: string;
};

const IMG = "/images/products/conductor-processor";

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
const IcModule = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={p.className} {...stroke} aria-hidden="true">
    <rect x="3.5" y="7" width="17" height="10" rx="2" />
    <rect x="7" y="10" width="6" height="4" rx="1" />
    <path d="M17 12h1.5" />
  </svg>
);
const IcPower = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={p.className} {...stroke} aria-hidden="true">
    <path d="M12 3v8" />
    <path d="M7 6.5a8 8 0 1 0 10 0" />
  </svg>
);
const IcPlug = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={p.className} {...stroke} aria-hidden="true">
    <circle cx="12" cy="12" r="7" />
    <circle cx="12" cy="12" r="2" />
    <path d="M12 5V3M12 21v-2M5 12H3M21 12h-2" />
  </svg>
);
const IcWave = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={p.className} {...stroke} aria-hidden="true">
    <path d="M3 12c2 0 2-5 4-5s2 10 4 10 2-10 4-10 2 5 4 5" />
  </svg>
);
const IcWeave = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={p.className} {...stroke} aria-hidden="true">
    <path d="M4 8c2 0 2 4 4 4s2-4 4-4 2 4 4 4 2-4 4-4" />
    <path d="M4 16c2 0 2-4 4-4s2 4 4 4 2-4 4-4 2 4 4 4" />
  </svg>
);
const IcGold = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={p.className} {...stroke} aria-hidden="true">
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3.4" />
  </svg>
);
const IcCrown = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={p.className} {...stroke} aria-hidden="true">
    <path d="M4 8l3 3 5-6 5 6 3-3-2 11H6L4 8Z" />
  </svg>
);
const IcLine = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={p.className} {...stroke} aria-hidden="true">
    <path d="M3 12h4" />
    <rect x="7" y="9" width="10" height="6" rx="1.5" />
    <path d="M17 12h4" />
  </svg>
);

/* ────────────────────────────────────────────────────────────
   DATA — every fact/figure is from the Avito description
   ──────────────────────────────────────────────────────────── */

function localized(text: string): Record<SiteLocale, string> {
  return { ru: text, en: text, de: text, es: text, fr: text, zh: text, ja: text };
}

// Gallery captions — ONLY real features from the Avito description (RU for all locales).
const GALLERY: DacCarouselItem[] = [
  {
    id: "proc-angle",
    image: `${IMG}/gal-angle.webp`,
    title: "Корпус модуля",
    role: localized("Полностью аналоговое устройство · без внешнего питания"),
  },
  {
    id: "proc-top",
    image: `${IMG}/gal-top.webp`,
    title: "Карбоновая панель",
    role: localized("Глянцевый gunmetal-корпус · карбоновые вставки"),
  },
  {
    id: "proc-connector",
    image: `${IMG}/gal-connector.webp`,
    title: "Разъём RCA / XLR",
    role: localized("Включение в разрыв аналогового тракта · line-level"),
  },
];

// Hero ledger highlights — from the Avito description.
const HIGHLIGHTS: Array<{ k: string; v: string }> = [
  { k: "Тип", v: "аналоговый модуль" },
  { k: "Питание", v: "не требуется" },
  { k: "Подключение", v: "RCA / XLR" },
  { k: "Комплект", v: "стерео · 2 устройства" },
];

// Bento "character in numbers/words" — animated count-up where numeric.
type BentoTile = {
  id: string;
  size: "lg" | "wide" | "sm";
  count?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  value?: string;
  label: string;
  sub: string;
  Icon: (p: IconProps) => ReactElement;
};
const BENTO: BentoTile[] = [
  {
    id: "stereo",
    size: "lg",
    count: 2,
    label: "устройства в стереокомплекте",
    sub: "Модуль поставляется парой — по одному в левый и правый канал аналогового тракта. Настройка системы как работа не только с компонентами, но и с качеством самой передачи сигнала.",
    Icon: IcModule,
  },
  {
    id: "power",
    size: "sm",
    value: "0",
    suffix: " V",
    label: "внешнее питание",
    sub: "Полностью аналоговое устройство без внешнего питания — нет блока питания и связанных с ним сетевых наводок.",
    Icon: IcPower,
  },
  {
    id: "io",
    size: "sm",
    value: "RCA · XLR",
    label: "совместимость по тракту",
    sub: "Включается в разрыв аналогового line-level тракта между компонентами по RCA или XLR.",
    Icon: IcPlug,
  },
  {
    id: "line",
    size: "wide",
    value: "Line-level",
    label: "точка включения в тракт",
    sub: "Инструмент доводки analog front-end: между источником, предусилителем и усилением — там, где формируется характер аналоговой передачи.",
    Icon: IcLine,
  },
  {
    id: "analog",
    size: "sm",
    value: "Аналог",
    label: "полностью аналоговый путь",
    sub: "Не цифровой процессор: деликатная фундаментальная работа с характером самой аналоговой передачи сигнала, без навязывания собственного «почерка».",
    Icon: IcWave,
  },
  {
    id: "carbon",
    size: "sm",
    value: "Carbon",
    label: "карбоновые вставки корпуса",
    sub: "Woven carbon-fiber на верхней и боковой панелях, глянцевый gunmetal-корпус — тактильная премиальная конструкция.",
    Icon: IcWeave,
  },
  {
    id: "hiend",
    size: "wide",
    value: "Hi-End",
    label: "для систем высокого класса",
    sub: "Особенно интересен там, где базовый уровень компонентов уже высок, а владелец ищет не косметическое изменение, а более серьёзный структурный апгрейд.",
    Icon: IcCrown,
  },
  {
    id: "gold",
    size: "sm",
    value: "Gold",
    label: "золотой разъём",
    sub: "Золочёный контакт RCA/XLR в металлическом фланце — чистое аналоговое соединение с трактом.",
    Icon: IcGold,
  },
];

// Zigzag editorial — full Avito description; short lead always visible, detail in accordion.
type Story = {
  n: string;
  kicker: string;
  title: string;
  lead: string;
  detail: string;
  image: string;
  alt: string;
};
const STORIES: Story[] = [
  {
    n: "01",
    kicker: "Концепция",
    title: "Аналоговый модуль тонкой настройки уже серьёзного тракта",
    lead: "Montelar Audio Signal Processor — аналоговый модуль тонкой системной настройки, предназначенный для включения в тракт между компонентами по RCA или XLR. Он не заменяет качественный межблочный кабель и не подменяет фундаментальную архитектуру системы.",
    detail:
      "Его задача иная: раскрыть потенциал уже серьёзного аналогового тракта, повысить степень его внутренней свободы, организованности и музыкальной отзывчивости. В системах высокого класса именно такие решения нередко оказываются особенно значимыми — не потому, что они «меняют всё» эффектом первой минуты, а потому, что способны воздействовать на более глубокий уровень восприятия: на микродинамику, ритмическую пластичность, масштаб, скорость реакции и ощущение непрерывности музыкального потока.",
    image: `${IMG}/gal-angle.webp`,
    alt: "Montelar Audio Signal Processor — модуль на тёплом архитектурном фоне",
  },
  {
    n: "02",
    kicker: "Конструкция",
    title: "Полностью аналоговое устройство без внешнего питания",
    lead: "Montelar Audio Signal Processor создавался как полностью аналоговое устройство без внешнего питания, ориентированное на деликатную, но фундаментальную работу с характером аналоговой передачи сигнала.",
    detail:
      "Вместо навязывания собственного «почерка» его роль — помочь тракту звучать свободнее, быстрее, масштабнее, пластичнее и внутренне собраннее. В хорошей системе его действие воспринимается не как отдельный эффект, а как повышение общего класса подачи. Именно поэтому он особенно интересен там, где базовый уровень компонентов уже достаточно высок, а владелец ищет не косметическое изменение, а более серьёзный структурный апгрейд. Глянцевый gunmetal-корпус с карбоновыми вставками на верхней и боковой панелях и золочёный разъём подчёркивают эту инженерную логику.",
    image: `${IMG}/gal-top.webp`,
    alt: "Montelar Audio Signal Processor — карбоновая верхняя панель крупным планом",
  },
  {
    n: "03",
    kicker: "Как это проявляется в системе",
    title: "Отзывчивость, микродинамика и масштаб — без навязчивой яркости",
    lead: "В зависимости от конфигурации тракта и уровня разрешения компонентов Montelar Audio Signal Processor обычно проявляет себя как повышение общего класса подачи, а не как отдельный «эффект».",
    detail:
      "Это более высокая отзывчивость системы; лучшая свобода микродинамических переходов; увеличение ощущения масштаба; более живая и точная скоростная организация; более естественная пластичность музыкального движения; рост внутренней ясности без навязчивой яркости. Особенно заметен результат в системах, где уже хорошо слышны различия между уровнями межблочных соединений, качеством питания и степенью согласованности компонентов.",
    image: `${IMG}/gal-connector.webp`,
    alt: "Montelar Audio Signal Processor — золотой разъём RCA/XLR крупным планом",
  },
  {
    n: "04",
    kicker: "Роль в тракте",
    title: "Инструмент доводки analog front-end, а не «эффектный аксессуар»",
    lead: "Это устройство корректнее всего рассматривать не как «эффектный аксессуар», а как инструмент доводки analog front-end / line-level тракта. Оно не отменяет важность качественного межблочного кабеля.",
    detail:
      "Напротив, в сочетании с хорошим кабелем Audio Signal Processor способен сделать уже сильную систему более зрелой, цельной и выразительной. Именно поэтому подобный модуль особенно уместен: в системах, где базовый уровень уже высок; в трактах, чувствительных к качеству аналоговой передачи; в сетапах, где важны скорость, свобода и микродинамика, а не только тональный баланс.",
    image: `${IMG}/gal-angle.webp`,
    alt: "Montelar Audio Signal Processor — модуль в разрыве аналогового line-level тракта",
  },
  {
    n: "05",
    kicker: "Позиционирование",
    title: "Для тех, кто настраивает не только компоненты, но и передачу сигнала",
    lead: "Montelar Audio Signal Processor предназначен для тех, кто воспринимает настройку системы как работу не только с компонентами, но и с качеством самой передачи сигнала.",
    detail:
      "Это решение для слушателей, которым важны не формальные улучшения, не эффект «погромче и поярче», а более высокий уровень музыкальной собранности, динамической гибкости и внутренней естественности. Цена указана за стереокомплект из двух устройств.",
    image: `${IMG}/gal-top.webp`,
    alt: "Montelar Audio Signal Processor — карбоновая верхняя панель, премиальная отделка",
  },
];

// Interactive hotspots over the module photo — labels from the product's real features.
type Hotspot = { id: string; x: number; y: number; title: string; text: string };
const HOTSPOTS: Hotspot[] = [
  { id: "carbon-top", x: 44, y: 38, title: "Карбоновая верхняя панель", text: "Woven carbon-fiber вставка на верхней панели — тактильная премиальная отделка глянцевого gunmetal-корпуса" },
  { id: "body", x: 30, y: 60, title: "Gunmetal-корпус", text: "Полностью аналоговое устройство без внешнего питания — пассивная аналоговая архитектура в металлическом корпусе" },
  { id: "carbon-side", x: 22, y: 50, title: "Карбоновая боковая вставка", text: "Карбоновая вставка на боковой панели — единый конструктивный язык корпуса модуля" },
  { id: "connector", x: 66, y: 64, title: "Золотой разъём RCA / XLR", text: "Золочёный разъём для включения в разрыв аналогового line-level тракта между компонентами" },
];

const SOUND_NOTES = [
  "Более высокая отзывчивость системы",
  "Свобода микродинамических переходов",
  "Увеличение ощущения масштаба",
  "Живая и точная скоростная организация",
  "Естественная пластичность музыкального движения",
  "Рост внутренней ясности без навязчивой яркости",
];

// Construction & fit — reuses the warm LIGHT version stripe (single product, three facets).
type Facet = {
  name: string;
  tier: string;
  specA: string;
  specB: string;
  price: string;
  note: string;
};
const FACETS: Facet[] = [
  {
    name: "Конструкция",
    tier: "Полностью аналоговый модуль",
    specA: "Без внешнего питания",
    specB: "Gunmetal-корпус · карбоновые вставки",
    price: "RCA / XLR",
    note: "Включается в разрыв аналогового тракта; работает с характером самой передачи сигнала, без навязывания собственного «почерка».",
  },
  {
    name: "Комплект поставки",
    tier: "Стереокомплект",
    specA: "2 устройства — по одному в канал",
    specB: "Для левого и правого канала тракта",
    price: "169 990 ₽",
    note: "Цена указана за стереокомплект из двух устройств — полный набор для аналогового стереотракта.",
  },
  {
    name: "Где уместен",
    tier: "Системы высокого класса",
    specA: "line-level / analog front-end",
    specB: "источник · предусилитель · усиление",
    price: "Hi-End",
    note: "Особенно интересен там, где базовый уровень компонентов уже высок и слышны различия между межблочными, питанием и согласованностью компонентов.",
  },
];

/* ────────────────────────────────────────────────────────────
   Accordion (zigzag detail) — smooth grid-rows animation
   ──────────────────────────────────────────────────────────── */
function StoryCard({ story, flip }: { story: Story; flip: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <article className={`dac-lp2-zz${flip ? " dac-lp2-zz--flip" : ""}`} data-reveal>
      <div className="dac-lp2-zz-media">
        <span className="dac-lp2-zz-no" aria-hidden="true">{story.n}</span>
        <img src={story.image} alt={story.alt} loading="eager" decoding="async" width={1536} height={1024} />
      </div>
      <div className="dac-lp2-zz-copy">
        <p className="dac-lp2-kicker">{story.kicker}</p>
        <h3 className="dac-lp2-zz-title">{story.title}</h3>
        <p className="dac-lp2-zz-lead">{story.lead}</p>
        <button
          type="button"
          className={`dac-lp2-acc-toggle${open ? " is-open" : ""}`}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span>{open ? "Свернуть" : "Подробнее"}</span>
          <svg viewBox="0 0 24 24" className="dac-lp2-acc-chevron" {...stroke} aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <div className="dac-lp2-acc-panel" data-open={open ? "true" : "false"}>
          <div className="dac-lp2-acc-inner">
            <p>{story.detail}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

export function ConductorProcessorLanding({ requestPath, categoryPath, locale }: ConductorProcessorLandingProps) {
  const rootRef = useRef<HTMLElement>(null);
  const [activeSpot, setActiveSpot] = useState<string>("carbon-top");

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const runCount = (el: HTMLElement) => {
      const target = Number(el.dataset.count || "0");
      const decimals = Number(el.dataset.decimals || "0");
      const fmt = (n: number) => (decimals ? n.toFixed(decimals) : String(Math.round(n)));
      if (!target || prefersReduced) {
        el.textContent = fmt(target);
        return;
      }
      const dur = 1100;
      let start = 0;
      const tick = (t: number) => {
        if (!start) start = t;
        const p = Math.min(1, (t - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(eased * target);
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = fmt(target);
      };
      requestAnimationFrame(tick);
    };

    const reveal = (_el: HTMLElement) => {
      /* single standard: reveal + count-up handled globally by <ScrollReveal/> */
      void runCount;
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
        if (!prefersReduced) {
          const vh = window.innerHeight;
          root.querySelectorAll<HTMLElement>("[data-reveal]:not(.in)").forEach((el) => {
            if (el.getBoundingClientRect().top < vh * 0.92) reveal(el);
          });
        }
      });
    };
    window.addEventListener("scroll", onProgress, { passive: true });
    window.addEventListener("resize", onProgress, { passive: true });
    onProgress();

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            reveal(el);
            io.unobserve(el);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );

    root.querySelectorAll("[data-reveal]").forEach((el) => {
      if (prefersReduced) {
        el.classList.add("in");
        el.querySelectorAll<HTMLElement>("[data-count]").forEach((c) => {
          const d = Number((c as HTMLElement).dataset.decimals || "0");
          const t = Number((c as HTMLElement).dataset.count || "0");
          c.textContent = d ? t.toFixed(d) : String(t);
        });
      } else {
        io.observe(el);
      }
    });

    // Fail-safe: force-reveal everything if no scroll happens (static/headless
    // capture, or a reader sitting on the hero) so content is NEVER stuck at
    // opacity:0 below the fold.
    let fallback = 0;
    if (!prefersReduced) {
      fallback = window.setTimeout(() => {
        root.querySelectorAll<HTMLElement>("[data-reveal]:not(.in)").forEach(reveal);
      }, 1300);
    }

    if (prefersReduced) {
      return () => {
        io.disconnect();
        window.removeEventListener("scroll", onProgress);
        window.removeEventListener("resize", onProgress);
      };
    }

    const heroImg = root.querySelector(".dac-lp2-hero-img") as HTMLElement | null;
    const bandImg = root.querySelector(".dac-lp2-imageband-img") as HTMLElement | null;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const vh = window.innerHeight;
        if (heroImg) {
          const y = window.scrollY;
          const progress = Math.min(1, y / vh);
          heroImg.style.transform = `translateY(${progress * 38}px) scale(${1 + progress * 0.018})`;
        }
        if (bandImg) {
          const r = bandImg.getBoundingClientRect();
          const center = r.top + r.height / 2;
          const rel = (center - vh / 2) / vh;
          const shift = Math.max(-1, Math.min(1, rel)) * -32;
          bandImg.style.transform = `translateY(${shift}px)`;
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.clearTimeout(fallback);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onProgress);
      window.removeEventListener("resize", onProgress);
      io.disconnect();
    };
  }, []);

  const activeHotspot = HOTSPOTS.find((h) => h.id === activeSpot) ?? HOTSPOTS[0]!;

  return (
    <main className="dac-lp2 processor-lp2" ref={rootRef}>
      {/* Scoped layout fixes (P1/P2) — kept inside the component so the shared
          globals.css / other landings stay untouched. All scoped to .processor-lp2. */}
      <style>{`
        /* P2 — hero lead was capped at 18ch (1–2 words/line, ragged river).
           Widen to read in full lines, but cap with vw so it never reaches the
           device on the right (left scrim ends ~58%). */
        @media (min-width: 768px) {
          .processor-lp2 .dac-lp2-hero .dac-lp2-lead { max-width: min(44ch, 48vw); }
        }
        /* P1 — hotspot panel: the photo stage has aspect-ratio, so when the grid
           row stretched to the (taller) readout height the stage derived an
           over-wide width and overflowed its column, clipping the readout's left
           edge + pills. Stop the stage from stretching; keep the readout stretched. */
        .processor-lp2 .dac-lp2-panel-stage { align-self: start; min-width: 0; }
        .processor-lp2 .dac-lp2-panel-readout { min-width: 0; }
        /* P1 — FACETS cards: the long note inherited white-space:nowrap from the
           base dd rule and overran the card on every breakpoint. Let it wrap;
           keep the price token on one line. */
        .processor-lp2 .dac-lp2-versions .dac-lp2-version-card dd { white-space: normal; }
        .processor-lp2 .dac-lp2-versions .dac-lp2-version-note { overflow-wrap: anywhere; }
        .processor-lp2 .dac-lp2-versions .dac-lp2-version-price { white-space: nowrap; }
      `}</style>
      <div className="dac-lp2-progress" aria-hidden="true" />

      {/* ─── HERO BANNER — headline in the LEFT negative space (never over the device) ─── */}
      <section className="dac-lp2-hero" aria-label="Montelar Audio Signal Processor">
        <div className="dac-lp2-hero-media">
          <picture>
            <source media="(max-width: 767px)" srcSet={`${IMG}/hero-mobile-9x16.webp`} />
            <img
              className="dac-lp2-hero-img"
              src={`${IMG}/hero-desktop-16x9.webp`}
              alt="Montelar Audio Signal Processor — аналоговый модуль на тёплом архитектурном фоне"
              decoding="async"
              fetchPriority="high"
              width={1672}
              height={941}
            />
          </picture>
          <div className="dac-lp2-hero-scrim" aria-hidden="true" />
        </div>

        <div className="dac-lp2-hero-copy">
          <div className="dac-lp2-wrap">
            <p className="dac-lp2-eyebrow dac-lp2-reveal-now">Montelar · Perfect Conductors · Magic Science</p>
            <h1 className="dac-lp2-title dac-lp2-reveal-now" style={{ ["--reveal-delay" as string]: "90" }}>
              Audio Signal Processor
            </h1>
            <p className="dac-lp2-lead dac-lp2-reveal-now" style={{ ["--reveal-delay" as string]: "180" }}>
              Полностью аналоговый модуль тонкой настройки тракта — включается в разрыв между компонентами
              по RCA или XLR.{" "}
              <span className="dac-lp2-lead-tail">
                Не «эффект кабеля», а более высокий класс подачи: свобода микродинамики, масштаб и
                естественная пластичность музыкального движения.
              </span>
            </p>
          </div>
        </div>

        <span className="dac-lp2-scrollcue" aria-hidden="true">
          <span className="dac-lp2-scrollcue-line" />
          Прокрутите
        </span>
      </section>

      {/* ─── PRICE + HIGHLIGHT LEDGER + CTA ─── */}
      <section className="dac-lp2-price-zone" data-reveal>
        <div className="dac-lp2-wrap dac-lp2-price-inner">
          <div className="dac-lp2-price-block">
            <span className="dac-lp2-price-label">Цена · стереокомплект</span>
            <span className="dac-lp2-price">169&nbsp;990&nbsp;₽</span>
          </div>
          <dl className="dac-lp2-highlights">
            {HIGHLIGHTS.map((h) => (
              <div className="dac-lp2-highlight" key={h.k}>
                <dt>{h.k}</dt>
                <dd>{h.v}</dd>
              </div>
            ))}
          </dl>
          <div className="dac-lp2-cta-row">
            <Link className="dac-lp2-cta" href={requestPath}>
              Запросить консультацию
            </Link>
            <Link className="dac-lp2-cta dac-lp2-cta--ghost" href={categoryPath}>
              Perfect Conductors
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CONCEPT STATEMENT ─── */}
      <section className="dac-lp2-statement">
        <div className="dac-lp2-wrap">
          <p className="dac-lp2-kicker" data-reveal>Концепция</p>
          <p className="dac-lp2-statement-body" data-reveal data-delay="80">
            В системах высокого класса именно тонкие решения нередко оказываются особенно значимыми — не
            потому, что «меняют всё» эффектом первой минуты, а потому, что воздействуют на более глубокий
            уровень восприятия: микродинамику, ритмическую пластичность, масштаб, скорость реакции и
            ощущение непрерывности музыкального потока. Montelar Audio Signal Processor раскрывает потенциал
            уже серьёзного аналогового тракта — без «эффекта кабеля».
          </p>
        </div>
      </section>

      {/* ─── BENTO — character in numbers/words (glass tiles + count-up) ─── */}
      <section className="dac-lp2-bento-sec">
        <div className="dac-lp2-wrap">
          <div className="dac-lp2-sec-head" data-reveal>
            <p className="dac-lp2-kicker">Архитектура решения</p>
            <h2 className="dac-lp2-h2">Полностью аналоговый модуль — каждая грань на своём месте</h2>
          </div>
          <div className="dac-lp2-bento">
            {BENTO.map((t, i) => (
              <article
                key={t.id}
                className={`dac-lp2-tile dac-lp2-tile--${t.size}`}
                data-reveal
                data-delay={String((i % 4) * 70)}
              >
                <span className="dac-lp2-tile-ic"><t.Icon className="dac-lp2-ic" /></span>
                <div className="dac-lp2-tile-figure">
                  {t.prefix ? <span className="dac-lp2-tile-affix">{t.prefix}</span> : null}
                  {typeof t.count === "number" ? (
                    <span className="dac-lp2-tile-num" data-count={t.count} data-decimals={t.decimals ?? 0}>0</span>
                  ) : (
                    <span className="dac-lp2-tile-word">{t.value}</span>
                  )}
                  {t.suffix ? <span className="dac-lp2-tile-affix">{t.suffix}</span> : null}
                </div>
                <p className="dac-lp2-tile-label">{t.label}</p>
                <p className="dac-lp2-tile-sub">{t.sub}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ZIGZAG EDITORIAL — full Avito description, image ↔ text, accordion ─── */}
      <section className="dac-lp2-stories">
        <div className="dac-lp2-wrap">
          <div className="dac-lp2-sec-head" data-reveal>
            <p className="dac-lp2-kicker">Инженерия и звук</p>
            <h2 className="dac-lp2-h2">Пять граней, из которых складывается доводка тракта</h2>
          </div>
          <div className="dac-lp2-stories-list">
            {STORIES.map((s, i) => (
              <StoryCard key={s.n} story={s} flip={i % 2 === 1} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── IMAGE BAND — cinematic warm product photo, NO text overlay ─── */}
      <section className="dac-lp2-imageband" data-reveal aria-label="Montelar Audio Signal Processor — крупный план">
        <div className="dac-lp2-imageband-frame">
          <img
            className="dac-lp2-imageband-img"
            src={`${IMG}/gal-connector.webp`}
            alt="Montelar Audio Signal Processor — золочёный разъём RCA / XLR крупным планом"
            decoding="async"
            loading="eager"
            width={1536}
            height={1024}
          />
        </div>
      </section>

      {/* ─── INTERACTIVE MODULE — hotspots over the real photo ─── */}
      <section className="dac-lp2-panel-sec">
        <div className="dac-lp2-wrap">
          <div className="dac-lp2-sec-head" data-reveal>
            <p className="dac-lp2-kicker">Корпус и разъёмы</p>
            <h2 className="dac-lp2-h2">Карбоновые панели, gunmetal-корпус и золотой разъём</h2>
            <p className="dac-lp2-sec-hint">Наведите или коснитесь точки на модуле</p>
          </div>
          <div className="dac-lp2-panel" data-reveal data-delay="80">
            <div className="dac-lp2-panel-stage">
              <img
                src={`${IMG}/gal-angle.webp`}
                alt="Корпус Montelar Audio Signal Processor — карбоновые панели и золотой разъём"
                loading="eager"
                decoding="async"
                width={1536}
                height={1024}
              />
              {HOTSPOTS.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  className={`dac-lp2-spot${activeSpot === h.id ? " is-active" : ""}`}
                  style={{ left: `${h.x}%`, top: `${h.y}%` }}
                  aria-label={`${h.title} — ${h.text}`}
                  onMouseEnter={() => setActiveSpot(h.id)}
                  onFocus={() => setActiveSpot(h.id)}
                  onClick={() => setActiveSpot(h.id)}
                >
                  <span className="dac-lp2-spot-dot" />
                </button>
              ))}
            </div>
            <aside className="dac-lp2-panel-readout" aria-live="polite">
              <p className="dac-lp2-readout-title">{activeHotspot.title}</p>
              <p className="dac-lp2-readout-text">{activeHotspot.text}</p>
              <ul className="dac-lp2-readout-list">
                {HOTSPOTS.map((h) => (
                  <li key={h.id}>
                    <button
                      type="button"
                      className={activeSpot === h.id ? "is-active" : ""}
                      onMouseEnter={() => setActiveSpot(h.id)}
                      onFocus={() => setActiveSpot(h.id)}
                      onClick={() => setActiveSpot(h.id)}
                    >
                      {h.title}
                    </button>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </div>
      </section>

      {/* ─── GALLERY — interactive coverflow ─── */}
      <section className="dac-lp2-gallery" aria-label="Планы изделия">
        <div className="dac-lp2-wrap dac-lp2-gallery-head" data-reveal>
          <p className="dac-lp2-kicker">Планы изделия</p>
          <h2 className="dac-lp2-h2">Корпус, карбоновые панели и разъём — крупным планом</h2>
          <p className="dac-lp2-gallery-hint">Потяните, чтобы листать</p>
        </div>
        <DacProductCarousel locale={locale} items={GALLERY} title="Montelar Audio Signal Processor" variant="framed" frameAspect={1.2} />
      </section>

      {/* ─── SOUND — warm brown glass tiles ─── */}
      <section className="dac-lp2-sound">
        <div className="dac-lp2-wrap">
          <p className="dac-lp2-kicker" data-reveal>Как это проявляется в системе</p>
          <h2 className="dac-lp2-h2" data-reveal data-delay="60">
            Не «эффектный» аксессуар, а повышение общего класса подачи — больше отзывчивости, масштаба и
            микродинамической свободы.
          </h2>
          <ul className="dac-lp2-sound-list" data-reveal data-delay="120">
            {SOUND_NOTES.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── КОНСТРУКЦИЯ И СОВМЕСТИМОСТЬ — warm LIGHT stripe ─── */}
      <section className="dac-lp2-versions">
        <div className="dac-lp2-wrap">
          <p className="dac-lp2-kicker dac-lp2-kicker--dark" data-reveal>Конструкция и совместимость</p>
          <h2 className="dac-lp2-h2 dac-lp2-h2--dark" data-reveal data-delay="50">
            Полностью аналоговый, в стереокомплекте — для систем высокого класса
          </h2>
          <dl className="dac-lp2-version-grid" data-reveal data-delay="100">
            {FACETS.map((m) => (
              <div className="dac-lp2-version-card" key={m.name}>
                <dt>{m.name}</dt>
                <dd>
                  <span className="dac-lp2-version-tier">{m.tier}</span>
                  <span className="dac-lp2-version-spec">{m.specA}</span>
                  <span className="dac-lp2-version-spec">{m.specB}</span>
                  <span className="dac-lp2-version-note">{m.note}</span>
                  <span className="dac-lp2-version-price">{m.price}</span>
                </dd>
              </div>
            ))}
          </dl>
          <p className="dac-lp2-conn-note dac-lp2-conn-note--dark" data-reveal data-delay="120">
            Хорошо согласуется с компонентами Luxman, Scan-Speak, Kenwood, Byema, Vishay Dale, Jentzen,
            Inakustik. Подойдёт также для систем на Accuphase, Advance Acoustic, Pass Aleph, Anthem, Arcam,
            Atoll, AudioLab, Audia Flight, Audio Analogue, Bose, Bladelius, Burmester, Bryston, Coda, Denon
            и других трактах high-end класса.
          </p>
        </div>
      </section>

      {/* ─── FINAL CTA — warm climax ─── */}
      <section className="dac-lp2-final-cta">
        <div className="dac-lp2-wrap">
          <p className="dac-lp2-kicker" data-reveal>Позиционирование</p>
          <p className="dac-lp2-statement-body" data-reveal data-delay="60">
            Montelar Audio Signal Processor — это инструмент доводки analog front-end для тех, кто настраивает
            не только компоненты, но и качество самой передачи сигнала. Он не отменяет важность межблочного
            кабеля: в сочетании с хорошим кабелем он делает уже сильную систему более зрелой, цельной и
            выразительной — там, где важны скорость, свобода и микродинамика, а не только тональный баланс.
          </p>
          <div className="dac-lp2-final-foot" data-reveal data-delay="120">
            <div className="dac-lp2-price-block">
              <span className="dac-lp2-price-label">Цена · стереокомплект</span>
              <span className="dac-lp2-price">169&nbsp;990&nbsp;₽</span>
            </div>
            <Link className="dac-lp2-cta dac-lp2-cta--lg" href={requestPath}>
              Запросить консультацию
            </Link>
          </div>
          <p className="dac-lp2-service" data-reveal data-delay="140">
            Подбор и поставка компонентов high-end класса · кураторская сборка системы
          </p>
        </div>
      </section>

    </main>
  );
}
