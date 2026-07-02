import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const baseUrl = (process.env.MONTELAR_QA_BASE_URL || "http://127.0.0.1:8093").replace(/\/$/, "");
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const artifactRoot = process.env.MONTELAR_QA_ARTIFACT_DIR
  ? path.resolve(repoRoot, process.env.MONTELAR_QA_ARTIFACT_DIR)
  : path.resolve(repoRoot, "docs/strategy/artifacts/visual-qa/MNT-SITE-VIS-015/homepage-polish");
const executablePath =
  process.env.MONTELAR_QA_BROWSER ||
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
  "/usr/bin/chromium-browser";

const screenshotsDir = path.join(artifactRoot, "screenshots");
const videosDir = path.join(artifactRoot, "videos");

const viewports = [
  { name: "desktop-1440x900", width: 1440, height: 900, scrollY: 620 },
  { name: "laptop-1366x768", width: 1366, height: 768, scrollY: 560 },
  { name: "tablet-768x1024", width: 768, height: 1024, scrollY: 760 },
  { name: "mobile-390x844", width: 390, height: 844, scrollY: 640 },
];

const report = {
  baseUrl,
  executablePath,
  generatedAt: new Date().toISOString(),
  captures: [],
  interactions: [],
  failures: [],
};

function joinUrl(route) {
  return `${baseUrl}${route.startsWith("/") ? route : `/${route}`}`;
}

function fail(message, details = {}) {
  report.failures.push({ message, ...details });
}

function isIdentityTransform(transform) {
  return transform === "none" || transform === "matrix(1, 0, 0, 1, 0, 0)" || transform === "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)";
}

async function goto(page, route) {
  const response = await page.goto(joinUrl(route), { waitUntil: "networkidle", timeout: 60000 });
  const status = response?.status() ?? 0;
  if (status < 200 || status >= 400) {
    fail(`Route ${route} returned ${status}`, { route, status });
  }
}

async function collectMetrics(page) {
  return page.evaluate(() => {
    const box = (selector) => {
      const element = document.querySelector(selector);
      if (!element) {
        return null;
      }
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        x: Math.round(rect.x * 100) / 100,
        y: Math.round(rect.y * 100) / 100,
        width: Math.round(rect.width * 100) / 100,
        height: Math.round(rect.height * 100) / 100,
        opacity: Number.parseFloat(style.opacity || "1"),
        display: style.display,
      };
    };

    const visibleTextOverflows = [...document.querySelectorAll("main h1, main h2, main h3, main p, main a, main span")]
      .filter((element) => !element.closest(".product-scene-prototype"))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const visible =
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          Number.parseFloat(style.opacity || "1") > 0 &&
          rect.width > 2 &&
          rect.height > 2 &&
          rect.bottom > 0 &&
          rect.top < window.innerHeight;
        const overflowX = element.scrollWidth - element.clientWidth;
        const overflowY = element.scrollHeight - element.clientHeight;
        return {
          selector:
            element.className && typeof element.className === "string"
              ? `.${element.className.split(/\s+/).filter(Boolean).join(".")}`
              : element.tagName.toLowerCase(),
          text: element.textContent?.replace(/\s+/g, " ").trim().slice(0, 120) ?? "",
          overflowX,
          overflowY,
          visible,
        };
      })
      .filter((row) => row.visible && (row.overflowX > 2 || row.overflowY > 6));

    return {
      scrollY: window.scrollY,
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
      hotspotCount: document.querySelectorAll(".product-scene-prototype__hotspot").length,
      visibleTextOverflows,
      hero: box(".home-hero"),
      heroVisual: box(".home-hero-visual"),
      heroCopy: box(".home-hero-copy"),
      productScene: box(".home-hero-visual .product-scene-prototype__scene"),
      systemStory: box(".home-system-story"),
      systemTitle: box(".home-system-story .home-section-title"),
      systemText: box(".home-system-story .home-section-text"),
      systemAxis: box(".home-system-axis"),
      systemVisual: box(".home-system-visual"),
      productSequence: box(".home-product-sequence"),
      firstReel: box(".home-product-reel-item"),
      displaySurface: box(".home-display-surface"),
      briefing: box(".home-private-briefing"),
    };
  });
}

async function captureViewport(browser, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    recordVideo: { dir: videosDir, size: { width: viewport.width, height: viewport.height } },
  });
  const page = await context.newPage();

  await goto(page, "/ru");
  await page.waitForTimeout(900);
  const topPath = path.join(screenshotsDir, `${viewport.name}-top.png`);
  await page.screenshot({ path: topPath, fullPage: false });
  const topMetrics = await collectMetrics(page);

  await page.mouse.wheel(0, viewport.scrollY);
  await page.waitForTimeout(850);
  const scrollPath = path.join(screenshotsDir, `${viewport.name}-scroll.png`);
  await page.screenshot({ path: scrollPath, fullPage: false });
  const scrollMetrics = await collectMetrics(page);

  await page.mouse.move(Math.round(viewport.width * 0.6), Math.round(viewport.height * 0.68));
  await page.waitForTimeout(260);
  const hoverMetrics = await collectMetrics(page);

  for (const [state, metrics] of [
    ["top", topMetrics],
    ["scroll", scrollMetrics],
    ["hover", hoverMetrics],
  ]) {
    if (metrics.overflowX > 2) {
      fail(`${viewport.name} ${state} has horizontal overflow`, { viewport, metrics });
    }
    if (metrics.visibleTextOverflows.length > 0) {
      fail(`${viewport.name} ${state} has visible text overflow`, { viewport, overflows: metrics.visibleTextOverflows });
    }
    if (metrics.hotspotCount < 6) {
      fail(`${viewport.name} ${state} lost hero hotspots`, { viewport, metrics });
    }
  }

  await page.close();
  await context.close();

  report.captures.push({
    name: viewport.name,
    viewport: { width: viewport.width, height: viewport.height },
    topPath,
    scrollPath,
    topMetrics,
    scrollMetrics,
    hoverMetrics,
  });
}

