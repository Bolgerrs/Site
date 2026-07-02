"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import Link from "next/link";
import { DacProductCarousel, type DacCarouselItem } from "@/components/dac-product-carousel";
import type { SiteLocale } from "@/config/i18n";

type ConductorClockLandingProps = {
  locale: SiteLocale;
  requestPath: string;
  categoryPath: string;
};

const IMG = "/images/products/conductor-clock";

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
const IcConnector = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={p.className} {...stroke} aria-hidden="true">
    <circle cx="9" cy="12" r="4.5" />
    <circle cx="9" cy="12" r="1.4" />
    <path d="M13.5 12H21M16 9.5v5M19 9.5v5" />
  </svg>
);
const IcClock = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={p.className} {...stroke} aria-hidden="true">
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
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
    id: "clock-connectors",
    image: `${IMG}/gal-connectors.webp`,
    title: "Разъёмы BNC",
    role: localized("Золотой байонет · рифлёные серебряные стволы"),
  },
  {
    id: "clock-braid",
    image: `${IMG}/gal-braid.webp`,
    title: "Серебряная оплётка",
    role: localized("Посеребрённый экран из тех же материалов, что и проводник"),
  },
  {
    id: "clock-coil",
    image: `${IMG}/gal-coil.webp`,
    title: "Конструкция кабеля",
    role: localized("7 проводников большого сечения · мягкий тефлон"),
  },
  {
    id: "clock-interior",
    image: `${IMG}/gal-interior.webp`,
    title: "В системе",
    role: localized("transport → ЦАП · external clock → ЦАП / транспорт"),
  },
];

// Hero ledger highlights — from the Avito description.
const HIGHLIGHTS: Array<{ k: string; v: string }> = [
  { k: "Проводник", v: "медь 99.999997%" },
  { k: "Покрытие", v: "серебро 99.9997%" },
  { k: "Архитектура", v: "7 проводников" },
  { k: "Разъёмы", v: "BNC / RCA" },
];

