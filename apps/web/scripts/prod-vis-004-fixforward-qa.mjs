import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const repoRoot = process.cwd().endsWith(path.join("apps", "web")) ? path.resolve(process.cwd(), "../..") : process.cwd();
const baseUrl = (process.env.MONTELAR_QA_BASE_URL || "http://127.0.0.1:8093").replace(/\/$/, "");
const artifactRoot = path.resolve(
  repoRoot,
  "docs/strategy/artifacts/production-visual-sprint-20260604/MNT-PROD-VIS-004/after",
);
const videoDir = path.join(artifactRoot, "videos");
const chromiumPath =
  process.env.MONTELAR_QA_BROWSER ||
  (existsSync("/usr/bin/google-chrome") ? "/usr/bin/google-chrome" : "/usr/bin/chromium-browser");
const yandexPath = process.env.YANDEX_BROWSER_PATH || "/opt/yandex/browser/yandex-browser";

const routes = [
  { name: "ru_vision-max", path: "/ru/vision-max", locale: "ru" },
  { name: "ru_audio_speakers", path: "/ru/audio/speakers", locale: "ru", motion: true },
  { name: "ru_products_vision-max-premium", path: "/ru/products/vision-max-premium", locale: "ru" },
  { name: "en_vision-max", path: "/en/vision-max", locale: "en" },
  { name: "en_audio_speakers", path: "/en/audio/speakers", locale: "en", motion: true },
  { name: "en_products_vision-max-premium", path: "/en/products/vision-max-premium", locale: "en" },
];

const viewports = [
  { name: "desktop-1440x900", width: 1440, height: 900 },
  { name: "laptop-1366x768", width: 1366, height: 768 },
  { name: "tablet-768x1024", width: 768, height: 1024 },
  { name: "mobile-390x844", width: 390, height: 844 },
];

function screenshotPath(viewport, routeName, suffix = "") {
  const extra = suffix ? `-${suffix}` : "";
  return path.join(artifactRoot, `${viewport}-${routeName}${extra}.png`);
}

async function ensureDirs() {
  await mkdir(artifactRoot, { recursive: true });
  await mkdir(videoDir, { recursive: true });
}

async function scanLayout(page) {
  return page.evaluate(() => {
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const overflowElements = Array.from(document.querySelectorAll("body *"))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tagName: element.tagName,
          className: element.className?.toString?.() || "",
          text: element.textContent?.replace(/\s+/g, " ").trim().slice(0, 90) || "",
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          top: Math.round(rect.top),
          bottom: Math.round(rect.bottom),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })
      .filter((item) => item.width > 0 && item.height > 0 && (item.left < -2 || item.right > viewport.width + 2))
      .slice(0, 20);

    const textIssues = Array.from(document.querySelectorAll("h1,h2,h3,p,a,button,li,dt,dd"))
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        const visible = rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < viewport.height;
        const horizontalScroller = Boolean(
          element.closest(".desktop-product-rail, .mobile-product-panel, .route-links-grid, .motion-ready-stage__steps"),
        );
        return visible && !horizontalScroller && (rect.left < -2 || rect.right > viewport.width + 2);
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tagName: element.tagName,
          className: element.className?.toString?.() || "",
          text: element.textContent?.replace(/\s+/g, " ").trim().slice(0, 120) || "",
          rect: {
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            top: Math.round(rect.top),
            bottom: Math.round(rect.bottom),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
        };
      })
      .slice(0, 20);

    const visibleMedia = Array.from(document.querySelectorAll("img, video, canvas"))
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 40 && rect.height > 40 && rect.bottom > 0 && rect.top < viewport.height;
      })
      .slice(0, 12)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tagName: element.tagName,
          className: element.className?.toString?.() || "",
          alt: element.getAttribute("alt") || "",
          rect: {
            left: Math.round(rect.left),
            top: Math.round(rect.top),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
        };
      });

    return {
      title: document.title,
      url: location.href,
      viewport,
      scrollHeight: document.documentElement.scrollHeight,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      overflowX: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
      overflowElements,
      textIssues,
      visibleMedia,
      reducedMotionActive: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      motionSequenceReduced:
        document.querySelector(".motion-ready-stage__sequence")?.getAttribute("data-reduced-motion") || null,
      bodyMobileNavOpen: document.body.dataset.mobileNavOpen || null,
    };
  });
}

