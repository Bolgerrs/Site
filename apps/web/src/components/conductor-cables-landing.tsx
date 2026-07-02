"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import Link from "next/link";
import { DacProductCarousel, type DacCarouselItem } from "@/components/dac-product-carousel";
import type { SiteLocale } from "@/config/i18n";

type ConductorCablesLandingProps = {
  locale: SiteLocale;
  requestPath: string;
  categoryPath: string;
};

const IMG = "/images/products/conductor-cables";

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
const IcConductor = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={p.className} {...stroke} aria-hidden="true">
    <path d="M3 12h4M17 12h4" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.6" />
  </svg>
);
const IcSilver = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={p.className} {...stroke} aria-hidden="true">
    <path d="M12 3l2.4 5 5.6.8-4 4 1 5.6L12 20l-5 1.4 1-5.6-4-4 5.6-.8L12 3Z" />
  </svg>
);
const IcWeave = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={p.className} {...stroke} aria-hidden="true">
    <path d="M4 8c2 0 2 4 4 4s2-4 4-4 2 4 4 4 2-4 4-4" />
    <path d="M4 16c2 0 2-4 4-4s2 4 4 4 2-4 4-4 2 4 4 4" />
  </svg>
);
const IcShield = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={p.className} {...stroke} aria-hidden="true">
    <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" />
  </svg>
);
const IcLayers = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={p.className} {...stroke} aria-hidden="true">
    <path d="M12 4 3 9l9 5 9-5-9-5Z" />
    <path d="M3 14l9 5 9-5M3 11.5l9 5 9-5" />
  </svg>
);
const IcPlug = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={p.className} {...stroke} aria-hidden="true">
    <path d="M9 3v5M15 3v5" />
    <path d="M6 8h12v2a6 6 0 0 1-12 0V8Z" />
    <path d="M12 16v5" />
  </svg>
);
const IcSnow = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={p.className} {...stroke} aria-hidden="true">
    <path d="M12 3v18M3 12h18M5.5 5.5l13 13M18.5 5.5l-13 13" />
  </svg>
);
const IcWave = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={p.className} {...stroke} aria-hidden="true">
    <path d="M3 12c2 0 2-5 4-5s2 10 4 10 2-10 4-10 2 5 4 5" />
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
    id: "cables-connectors",
    image: `${IMG}/gal-connectors.webp`,
    title: "Разъёмы",
    role: localized("Силовая вилка и IEC-разъём · карбоновые рифлёные стволы"),
  },
  {
    id: "cables-braid",
    image: `${IMG}/gal-braid.webp`,
    title: "Плетёная оплётка",
    role: localized("Многослойная система шуморассеивания · демпфирующий слой"),
  },
  {
    id: "cables-coil",
    image: `${IMG}/gal-coil.webp`,
    title: "Конструкция кабеля",
    role: localized("Монокристаллические проводники · двойной тефлоновый диэлектрик"),
  },
];

// Hero ledger highlights — from the Avito description.
const HIGHLIGHTS: Array<{ k: string; v: string }> = [
  { k: "Проводники", v: "монокристалл / серебро" },
  { k: "Диэлектрик", v: "тефлон PTFE + воздух" },
  { k: "Обработка", v: "отжиг + криогенная" },
  { k: "Линейка", v: "3 модели · 1.6 м" },
];