// Bento "materials in numbers" — animated count-up where numeric.
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
    id: "copper",
    size: "lg",
    value: "99.999997%",
    label: "длиннокристаллическая медь",
    sub: "Тщательно очищенная медь высокой чистоты как основа проводника — высокая стабильность параметров и дисциплина материала.",
    Icon: IcConductor,
  },
  {
    id: "cores",
    size: "sm",
    count: 7,
    label: "проводников большого сечения",
    sub: "Семипроводниковая архитектура большого сечения в основе кабеля.",
    Icon: IcLayers,
  },
  {
    id: "silver",
    size: "sm",
    value: "99.9997%",
    label: "серебряное покрытие",
    sub: "Каждый проводник покрыт серебром чистотой 99.9997% — точность и скорость передачи поверхностного сигнала.",
    Icon: IcSilver,
  },
  {
    id: "plating",
    size: "wide",
    count: 15,
    suffix: " %",
    label: "содержание серебряного покрытия",
    sub: "Сочетание очищенной меди как основы и серебра как материала, повышающего разрешение, ясность и внутреннюю организованность подачи.",
    Icon: IcWave,
  },
  {
    id: "dielectric",
    size: "sm",
    value: "PTFE",
    label: "мягкий итальянский тефлон",
    sub: "Сохраняет преимущества классического PTFE, но заметно лучше демпфирует по сравнению с жёсткими вариантами.",
    Icon: IcShield,
  },
  {
    id: "dupont",
    size: "sm",
    value: "DuPont",
    label: "финальный диэлектрик",
    sub: "Внешний диэлектрический слой выполнен на основе тефлона DuPont PTFE.",
    Icon: IcShield,
  },
  {
    id: "shield",
    size: "wide",
    value: "Ag-ленты",
    label: "посеребрённый экран",
    sub: "Экран из посеребрённых лент из тех же материалов, что и основной проводник: сигнальный и обратный путь — одного класса.",
    Icon: IcWeave,
  },
  {
    id: "connectors",
    size: "sm",
    value: "BNC / RCA",
    label: "цифровое соединение",
    sub: "transport → ЦАП, external clock → ЦАП и транспорт — для устройств, чувствительных к качеству клок-сигнала.",
    Icon: IcConnector,
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
    title: "Цифровой коаксиал референсного класса, а не «подкраска» тракта",
    lead: "Montelar Reference Digital BNC создан для систем, где точность передачи импульсной информации, временна́я стабильность и чистота фоновой среды имеют принципиальное значение.",
    detail:
      "В цифровом коаксиальном соединении качество кабеля определяется не только формальным соответствием стандарту, но и тем, насколько точно он сохраняет форму сигнала, насколько устойчив к паразитным воздействиям и насколько мало вносит собственных временны́х и структурных искажений. Кабель создавался как система, в которой механическая стабильность, проводниковая архитектура, диэлектрическая среда и уровень экрана работают как единое целое — задача не «подкрасить» цифровой тракт, а обеспечить ему более точную, спокойную и структурно цельную среду передачи.",
    image: `${IMG}/gal-braid.webp`,
    alt: "Reference Digital BNC — катушка с серебряной оплёткой и золотыми BNC на тёплом архитектурном фоне",
  },
  {
    n: "02",
    kicker: "Материалы и конструкция",
    title: "Длиннокристаллическая медь 99.999997% и серебро в семипроводниковой архитектуре",
    lead: "В основе кабеля — длиннокристаллическая медь высокой чистоты 99.999997% в семипроводниковой архитектуре большого сечения; каждый проводник покрыт серебром чистотой 99.9997% с содержанием покрытия 15%.",
    detail:
      "Конструкция сочетает достоинства тщательно очищенной меди как основы и серебра как материала, повышающего точность и скорость передачи поверхностного сигнала. В результате кабель демонстрирует не просто высокое разрешение, а редкое сочетание ясности, естественности и внутренней организованности. Источник инженерной культуры — технологии и материалы, применяемые в производстве проводников для аэрокосмической отрасли Великобритании и США: они определяют высокую стабильность параметров, дисциплину материалов и исключительное внимание к физике проводника.",
    image: `${IMG}/gal-connectors.webp`,
    alt: "Reference Digital BNC — BNC-разъёмы и оплётка крупным планом",
  },
  {
    n: "03",
    kicker: "Диэлектрик и экран",
    title: "Мягкий тефлон DuPont и посеребрённый экран одного класса с проводником",
    lead: "Особое внимание уделено диэлектрику: используется мягкий итальянский тефлон, который сохраняет электрические преимущества классического PTFE, но обладает заметно лучшими демпфирующими свойствами.",
    detail:
      "Финальный диэлектрик выполнен на основе тефлона DuPont. Экран реализован в виде посеребрённых лент из тех же материалов, что и основной проводник — это принципиальный момент: в конструкции такого уровня качество сигнального и обратного пути не должно различаться по классу материала. Именно поэтому кабель сохраняет единый уровень проводниковой культуры не только в основной, но и в экранной части.",
    image: `${IMG}/gal-coil.webp`,
    alt: "Reference Digital BNC — катушка кабеля с плотной серебряной оплёткой",
  },
  {
    n: "04",
    kicker: "Область применения",
    title: "BNC-кабель, цифровой RCA и линия для внешних clock-генераторов",
    lead: "Montelar Reference Digital BNC применяется как цифровой BNC-кабель транспорт → ЦАП, как коаксиальный RCA-кабель цифрового назначения и как референсное решение для подключения внешних тактовых генераторов.",
    detail:
      "Именно в работе с внешними clock-генераторами и высококлассными цифровыми источниками особенно заметно, насколько кабель способен сохранять временну́ю дисциплину, фокус и спокойствие подачи. Решение адресовано трактам, чувствительным к качеству клок-сигнала: подключение внешних генераторов к ЦАП, транспортам и цифровым устройствам.",
    image: `${IMG}/gal-braid.webp`,
    alt: "Reference Digital BNC — серебряная оплётка и золотой байонет BNC крупным планом",
  },
  {
    n: "05",
    kicker: "Как это проявляется в системе",
    title: "Кабель структурного уровня, а не локальный «вау-эффект»",
    lead: "В правильно выстроенном тракте кабель проявляет себя не как «эффектный», а как кабель структурного уровня: сцена становится устойчивее, фон — чище, а подача — спокойнее и непрерывнее.",
    detail:
      "На слух это выражается так: сцена становится более устойчивой и лучше организованной; возрастает ясность микродинамических переходов; улучшается чувство временно́й точности и ритмической собранности; фон воспринимается более чистым; высокие частоты звучат свободнее, но без стеклянной жёсткости; тембры становятся естественнее и менее «цифрово очерченными». Главное достоинство — в том, что кабель позволяет цифровому тракту звучать более взрослым, точным и органичным.",
    image: `${IMG}/gal-interior.webp`,
    alt: "Reference Digital BNC — кабель в системе, на тёмном мраморе в тёплой комнате прослушивания",
  },
];