async function observeScroll(page) {
  return page.evaluate(async () => {
    window.scrollTo({ top: 0, behavior: "instant" });
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const start = performance.now();
    let last = start;
    let frames = 0;
    let maxDeltaMs = 0;
    const deltas = [];
    const distance = Math.min(
      Math.max(1, document.documentElement.scrollHeight - window.innerHeight),
      Math.round(window.innerHeight * 2.1),
    );

    return new Promise((resolve) => {
      function tick(now) {
        frames += 1;
        const delta = now - last;
        deltas.push(delta);
        maxDeltaMs = Math.max(maxDeltaMs, delta);
        last = now;

        const progress = Math.min(1, (now - start) / 1600);
        window.scrollTo(0, Math.round(distance * progress));

        if (progress >= 1) {
          const sorted = [...deltas].sort((a, b) => a - b);
          resolve({
            distance,
            frames,
            observedFps: Math.round((frames / (now - start)) * 1000),
            maxDeltaMs: Math.round(maxDeltaMs),
            p95DeltaMs: Math.round(sorted[Math.floor(sorted.length * 0.95)] || maxDeltaMs),
            droppedFramesOver50ms: deltas.filter((item) => item > 50).length,
            finalScrollY: Math.round(window.scrollY),
          });
          return;
        }

        requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    });
  });
}

async function captureRoute(browser, route, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    recordVideo:
      route.motion && viewport.name === "desktop-1440x900"
        ? { dir: videoDir, size: { width: viewport.width, height: viewport.height } }
        : undefined,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(`${baseUrl}${route.path}`, { waitUntil: "networkidle", timeout: 60000 });
  await page.screenshot({ path: screenshotPath(viewport.name, route.name), fullPage: false });
  const topState = await scanLayout(page);
  const scroll = await observeScroll(page);
  const scrolledState = await scanLayout(page);

  if (route.motion && viewport.name === "desktop-1440x900") {
    await page.waitForTimeout(500);
  }

  const video = page.video();
  await page.close();
  await context.close();

  return {
    route: route.path,
    name: route.name,
    locale: route.locale,
    viewport: viewport.name,
    screenshot: screenshotPath(viewport.name, route.name),
    video: video ? await video.path().catch(() => null) : null,
    overflowX: Math.max(topState.overflowX, scrolledState.overflowX),
    textIssues: [...topState.textIssues, ...scrolledState.textIssues],
    overflowElements: [...topState.overflowElements, ...scrolledState.overflowElements],
    media: topState.visibleMedia,
    reducedMotionActive: topState.reducedMotionActive,
    motionSequenceReduced: topState.motionSequenceReduced || scrolledState.motionSequenceReduced,
    scroll,
    consoleErrors: errors.slice(0, 8),
  };
}

async function captureReducedMotion(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/ru/audio/speakers`, { waitUntil: "networkidle", timeout: 60000 });
  await page.evaluate(() => {
    document.querySelector(".motion-ready-stage")?.scrollIntoView({ block: "start" });
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: screenshotPath("desktop-reduced-motion-1440x900", "ru_audio_speakers"), fullPage: false });
  const state = await scanLayout(page);
  await page.close();
  await context.close();
  return {
    route: "/ru/audio/speakers",
    viewport: "desktop-reduced-motion-1440x900",
    screenshot: screenshotPath("desktop-reduced-motion-1440x900", "ru_audio_speakers"),
    mediaMatches: state.reducedMotionActive,
    motionSequenceReduced: state.motionSequenceReduced,
    overflowX: state.overflowX,
    textIssues: state.textIssues,
  };
}

async function verifyInteraction(browser, item) {
  const context = await browser.newContext({ viewport: { width: item.width || 1440, height: item.height || 900 } });
  const page = await context.newPage();
  await page.goto(`${baseUrl}${item.from}`, { waitUntil: "networkidle", timeout: 60000 });

  if (item.preClick) {
    await item.preClick(page);
  }

  const locator = page.locator(item.selector).first();
  const count = await locator.count();
  const href = count ? await locator.getAttribute("href").catch(() => null) : null;
  let afterUrl = page.url();
  let menuOpen = false;

  if (count) {
    if (item.menu) {
      await locator.click();
      await page.waitForTimeout(500);
      menuOpen = await page.locator(item.menuOpenSelector).first().isVisible().catch(() => false);
    } else {
      await locator.scrollIntoViewIfNeeded().catch(() => undefined);
      await locator.click();
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => undefined);
      await page.waitForTimeout(700);
      afterUrl = page.url();
    }
  }

  await page.close();
  await context.close();

  return {
    name: item.name,
    from: item.from,
    selector: item.selector,
    exists: count,
    href,
    expectedPath: item.expectedPath || null,
    afterUrl,
    menuOpen,
    ok: item.menu ? count > 0 && menuOpen : count > 0 && new URL(afterUrl).pathname === item.expectedPath,
  };
}

async function main() {
  await ensureDirs();

  if (!existsSync(chromiumPath)) {
    throw new Error(`Chromium executable not found: ${chromiumPath}`);
  }

  const browser = await chromium.launch({ executablePath: chromiumPath, headless: true });
  const report = {
    task: "MNT-PROD-VIS-004",
    generatedAt: new Date().toISOString(),
    baseUrl,
    browser: { chromiumPath, yandexPath, yandexAvailable: existsSync(yandexPath) },
    routes: [],
    interactions: [],
    reducedMotion: null,
    performanceNotes: [],
    failures: [],
  };

  for (const route of routes) {
    for (const viewport of viewports) {
      const result = await captureRoute(browser, route, viewport);
      report.routes.push(result);
      if (result.overflowX > 2) {
        report.failures.push(`${result.name}/${result.viewport}: horizontal overflow ${result.overflowX}px`);
      }
      if (result.textIssues.length) {
        report.failures.push(`${result.name}/${result.viewport}: visible text/offscreen issues ${result.textIssues.length}`);
      }
    }
  }

  report.reducedMotion = await captureReducedMotion(browser);
  if (!report.reducedMotion.mediaMatches || report.reducedMotion.motionSequenceReduced !== "true") {
    report.failures.push("Reduced-motion emulation did not set the motion sequence data-reduced-motion=true.");
  }

  const interactionChecks = [
    {
      name: "vision-max-product-link",
      from: "/ru/vision-max",
      selector: "a[href='/ru/products/vision-max-premium']",
      expectedPath: "/ru/products/vision-max-premium",
    },
    {
      name: "speakers-product-link",
      from: "/ru/audio/speakers",
      selector: "a[href='/ru/products/monolith-reference']",
      expectedPath: "/ru/products/monolith-reference",
    },
    {
      name: "vision-max-premium-request",
      from: "/ru/products/vision-max-premium",
      selector: "a[href='/ru/request/vision-max-premium']",
      expectedPath: "/ru/request/vision-max-premium",
    },
    {
      name: "desktop-products-menu",
      from: "/ru/vision-max",
      selector: "[data-qa='nav-trigger-products']",
      menu: true,
      menuOpenSelector: "#desktop-branch-products, .desktop-products-menu, .desktop-product-panel",
    },
    {
      name: "desktop-language-en-link",
      from: "/ru/audio/speakers",
      selector: ".header-locale-switcher a[href='/en/audio/speakers']",
      expectedPath: "/en/audio/speakers",
      preClick: async (page) => {
        await page.locator(".header-locale-switcher .locale-switcher-trigger").click();
        await page.waitForTimeout(300);
      },
    },
    {
      name: "mobile-menu-toggle",
      from: "/ru/audio/speakers",
      selector: "[data-qa='mobile-nav-toggle']",
      width: 390,
      height: 844,
      menu: true,
      menuOpenSelector: "#mobile-site-navigation",
    },
  ];

  for (const item of interactionChecks) {
    const result = await verifyInteraction(browser, item);
    report.interactions.push(result);
    if (!result.ok) {
      report.failures.push(`${item.name}: interaction failed`);
    }
  }

  await browser.close();

  const motionRows = report.routes.filter((row) => row.route.includes("audio/speakers") && row.viewport !== "mobile-390x844");
  report.performanceNotes.push(
    `Chromium scroll fallback: ${motionRows
      .map((row) => `${row.name}/${row.viewport} fps=${row.scroll.observedFps}, p95=${row.scroll.p95DeltaMs}ms, max=${row.scroll.maxDeltaMs}ms, drops>50=${row.scroll.droppedFramesOver50ms}`)
      .join("; ")}.`,
  );
  if (!existsSync(yandexPath)) {
    report.performanceNotes.push(`Yandex browser unavailable at ${yandexPath}; stricter Chromium breakpoint/video fallback recorded instead.`);
  }

  await writeFile(path.join(artifactRoot, "browser-qa-report.json"), `${JSON.stringify(report, null, 2)}\n`);

  if (report.failures.length) {
    console.error(JSON.stringify({ failures: report.failures }, null, 2));
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        task: report.task,
        routeChecks: report.routes.length,
        interactions: report.interactions.length,
        reducedMotion: report.reducedMotion,
        performanceNotes: report.performanceNotes,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
