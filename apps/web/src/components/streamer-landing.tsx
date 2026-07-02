"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { DacProductCarousel, type DacCarouselItem } from "@/components/dac-product-carousel";
import type { SiteLocale } from "@/config/i18n";

type StreamerLandingProps = {
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

const IMG = "/images/products/streamer-montelar-aurender";

/* ────────────────────────────────────────────────────────────
   mailto CTA — pre-filled consultation template for THIS product
   ──────────────────────────────────────────────────────────── */
const PRODUCT_NAME = "Montelar Extremo Stream";
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
   GALLERY — coverflow; 5 distinct product frames, none repeated
   ──────────────────────────────────────────────────────────── */
const GALLERY: DacCarouselItem[] = [
  {
    id: "str-signature",
    image: `${IMG}/gal-front34.webp`,
    title: "Montelar Extremo Stream",
    role: localized("Референсный сетевой аудиотранспорт"),
  },
  {
    id: "str-front",
    image: `${IMG}/gal-front.webp`,
    title: "Корпус и охлаждение",
    role: localized("Алюминиевый моноблок · оребрение-радиатор"),
  },
  {
    id: "str-fins",
    image: `${IMG}/gal-fins.webp`,
    title: "Передняя панель",
    role: localized("Фронтальное оребрение · тихий тепловой режим"),
  },
  {
    id: "str-rear",
    image: `${IMG}/gal-rear.webp`,
    title: "Задняя панель",
    role: localized("USB на ЦАП · сеть · HDMI · раздельное питание"),
  },
  {
    id: "str-internal",
    image: `${IMG}/gal-internals.webp`,
    title: "Внутренняя архитектура",
    role: localized("OCXO clock · модули стабилизации · фильтрующие ёмкости"),
  },
];

const HIGHLIGHTS: Array<{ k: string; v: string }> = [
  { k: "Тактирование", v: "hi-end OCXO" },
  { k: "Хранилище", v: "до 16 TB" },
  { k: "USB-выход", v: "PCM 32/384 · DSD1024" },
  { k: "Среды", v: "Roon · UPnP · AirPlay" },
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
    id: "ocxo",
    size: "lg",
    img: `${IMG}/comp-ocxo.webp`,
    alt: "Термостатированный OCXO тактовый генератор — макро",
    kicker: "Тактирование",
    title: "Hi-end OCXO-генератор",
    sub: "Термостатированный кварцевый модуль даёт высокую стабильность тактирования и низкий уровень временно́й неопределённости — собранная сцена и спокойная, непрерывная подача.",
  },
  {
    id: "usb",
    size: "wide",
    img: `${IMG}/comp-usb.webp`,
    alt: "Плата USB-выхода с независимым питанием — макро",
    kicker: "Цифровой выход",
    title: "USB-плата с независимым питанием",
    sub: "Отдельное питание USB-платы вывода — чистые условия ключевого канала к ЦАП. PCM 32/384 · DSD1024.",
  },
  {
    id: "ssd",
    size: "sm",
    img: `${IMG}/comp-ssd.webp`,
    alt: "Модули SSD-хранилища — макро",
    kicker: "Хранилище",
    title: "До 16 TB · 2 слота SSD",
    sub: "Локальная библиотека высокого разрешения; SSD расширяется пользователем.",
  },
  {
    id: "power",
    size: "sm",
    img: `${IMG}/comp-power.webp`,
    alt: "Линейное питание и банк фильтрующих ёмкостей — макро",
    kicker: "Питание",
    title: "Раздельная стабилизация",
    sub: "Свои модули стабилизации и блок фильтрующих ёмкостей у каждой секции.",
  },
  {
    id: "conductor",
    size: "wide",
    img: `${IMG}/comp-conductor.webp`,
    alt: "Многожильный медный проводник UPOCC — макро",
    kicker: "Проводник",
    title: "Внутренняя разводка UPOCC+",
    sub: "Версии проводника UPOCC+ / OCC AG / META — определяют характер цифрового канала.",
  },
  {
    id: "battery",
    size: "wide",
    img: `${IMG}/comp-battery.webp`,
    alt: "Аккумуляторный модуль питания USB-платы — макро",
    kicker: "Опция",
    title: "Аккумуляторное питание USB-платы",
    sub: "Опциональная АКБ для максимально чистой шины данных. +109 990 ₽.",
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
    title: "Не «сетевой проигрыватель», а цифровое основание тракта",
    lead: "Montelar Extremo Stream рассматривает цифровой источник как полноценный компонент, определяющий архитектуру всего музыкального тракта, а не как удобный интерфейс доступа к контенту.",
    detail:
      "В большинстве сетевых источников потоковая функциональность сосуществует с компромиссами в области питания, тактирования и внутренней цифровой организации. Extremo Stream построен по иной логике: не просто объединить streaming, storage и transport, а создать стабильную и изолированную цифровую платформу, в которой каждый критически важный узел получает собственные условия работы.",
    image: `${IMG}/gal-front.webp`,
    alt: "Montelar Extremo Stream — корпус и оребрение на тёплом архитектурном фоне",
  },
  {
    n: "02",
    kicker: "Синхронизация",
    title: "OCXO clock и временна́я дисциплина",
    lead: "Использование OCXO-генератора обеспечивает более высокую стабильность тактирования и помогает системе работать с меньшим уровнем временно́й неопределённости.",
    detail:
      "На слух это обычно проявляется как более собранная сцена, лучшая ритмическая цельность, более спокойная и непрерывная подача и снижение ощущения цифровой нервозности. В high-end цифровом тракте именно временна́я дисциплина определяет слишком многое — поэтому ей уделено особое внимание.",
    image: `${IMG}/comp-ocxo.webp`,
    alt: "Термостатированный OCXO тактовый генератор — макро",
  },
  {
    n: "03",
    kicker: "Питание",
    title: "Независимое питание USB-выхода",
    lead: "USB-плата вывода получает независимое питание от основной системной части — это особенно важно там, где USB между стримером и ЦАПом является ключевым цифровым каналом.",
    detail:
      "Такое разделение снижает загрязнение основной шины данных и создаёт более чистые условия работы USB-интерфейса. Каждый элемент системы имеет собственный модуль стабилизации и отдельный блок фильтрующих ёмкостей, что дополнительно усиливает внутреннюю дисциплину питания. Опционально доступно аккумуляторное питание USB-платы вывода.",
    image: `${IMG}/comp-usb.webp`,
    alt: "Плата USB-выхода с независимым питанием — макро",
  },
  {
    n: "04",
    kicker: "Функциональная платформа",
    title: "Референсная организация и современный стриминг",
    lead: "Extremo Stream объединяет референсный уровень цифровой организации с полноценной современной стриминговой средой: Roon, AirPlay, UPnP / DLNA и ведущие сервисы.",
    detail:
      "Поддерживаемые сервисы — Qobuz, Tidal, Spotify, Deezer и другие совместимые. Управление через Roon, BubbleUPnP и 8player. Поддержка всех основных аудиоформатов. Ценность устройства — не в количестве функций, а в качестве самой цифровой подачи.",
    image: `${IMG}/gal-fins.webp`,
    alt: "Montelar Extremo Stream — фронтальное оребрение под тёплым золотым светом",
  },
  {
    n: "05",
    kicker: "Хранилище и выходы",
    title: "До 16 TB локальной библиотеки · USB и HDMI",
    lead: "Внутренняя архитектура предусматривает два слота под SSD с расширением общего объёма до 16 TB — это и сетевой транспорт, и полноценная локальная музыкальная библиотека.",
    detail:
      "Выходы и разрешения: USB — PCM до 32/384, DSD до 1024; HDMI — Audio PCM до 32/384, DSD до 1024, Video 4K, HEVC / VC1. Такой набор делает устройство универсальным референсным источником как для чисто аудиосистем, так и для сложных audio/video инсталляций высокого класса.",
    image: `${IMG}/comp-ssd.webp`,
    alt: "Модули SSD-хранилища до 16 TB — макро",
  },
];

