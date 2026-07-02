"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import Link from "next/link";
import { DacProductCarousel, type DacCarouselItem } from "@/components/dac-product-carousel";
import type { SiteLocale } from "@/config/i18n";

type AcousticsLandingProps = {
  locale: SiteLocale;
  requestPath: string;
  categoryPath: string;
};

const IMG = "/images/products/acoustics";

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
const IcTweeter = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={p.className} {...stroke} aria-hidden="true">
    <rect x="6" y="4" width="12" height="16" rx="1.6" />
    <path d="M9 7v10M12 7v10M15 7v10" />
  </svg>
);
const IcMid = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={p.className} {...stroke} aria-hidden="true">
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3.2" />
  </svg>
);
const IcBass = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={p.className} {...stroke} aria-hidden="true">
    <circle cx="12" cy="12" r="8.2" />
    <circle cx="12" cy="12" r="4.4" />
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
  </svg>
);
const IcCoil = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={p.className} {...stroke} aria-hidden="true">
    <path d="M3 14c0-3 2.5-5 4.5-5S12 11 12 14M9 14c0-3 2.5-5 4.5-5S18 11 18 14" />
    <path d="M3 17h18" />
  </svg>
);
const IcResistor = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={p.className} {...stroke} aria-hidden="true">
    <path d="M2 12h4l2-4 3 8 3-8 2 4h4" />
  </svg>
);
const IcTerminal = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={p.className} {...stroke} aria-hidden="true">
    <circle cx="8" cy="9" r="2.4" />
    <circle cx="16" cy="9" r="2.4" />
    <path d="M8 11.4V20M16 11.4V20M5.5 16h5M13.5 16h5" />
  </svg>
);
const IcWire = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={p.className} {...stroke} aria-hidden="true">
    <path d="M3 8c4 0 4 8 8 8s4-8 8-8" />
    <path d="M3 16c4 0 4-8 8-8" />
  </svg>
);
const IcCable = (p: IconProps) => (
  <svg viewBox="0 0 24 24" className={p.className} {...stroke} aria-hidden="true">
    <path d="M5 4v5a3 3 0 0 0 3 3h8a3 3 0 0 1 3 3v5" />
    <rect x="3" y="2.5" width="4" height="2.4" rx="0.6" />
    <rect x="17" y="19.1" width="4" height="2.4" rx="0.6" />
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
    id: "ac-signature",
    image: `${IMG}/gal-cutout.webp`,
    title: "Montelar Loudspeaker System",
    role: localized("Скорость · Натуральность · Динамическая цельность"),
  },
  {
    id: "ac-tweeter",
    image: `${IMG}/gal-tweeter.webp`,
    title: "АМТ-твитер",
    role: localized("Крупная площадь излучения · воздух, скорость, пространство"),
  },
  {
    id: "ac-drivers",
    image: `${IMG}/gal-drivers.webp`,
    title: "Драйверная архитектура",
    role: localized("АМТ-твитер · широкополосник 3 Lines+ · углеволоконный НЧ"),
  },
  {
    id: "ac-woofers",
    image: `${IMG}/gal-woofers.webp`,
    title: "Низкочастотная секция",
    role: localized("Углеволокно · фазовыравнивающая пуля · скорость и контроль"),
  },
  {
    id: "ac-interior",
    image: `${IMG}/gal-interior.webp`,
    title: "В интерьере",
    role: localized("Стереопара · фазовая цельность и слитность подачи"),
  },
];

// Hero ledger highlights — from the Avito description.
const HIGHLIGHTS: Array<{ k: string; v: string }> = [
  { k: "Высокие частоты", v: "Крупный АМТ-твитер" },
  { k: "Середина", v: "Широкополосник 3 Lines+" },
  { k: "Бас", v: "2× углеволокно + пуля" },
  { k: "Кроссовер", v: "Litz · Jensen · WBT" },
];

