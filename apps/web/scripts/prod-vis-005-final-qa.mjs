import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const repoRoot = process.cwd().endsWith(path.join("apps", "web")) ? path.resolve(process.cwd(), "../..") : process.cwd();
const baseUrl = (process.env.MONTELAR_QA_BASE_URL || "http://127.0.0.1:8093").replace(/\/$/, "");
const phase = process.env.MONTELAR_QA_PHASE || "after";
const artifactRoot = path.resolve(
  repoRoot,
  `docs/strategy/artifacts/production-visual-sprint-20260604/MNT-PROD-VIS-005/${phase}`,
);
const videoDir = path.join(artifactRoot, "videos");
const chromiumPath =
  process.env.MONTELAR_QA_BROWSER ||
  (existsSync("/usr/bin/google-chrome") ? "/usr/bin/google-chrome" : "/usr/bin/chromium-browser");
const yandexPath = process.env.YANDEX_BROWSER_PATH || "/opt/yandex/browser/yandex-browser";

const siteLocales = ["ru", "en", "es", "fr", "zh", "ja", "de"];

const routeTemplates = [
  { name: "home", path: "", motionLocale: "ru" },
  { name: "brand", path: "/brand" },
  { name: "technology", path: "/technology" },
  { name: "projects", path: "/projects" },
  { name: "journal", path: "/journal" },
  { name: "contact", path: "/contact" },
  { name: "vision-max", path: "/vision-max" },
  { name: "audio_speakers", path: "/audio/speakers", motionLocale: "ru" },
  { name: "invisible-display", path: "/invisible-display" },
  { name: "pictorial-art-display", path: "/pictorial-art-display" },
  { name: "exhibition-displays", path: "/exhibition-displays" },
  { name: "products_vision-max-premium", path: "/products/vision-max-premium" },
  { name: "prima-materia", path: "/audio/perfect-conductors/prima-materia" },
];

const routes = routeTemplates.flatMap((template) =>
  siteLocales.map((locale) => ({
    name: `${locale}_${template.name}`,
    path: `/${locale}${template.path}`,
    locale,
    motion: template.motionLocale === locale,
  })),
);

const viewports = [
  { name: "desktop-1440x900", width: 1440, height: 900 },
  { name: "laptop-1366x768", width: 1366, height: 768 },
  { name: "tablet-768x1024", width: 768, height: 1024 },
  { name: "mobile-390x844", width: 390, height: 844 },
];

const forbiddenVisibleTerms = [
  "Что можно сделать на этой странице",
  "Сигнатура",
  "Материальный язык",
  "Куда идти дальше",
  "Как пользоваться направлением",
  "Точки входа в продукты",
  "Product notes",
  "Open product context",
  "Hero",
  "Object Stage",
  "Content Mode",
  "Inquiry",
  "route boxes",
  "route explanations",
  "template",
  "schema",
];

function fileName(viewport, routeName, suffix = "") {
  const extra = suffix ? `-${suffix}` : "";
  return `${viewport}-${routeName}${extra}.png`;
}

function screenshotPath(viewport, routeName, suffix = "") {
  return path.join(artifactRoot, fileName(viewport, routeName, suffix));
}

async function gotoQa(page, routePath) {
  const response = await page.goto(`${baseUrl}${routePath}`, { waitUntil: "load", timeout: 60000 });
  await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => undefined);
  await page.waitForTimeout(250);
  return response;
}

async function ensureDirs() {
  await mkdir(artifactRoot, { recursive: true });
  await mkdir(videoDir, { recursive: true });
}