async function captureInteractions(browser) {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await goto(desktop, "/ru");
  await desktop.waitForTimeout(700);

  await desktop.locator('[data-qa="nav-trigger-products"]').click();
  await desktop.waitForTimeout(420);
  await desktop.screenshot({ path: path.join(screenshotsDir, "desktop-products-menu-open.png"), fullPage: false });
  report.interactions.push({
    name: "desktop products menu",
    state: await desktop.evaluate(() => ({
      expanded: document.querySelector('[data-qa="nav-trigger-products"]')?.getAttribute("aria-expanded"),
      panelCount: document.querySelectorAll('[data-qa="desktop-panel-products"]').length,
      linkCount: document.querySelectorAll('[data-qa="desktop-panel-products"] a').length,
    })),
  });
  await desktop.keyboard.press("Escape");
  await desktop.waitForTimeout(200);

  const desktopPrimary = desktop.locator(".home-hero .home-primary-link").first();
  await desktopPrimary.hover();
  await desktopPrimary.focus();
  await desktop.screenshot({ path: path.join(screenshotsDir, "desktop-home-primary-focus.png"), fullPage: false });
  const primaryHref = await desktopPrimary.getAttribute("href");
  report.interactions.push({ name: "desktop hero primary hover focus", href: primaryHref });
  await desktop.close();

  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    recordVideo: { dir: videosDir, size: { width: 390, height: 844 } },
  });
  const mobile = await mobileContext.newPage();
  await goto(mobile, "/ru");
  await mobile.waitForTimeout(700);
  await mobile.locator('[data-qa="mobile-nav-toggle"]').click();
  await mobile.waitForTimeout(620);
  await mobile.screenshot({ path: path.join(screenshotsDir, "mobile-menu-open.png"), fullPage: false });
  report.interactions.push({
    name: "mobile menu open",
    state: await mobile.evaluate(() => ({
      bodyFlag: document.body.dataset.mobileNavOpen ?? null,
      expanded: document.querySelector('[data-qa="mobile-nav-toggle"]')?.getAttribute("aria-expanded"),
      productButtons: document.querySelectorAll(".mobile-product-direction-button").length,
    })),
  });
  await mobile.close();
  await mobileContext.close();
}

async function captureReducedMotion(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
    recordVideo: { dir: videosDir, size: { width: 1440, height: 900 } },
  });
  const page = await context.newPage();

  await goto(page, "/ru");
  await page.waitForTimeout(900);
  await page.mouse.wheel(0, 2250);
  await page.waitForTimeout(700);
  const reducedMotionPath = path.join(screenshotsDir, "desktop-reduced-motion-scroll.png");
  await page.screenshot({ path: reducedMotionPath, fullPage: false });
  const state = await page.evaluate(() => {
    const styleState = (selector) => {
      const element = document.querySelector(selector);
      if (!element) {
        return null;
      }
      const style = getComputedStyle(element);
      return {
        opacity: Number.parseFloat(style.opacity || "1"),
        transform: style.transform,
        animationName: style.animationName,
        transitionDuration: style.transitionDuration,
        filter: style.filter,
      };
    };

    return {
      reducedMotionActive: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      htmlClasses: document.documentElement.className,
      scrollY: window.scrollY,
      systemInner: styleState(".home-system-story-inner"),
      systemVisualImage: styleState(".home-system-visual img"),
      productItem: styleState(".home-product-reel-item"),
      productImage: styleState(".home-product-reel-item figure img"),
      displaySurface: styleState(".home-display-surface"),
      displayImage: styleState(".home-display-surface img"),
    };
  });

  if (!state.reducedMotionActive) {
    fail("Reduced-motion media emulation is not active", { state });
  }
  if (state.htmlClasses.includes("home-gsap-motion")) {
    fail("HomepageMotion added GSAP class under reduced motion", { state });
  }
  for (const [name, item] of Object.entries({
    systemInner: state.systemInner,
    systemVisualImage: state.systemVisualImage,
    productItem: state.productItem,
    productImage: state.productImage,
    displaySurface: state.displaySurface,
    displayImage: state.displayImage,
  })) {
    if (!item) {
      fail(`Reduced-motion target ${name} is missing`, { state });
      continue;
    }
    if (!isIdentityTransform(item.transform)) {
      fail(`Reduced-motion target ${name} still has transform`, { state });
    }
    if (item.animationName !== "none") {
      fail(`Reduced-motion target ${name} still has animation`, { state });
    }
  }

  report.interactions.push({
    name: "desktop reduced-motion scroll fallback",
    screenshot: reducedMotionPath,
    state,
  });

  await page.close();
  await context.close();
}

await mkdir(screenshotsDir, { recursive: true });
await mkdir(videosDir, { recursive: true });

const browser = await chromium.launch({ executablePath, headless: true });
try {
  for (const viewport of viewports) {
    await captureViewport(browser, viewport);
  }
  await captureInteractions(browser);
  await captureReducedMotion(browser);
} finally {
  await browser.close();
}

const reportPath = path.join(artifactRoot, "homepage-protected-polish-report.json");
await writeFile(reportPath, JSON.stringify(report, null, 2));

if (report.failures.length > 0) {
  console.error(JSON.stringify({ reportPath, failures: report.failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ reportPath, captures: report.captures.length, interactions: report.interactions.length }, null, 2));