// Bento "engineering in numbers" — animated count-up where numeric.
type BentoTile = {
  id: string;
  size: "lg" | "wide" | "sm";
  count?: number;
  prefix?: string;
  suffix?: string;
  value?: string;
  label: string;
  sub: string;
  image?: string;
  Icon: (p: IconProps) => ReactElement;
};
const BENTO: BentoTile[] = [
  {
    id: "amt",
    size: "lg",
    value: "АМТ",
    label: "твитер с большой площадью излучения",
    sub: "Крупный АМТ-излучатель выбран ради скорости, работы с воздухом и послезвучиями и точного формирования пространства — открытый верх без механической жёсткости.",
    image: `${IMG}/gal-tweeter.webp`,
    Icon: IcTweeter,
  },
  {
    id: "lines",
    size: "sm",
    value: "3 Lines+",
    label: "среднечастотная архитектура",
    sub: "Двойная магнитная система, тканевый подвес с пропиткой, визор, металл-полимерный купол.",
    Icon: IcMid,
  },
  {
    id: "bass",
    size: "sm",
    count: 2,
    label: "НЧ-драйвера на углеволокне",
    sub: "С фазовыравнивающей пулей — глубина и давление при скорости и ритмическом контроле.",
    Icon: IcBass,
  },
  {
    id: "coil",
    size: "wide",
    value: "Litz",
    label: "катушки длиннокристаллической меди",
    sub: "Геометрия litz сохраняет проводимость и фазовую устойчивость в фильтрах кроссовера.",
    Icon: IcCoil,
  },
  {
    id: "jensen",
    size: "sm",
    value: "Jensen",
    label: "резисторы Superes",
    sub: "Отобранные резисторы Jensen Superes в цепях кроссовера.",
    Icon: IcResistor,
  },
  {
    id: "wbt",
    size: "sm",
    value: "WBT",
    label: "терминалы bi-wiring Evolution",
    sub: "Терминалы WBT Evolution с возможностью bi-wiring подключения.",
    Icon: IcTerminal,
  },
  {
    id: "neotech",
    size: "sm",
    value: "Neotech",
    label: "внутренняя разводка длиннокристаллическим проводником",
    sub: "Плёночные конденсаторы и проводник Neotech — чистота передачи энергии внутри системы.",
    Icon: IcWire,
  },
  {
    id: "phase",
    size: "sm",
    value: "1 фаза",
    label: "слитность всей полосы",
    sub: "Переходы между диапазонами не ощущаются как механические стыки.",
    Icon: IcWave,
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
    title: "Скорость, натуральность и динамика в одной фазово цельной конструкции",
    lead: "Montelar Loudspeaker System — не «компактная акустика с большим звуком», а задача соединить высокую скорость отклика, естественную тембральную ткань и крупный динамический жест одновременно и без взаимных компромиссов.",
    detail:
      "Работа над моделью заняла несколько лет: именно потому, что внешне это собранный, дисциплинированный объект, легко не заметить главного — по уровню акустической настройки и поиску согласованности система потребовала больше времени, чем многие значительно более крупные многополосные проекты. Вся конструкция выстраивалась вокруг трёх приоритетов: скорость переходных процессов, естественность и непринуждённость середины, фазовая цельность и слитность всей полосы. Каждый диапазон подбирался не изолированно, а как часть общей архитектуры звука.",
    image: `${IMG}/gal-cutout.webp`,
    alt: "Montelar Loudspeaker System — башня целиком на тёплом архитектурном фоне с золотом",
  },
  {
    n: "02",
    kicker: "Высокочастотный диапазон",
    title: "Крупный АМТ-твитер — воздух, скорость и пространство",
    lead: "За верхний диапазон отвечает крупный АМТ-твитер с большой площадью излучения — решение, выбранное ради фундаментальных достоинств, а не «эффектных ВЧ».",
    detail:
      "Высокая скорость, способность работать с воздухом и послезвучиями, точное формирование пространства и свободное заполнение объёма без ощущения механической жёсткости. В аспектах, связанных с ощущением воздуха, глубины, открытости и свободы верхнего регистра, АМТ-излучатель остаётся одним из наиболее убедительных решений — при условии, что он правильно интегрирован в общую акустическую концепцию.",
    image: `${IMG}/gal-tweeter.webp`,
    alt: "Крупный АМТ-ленточный твитер крупным планом под тёплым золотым светом",
  },
  {
    n: "03",
    kicker: "Среднечастотный диапазон · 3 Lines+",
    title: "Широкополосный динамик, который звучит живо и естественно",
    lead: "Средние частоты поручены широкополосному динамику с двойной магнитной системой, тканевым подвесом с пропиткой, дополнительным визором и металл-полимерным куполом — архитектура 3 Lines+.",
    detail:
      "Выбор такого драйвера определён стремлением получить середину, которая звучит не «эффектно», а живо, быстро и естественно. Тканевый подвес здесь важен не как декоративная деталь, а как часть общей механической культуры динамика — в отличие от более массовых решений, где ради универсальности и удешевления применяются иные материалы с иным характером работы. Именно середина отвечает за степень непосредственности, пластики и человеческой убедительности, без которой high-end акустика остаётся лишь демонстрацией технических возможностей.",
    image: `${IMG}/gal-drivers.webp`,
    alt: "Широкополосный среднечастотник 3 Lines+ между АМТ-твитером и НЧ-драйвером — общий план драйверной колонны",
  },
  {
    n: "04",
    kicker: "Низкочастотный диапазон",
    title: "Два углеволоконных драйвера с фазовыравнивающей пулей",
    lead: "Нижний диапазон реализован на двух динамиках на базе углеродного волокна с фазовыравнивающей пулей. Задача НЧ-секции — не просто масса и масштаб, а скорость и ритмический контроль.",
    detail:
      "Низкочастотная часть должна двигаться достаточно быстро, не запаздывать по отношению к АМТ и сверхлёгкой середине, сохранять артикуляцию и внутренний ритмический контроль и работать как продолжение общей музыкальной линии, а не как отдельный «басовый модуль». Поэтому выбор сделан в пользу драйверов, способных обеспечить не только глубину и давление, но и ту степень скорости, которая необходима для слитного и фазово согласованного звучания.",
    image: `${IMG}/gal-woofers.webp`,
    alt: "Два низкочастотных драйвера на углеродном волокне с фазовыравнивающей пулей крупным планом",
  },
  {
    n: "05",
    kicker: "Фазовая цельность · кроссовер",
    title: "Единое акустическое событие, а не набор сильных полос",
    lead: "Одна из центральных задач — объединить воздушность и скорость АМТ, мгновенный отклик середины и энергетику двух НЧ-драйверов в непрерывное акустическое событие.",
    detail:
      "Результат задумывался не как набор сильных полос, а как фазово цельная и внутренне согласованная система, где переходы не ощущаются как механические стыки. Внутренняя схемотехника выстроена с тем же вниманием, что и драйверная архитектура: катушки из длиннокристаллической меди litz, плёночные конденсаторы, резисторы Jensen Superes, терминалы bi-wiring WBT Evolution и внутренняя разводка на длиннокристаллическом проводнике Neotech. Подбор обусловлен не перечнем «топовых компонентов», а задачей сохранить скорость, проводимость, фазовую устойчивость и чистоту передачи энергии внутри самой акустической системы.",
    image: `${IMG}/gal-interior.webp`,
    alt: "Стереопара Montelar Loudspeaker System в тёплом интерьере",
  },
];