async function scanPage(page) {
  return page.evaluate((forbiddenTerms) => {
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const selectors = "h1,h2,h3,h4,p,a,button,li,dt,dd,label,summary,figcaption";
    const visibleTextNodes = Array.from(document.querySelectorAll(selectors)).filter((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        Number.parseFloat(style.opacity || "1") > 0 &&
        rect.width > 1 &&
        rect.height > 1 &&
        rect.bottom > 0 &&
        rect.top < viewport.height
      );
    });

    const textIssues = visibleTextNodes
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        const horizontalScroller = Boolean(
          element.closest(".desktop-product-rail, .mobile-product-panel, .route-links-grid, .motion-ready-stage__steps"),
        );
        return !horizontalScroller && (rect.left < -2 || rect.right > viewport.width + 2);
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tagName: element.tagName,
          className: element.className?.toString?.() || "",
          text: element.textContent?.replace(/\s+/g, " ").trim().slice(0, 140) || "",
          rect: {
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            top: Math.round(rect.top),
            bottom: Math.round(rect.bottom),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
        };
      });

    const visibleText = visibleTextNodes
      .map((element) => element.textContent?.replace(/\s+/g, " ").trim() || "")
      .filter(Boolean)
      .join("\n");
    const forbiddenMatches = forbiddenTerms.filter((term) => visibleText.includes(term));

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
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })
      .filter((item) => item.width > 0 && item.height > 0 && (item.left < -2 || item.right > viewport.width + 2))
      .slice(0, 30);

    const visibleMedia = Array.from(document.querySelectorAll("img, video, canvas"))
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 40 && rect.height > 40 && rect.bottom > 0 && rect.top < viewport.height;
      })
      .slice(0, 16)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tagName: element.tagName,
          className: element.className?.toString?.() || "",
          alt: element.getAttribute("alt") || "",
          src: element.currentSrc || element.getAttribute("src") || "",
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
      textIssues,
      overflowElements,
      forbiddenMatches,
      visibleMedia,
      reducedMotionActive: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      motionSequenceReduced:
        document.querySelector(".motion-ready-stage__sequence")?.getAttribute("data-reduced-motion") || null,
      bodyMobileNavOpen: document.body.dataset.mobileNavOpen || null,
    };
  }, forbiddenVisibleTerms);
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
      Math.round(window.innerHeight * 2.3),
    );

    return new Promise((resolve) => {
      function tick(now) {
        frames += 1;
        const delta = now - last;
        deltas.push(delta);
        maxDeltaMs = Math.max(maxDeltaMs, delta);
        last = now;

        const progress = Math.min(1, (now - start) / 1100);
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
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  const response = await gotoQa(page, route.path);
  await page.screenshot({ path: screenshotPath(viewport.name, route.name), fullPage: false });
  const topState = await scanPage(page);
  const scroll = await observeScroll(page);
  const scrolledState = await scanPage(page);

  const video = page.video();
  await page.close();
  await context.close();

  return {
    route: route.path,
    name: route.name,
    locale: route.locale,
    viewport: viewport.name,
    status: response?.status() ?? 0,
    screenshot: screenshotPath(viewport.name, route.name),
    video: video ? await video.path().catch(() => null) : null,
    overflowX: Math.max(topState.overflowX, scrolledState.overflowX),
    textIssues: [...topState.textIssues, ...scrolledState.textIssues],
    overflowElements: [...topState.overflowElements, ...scrolledState.overflowElements],
    forbiddenMatches: [...new Set([...topState.forbiddenMatches, ...scrolledState.forbiddenMatches])],
    media: topState.visibleMedia,
    scroll,
    consoleErrors: consoleErrors.slice(0, 8),
  };
}

async function captureHeaderStates(browser) {
  const states = [];
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    const page = await context.newPage();
    await gotoQa(page, "/ru");
    const mobileToggleVisible = await page.locator("[data-qa='mobile-nav-toggle']").first().isVisible().catch(() => false);

    if (mobileToggleVisible) {
      await page.locator("[data-qa='mobile-nav-toggle']").click();
      await page.waitForTimeout(500);
      const screenshot = screenshotPath(viewport.name, "ru_home", "menu-open");
      await page.screenshot({ path: screenshot, fullPage: false });
      states.push({
        name: `${viewport.name}-mobile-menu-open`,
        viewport: viewport.name,
        open: await page.locator("#mobile-site-navigation").first().isVisible().catch(() => false),
        screenshot,
      });
    } else {
      await page.locator("[data-qa='nav-trigger-products']").click();
      await page.waitForTimeout(500);
      const productsScreenshot = screenshotPath(viewport.name, "ru_home", "products-open");
      await page.screenshot({ path: productsScreenshot, fullPage: false });
      states.push({
        name: `${viewport.name}-products-open`,
        viewport: viewport.name,
        open: await page.locator("#desktop-branch-products, .desktop-products-menu, .desktop-product-panel").first().isVisible().catch(() => false),
        screenshot: productsScreenshot,
      });

      await page.locator(".header-locale-switcher .locale-switcher-trigger").click();
      await page.waitForTimeout(300);
      const languageScreenshot = screenshotPath(viewport.name, "ru_home", "language-open");
      await page.screenshot({ path: languageScreenshot, fullPage: false });
      states.push({
        name: `${viewport.name}-language-open`,
        viewport: viewport.name,
        open: await page.locator(".header-locale-switcher a[href='/en']").first().isVisible().catch(() => false),
        screenshot: languageScreenshot,
      });
    }

    await page.close();
    await context.close();
  }

  return states;
}

async function captureReducedMotion(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await gotoQa(page, "/ru/audio/speakers");
  await page.locator(".motion-ready-stage").first().scrollIntoViewIfNeeded().catch(() => undefined);
  await page.waitForTimeout(500);
  await page.screenshot({ path: screenshotPath("desktop-reduced-motion-1440x900", "ru_audio_speakers"), fullPage: false });
  const state = await scanPage(page);
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
  await gotoQa(page, item.from);

  if (item.preClick) {
    await item.preClick(page);
  }

  const locator = page.locator(item.selector).first();
  const count = await locator.count();
  let href = count ? await locator.getAttribute("href").catch(() => null) : null;
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
      await page.waitForTimeout(500);
      afterUrl = page.url();
      href = href || afterUrl;
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
    task: "MNT-PROD-VIS-005",
    phase,
    generatedAt: new Date().toISOString(),
    baseUrl,
    browser: { chromiumPath, yandexPath, yandexAvailable: existsSync(yandexPath) },
    routes: [],
    headerStates: [],
    interactions: [],
    reducedMotion: null,
    performanceNotes: [],
    failures: [],
  };

  for (const route of routes) {
    for (const viewport of viewports) {
      const result = await captureRoute(browser, route, viewport);
      report.routes.push(result);
      if (result.status < 200 || result.status >= 400) {
        report.failures.push(`${result.name}/${result.viewport}: HTTP status ${result.status}`);
      }
      if (result.overflowX > 2) {
        report.failures.push(`${result.name}/${result.viewport}: horizontal overflow ${result.overflowX}px`);
      }
      if (result.textIssues.length) {
        report.failures.push(`${result.name}/${result.viewport}: visible text/offscreen issues ${result.textIssues.length}`);
      }
      if (result.forbiddenMatches.length) {
        report.failures.push(`${result.name}/${result.viewport}: forbidden visible terms ${result.forbiddenMatches.join(", ")}`);
      }
    }
  }

  report.headerStates = await captureHeaderStates(browser);
  for (const state of report.headerStates) {
    if (!state.open) {
      report.failures.push(`${state.name}: open-state check failed`);
    }
  }

  report.reducedMotion = await captureReducedMotion(browser);
  if (!report.reducedMotion.mediaMatches || report.reducedMotion.motionSequenceReduced !== "true") {
    report.failures.push("Reduced-motion emulation did not set the motion sequence data-reduced-motion=true.");
  }

  const interactionChecks = [
    {
      name: "home-to-vision-max",
      from: "/ru",
      selector: "a[href='/ru/vision-max']",
      expectedPath: "/ru/vision-max",
    },
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
      name: "contact-product-request-link",
      from: "/ru/contact",
      selector: "a[href='/ru/request/vision-max-premium']",
      expectedPath: "/ru/request/vision-max-premium",
    },
    {
      name: "desktop-products-menu",
      from: "/ru",
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
      from: "/ru",
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
    if (item.expectedPath === null) {
      result.ok = result.exists > 0 && Boolean(result.href);
    }
    if (!result.ok) {
      report.failures.push(`${item.name}: interaction failed`);
    }
  }

  await browser.close();

  const motionRows = report.routes.filter((row) => row.video);
  report.performanceNotes.push(
    `Chromium scroll fallback: ${motionRows
      .map((row) => `${row.name}/${row.viewport} fps=${row.scroll.observedFps}, p95=${row.scroll.p95DeltaMs}ms, max=${row.scroll.maxDeltaMs}ms, drops>50=${row.scroll.droppedFramesOver50ms}`)
      .join("; ")}.`,
  );
  if (!existsSync(yandexPath)) {
    report.performanceNotes.push(`Yandex browser unavailable at ${yandexPath}; Chromium breakpoint/video fallback recorded instead.`);
  }

  await writeFile(path.join(artifactRoot, "browser-qa-report.json"), `${JSON.stringify(report, null, 2)}\n`);

  if (report.failures.length) {
    console.error(JSON.stringify({ phase, failures: report.failures }, null, 2));
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        task: report.task,
        phase,
        routeChecks: report.routes.length,
        headerStates: report.headerStates.length,
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
