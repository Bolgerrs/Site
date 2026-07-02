import { ScrollFrameSequence } from "@/components/scroll-frame-sequence";
import { getRequestLocale } from "@/lib/request-locale";
import { buildRouteMetadata } from "@/lib/seo/metadata";
import { getLocaleCopy } from "@/lib/copy/site-copy";

const frameBasePath = "/images/scroll-sequence/speaker-engineered-disassembly-webp-72";
const poster = "/images/product-motion/speaker-pair-premium/engineered-disassembly-poster.webp";

export async function generateMetadata() {
  const locale = await getRequestLocale();

  return buildRouteMetadata({
    title: getLocaleCopy(locale, {
      en: "Speaker motion prototype | Montelar",
      de: "Lautsprecher Motion-Prototyp | Montelar",
      es: "Prototipo motion de altavoces | Montelar",
      fr: "Prototype motion d'enceintes | Montelar",
      zh: "音箱动态原型 | Montelar",
      ja: "スピーカー・モーションプロトタイプ | Montelar",
      ru: "Прототип motion-страницы колонок | Montelar",
    }),
    description: getLocaleCopy(locale, {
      en: "A controlled product page prototype for a scroll-driven Montelar speaker film.",
      de: "Ein kontrollierter Produktseiten-Prototyp fur einen scrollgesteuerten Montelar-Lautsprecherfilm.",
      es: "Un prototipo controlado de pagina de producto para una pelicula de altavoces Montelar controlada por scroll.",
      fr: "Un prototype controle de page produit pour un film d'enceintes Montelar pilote au scroll.",
      zh: "用于 Montelar 音箱滚动影片的受控产品页原型。",
      ja: "Montelarスピーカーのスクロール駆動フィルム用の製品ページプロトタイプ。",
      ru: "Тестовая продуктовая страница с управляемым скроллом фильмом о колонках Montelar.",
    }),
    path: "/product-motion-prototype",
    locale,
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default async function ProductMotionPrototypePage() {
  const locale = await getRequestLocale();

  const labels = [
    {
      at: 0,
      title: getLocaleCopy(locale, {
        en: "Isolated object",
        de: "Isoliertes Objekt",
        es: "Objeto aislado",
        fr: "Objet isole",
        zh: "独立物件",
        ja: "単体オブジェクト",
        ru: "Изолированный объект",
      }),
      text: getLocaleCopy(locale, {
        en: "The test starts from a clean technical keyframe: product only, no room, no plinth, no background noise.",
        de: "Der Test beginnt mit einem sauberen technischen Keyframe: nur Produkt, kein Raum, kein Sockel, kein Hintergrundrauschen.",
        es: "La prueba parte de un keyframe tecnico limpio: solo producto, sin sala, sin podio, sin ruido visual.",
        fr: "Le test part d'une keyframe technique propre: seulement le produit, sans piece, sans socle, sans bruit visuel.",
        zh: "测试从干净的技术关键帧开始：只有产品，没有房间、基座或背景干扰。",
        ja: "テストはクリーンな技術キーフレームから始まります。製品だけで、部屋も台座も背景ノイズもありません。",
        ru: "Тест начинается с чистого технического кадра: только продукт, без комнаты, подиума и фонового шума.",
      }),
    },
    {
      at: 0.34,
      title: getLocaleCopy(locale, {
        en: "Exploded logic",
        de: "Explosionslogik",
        es: "Logica explotada",
        fr: "Logique eclatee",
        zh: "分解逻辑",
        ja: "分解構造",
        ru: "Логика разборки",
      }),
      text: getLocaleCopy(locale, {
        en: "Scroll reveals the cabinet, baffle, horn, bronze rings and drivers as separate pieces rather than a flat product card.",
        de: "Der Scroll zeigt Gehause, Schallwand, Horn, Bronzeringe und Treiber als getrennte Bauteile statt als flache Produktkarte.",
        es: "El scroll revela caja, bafle, bocina, aros de bronce y drivers como piezas separadas, no como una ficha plana.",
        fr: "Le scroll revele caisse, baffle, pavillon, bagues bronze et haut-parleurs comme pieces distinctes, pas comme carte produit.",
        zh: "滚动把箱体、前障板、号角、青铜环和单元作为独立部件展示，而不是扁平产品卡片。",
        ja: "スクロールでキャビネット、バッフル、ホーン、ブロンズリング、ドライバーを個別部品として見せます。",
        ru: "Скролл раскрывает корпус, фронт, рупор, бронзовые кольца и динамики как отдельные элементы, а не как плоскую карточку.",
      }),
    },
    {
      at: 0.68,
      title: getLocaleCopy(locale, {
        en: "Composited stage",
        de: "Komponierte Buhne",
        es: "Escena compuesta",
        fr: "Scene composee",
        zh: "合成舞台",
        ja: "合成ステージ",
        ru: "Собранная сцена",
      }),
      text: getLocaleCopy(locale, {
        en: "The green-screen render is cut into transparent frames, so the product can later sit inside a Montelar background.",
        de: "Der Greenscreen-Render wird in transparente Frames zerlegt und kann spater in einen Montelar-Hintergrund eingesetzt werden.",
        es: "El render en croma se convierte en frames transparentes para integrarlo despues en un fondo Montelar.",
        fr: "Le rendu fond vert devient des frames transparents pour etre integre ensuite dans un fond Montelar.",
        zh: "绿幕渲染会被切成透明帧，之后可以放入 Montelar 的品牌背景中。",
        ja: "グリーンスクリーンのレンダーを透過フレーム化し、後でMontelarの背景へ合成できます。",
        ru: "Green-screen рендер разрезан на прозрачные кадры, чтобы позже посадить продукт в фон Montelar.",
      }),
    },
  ];

  return (
    <main className="product-motion-prototype-page">
      <section className="product-motion-prototype-page__intro">
        <p className="eyebrow">
          {getLocaleCopy(locale, {
            en: "Motion prototype",
            de: "Motion-Prototyp",
            es: "Prototipo motion",
            fr: "Prototype motion",
            zh: "动态原型",
            ja: "モーションプロトタイプ",
            ru: "Motion-прототип",
          })}
        </p>
        <h1>
          {getLocaleCopy(locale, {
            en: "A product page that behaves like a quiet product film.",
            de: "Eine Produktseite, die sich wie ein ruhiger Produktfilm verhalt.",
            es: "Una pagina de producto que se comporta como una pelicula silenciosa.",
            fr: "Une page produit qui se comporte comme un film produit silencieux.",
            zh: "像安静产品影片一样运行的产品页。",
            ja: "静かなプロダクトフィルムのように振る舞う製品ページ。",
            ru: "Продуктовая страница, которая ведет себя как спокойный предметный фильм.",
          })}
        </h1>
        <p>
          {getLocaleCopy(locale, {
            en: "This lab page is isolated from the live homepage. It tests the Flow-style frame pipeline before we move the mechanic into real product pages.",
            de: "Diese Laborseite ist von der Live-Startseite isoliert. Sie testet die Flow-artige Frame-Pipeline vor der Ubertragung in echte Produktseiten.",
            es: "Esta pagina de laboratorio esta aislada de la home real. Prueba el pipeline de frames estilo Flow antes de llevarlo a paginas de producto reales.",
            fr: "Cette page laboratoire est isolee de la page d'accueil. Elle teste le pipeline de frames type Flow avant de l'integrer aux vraies pages produit.",
            zh: "这个独立页面与线上首页隔离，用来在进入真实产品页之前测试 Flow 式帧序列流程。",
            ja: "この独立ページは本番ホームから分離され、実製品ページへ移す前にFlow型フレームパイプラインを検証します。",
            ru: "Это изолированный тест: проверяем Flow-подобный пайплайн кадров до переноса механики в реальные продуктовые страницы.",
          })}
        </p>
      </section>

      <ScrollFrameSequence
        frameBasePath={frameBasePath}
        frameCount={72}
        frameFit="contain"
        frameScale={1.05}
        labels={labels}
        poster={poster}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `
(() => {
  if (window.__montelarScrollFrameSequenceBooted) return;
  window.__montelarScrollFrameSequenceBooted = true;

  const stage = document.querySelector(".scroll-frame-sequence__stage");
  const section = document.querySelector(".scroll-frame-sequence");
  const canvas = document.querySelector(".scroll-frame-sequence__canvas");
  const readoutTitle = document.querySelector(".scroll-frame-sequence__readout strong");
  const readoutText = document.querySelector(".scroll-frame-sequence__readout p");
  const readoutIndex = document.querySelector(".scroll-frame-sequence__readout span");
  const stepItems = Array.from(document.querySelectorAll(".scroll-frame-sequence__steps li"));

  if (!stage || !section || !canvas) return;

  const frameCount = Number(stage.dataset.frameCount || 0);
  const frameBasePath = stage.dataset.frameBasePath || "";
  const frameFit = stage.dataset.frameFit || "cover";
  const frameScale = Number(stage.dataset.frameScale || 1);
  const frames = [];
  const labels = stepItems.map((item, index) => ({
    index,
    title: item.querySelector("strong")?.textContent || "",
    at: index === 0 ? 0 : index === 1 ? 0.34 : 0.68,
  }));
  let frameIndex = -1;
  let scrollRaf = 0;
  let smoothRaf = 0;
  let targetProgress = 0;
  let displayProgress = 0;

  const clamp = (value) => Math.min(1, Math.max(0, value));
  const resizeCanvas = () => {
    const rect = canvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width * pixelRatio));
    const height = Math.max(1, Math.round(rect.height * pixelRatio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  };
  const draw = (image) => {
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx || !image?.naturalWidth) return;
    resizeCanvas();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const baseScale = frameFit === "contain"
      ? Math.min(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight)
      : Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
    const scale = baseScale * frameScale;
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    ctx.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
  };
  const findDrawableFrame = (targetFrame) => {
    if (frames[targetFrame]?.complete && frames[targetFrame]?.naturalWidth) return targetFrame;
    for (let offset = 1; offset <= 8; offset += 1) {
      const forward = targetFrame + offset;
      const backward = targetFrame - offset;
      if (frames[forward]?.complete && frames[forward]?.naturalWidth) return forward;
      if (frames[backward]?.complete && frames[backward]?.naturalWidth) return backward;
    }
    return frameIndex >= 0 ? frameIndex : 0;
  };
  const setActive = (nextIndex) => {
    stepItems.forEach((item, index) => item.classList.toggle("is-active", index === nextIndex));
    if (readoutIndex) readoutIndex.textContent = String(nextIndex + 1).padStart(2, "0");
    if (readoutTitle) readoutTitle.textContent = stepItems[nextIndex]?.querySelector("strong")?.textContent || readoutTitle.textContent;
    if (readoutText) {
      const sourceText = [
        "Тест начинается с чистого технического кадра: только продукт, без комнаты, подиума и фонового шума.",
        "Скролл раскрывает корпус, фронт, рупор, бронзовые кольца и динамики как отдельные элементы, а не как плоскую карточку.",
        "Green-screen рендер разрезан на прозрачные кадры, чтобы позже посадить продукт в фон Montelar."
      ][nextIndex];
      if (sourceText) readoutText.textContent = sourceText;
    }
  };
  const drawProgress = (progress) => {
    const targetFrame = Math.round(progress * (frameCount - 1));
    const nextFrame = findDrawableFrame(targetFrame);
    if (nextFrame !== frameIndex && frames[nextFrame]?.complete && frames[nextFrame]?.naturalWidth) {
      draw(frames[nextFrame]);
      frameIndex = nextFrame;
    }
    let active = 0;
    labels.forEach((label, index) => {
      if (progress >= label.at) active = index;
    });
    setActive(active);
  };
  const animateProgress = () => {
    smoothRaf = 0;
    const delta = targetProgress - displayProgress;
    if (Math.abs(delta) <= 0.0015) {
      displayProgress = targetProgress;
      drawProgress(displayProgress);
      return;
    }
    const maxStep = window.innerWidth <= 900 ? 0.04 : 0.032;
    const easedStep = delta * 0.18;
    const step = Math.sign(delta) * Math.min(Math.abs(easedStep), maxStep);
    displayProgress = clamp(displayProgress + step);
    drawProgress(displayProgress);
    smoothRaf = window.requestAnimationFrame(animateProgress);
  };
  const requestSmooth = () => {
    if (!smoothRaf) smoothRaf = window.requestAnimationFrame(animateProgress);
  };
  const updateTargetFromScroll = () => {
    scrollRaf = 0;
    const rect = section.getBoundingClientRect();
    const viewportHeight = Math.max(1, window.innerHeight);
    const fullVisibilityStartTop = Math.max(0, viewportHeight - rect.height);
    const fullVisibilityTravel = Math.max(1, fullVisibilityStartTop);
    const isDesktopHold = window.innerWidth > 900 && rect.height > viewportHeight;
    targetProgress = isDesktopHold
      ? clamp(-rect.top / Math.max(1, rect.height - viewportHeight))
      : rect.height <= viewportHeight
        ? clamp((fullVisibilityStartTop - rect.top) / fullVisibilityTravel)
        : clamp((viewportHeight * 0.56 - rect.top) / (viewportHeight * 0.54));
    requestSmooth();
  };
  const requestUpdate = () => {
    if (!scrollRaf) scrollRaf = window.requestAnimationFrame(updateTargetFromScroll);
  };

  let loaded = 0;
  for (let index = 0; index < frameCount; index += 1) {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      loaded += 1;
      if (loaded === 1) {
        stage.classList.add("is-ready");
        canvas.classList.add("is-ready");
        draw(image);
        requestUpdate();
      }
    };
    image.src = frameBasePath + "/frame-" + String(index + 1).padStart(3, "0") + ".webp";
    frames.push(image);
  }
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate, { passive: true });
  requestUpdate();
})();
          `,
        }}
      />
      <div className="product-motion-prototype-page__tail" aria-hidden="true" />
    </main>
  );
}