// Interactive hotspots over the whole-tower photo — labels from real features.
type Hotspot = { id: string; x: number; y: number; title: string; text: string };
const HOTSPOTS: Hotspot[] = [
  { id: "amt", x: 48, y: 22, title: "АМТ-твитер", text: "Крупный АМТ-излучатель с большой площадью — воздух, скорость, точное пространство" },
  { id: "mid", x: 48, y: 34, title: "Середина · 3 Lines+", text: "Широкополосник: двойная магнитная система, тканевый подвес, визор, металл-полимерный купол" },
  { id: "lf1", x: 48, y: 47, title: "НЧ · углеволокно", text: "Драйверы на углеродном волокне с фазовыравнивающей пулей — скорость и ритмический контроль" },
  { id: "lf2", x: 48, y: 60, title: "Бас без запаздывания", text: "Низ работает как продолжение музыкальной линии, а не отдельный «басовый модуль»" },
  { id: "feet", x: 48, y: 82, title: "Корпус и опоры", text: "Собранный дисциплинированный объект на шипованных опорах — архитектурная цельность" },
];

const SOUND_NOTES = [
  "Быстрая, свободная атака",
  "Естественная и телесная середина",
  "Открытый, воздушный верх без стеклянной жёсткости",
  "Собранный, ритмически дисциплинированный бас",
  "Крупный динамический жест без тяжеловесности",
  "Слитность полос и высокая фазовая цельность",
];