// Interactive hotspots over the connectors photo — labels from the cable's real features.
type Hotspot = { id: string; x: number; y: number; title: string; text: string };
const HOTSPOTS: Hotspot[] = [
  { id: "gold", x: 17, y: 66, title: "Золотой байонет BNC", text: "Позолоченный контакт BNC — байонетное соединение для цифрового коаксиала" },
  { id: "barrel", x: 41, y: 54, title: "Рифлёный ствол", text: "Машинная обработка из алюминия с тонкими кольцевыми насечками — механическая стабильность соединения" },
  { id: "bnc2", x: 70, y: 42, title: "Второй разъём", text: "Цифровой BNC / коаксиальный RCA — transport → ЦАП и external clock → ЦАП / транспорт" },
  { id: "braid", x: 85, y: 29, title: "Серебряная оплётка", text: "Плотная посеребрённая оплётка-экран из тех же материалов, что и проводник" },
];

const SOUND_NOTES = [
  "Сцена становится устойчивее и лучше организована",
  "Возрастает ясность микродинамических переходов",
  "Улучшается чувство временно́й точности и ритмической собранности",
  "Фон воспринимается более чистым",
  "Высокие частоты звучат свободнее, без стеклянной жёсткости",
  "Тембры — естественнее и менее «цифрово очерченные»",
];