// Bento "construction in numbers" — animated count-up where numeric.
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
    id: "lineup",
    size: "lg",
    count: 3,
    label: "модели силовой линейки",
    sub: "Reference Grey, Extremo Power и флагман Solution AG11 — от собранного референса до ультимативного чистого серебра, под уровень и характер тракта.",
    Icon: IcLayers,
  },
  {
    id: "mono",
    size: "sm",
    value: "XPOCC+",
    label: "монокристаллическая медь",
    sub: "Японская монокристаллическая медь XPOCC высокой чистоты в старших гибридных моделях линейки.",
    Icon: IcConductor,
  },
  {
    id: "silver",
    size: "sm",
    value: "6N Ag",
    label: "чистое серебро OCC",
    sub: "В топовой версии Solution AG11 — чистое серебро OCC Silver 6N с криогенной обработкой во всех трёх проводниках.",
    Icon: IcSilver,
  },
  {
    id: "section",
    size: "wide",
    count: 6,
    suffix: " мм",
    label: "сечение проводника (Extremo Power)",
    sub: "Проводник увеличенного сечения в старшей модели повышает энергетическую стабильность и углубляет тишину между звуками.",
    Icon: IcWave,
  },
  {
    id: "ptfe",
    size: "sm",
    value: "PTFE",
    label: "двойной тефлоновый диэлектрик",
    sub: "Проводники в двойном тефлоновом диэлектрике с присутствием воздуха в трубках — крайне низкое поглощение энергии и малые потери.",
    Icon: IcShield,
  },
  {
    id: "carbon",
    size: "sm",
    value: "C",
    label: "углеродный вторичный диэлектрик",
    sub: "Многослойная система шуморассеивания на основе углерода активно подавляет паразитные влияния без избыточных экранов.",
    Icon: IcWeave,
  },
  {
    id: "latex",
    size: "wide",
    value: "Латекс",
    label: "натуральный демпфирующий слой",
    sub: "Натуральный латекс как третичный диэлектрик и демпфирующий слой — снижает накопление энергии в изоляции и временные нелинейности.",
    Icon: IcShield,
  },
  {
    id: "cryo",
    size: "sm",
    value: "CRYO",
    label: "криогенная обработка",
    sub: "Отжиг и криогенная обработка металла снижают межзёренные искажения и повышают электрическое спокойствие кабеля.",
    Icon: IcSnow,
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
// One unique photo per block — no repeats. With only three real frames the
// editorial runs three deep (concept → materials → dielectric); the model
// line-up lives in its own section below, so nothing is lost by not stretching
// the same photo across five blocks.
const STORIES: Story[] = [
  {
    n: "01",
    kicker: "Концепция",
    title: "Питание как структурный элемент всей звуковой архитектуры",
    lead: "В high-end системе питание никогда не бывает второстепенной темой. Именно в силовой архитектуре определяется, насколько свободно компонент работает с микродинамикой, устойчиво держит форму сцены и чисто раскрывает тембры.",
    detail:
      "Montelar Power Collection создана для систем, в которых силовой кабель рассматривается как структурный элемент всей звуковой архитектуры. Каждая модель строится вокруг одной задачи: обеспечить компоненту более стабильную, менее загрязнённую и более предсказуемую среду питания — без грубого вмешательства в музыкальный баланс и без искусственного «эффекта кабеля». Это не декоративное изменение почерка, а создание условий, при которых компонент звучит ближе к своему реальному потенциалу.",
    image: `${IMG}/gal-coil.webp`,
    alt: "Montelar Reference AC Architecture — силовой кабель на тёплом архитектурном фоне",
  },
  {
    n: "02",
    kicker: "Материалы и инженерная логика",
    title: "Монокристаллические проводники и метаматериалы вместо наращивания экранов",
    lead: "В основе кабелей — сочетание цельнометаллических монокристаллических проводников и метаматериалов, специально подобранных диэлектрика и шуморассеивания. Ключевой принцип — не механическое наращивание экранов, а тонкая работа с самой природой паразитных влияний.",
    detail:
      "Вместо попытки «запереть» все процессы внутри многослойного экранирования конструкция ориентирована на активное подавление как внешних помех, идущих к компоненту, так и собственных шумов аппаратуры, возвращающихся в сеть. Поэтому используется сложная система материалов и слоёв, снижающая радиочастотные и электромагнитные искажения без тех компромиссов, которые нередко вносят избыточные экраны: потери свободы, динамической пластики и естественной пространственной организованности. В старших моделях применяются гибридные сочетания: японская монокристаллическая медь XPOCC высокой чистоты; PCOCC / OCC медь с отжигом и криогенной обработкой; в топовой версии — чистое серебро LGC Silver.",
    image: `${IMG}/gal-connectors.webp`,
    alt: "Montelar Reference AC Architecture — силовой кабель с карбоновыми разъёмами, силовой вилкой и IEC",
  },
  {
    n: "03",
    kicker: "Диэлектрик и шуморассеивание",
    title: "Двойной тефлон, углеродный слой и натуральный латекс",
    lead: "Проводники размещаются в двойном тефлоновом диэлектрике, а дальнейшая система управления паразитными процессами строится на углеродном вторичном диэлектрике и натуральном латексе в роли третичного диэлектрика и демпфирующего слоя.",
    detail:
      "Такой подход решает сразу несколько задач: снижает уровень радиочастотных и перекрёстных помех; уменьшает накопление энергии в изоляции; помогает сократить временные нелинейности и паразитные задержки; повышает механическое и электрическое спокойствие кабеля в работе. Отдельно важен выбор PTFE (тефлона) — материал давно считается одним из наиболее предпочтительных для high-end аудио благодаря крайне низкому поглощению энергии, малым потерям и более предсказуемому профилю искажений. Присутствие воздуха в тефлоновых трубках дополнительно снижает эффект расфокусировки сигнала. Когда уровень межзёренных искажений, радиочастотного загрязнения и временной нестабильности падает, система звучит не просто «ярче» или «детальнее», а более цельно, спокойно и зрело — больше порядка, тишины и внутренней непрерывности.",
    image: `${IMG}/gal-braid.webp`,
    alt: "Montelar Reference AC Architecture — плетёная оплётка и демпфирующий слой",
  },
];

// Interactive hotspots over the connectors photo — labels from the cable's real features.
type Hotspot = { id: string; x: number; y: number; title: string; text: string };
// Coordinates measured against gal-connectors.webp: Schuko plug bottom-left,
// IEC socket on the right connector, carbon barrel of the right connector,
// braided sleeve at the top of the loop.
const HOTSPOTS: Hotspot[] = [
  { id: "plug", x: 14, y: 64, title: "Силовая вилка Schuko", text: "Сетевая вилка Schuko с круглыми штырями — подключение компонента к силовой линии" },
  { id: "iec", x: 67, y: 71, title: "Разъём IEC", text: "Разъём IEC для подключения к аппаратуре — транспорт, ЦАП, усиление, источник питания" },
  { id: "carbon", x: 80, y: 62, title: "Карбоновый ствол", text: "Рифлёный ствол разъёма с карбоновой отделкой — механическая стабильность и виброразвязка соединения" },
  { id: "braid", x: 52, y: 45, title: "Плетёная оплётка", text: "Многослойная плетёная оплётка — система шуморассеивания и демпфирующий слой кабеля" },
];

const SOUND_NOTES = [
  "Более тёмный и чистый фон",
  "Лучшая структурность сцены",
  "Более точная локализация образов",
  "Более плотный и дисциплинированный бас",
  "Снижение жёсткости и зернистости на ВЧ",
  "Рост микродинамической выразительности",
];

// Models — three real versions from the Avito listing (warm light stripe).
type Model = {
  name: string;
  tier: string;
  conductor: string;
  section: string;
  price: string;
  note: string;
};
const MODELS: Model[] = [
  {
    name: "Reference Grey",
    tier: "Базовая референсная · Controlled Foundation",
    conductor: "POCC+ / OCC CRYO 7N",
    section: "1.6 м · сечение 5 мм",
    price: "109 990 ₽",
    note: "Заметный шаг вперёд по сравнению с типовым подключением: общая собранность, очищение фона, уверенный контроль НЧ при естественном тональном балансе.",
  },
  {
    name: "Extremo Power",
    tier: "Старшая референсная · Power Architecture",
    conductor: "XPOCC+ / HEX TRIPLE C / LGS+ 8N CRYO",
    section: "1.6 м · сечение 6 мм",
    price: "210 990 ₽",
    note: "Энергетическая стабильность, более глубокая тишина между звуками, монументальная сцена и усиленная внутренняя собранность музыкальной формы.",
  },
  {
    name: "Solution AG11",
    tier: "Флагман · Pure Silver Reference",
    conductor: "OCC Silver 6N CRYO · чистое серебро",
    section: "1.6 м · все три проводника",
    price: "289 990 ₽",
    note: "Ультимативный класс: тишина фона, ясность внутренних связей, микродинамическая свобода, глубина сцены и благородная прозрачность без напряжения.",
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
          <span>{open ? "Свернуть" : "Подробнее об инженерии"}</span>
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

export function ConductorCablesLanding({ requestPath, categoryPath, locale }: ConductorCablesLandingProps) {
  const rootRef = useRef<HTMLElement>(null);
  const [activeSpot, setActiveSpot] = useState<string>("plug");

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
    <main className="dac-lp2 cables-lp2" ref={rootRef}>
      {/* Scoped overrides — never touch globals.css (shared). Widen the hero lead
          from the cramped 18ch base to a comfortable ~50ch measure on desktop;
          mobile keeps its own 34ch rule. */}
      <style>{`
        @media (min-width: 768px) {
          .cables-lp2 .dac-lp2-hero-copy .dac-lp2-lead { max-width: 52ch; }
        }
      `}</style>
      <div className="dac-lp2-progress" aria-hidden="true" />

      {/* ─── HERO BANNER — headline in the LEFT negative space (never over the device) ─── */}
      <section className="dac-lp2-hero" aria-label="Montelar Reference AC Architecture">
        <div className="dac-lp2-hero-media">
          <picture>
            <source media="(max-width: 767px)" srcSet={`${IMG}/hero-mobile-9x16.webp`} />
            <img
              className="dac-lp2-hero-img"
              src={`${IMG}/hero-desktop-16x9.webp`}
              alt="Montelar Reference AC Architecture — силовой кабель с плетёной оплёткой на тёплом архитектурном фоне"
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
            <p className="dac-lp2-eyebrow dac-lp2-reveal-now">Montelar · Perfect Conductors · Power Collection</p>
            <h1 className="dac-lp2-title dac-lp2-reveal-now" style={{ ["--reveal-delay" as string]: "90" }}>
              Reference AC Architecture
            </h1>
            <p className="dac-lp2-lead dac-lp2-reveal-now" style={{ ["--reveal-delay" as string]: "180" }}>
              Силовые кабели референсного класса для систем, где питание — структурный элемент всей
              звуковой архитектуры.{" "}
              <span className="dac-lp2-lead-tail">
                Монокристаллические проводники, тефлоновый диэлектрик и многослойное шуморассеивание —
                от Reference Grey до флагмана на чистом серебре.
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
            <span className="dac-lp2-price-label">Цена · от</span>
            <span className="dac-lp2-price">109&nbsp;990&nbsp;₽</span>
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
            В high-end системе питание никогда не бывает второстепенной темой. Именно в силовой
            архитектуре определяется, насколько свободно компонент работает с микродинамикой, держит
            форму сцены и раскрывает тембры. Montelar Power Collection даёт компоненту более стабильную,
            менее загрязнённую и предсказуемую среду питания — без «эффекта кабеля».
          </p>
        </div>
      </section>

      {/* ─── BENTO — construction in numbers (glass tiles + count-up) ─── */}
      <section className="dac-lp2-bento-sec">
        <div className="dac-lp2-wrap">
          <div className="dac-lp2-sec-head" data-reveal>
            <p className="dac-lp2-kicker">Конструкция в цифрах</p>
            <h2 className="dac-lp2-h2">Каждый слой кабеля — отдельная инженерная дисциплина</h2>
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
            <p className="dac-lp2-kicker">Инженерия</p>
            <h2 className="dac-lp2-h2">Три решения, из которых складывается силовая архитектура</h2>
          </div>
          <div className="dac-lp2-stories-list">
            {STORIES.map((s, i) => (
              <StoryCard key={s.n} story={s} flip={i % 2 === 1} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── IMAGE BAND — cinematic warm product photo, NO text overlay ─── */}
      <section className="dac-lp2-imageband" data-reveal aria-label="Montelar Reference AC Architecture — крупный план">
        <div className="dac-lp2-imageband-frame">
          <img
            className="dac-lp2-imageband-img"
            src={`${IMG}/gal-coil.webp`}
            alt="Montelar Reference AC Architecture на тёплом архитектурном фоне с золотыми акцентами"
            decoding="async"
            loading="eager"
            width={1536}
            height={1024}
          />
        </div>
      </section>

      {/* ─── INTERACTIVE CONNECTORS — hotspots over the real photo ─── */}
      <section className="dac-lp2-panel-sec">
        <div className="dac-lp2-wrap">
          <div className="dac-lp2-sec-head" data-reveal>
            <p className="dac-lp2-kicker">Разъёмы и оплётка</p>
            <h2 className="dac-lp2-h2">Карбоновые стволы, силовая вилка и многослойная оплётка</h2>
            <p className="dac-lp2-sec-hint">Наведите или коснитесь точки на кабеле</p>
          </div>
          <div className="dac-lp2-panel" data-reveal data-delay="80">
            <div className="dac-lp2-panel-stage">
              <img
                src={`${IMG}/gal-connectors.webp`}
                alt="Разъёмы Montelar Reference AC Architecture — карбоновые стволы и силовая вилка"
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
          <h2 className="dac-lp2-h2">Разъёмы, оплётка и конструкция — крупным планом</h2>
          <p className="dac-lp2-gallery-hint">Потяните, чтобы листать</p>
        </div>
        <DacProductCarousel locale={locale} items={GALLERY} title="Montelar Reference AC Architecture" variant="framed" />
      </section>

      {/* ─── SOUND — warm brown glass tiles ─── */}
      <section className="dac-lp2-sound">
        <div className="dac-lp2-wrap">
          <p className="dac-lp2-kicker" data-reveal>Как это проявляется в системе</p>
          <h2 className="dac-lp2-h2" data-reveal data-delay="60">
            Не «эффектный» кабель, а изменение структурного уровня — больше порядка, тишины и
            внутренней непрерывности.
          </h2>
          <ul className="dac-lp2-sound-list" data-reveal data-delay="120">
            {SOUND_NOTES.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── МОДЕЛИ ЛИНЕЙКИ — warm LIGHT stripe (three real versions) ─── */}
      <section className="dac-lp2-versions">
        <div className="dac-lp2-wrap">
          <p className="dac-lp2-kicker dac-lp2-kicker--dark" data-reveal>Линейка Power Collection</p>
          <h2 className="dac-lp2-h2 dac-lp2-h2--dark" data-reveal data-delay="50">
            Три модели — под уровень и характер тракта
          </h2>
          <dl className="dac-lp2-version-grid" data-reveal data-delay="100">
            {MODELS.map((m) => (
              <div className="dac-lp2-version-card" key={m.name}>
                <dt>{m.name}</dt>
                <dd>
                  <span className="dac-lp2-version-tier">{m.tier}</span>
                  <span className="dac-lp2-version-spec">{m.conductor}</span>
                  <span className="dac-lp2-version-spec">{m.section}</span>
                  <span className="dac-lp2-version-note">{m.note}</span>
                  <span className="dac-lp2-version-price">{m.price}</span>
                </dd>
              </div>
            ))}
          </dl>
          <p className="dac-lp2-conn-note dac-lp2-conn-note--dark" data-reveal data-delay="120">
            Общие конструктивные особенности линейки: гибридные или мономатериальные проводники высокого
            класса, высокая степень очистки металла, отжиг и криогенная обработка, тефлоновый диэлектрик,
            многослойное шуморассеивание на основе углерода и натуральный латекс как демпфирующий слой.
            Длина всех моделей — 1.6 м.
          </p>
        </div>
      </section>

      {/* ─── FINAL CTA — warm climax ─── */}
      <section className="dac-lp2-final-cta">
        <div className="dac-lp2-wrap">
          <p className="dac-lp2-kicker" data-reveal>Позиционирование</p>
          <p className="dac-lp2-statement-body" data-reveal data-delay="60">
            Montelar Reference AC Architecture — это силовая линия не для формального апгрейда, а для
            систем, где питание рассматривается как часть всей архитектуры сигнала. Старшие версии особенно
            убедительны там, где уже слышны не просто изменения тонального баланса, а изменения
            структурного уровня: ритмической устойчивости, внутренней тишины и способности системы
            сохранять форму музыкального события.
          </p>
          <div className="dac-lp2-final-foot" data-reveal data-delay="120">
            <div className="dac-lp2-price-block">
              <span className="dac-lp2-price-label">Цена · от</span>
              <span className="dac-lp2-price">109&nbsp;990&nbsp;₽</span>
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
