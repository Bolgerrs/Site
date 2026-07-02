"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { DacProductCarousel, type DacCarouselItem } from "@/components/dac-product-carousel";
import type { SiteLocale } from "@/config/i18n";

type StreamerRoonLandingProps = {
  locale: SiteLocale;
  requestPath: string;
  categoryPath: string;
};

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const IMG = "/images/products/streamer-ads-ex-roon";

/* ────────────────────────────────────────────────────────────
   mailto CTA — pre-filled consultation template for THIS product
   ──────────────────────────────────────────────────────────── */
const PRODUCT_NAME = "AUDIO DATA SCIENCE Extremo Source";
const SALE_EMAIL = "sale@montelar.ru";
function buildMailto(pageUrl: string): string {
  const subject = `Консультация — ${PRODUCT_NAME}`;
  const body =
    `Здравствуйте! Меня заинтересовал ${PRODUCT_NAME} (${pageUrl}). ` +
    `Хотел бы получить консультацию по этому продукту: наличие, комплектация, условия и сроки.\r\n` +
    `Контакт для связи: ___`;
  return `mailto:${SALE_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function localized(text: string): Record<SiteLocale, string> {
  return { ru: text, en: text, de: text, es: text, fr: text, zh: text, ja: text };
}

/* ────────────────────────────────────────────────────────────
   GALLERY — coverflow; 4 distinct device frames, none repeated
   ──────────────────────────────────────────────────────────── */
const GALLERY: DacCarouselItem[] = [
  {
    id: "roon-signature",
    image: `${IMG}/gal-signature.webp`,
    title: "AUDIO DATA SCIENCE · Extremo Source",
    role: localized("Источник ультимативного качества"),
  },
  {
    id: "roon-top",
    image: `${IMG}/gal-top.webp`,
    title: "Корпус и компоновка",
    role: localized("Анодированный алюминий · гориз./верт. установка"),
  },
  {
    id: "roon-fins",
    image: `${IMG}/gal-fins.webp`,
    title: "Оребрение и фронт",
    role: localized("Радиаторный корпус · спокойный тепловой режим"),
  },
  {
    id: "roon-ports",
    image: `${IMG}/gal-ports.webp`,
    title: "Интерфейсы",
    role: localized("USB 4.0 на ЦАП · быстросъёмный SSD 2.5\""),
  },
];

const HIGHLIGHTS: Array<{ k: string; v: string }> = [
  { k: "Процессор", v: "APU + NPU · Ryzen" },
  { k: "Хранилище", v: "до 24 TB · PCIe 5.0" },
  { k: "USB на ЦАП", v: "USB 4.0 · OCXO" },
  { k: "Среды", v: "Roon · AirPlay · UPnP" },
];

/* ────────────────────────────────────────────────────────────
   ADVANTAGE TILES — each tile carries a MACRO PHOTO of the exact
   internal component it describes (component ↔ photo ↔ text).
   Sizes tile a clean 4-col grid with NO orphan cell:
   lg(2×2) + wide(1×2) + sm + sm + wide(1×2) + wide(1×2) = 12 cells.
   ──────────────────────────────────────────────────────────── */
type AdvTile = {
  id: string;
  size: "lg" | "wide" | "sm";
  img: string;
  alt: string;
  kicker: string;
  title: string;
  sub: string;
};
const ADV: AdvTile[] = [
  {
    id: "apu",
    size: "lg",
    img: `${IMG}/comp-apu.webp`,
    alt: "Гибридный процессор APU с нейропроцессором — макро",
    kicker: "Вычисления",
    title: "Гибридный процессор APU + NPU",
    sub: "Accelerated Processor Unit с нейропроцессором (ИИ) на платформе Ryzen берёт на себя тяжёлую математику звука — upsampling, oversampling, а также функции FPGA и DSP.",
  },
  {
    id: "power",
    size: "wide",
    img: `${IMG}/comp-power.webp`,
    alt: "Блок питания с банком фильтрующих конденсаторов — макро",
    kicker: "Питание",
    title: "13 фаз питания под управлением Ai",
    sub: "Конденсаторы Nichicon, два независимых блока: основной ENHANCE PLATINUM 500 W и внешний аккумуляторный на Panasonic с фильтрацией Mundorf Mlytic.",
  },
  {
    id: "board",
    size: "sm",
    img: `${IMG}/comp-board.webp`,
    alt: "Многослойная тефлоновая плата AM5 — макро",
    kicker: "Плата",
    title: "8-слойная плата AM5",
    sub: "Удвоенная толщина медного слоя, японские плёночные и электролитические конденсаторы.",
  },
  {
    id: "storage",
    size: "sm",
    img: `${IMG}/comp-ssd.webp`,
    alt: "Модули SSD PCIe 5.0 на шине M2 — макро",
    kicker: "Хранилище",
    title: "До 24 TB · PCIe 5.0",
    sub: "SLC-кэш и DRAM-буфер на центральной шине M2; быстросъёмный SSD 2.5″.",
  },
  {
    id: "clock",
    size: "wide",
    img: `${IMG}/comp-ocxo.webp`,
    alt: "Термостабилизированный генератор OCXO — макро",
    kicker: "Тактирование",
    title: "USB 4.0 · генераторы OCXO",
    sub: "Соединение с ЦАП через прецизионный USB-интерфейс с термостабилизированными тактовыми генераторами OCXO. PCM 32/384 · DSD1024.",
  },
  {
    id: "silver",
    size: "wide",
    img: `${IMG}/comp-conductor.webp`,
    alt: "Длиннокристаллический серебряный проводник в тефлоне — макро",
    kicker: "Коммутация",
    title: "Серебро 99.9997% EXTREMO AGTF",
    sub: "Длиннокристаллическое серебро в тефлоновой изоляции для внутренней коммутации сигнала.",
  },
];

/* zigzag editorial — full Avito description; image ↔ text, accordion */
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
    title: "Не «сетевой проигрыватель», а источник ультимативного качества",
    lead: "AUDIO DATA SCIENCE Extremo Source — источник ультимативного качества на базе Roon, AirPlay и UPnP/DLNA, построенный вокруг гибридного процессора APU с нейропроцессором.",
    detail:
      "Это немного большее, чем стример: в основе — Accelerated Processor Unit (APU) с NPU (ИИ) Ryzen и архитектура, в которой каждый критически важный узел получает собственные условия работы. Возможности расширения памяти позволяют использовать локальные Ai-агенты — устройство одновременно является ультимативным аудио- и видеоисточником и вычислительной платформой.",
    image: `${IMG}/gal-signature.webp`,
    alt: "Extremo Source — общий план корпуса на тёплом архитектурном фоне",
  },
  {
    n: "02",
    kicker: "Вычисления · NPU",
    title: "Нейропроцессор берёт на себя тяжёлую математику звука",
    lead: "Главная особенность NPU (Neural Processing Unit) — способность одновременно обрабатывать большие массивы сложных математических данных быстрее и качественнее.",
    detail:
      "NPU выполняет работу upsampling, oversampling, multiroom, а также функции FPGA и DSP программных процессоров. Благодаря ему доступны продвинутое декодирование, обработка и пост-обработка аудио и видео, Super Resolution, Frame generation, Dolby Atmos и ИИ-нейросетевое голосовое управление. 16 ГБ DDR5 6000 MHz T-CREATE DELUXE и отдельный буфер-фильтр оперативной памяти на чипах NEC (Япония) поддерживают умный контроллер напряжения DDR5.",
    image: `${IMG}/comp-apu.webp`,
    alt: "Гибридный процессор APU с нейропроцессором — макро",
  },
  {
    n: "03",
    kicker: "Питание",
    title: "Два независимых блока и 13 фаз под управлением Ai",
    lead: "Два независимых стабилизированных блока питания обслуживают разные узлы системы: основной ENHANCE PLATINUM 500 W и внешний аккумуляторный блок.",
    detail:
      "13 независимых фаз питания с конденсаторами Nichicon оптимизированы и управляются Ai. Внешний аккумуляторный блок собран на аккумуляторах Panasonic с фильтрацией на конденсаторах Mundorf Mlytic. Модули промежуточной фильтрации с твердотельными конденсаторами большой ёмкости и плоскими медными индуктивностями обслуживают APU, основную плату и системы охлаждения.",
    image: `${IMG}/comp-power.webp`,
    alt: "Блок питания с банком фильтрующих конденсаторов — макро",
  },
  {
    n: "04",
    kicker: "Тактирование и коммутация",
    title: "USB 4.0, генераторы OCXO и серебро EXTREMO AGTF",
    lead: "Соединение с ЦАП выполнено через USB 4.0 и прецизионный интерфейс с термостабилизированными тактовыми генераторами OCXO — вершиной студийных осцилляторов.",
    detail:
      "Внутренняя коммутация выполнена длиннокристаллическим серебром 99.9997 EXTREMO AGTF в тефлоновой изоляции. Основа стабильной цифровой среды — 8-слойная тефлоновая плата AM5 с удвоенной толщиной медного слоя, высококачественные дроссели, японские плёночные и электролитические конденсаторы.",
    image: `${IMG}/comp-ocxo.webp`,
    alt: "Термостабилизированный генератор OCXO — макро",
  },
  {
    n: "05",
    kicker: "Хранилище и выходы",
    title: "До 24 TB PCIe 5.0 · выходы USB и HDMI 8K",
    lead: "Память до 24 TB SSD PCIe 5.0 с SLC-кэшем и DRAM-буфером на центральной шине M2 — без типичных преобразований и устаревших интерфейсов.",
    detail:
      "Выходы: USB — PCM 32/384, DSD 1024; HDMI — 8K (7680×4320 120 Hz) и 4K (3840×2160 240 Hz). Поддерживаются все форматы файлов. Быстросъёмный диск SSD 2.5\". Цельнометаллический корпус из анодированного алюминия высшей категории; горизонтальное и вертикальное аппаратное расположение — на выбор.",
    image: `${IMG}/comp-ssd.webp`,
    alt: "Модули SSD PCIe 5.0 на шине M2 — макро",
  },
];

/* ────────────────────────────────────────────────────────────
   FRONT-PANEL CALLOUTS — precise leader lines to the real I/O
   nodes on the gal-ports macro (no glowing dots). Each callout is
   interactive (hover / tap highlights its node + label).
   ax/ay = anchor on the real node (% of stage).
   ──────────────────────────────────────────────────────────── */
type Callout = {
  id: string;
  ax: number;
  ay: number;
  title: string;
  text: string;
};
const CALLOUTS: Callout[] = [
  { id: "usb1", ax: 48, ay: 63, title: "USB 4.0 на ЦАП", text: "USB-выход к ЦАП · PCM 32/384 · DSD1024 · прецизионный интерфейс с OCXO" },
  { id: "usb2", ax: 55.5, ay: 52, title: "Второй порт USB", text: "Дополнительный высокоскоростной порт для подключения и обслуживания" },
  { id: "jack", ax: 60, ay: 44.5, title: "Сигнальный разъём", text: "Служебный разъём передней панели" },
  { id: "ctrl", ax: 40, ay: 75, title: "Управление", text: "Кнопки управления и индикация состояния источника" },
];
const CALLOUT_LABEL_Y = 18; // active label sits in the clean blurred top-face area

const CAPABILITY_NOTES = [
  "Продвинутое декодирование и пост-обработка аудио и видео",
  "Upsampling и oversampling силами NPU",
  "Super Resolution и Frame generation для видео",
  "Dolby Atmos и многоканальная обработка",
  "ИИ-нейросетевое голосовое управление",
  "Локальные Ai-агенты за счёт расширения памяти",
];

const VERSIONS: Array<{ k: string; v: string }> = [
  { k: "4 TB", v: "1 299 000 ₽" },
  { k: "8 TB", v: "1 399 990 ₽" },
  { k: "12 TB", v: "1 599 990 ₽" },
];

/* ── zigzag accordion ── */
function StoryCard({ story, flip }: { story: Story; flip: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <article className={`dac-lp2-zz${flip ? " dac-lp2-zz--flip" : ""}`} data-reveal>
      <div className="dac-lp2-zz-media">
        <span className="dac-lp2-zz-no" aria-hidden="true">{story.n}</span>
        <img src={story.image} alt={story.alt} loading="lazy" decoding="async" width={1400} height={933} draggable={false} />
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

export function StreamerRoonLanding({ categoryPath, locale }: StreamerRoonLandingProps) {
  const rootRef = useRef<HTMLElement>(null);
  const [activeSpot, setActiveSpot] = useState<string>("usb1");
  const [pageUrl, setPageUrl] = useState<string>("https://montelar.ru/products/streamer-ads-ex-roon");

  useEffect(() => {
    if (typeof window !== "undefined") setPageUrl(window.location.href);
  }, []);

  const mailtoHref = useMemo(() => buildMailto(pageUrl), [pageUrl]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Scroll-progress hairline — always active.
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
            if (el.getBoundingClientRect().top < vh * 0.92) {
              el.style.setProperty("--reveal-delay", String(el.dataset.delay ?? "0"));
              el.classList.add("in");
            }
          });
        }
      });
    };
    window.addEventListener("scroll", onProgress, { passive: true });
    window.addEventListener("resize", onProgress, { passive: true });
    onProgress();

    // Orchestrated scroll-reveal (resting state already opacity:1 — this only adds a transient entrance).
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            el.style.setProperty("--reveal-delay", String(el.dataset.delay ?? "0"));
            el.classList.add("in");
            io.unobserve(el);
          }
        }
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
    );

    root.querySelectorAll("[data-reveal]").forEach((el) => {
      if (prefersReduced) el.classList.add("in");
      else io.observe(el);
    });

    if (prefersReduced) {
      return () => {
        io.disconnect();
        window.removeEventListener("scroll", onProgress);
        window.removeEventListener("resize", onProgress);
      };
    }

    // Gentle desktop parallax for the hero + image band.
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
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onProgress);
      window.removeEventListener("resize", onProgress);
      io.disconnect();
    };
  }, []);

  const activeCallout = CALLOUTS.find((c) => c.id === activeSpot) ?? CALLOUTS[0]!;

  return (
    <main className="dac-lp2" ref={rootRef}>
      <div className="dac-lp2-progress" aria-hidden="true" />

      {/* ─── HERO ─── */}
      <section className="dac-lp2-hero" aria-label="AUDIO DATA SCIENCE Extremo Source">
        <div className="dac-lp2-hero-media">
          <picture>
            <source media="(max-width: 767px)" srcSet={`${IMG}/hero-mobile-9x16.webp`} />
            <img
              className="dac-lp2-hero-img"
              src={`${IMG}/hero-desktop-16x9.webp`}
              alt="Extremo Source — матовый чёрный сетевой источник на тёплом архитектурном фоне"
              decoding="async"
              fetchPriority="high"
              width={1920}
              height={1080}
              draggable={false}
            />
          </picture>
          <div className="dac-lp2-hero-scrim" aria-hidden="true" />
        </div>

        <div className="dac-lp2-hero-copy">
          <div className="dac-lp2-wrap">
            <p className="dac-lp2-eyebrow dac-lp2-reveal-now">Montelar · AUDIO DATA SCIENCE · Стример</p>
            <h1 className="dac-lp2-title dac-lp2-reveal-now" style={{ ["--reveal-delay" as string]: "90" }}>
              Extremo<br />Source
            </h1>
            <p className="dac-lp2-lead dac-lp2-reveal-now" style={{ ["--reveal-delay" as string]: "180" }}>
              Источник ультимативного качества на базе Roon, AirPlay и UPnP/DLNA, построенный
              вокруг гибридного процессора APU с нейропроцессором&nbsp;(ИИ).
              <span className="dac-lp2-lead-tail">{" "}Не просто стример — вычислительная
              аудио-видео платформа.</span>
            </p>
          </div>
        </div>

        <span className="dac-lp2-scrollcue" aria-hidden="true">
          <span className="dac-lp2-scrollcue-line" />
          Прокрутите
        </span>
      </section>

      {/* ─── PRICE + LEDGER + CTA ─── */}
      <section className="dac-lp2-price-zone" data-reveal>
        <div className="dac-lp2-wrap dac-lp2-price-inner">
          <div className="dac-lp2-price-block">
            <span className="dac-lp2-price-label">Цена · 4 TB</span>
            <span className="dac-lp2-price">1&nbsp;299&nbsp;000&nbsp;₽</span>
            <span className="dac-lp2-price-note">8 TB — 1&nbsp;399&nbsp;990&nbsp;₽ · 12 TB — 1&nbsp;599&nbsp;990&nbsp;₽ · расширение хранилища до 24 TB</span>
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
            <a className="dac-lp2-cta" href={mailtoHref}>
              Запросить консультацию
            </a>
            <Link className="dac-lp2-cta dac-lp2-cta--ghost" href={categoryPath}>
              Hi-End Audio
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CONCEPT ─── */}
      <section className="dac-lp2-statement">
        <div className="dac-lp2-wrap">
          <p className="dac-lp2-kicker" data-reveal>Концепция</p>
          <p className="dac-lp2-statement-body" data-reveal data-delay="80">
            Главное здесь — не только потоковые функции, а вычислительная архитектура:
            гибридный процессор APU с нейропроцессором, дисциплина питания и точная
            синхронизация передают музыку в ЦАП с максимально высокой структурной чистотой.
            Каждый критически важный узел получает собственные условия работы.
          </p>
        </div>
      </section>

      {/* ─── ADVANTAGE TILES — component macro photo in every tile ─── */}
      <section className="dac-lp2-bento-sec">
        <div className="dac-lp2-wrap">
          <div className="dac-lp2-sec-head" data-reveal>
            <p className="dac-lp2-kicker">Узлы платформы</p>
            <h2 className="dac-lp2-h2">Каждый узел спроектирован как самостоятельная дисциплина</h2>
          </div>
          <div className="str-adv">
            {ADV.map((t, i) => (
              <article
                key={t.id}
                className={`str-adv-tile str-adv-tile--${t.size}`}
                data-reveal
                data-delay={String((i % 3) * 70)}
              >
                <div className="str-adv-media">
                  <img src={t.img} alt={t.alt} loading="lazy" decoding="async" width={900} height={600} draggable={false} />
                </div>
                <div className="str-adv-body">
                  <p className="str-adv-kicker">{t.kicker}</p>
                  <h3 className="str-adv-title">{t.title}</h3>
                  <p className="str-adv-sub">{t.sub}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ZIGZAG STORIES ─── */}
      <section className="dac-lp2-stories">
        <div className="dac-lp2-wrap">
          <div className="dac-lp2-sec-head" data-reveal>
            <p className="dac-lp2-kicker">Инженерия</p>
            <h2 className="dac-lp2-h2">Пять решений, из которых складывается источник</h2>
          </div>
          <div className="dac-lp2-stories-list">
            {STORIES.map((s, i) => (
              <StoryCard key={s.n} story={s} flip={i % 2 === 1} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── IMAGE BAND ─── */}
      <section className="dac-lp2-imageband" data-reveal aria-label="Extremo Source — крупный план">
        <div className="dac-lp2-imageband-frame">
          <img
            className="dac-lp2-imageband-img"
            src={`${IMG}/gal-top.webp`}
            alt="Extremo Source на тёплом архитектурном фоне с золотыми акцентами"
            decoding="async"
            loading="lazy"
            width={1500}
            height={1000}
            draggable={false}
          />
        </div>
      </section>

      {/* ─── FRONT PANEL — precise interactive callouts ─── */}
      <section className="dac-lp2-panel-sec">
        <div className="dac-lp2-wrap">
          <div className="dac-lp2-sec-head" data-reveal>
            <p className="dac-lp2-kicker">Передняя панель и подключения</p>
            <h2 className="dac-lp2-h2">USB 4.0 на ЦАП, управление и быстросъёмный накопитель</h2>
            <p className="dac-lp2-sec-hint">Наведите или коснитесь выноски</p>
          </div>
          <div className="str-callout" data-reveal data-delay="80">
            <div className="str-callout-stage">
              <img
                src={`${IMG}/gal-ports.webp`}
                alt="Интерфейсы передней панели Extremo Source крупным планом"
                loading="lazy"
                decoding="async"
                width={1500}
                height={1000}
                draggable={false}
              />
              {/* subtle anchor ticks on every real node — no glowing rings */}
              {CALLOUTS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`str-co-anchor${activeSpot === c.id ? " is-active" : ""}`}
                  style={{ left: `${c.ax}%`, top: `${c.ay}%` }}
                  onMouseEnter={() => setActiveSpot(c.id)}
                  onFocus={() => setActiveSpot(c.id)}
                  onClick={() => setActiveSpot(c.id)}
                  aria-label={`${c.title} — ${c.text}`}
                />
              ))}
              {/* clean leader line + label for the ACTIVE callout only */}
              <span
                className="str-co-line"
                style={{
                  left: `${activeCallout.ax}%`,
                  top: `${CALLOUT_LABEL_Y}%`,
                  height: `${activeCallout.ay - CALLOUT_LABEL_Y}%`,
                }}
                aria-hidden="true"
              />
              <span
                className="str-co-label"
                style={{ left: `${activeCallout.ax}%`, top: `${CALLOUT_LABEL_Y}%` }}
                aria-hidden="true"
              >
                {activeCallout.title}
              </span>
            </div>
            <aside className="str-callout-readout" aria-live="polite">
              <p className="str-co-read-title">{activeCallout.title}</p>
              <p className="str-co-read-text">{activeCallout.text}</p>
              <ul className="str-co-read-list">
                {CALLOUTS.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className={activeSpot === c.id ? "is-active" : ""}
                      onMouseEnter={() => setActiveSpot(c.id)}
                      onFocus={() => setActiveSpot(c.id)}
                      onClick={() => setActiveSpot(c.id)}
                    >
                      {c.title}
                    </button>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </div>
      </section>

      {/* ─── GALLERY — coverflow ─── */}
      <section className="dac-lp2-gallery" aria-label="Планы изделия">
        <div className="dac-lp2-wrap dac-lp2-gallery-head" data-reveal>
          <p className="dac-lp2-kicker">Планы изделия</p>
          <h2 className="dac-lp2-h2">Корпус, оребрение и интерфейсы — крупным планом</h2>
          <p className="dac-lp2-gallery-hint">Потяните, чтобы листать</p>
        </div>
        <DacProductCarousel locale={locale} items={GALLERY} title="AUDIO DATA SCIENCE Extremo Source" variant="framed" frameAspect={1.5} />
      </section>

      {/* ─── CAPABILITIES ─── */}
      <section className="dac-lp2-sound">
        <div className="dac-lp2-wrap">
          <p className="dac-lp2-kicker" data-reveal>Возможности платформы</p>
          <h2 className="dac-lp2-h2" data-reveal data-delay="60">
            NPU открывает функции, недоступные из-за нехватки производительности у источников
            прошлых поколений.
          </h2>
          <ul className="dac-lp2-sound-list" data-reveal data-delay="120">
            {CAPABILITY_NOTES.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── VERSIONS ─── */}
      <section className="dac-lp2-versions">
        <div className="dac-lp2-wrap">
          <p className="dac-lp2-kicker dac-lp2-kicker--dark" data-reveal>Версии</p>
          <h2 className="dac-lp2-h2 dac-lp2-h2--dark" data-reveal data-delay="50">
            Три заводские версии по объёму встроенного хранилища
          </h2>
          <dl className="dac-lp2-version-grid" data-reveal data-delay="100">
            {VERSIONS.map((row) => (
              <div className="dac-lp2-version-card" key={row.k}>
                <dt>{row.k}</dt>
                <dd>{row.v}</dd>
              </div>
            ))}
          </dl>
          <p className="dac-lp2-conn-note dac-lp2-conn-note--dark" data-reveal data-delay="120">
            Архитектура поддерживает расширение хранилища до 24 TB SSD PCIe 5.0 — быстросъёмный
            диск SSD 2.5″. Горизонтальное и вертикальное аппаратное расположение — на выбор.
          </p>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="dac-lp2-final-cta">
        <div className="dac-lp2-wrap">
          <p className="dac-lp2-kicker" data-reveal>Позиционирование</p>
          <p className="dac-lp2-statement-body" data-reveal data-delay="60">
            AUDIO DATA SCIENCE Extremo Source предназначен для систем, где цифровой источник
            должен быть вычислительным основанием тракта: гибридный процессор APU с нейропроцессором,
            строгая архитектура питания, тактирование на OCXO, локальное хранение большого объёма
            музыки и полная интеграция с современной streaming-экосистемой — и аудио, и видео.
          </p>
          <div className="dac-lp2-final-foot" data-reveal data-delay="120">
            <div className="dac-lp2-price-block">
              <span className="dac-lp2-price-label">Цена · 4 TB</span>
              <span className="dac-lp2-price">1&nbsp;299&nbsp;000&nbsp;₽</span>
            </div>
            <a className="dac-lp2-cta dac-lp2-cta--lg" href={mailtoHref}>
              Запросить консультацию
            </a>
          </div>
          <p className="dac-lp2-service" data-reveal data-delay="140">
            Подбор и поставка компонентов high-end класса · кураторская сборка системы
          </p>
        </div>
      </section>
    </main>
  );
}