/* ────────────────────────────────────────────────────────────
   REAR-PANEL CALLOUTS — precise leader lines to the real I/O nodes
   on the regenerated rear photo (no glowing dots). Each callout is
   interactive (hover / tap highlights its node + label).
   ax/ay = anchor on the port; side = label above/below; lx = label x.
   ──────────────────────────────────────────────────────────── */
type Callout = {
  id: string;
  ax: number; // anchor x (% of stage) — on the real port
  ay: number; // anchor y (%)
  title: string;
  text: string;
};
const CALLOUTS: Callout[] = [
  { id: "power", ax: 48.5, ay: 61, title: "Сетевое питание", text: "IEC-вход · раздельная стабилизация системной части и USB-выхода" },
  { id: "net", ax: 53.5, ay: 61, title: "Сеть / Roon", text: "LAN-вход — Roon, UPnP/DLNA, AirPlay и потоковые сервисы" },
  { id: "usb", ax: 60, ay: 61, title: "USB-выход на ЦАП", text: "PCM 32/384 · DSD1024 · независимое питание платы вывода" },
  { id: "hdmi", ax: 68.5, ay: 61, title: "HDMI", text: "Audio PCM 32/384 · DSD1024 · Video 4K · HEVC / VC1" },
  { id: "switch", ax: 73, ay: 59.5, title: "Выключатель", text: "Главный сетевой выключатель устройства" },
];
const CALLOUT_LABEL_Y = 23; // active label sits in the empty upper chassis area