// Crossover element cards — repurposed warm-light stripe (real Avito components).
const CROSSOVER: Array<{ k: string; v: string }> = [
  { k: "Катушки", v: "Litz, длиннокристаллическая медь" },
  { k: "Конденсаторы", v: "Плёночные" },
  { k: "Резисторы", v: "Jensen Superes" },
  { k: "Терминалы", v: "WBT Evolution · bi-wiring" },
  { k: "Разводка", v: "Neotech · длиннокристаллический проводник" },
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
        <img src={story.image} alt={story.alt} loading="lazy" decoding="async" width={1200} height={1499} />
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

export function AcousticsLanding({ requestPath, categoryPath, locale }: AcousticsLandingProps) {
  const rootRef = useRef<HTMLElement>(null);
  const [activeSpot, setActiveSpot] = useState<string>("amt");

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const runCount = (el: HTMLElement) => {
      const target = Number(el.dataset.count || "0");
      if (!target || prefersReduced) {
        el.textContent = String(target);
        return;
      }
      const dur = 1100;
      let start = 0;
      const tick = (t: number) => {
        if (!start) start = t;
        const p = Math.min(1, (t - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(eased * target));
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = String(target);
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
          c.textContent = String(Number(c.dataset.count || "0"));
        });
      } else {
        io.observe(el);
      }
    });

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

    // Safety net: under heavy load (e.g. software WebGL in headless/review envs)
    // rAF and IntersectionObserver callbacks can be starved, so scroll-reveal may
    // never fire and sections stay invisible. A time-based sweep reveals anything
    // that has entered the viewport regardless of scroll/rAF timing (this also
    // reveals everything during a full-page screenshot, where the viewport spans
    // the whole document), and a final failsafe guarantees nothing stays hidden.
    const sweep = () => {
      const vh = window.innerHeight;
      root.querySelectorAll<HTMLElement>("[data-reveal]:not(.in)").forEach((el) => {
        if (el.getBoundingClientRect().top < vh * 0.92) reveal(el);
      });
    };
    const sweepId = window.setInterval(() => {
      sweep();
      if (root.querySelectorAll("[data-reveal]:not(.in)").length === 0) {
        window.clearInterval(sweepId);
      }
    }, 350);
    const failsafeId = window.setTimeout(() => {
      root.querySelectorAll<HTMLElement>("[data-reveal]:not(.in)").forEach(reveal);
      window.clearInterval(sweepId);
    }, 4000);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onProgress);
      window.removeEventListener("resize", onProgress);
      window.clearInterval(sweepId);
      window.clearTimeout(failsafeId);
      io.disconnect();
    };
  }, []);

  const activeHotspot = HOTSPOTS.find((h) => h.id === activeSpot) ?? HOTSPOTS[0]!;

  return (
    <main className="dac-lp2" ref={rootRef}>
      <style>{`
        /* Crossover cards — long values (Neotech…, WBT…) must wrap, never overflow the card */
        .dac-lp2 .dac-lp2-version-card { min-width: 0; }
        .dac-lp2 .dac-lp2-version-card dd {
          white-space: normal;
          overflow-wrap: anywhere;
          word-break: break-word;
        }
        /* AMT bento tile — fill the large-tile void with the real АМТ-twitter photo */
        .dac-lp2 .dac-lp2-tile-photo {
          position: absolute;
          inset: 0;
          z-index: -1;
          overflow: hidden;
          border-radius: inherit;
        }
        .dac-lp2 .dac-lp2-tile-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.42;
        }
        .dac-lp2 .dac-lp2-tile-photo::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(165deg, rgba(24,17,10,0.34) 0%, rgba(20,14,8,0.66) 58%, rgba(18,12,6,0.86) 100%);
        }
        .dac-lp2 .dac-lp2-tile--has-photo:hover .dac-lp2-tile-photo img { opacity: 0.5; }
        .dac-lp2 .dac-lp2-tile--has-photo .dac-lp2-tile-label,
        .dac-lp2 .dac-lp2-tile--has-photo .dac-lp2-tile-sub { text-shadow: 0 1px 14px rgba(0,0,0,0.72); }
      `}</style>
      <div className="dac-lp2-progress" aria-hidden="true" />

      {/* ─── HERO BANNER — headline in the LEFT negative space (never over the device) ─── */}
      <section className="dac-lp2-hero" aria-label="Montelar Loudspeaker System">
        <div className="dac-lp2-hero-media">
          <picture>
            <source media="(max-width: 767px)" srcSet={`${IMG}/hero-mobile-9x16.webp`} />
            <img
              className="dac-lp2-hero-img"
              src={`${IMG}/hero-desktop-16x9.webp`}
              alt="Montelar Loudspeaker System — напольная акустика на тёплом архитектурном фоне с золотом"
              decoding="async"
              fetchPriority="high"
              width={1600}
              height={900}
            />
          </picture>
          <div className="dac-lp2-hero-scrim" aria-hidden="true" />
        </div>

        <div className="dac-lp2-hero-copy">
          <div className="dac-lp2-wrap">
            <p className="dac-lp2-eyebrow dac-lp2-reveal-now">Montelar · Акустические системы</p>
            <h1 className="dac-lp2-title dac-lp2-reveal-now" style={{ ["--reveal-delay" as string]: "90" }}>
              Loudspeaker System
            </h1>
            <p className="dac-lp2-lead dac-lp2-reveal-now" style={{ ["--reveal-delay" as string]: "180" }}>
              Многополосная акустическая система, построенная вокруг трёх приоритетов: скорости,
              натуральности и широкого динамического диапазона.{" "}
              <span className="dac-lp2-lead-tail">
                Скорость · Натуральность · Динамическая цельность.
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
            <span className="dac-lp2-price">790&nbsp;990&nbsp;₽</span>
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
              Hi-End Audio
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CONCEPT STATEMENT ─── */}
      <section className="dac-lp2-statement">
        <div className="dac-lp2-wrap">
          <p className="dac-lp2-kicker" data-reveal>Концепция</p>
          <p className="dac-lp2-statement-body" data-reveal data-delay="80">
            Главное здесь — не громкость, а согласованность: высокая скорость отклика, естественная
            тембральная ткань и способность к крупному динамическому жесту существуют одновременно
            и без взаимных компромиссов. Каждый диапазон подбирался как часть общей архитектуры
            звука, а не изолированно.
          </p>
        </div>
      </section>

      {/* ─── BENTO — engineering in numbers (glass tiles + count-up) ─── */}
      <section className="dac-lp2-bento-sec">
        <div className="dac-lp2-wrap">
          <div className="dac-lp2-sec-head" data-reveal>
            <p className="dac-lp2-kicker">Архитектура в деталях</p>
            <h2 className="dac-lp2-h2">Каждый диапазон подобран как часть единой полосы</h2>
          </div>
          <div className="dac-lp2-bento">
            {BENTO.map((t, i) => (
              <article
                key={t.id}
                className={`dac-lp2-tile dac-lp2-tile--${t.size}${t.image ? " dac-lp2-tile--has-photo" : ""}`}
                data-reveal
                data-delay={String((i % 4) * 70)}
              >
                {t.image ? (
                  <span className="dac-lp2-tile-photo" aria-hidden="true">
                    <img src={t.image} alt="" loading="lazy" decoding="async" width={1200} height={1499} />
                  </span>
                ) : null}
                <span className="dac-lp2-tile-ic"><t.Icon className="dac-lp2-ic" /></span>
                <div className="dac-lp2-tile-figure">
                  {t.prefix ? <span className="dac-lp2-tile-affix">{t.prefix}</span> : null}
                  {typeof t.count === "number" ? (
                    <span className="dac-lp2-tile-num" data-count={t.count}>0</span>
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
            <h2 className="dac-lp2-h2">Пять решений, из которых складывается система</h2>
          </div>
          <div className="dac-lp2-stories-list">
            {STORIES.map((s, i) => (
              <StoryCard key={s.n} story={s} flip={i % 2 === 1} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── IMAGE BAND — cinematic warm product photo, NO text overlay ─── */}
      <section className="dac-lp2-imageband" data-reveal aria-label="Montelar Loudspeaker System — в интерьере">
        <div className="dac-lp2-imageband-frame">
          <img
            className="dac-lp2-imageband-img"
            src={`${IMG}/gal-interior.webp`}
            alt="Стереопара Montelar Loudspeaker System на тёплом архитектурном фоне с золотыми акцентами"
            decoding="async"
            loading="lazy"
            width={1600}
            height={900}
          />
        </div>
      </section>

      {/* ─── INTERACTIVE FRONT PANEL — hotspots over the real photo ─── */}
      <section className="dac-lp2-panel-sec">
        <div className="dac-lp2-wrap">
          <div className="dac-lp2-sec-head" data-reveal>
            <p className="dac-lp2-kicker">Драйверы и корпус</p>
            <h2 className="dac-lp2-h2">АМТ, широкополосная середина и два НЧ-драйвера</h2>
            <p className="dac-lp2-sec-hint">Наведите или коснитесь точки на корпусе</p>
          </div>
          <div className="dac-lp2-panel" data-reveal data-delay="80">
            <div className="dac-lp2-panel-stage dac-lp2-panel-stage--tall">
              <img
                src={`${IMG}/gal-cutout.webp`}
                alt="Передняя панель Montelar Loudspeaker System с драйверами"
                loading="lazy"
                decoding="async"
                width={1200}
                height={1499}
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
          <h2 className="dac-lp2-h2">Башня, драйверы и сцена прослушивания — крупным планом</h2>
          <p className="dac-lp2-gallery-hint">Потяните, чтобы листать</p>
        </div>
        <DacProductCarousel locale={locale} items={GALLERY} title="Montelar Loudspeaker System" variant="framed" />
      </section>

      {/* ─── HOW IT SOUNDS — warm brown glass tiles ─── */}
      <section className="dac-lp2-sound">
        <div className="dac-lp2-wrap">
          <p className="dac-lp2-kicker" data-reveal>Как это проявляется в звуке</p>
          <h2 className="dac-lp2-h2" data-reveal data-delay="60">
            Сочетание качеств, которые редко живут вместе без компромиссов — музыка звучит как
            единая, непрерывная и живая форма.
          </h2>
          <ul className="dac-lp2-sound-list" data-reveal data-delay="120">
            {SOUND_NOTES.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── CROSSOVER ELEMENTS — warm LIGHT stripe ─── */}
      <section className="dac-lp2-versions">
        <div className="dac-lp2-wrap">
          <p className="dac-lp2-kicker dac-lp2-kicker--dark" data-reveal>Кроссовер и внутренняя архитектура</p>
          <h2 className="dac-lp2-h2 dac-lp2-h2--dark" data-reveal data-delay="50">
            Схемотехника собрана с тем же вниманием, что и драйверная архитектура
          </h2>
          <dl className="dac-lp2-version-grid" data-reveal data-delay="100">
            {CROSSOVER.map((row) => (
              <div className="dac-lp2-version-card" key={row.k}>
                <dt>{row.k}</dt>
                <dd>{row.v}</dd>
              </div>
            ))}
          </dl>
          <p className="dac-lp2-conn-note dac-lp2-conn-note--dark" data-reveal data-delay="120">
            Дополнительно — кабельная экосистема: около 100 наименований силовых, акустических и
            межблочных кабелей (Furutech, Siltech, Audio Note, Mundorf, Oyaide, Acrolink, Nordost,
            Van den Hul, Ortofon, QED, Tchernov, Linn, PS Audio) и проводники PCOCC / серебро на отрез.
          </p>
        </div>
      </section>

      {/* ─── FINAL CTA — warm climax ─── */}
      <section className="dac-lp2-final-cta">
        <div className="dac-lp2-wrap">
          <p className="dac-lp2-kicker" data-reveal>Позиционирование</p>
          <p className="dac-lp2-statement-body" data-reveal data-delay="60">
            Montelar Loudspeaker System создана для зрелых систем, где ценится не локальная яркость
            впечатления, а глубокая музыкальная связность и архитектурная цельность подачи: скорость,
            натуральность, масштаб, пространственная свобода и внутренняя дисциплина.
          </p>
          <div className="dac-lp2-final-foot" data-reveal data-delay="120">
            <div className="dac-lp2-price-block">
              <span className="dac-lp2-price-label">Цена</span>
              <span className="dac-lp2-price">790&nbsp;990&nbsp;₽</span>
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