// Техническое резюме — spec ledger (warm light stripe). All from the Avito description.
const SPECS: Array<{ k: string; v: string }> = [
  { k: "Тип", v: "цифровой коаксиальный кабель BNC / RCA" },
  { k: "Назначение", v: "transport → DAC · external clock → DAC / transport" },
  { k: "Проводник", v: "длиннокристаллическая медь 99.999997%" },
  { k: "Архитектура", v: "7 проводников большого сечения" },
  { k: "Покрытие", v: "серебро 99.9997%, содержание 15%" },
  { k: "Основной диэлектрик", v: "мягкий итальянский тефлон" },
  { k: "Финальный диэлектрик", v: "DuPont PTFE" },
  { k: "Экран", v: "посеребрённые ленты из материалов проводника" },
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

export function ConductorClockLanding({ requestPath, categoryPath, locale }: ConductorClockLandingProps) {
  const rootRef = useRef<HTMLElement>(null);
  const [activeSpot, setActiveSpot] = useState<string>("gold");

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

    // Fail-safe: if nothing has triggered a scroll (e.g. a static/headless
    // full-page capture, or a slow reader sitting on the hero), force-reveal
    // every remaining section so content is NEVER stuck at opacity:0 below the
    // fold. Interactive users who scroll get the normal staggered scroll-reveal
    // first; this only catches the no-scroll case.
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
    <main className="dac-lp2 clock-lp2" ref={rootRef}>
      <style>{`
        /* P2 — hero lead: widen the desktop measure (globals caps it at 18ch → ragged river) */
        @media (min-width: 768px) {
          .clock-lp2 .dac-lp2-hero-copy .dac-lp2-lead { max-width: 52ch; }
        }
        /* P3 — price: force normal lining + tabular figures (no oldstyle figures) */
        .clock-lp2 .dac-lp2-price {
          font-variant-numeric: lining-nums tabular-nums;
          font-feature-settings: "lnum" 1, "tnum" 1, "onum" 0, "pnum" 0;
        }
      `}</style>
      <div className="dac-lp2-progress" aria-hidden="true" />

      {/* ─── HERO BANNER — headline in the LEFT negative space (never over the device) ─── */}
      <section className="dac-lp2-hero" aria-label="Montelar Reference Digital BNC">
        <div className="dac-lp2-hero-media">
          <picture>
            <source media="(max-width: 767px)" srcSet={`${IMG}/hero-mobile-9x16.webp`} />
            <img
              className="dac-lp2-hero-img"
              src={`${IMG}/hero-desktop-16x9.webp`}
              alt="Reference Digital BNC — серебряная оплётка и золотые BNC-разъёмы на тёплом архитектурном фоне"
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
            <p className="dac-lp2-eyebrow dac-lp2-reveal-now">Montelar · Perfect Conductors · Цифровой кабель</p>
            <h1 className="dac-lp2-title dac-lp2-reveal-now" style={{ ["--reveal-delay" as string]: "90" }}>
              Reference Digital BNC
            </h1>
            <p className="dac-lp2-lead dac-lp2-reveal-now" style={{ ["--reveal-delay" as string]: "180" }}>
              Цифровой коаксиальный кабель референсного класса BNC&nbsp;/&nbsp;RCA для систем, где важны
              точность импульса, временна́я стабильность и чистота фона.{" "}
              <span className="dac-lp2-lead-tail">
                Precision Clock &amp; Digital Link — линия для транспорта, ЦАП и внешних clock-генераторов.
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
            <span className="dac-lp2-price-label">Цена</span>
            <span className="dac-lp2-price">129&nbsp;990&nbsp;₽</span>
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
            Качество цифрового коаксиала определяется не формальным соответствием стандарту, а тем,
            насколько точно он сохраняет форму сигнала, насколько устойчив к паразитным воздействиям
            и насколько мало вносит собственных временны́х и структурных искажений. Здесь механическая
            стабильность, проводниковая архитектура, диэлектрик и экран работают как единая система.
          </p>
        </div>
      </section>

      {/* ─── BENTO — materials in numbers (glass tiles + count-up) ─── */}
      <section className="dac-lp2-bento-sec">
        <div className="dac-lp2-wrap">
          <div className="dac-lp2-sec-head" data-reveal>
            <p className="dac-lp2-kicker">Материалы в цифрах</p>
            <h2 className="dac-lp2-h2">Каждый слой конструкции — отдельная инженерная дисциплина</h2>
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
            <h2 className="dac-lp2-h2">Пять решений, из которых складывается кабель</h2>
          </div>
          <div className="dac-lp2-stories-list">
            {STORIES.map((s, i) => (
              <StoryCard key={s.n} story={s} flip={i % 2 === 1} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── IMAGE BAND — cinematic warm product photo, NO text overlay ─── */}
      <section className="dac-lp2-imageband" data-reveal aria-label="Reference Digital BNC — крупный план">
        <div className="dac-lp2-imageband-frame">
          <img
            className="dac-lp2-imageband-img"
            src={`${IMG}/gal-coil.webp`}
            alt="Reference Digital BNC на тёплом архитектурном фоне с золотыми акцентами"
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
            <h2 className="dac-lp2-h2">Золотой байонет BNC, рифлёные стволы и посеребрённый экран</h2>
            <p className="dac-lp2-sec-hint">Наведите или коснитесь точки на кабеле</p>
          </div>
          <div className="dac-lp2-panel" data-reveal data-delay="80">
            <div className="dac-lp2-panel-stage">
              <img
                src={`${IMG}/gal-connectors.webp`}
                alt="BNC-разъёмы Reference Digital BNC с золотым байонетом и серебряной оплёткой"
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
        <DacProductCarousel locale={locale} items={GALLERY} title="Montelar Reference Digital BNC" variant="framed" />
      </section>

      {/* ─── SOUND — warm brown glass tiles ─── */}
      <section className="dac-lp2-sound">
        <div className="dac-lp2-wrap">
          <p className="dac-lp2-kicker" data-reveal>Как это проявляется в системе</p>
          <h2 className="dac-lp2-h2" data-reveal data-delay="60">
            Не «эффектный» кабель, а кабель структурного уровня — больше спокойствия, глубины и
            внутренней непрерывности.
          </h2>
          <ul className="dac-lp2-sound-list" data-reveal data-delay="120">
            {SOUND_NOTES.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── ТЕХНИЧЕСКОЕ РЕЗЮМЕ — warm LIGHT stripe ─── */}
      <section className="dac-lp2-versions">
        <div className="dac-lp2-wrap">
          <p className="dac-lp2-kicker dac-lp2-kicker--dark" data-reveal>Техническое резюме</p>
          <h2 className="dac-lp2-h2 dac-lp2-h2--dark" data-reveal data-delay="50">
            Материалы и конструкция — по спецификации
          </h2>
          <dl className="dac-lp2-version-grid dac-lp2-spec-grid" data-reveal data-delay="100">
            {SPECS.map((row) => (
              <div className="dac-lp2-version-card" key={row.k}>
                <dt>{row.k}</dt>
                <dd>{row.v}</dd>
              </div>
            ))}
          </dl>
          <p className="dac-lp2-conn-note dac-lp2-conn-note--dark" data-reveal data-delay="120">
            Адресован системам, где цифровой тракт уже слышит не только тональный характер, но и более
            глубокие изменения: временну́ю стабильность, точность фокусировки, чистоту фона и
            естественность тембральной ткани.
          </p>
        </div>
      </section>

      {/* ─── FINAL CTA — warm climax ─── */}
      <section className="dac-lp2-final-cta">
        <div className="dac-lp2-wrap">
          <p className="dac-lp2-kicker" data-reveal>Позиционирование</p>
          <p className="dac-lp2-statement-body" data-reveal data-delay="60">
            Montelar Reference Digital BNC — это кабель не для формального апгрейда, а для случаев,
            когда цифровое соединение рассматривается как часть всей архитектуры сигнала: транспорт →
            ЦАП, внешний clock → ЦАП и транспорт, коаксиальный RCA цифрового назначения.
          </p>
          <div className="dac-lp2-final-foot" data-reveal data-delay="120">
            <div className="dac-lp2-price-block">
              <span className="dac-lp2-price-label">Цена</span>
              <span className="dac-lp2-price">129&nbsp;990&nbsp;₽</span>
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