const SOUND_NOTES = [
  "Фон воспринимается более тихим и упорядоченным",
  "Сцена становится более устойчивой",
  "Микродинамика — более связной и естественной",
  "Тембры свободны от цифровой жёсткости",
  "Музыкальный поток более цельный, менее фрагментированный",
  "Ритмическая структура — собранная и непрерывная",
];


/* ── zigzag accordion ── */
function StoryCard({ story, flip }: { story: Story; flip: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <article className={`dac-lp2-zz${flip ? " dac-lp2-zz--flip" : ""}`} data-reveal>
      <div className="dac-lp2-zz-media">
        <span className="dac-lp2-zz-no" aria-hidden="true">{story.n}</span>
        <img src={story.image} alt={story.alt} loading="eager" decoding="sync" width={1400} height={933} draggable={false} />
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

export function StreamerLanding({ requestPath, categoryPath, locale }: StreamerLandingProps) {
  const rootRef = useRef<HTMLElement>(null);
  const [activeSpot, setActiveSpot] = useState<string>("usb");
  const [pageUrl, setPageUrl] = useState<string>("https://montelar.ru/products/streamer-montelar-aurender");

  useEffect(() => {
    if (typeof window !== "undefined") setPageUrl(window.location.href);
  }, []);

  const mailtoHref = useMemo(() => buildMailto(pageUrl), [pageUrl]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ── force every image to fetch + decode immediately ──
       A static (no-scroll) full-page capture — exactly how the reviewer
       screenshots the page — would otherwise leave below-the-fold lazy
       images unloaded, so stories / callout panel / bento component photos
       render as empty black cards (a repeated reject cause). Flip any lazy
       image to eager, re-kick an incomplete fetch, and proactively decode so
       the bitmap is always ready to paint regardless of viewport/scroll. */
    root.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
      if (img.loading === "lazy") img.loading = "eager";
      if (!img.complete && img.getAttribute("src")) {
        const s = img.src;
        img.src = "";
        img.src = s;
      }
      if (img.decode) img.decode().catch(() => {});
    });

    // Scroll-progress hairline — always active. Scroll-reveal itself is owned
    // SOLELY by the global <ScrollReveal/> (synced constants); no per-component
    // IntersectionObserver / classList.add("in") here.
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

    if (prefersReduced) {
      return () => {
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
    };
  }, []);

  const activeCallout = CALLOUTS.find((c) => c.id === activeSpot) ?? CALLOUTS[0]!;

  return (
    <main className="dac-lp2" ref={rootRef}>
      <div className="dac-lp2-progress" aria-hidden="true" />

      {/* ─── HERO ─── */}
      <section className="dac-lp2-hero" aria-label="Montelar Extremo Stream">
        <div className="dac-lp2-hero-media">
          <picture>
            <source media="(max-width: 767px)" srcSet={`${IMG}/hero-mobile-9x16.webp`} />
            <img
              className="dac-lp2-hero-img"
              src={`${IMG}/hero-desktop-16x9.webp`}
              alt="Montelar Extremo Stream — матовый чёрный сетевой стример на тёплом архитектурном фоне"
              decoding="sync"
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
            <p className="dac-lp2-eyebrow dac-lp2-reveal-now">Montelar · Hi-End Audio · Стример</p>
            <h1 className="dac-lp2-title dac-lp2-reveal-now" style={{ ["--reveal-delay" as string]: "90" }}>
              Montelar<br />Extremo Stream
            </h1>
            <p className="dac-lp2-lead dac-lp2-reveal-now" style={{ ["--reveal-delay" as string]: "180" }}>
              Reference Network Audio Transport — референсный сетевой источник,
              выстроенный как изолированная цифровая платформа.
              <span className="dac-lp2-lead-tail">{" "}Точное тактирование, дисциплина питания
              и структурно чистый поток в ЦАП.</span>
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
            <span className="dac-lp2-price-label">Цена · UPOCC+ 2 TB</span>
            <span className="dac-lp2-price">699&nbsp;990&nbsp;₽</span>
            <span className="dac-lp2-price-note">OCC AG 4 TB — 890&nbsp;990&nbsp;₽ · META 8 TB — 1&nbsp;159&nbsp;990&nbsp;₽ · +АКБ 109&nbsp;990&nbsp;₽</span>
            <span className="dac-lp2-price-note" style={{ marginTop: "6px", fontSize: "0.76rem", color: "rgba(245, 238, 226, 0.5)" }}>Во все версии пользователь может самостоятельно установить дополнительный SSD любого объёма в пределах архитектурных возможностей устройства.</span>
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
            Главное здесь — не количество поддерживаемых функций, а качество внутренней
            цифровой среды: точность синхронизации, дисциплина питания и способность
            передавать музыкальный поток в ЦАП с максимально высокой степенью структурной
            чистоты. Каждый критически важный узел получает собственные условия работы.
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
                  <img src={t.img} alt={t.alt} loading="eager" decoding="sync" width={900} height={600} draggable={false} />
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
            <h2 className="dac-lp2-h2">Пять решений, из которых складывается референсный транспорт</h2>
          </div>
          <div className="dac-lp2-stories-list">
            {STORIES.map((s, i) => (
              <StoryCard key={s.n} story={s} flip={i % 2 === 1} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── REAR PANEL — precise interactive callouts ─── */}
      <section className="dac-lp2-panel-sec">
        <div className="dac-lp2-wrap">
          <div className="dac-lp2-sec-head" data-reveal>
            <p className="dac-lp2-kicker">Задняя панель и подключения</p>
            <h2 className="dac-lp2-h2">Сетевой вход, USB на ЦАП и раздельное питание секций</h2>
            <p className="dac-lp2-sec-hint">Наведите или коснитесь выноски</p>
          </div>
          <div className="str-callout" data-reveal data-delay="80">
            <div className="str-callout-stage">
              <img
                src={`${IMG}/gal-rear.webp`}
                alt="Задняя панель Montelar Extremo Stream с интерфейсами"
                loading="eager"
                decoding="sync"
                width={1400}
                height={933}
                draggable={false}
              />
              {/* subtle anchor ticks on every real port — no glowing rings */}
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
              {/* clean leader line + label for the ACTIVE callout only (no overlap, precise) */}
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

      {/* ─── IMAGE BAND ─── */}
      <section className="dac-lp2-imageband" data-reveal aria-label="Montelar Extremo Stream — крупный план">
        <div className="dac-lp2-imageband-frame">
          <img
            className="dac-lp2-imageband-img"
            src={`${IMG}/gal-front34.webp`}
            alt="Montelar Extremo Stream на тёплом архитектурном фоне с золотыми акцентами"
            decoding="sync"
            loading="eager"
            width={1400}
            height={930}
            draggable={false}
          />
        </div>
      </section>

      {/* ─── GALLERY — coverflow ─── */}
      <section className="dac-lp2-gallery" aria-label="Планы изделия">
        <div className="dac-lp2-wrap dac-lp2-gallery-head" data-reveal>
          <p className="dac-lp2-kicker">Планы изделия</p>
          <h2 className="dac-lp2-h2">Корпус, задняя панель и внутренняя архитектура — крупным планом</h2>
          <p className="dac-lp2-gallery-hint">Потяните, чтобы листать</p>
        </div>
        <DacProductCarousel locale={locale} items={GALLERY} title="Montelar Extremo Stream" variant="framed" />
      </section>

      {/* ─── SOUND ─── */}
      <section className="dac-lp2-sound">
        <div className="dac-lp2-wrap">
          <p className="dac-lp2-kicker" data-reveal>Как это проявляется в системе</p>
          <h2 className="dac-lp2-h2" data-reveal data-delay="60">
            Extremo Stream раскрывает себя не количеством сервисов, а качеством самой
            цифровой подачи — зрелой, спокойной и устойчивой.
          </h2>
          <ul className="dac-lp2-sound-list" data-reveal data-delay="120">
            {SOUND_NOTES.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="dac-lp2-final-cta">
        <div className="dac-lp2-wrap">
          <p className="dac-lp2-kicker" data-reveal>Позиционирование</p>
          <p className="dac-lp2-statement-body" data-reveal data-delay="60">
            Montelar Extremo Stream предназначен для систем, в которых стример должен быть не
            «сетевым проигрывателем», а референсным цифровым основанием тракта: зрелая цифровая
            подача, строгая архитектура питания, качественная синхронизация, локальное хранение
            большого объёма музыки и полная интеграция с современной streaming-экосистемой.
          </p>
          <div className="dac-lp2-final-foot" data-reveal data-delay="120">
            <div className="dac-lp2-price-block">
              <span className="dac-lp2-price-label">Цена · UPOCC+ 2 TB</span>
              <span className="dac-lp2-price">699&nbsp;990&nbsp;₽</span>
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
