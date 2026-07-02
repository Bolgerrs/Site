import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = (process.env.MONTELAR_QA_BASE_URL || "http://127.0.0.1:8093").replace(/\/$/, "");
const repoRoot = process.cwd().endsWith(path.join("apps", "web")) ? path.resolve(process.cwd(), "../..") : process.cwd();
const artifactRoot = path.resolve(
  repoRoot,
  process.env.MONTELAR_QA_ARTIFACT_DIR ||
    "docs/strategy/artifacts/visual-qa/MNT-STANDALONE-LAYOUT-001/final",
);
const executablePath =
  process.env.MONTELAR_QA_BROWSER ||
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
  "/usr/bin/google-chrome";
const captureScreenshots = process.env.MONTELAR_QA_SCREENSHOTS !== "0";
const captureVideo = process.env.MONTELAR_QA_VIDEO !== "0";

const routes = [
  { route: "/ru/audio/speakers", slug: "audio-speakers", hasStage: true },
  { route: "/en/audio/speakers", slug: "audio-speakers-en", hasStage: true },
  { route: "/ru/products/hologram-vitrine", slug: "hologram-vitrine", hasStage: true },
  { route: "/en/products/hologram-vitrine", slug: "hologram-vitrine-en", hasStage: true },
];

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "laptop", width: 1366, height: 768 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile360", width: 360, height: 800 },
  { name: "mobile390", width: 390, height: 844 },
  { name: "mobile430", width: 430, height: 932 },
];

const report = {
  baseUrl,
  executablePath,
  generatedAt: new Date().toISOString(),
  routes: [],
  captures: [],
  clicks: [],
  reducedMotion: [],
  videos: [],
  protected: [],
  failures: [],
};

function joinUrl(route) {
  return `${baseUrl}${route}`;
}

function normalizePathname(value) {
  return new URL(value, baseUrl).pathname.replace(/\/$/, "") || "/";
}

function screenshotPath(...parts) {
  return path.join(artifactRoot, "screenshots", ...parts);
}

async function capture(page, name) {
  if (!captureScreenshots) {
    return null;
  }

  const filePath = screenshotPath(`${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  return filePath;
}

async function goto(page, route) {
  const response = await page.goto(joinUrl(route), { waitUntil: "networkidle", timeout: 60000 });
  const status = response?.status() ?? 0;
  const entry = { route, status, url: page.url() };
  report.routes.push(entry);

  if (status < 200 || status >= 400) {
    throw new Error(`${route} returned ${status}`);
  }

  return entry;
}

async function scrollToStage(page, viewportName) {
  await page.evaluate(
    ({ viewport }) => {
      const stage = document.querySelector(".motion-ready-stage");

      if (!stage) {
        throw new Error("Missing .motion-ready-stage");
      }

      const offset = viewport.startsWith("mobile") ? 92 : 24;
      window.scrollTo({
        top: stage.getBoundingClientRect().top + window.scrollY - offset,
        behavior: "instant",
      });
    },
    { viewport: viewportName },
  );
  await page.waitForTimeout(360);
}

async function scanLayout(page, label) {
  return page.evaluate((scanLabel) => {
    const textSelectors = [
      ".motion-ready-stage__copy h2",
      ".motion-ready-stage__copy p:not(.eyebrow)",
      ".motion-ready-stage__steps li",
      ".motion-ready-stage__primary",
      ".motion-ready-stage__secondary",
      ".route-page h1",
      ".route-page p",
      ".route-page a",
    ];
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const issues = [];
    const pageOverflow = Math.max(0, document.documentElement.scrollWidth - window.innerWidth);
    const stage = document.querySelector(".motion-ready-stage");
    const stageBox = stage?.getBoundingClientRect();

    for (const element of document.querySelectorAll(textSelectors.join(","))) {
      const rect = element.getBoundingClientRect();
      const visible = rect.width > 2 && rect.height > 2 && rect.bottom > 0 && rect.top < viewport.height;
      const style = getComputedStyle(element);
      const className = element.className?.toString?.() || element.tagName.toLowerCase();

      if (
        !visible ||
        style.visibility === "hidden" ||
        style.display === "none" ||
        style.opacity === "0" ||
        element.getAttribute("aria-hidden") === "true" ||
        className.includes("locale-switcher-label")
      ) {
        continue;
      }

      const ownHorizontalOverflow = element.scrollWidth > element.clientWidth + 2;
      const overflowsViewport = rect.left < -1 || rect.right > viewport.width + 1;

      if (ownHorizontalOverflow || overflowsViewport) {
        issues.push({
          selector: element.tagName.toLowerCase(),
          className,
          text: element.textContent?.replace(/\s+/g, " ").trim().slice(0, 160) || "",
          rect: {
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
            top: Math.round(rect.top),
            bottom: Math.round(rect.bottom),
          },
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth,
          ownHorizontalOverflow,
          overflowsViewport,
        });
      }
    }

    return {
      label: scanLabel,
      viewport,
      pageOverflow,
      stage: stageBox
        ? {
            left: Math.round(stageBox.left),
            right: Math.round(stageBox.right),
            width: Math.round(stageBox.width),
            top: Math.round(stageBox.top),
            bottom: Math.round(stageBox.bottom),
          }
        : null,
      issues,
    };
  }, label);
}

async function verifyClickPath(page, route, slug) {
  await goto(page, route);
  await scrollToStage(page, "desktop");
  const primary = page.locator(".motion-ready-stage__primary").first();
  await primary.scrollIntoViewIfNeeded();
  await page.waitForTimeout(160);
  const href = await primary.getAttribute("href");

  if (!href) {
    throw new Error(`${route} primary CTA has no href`);
  }

  const expected = normalizePathname(href);
  const hitTarget = await primary.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const topElement = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);

    return {
      rect: {
        left: Math.round(rect.left),
        top: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
      topTag: topElement?.tagName ?? null,
      topClass: topElement?.className?.toString?.() ?? null,
      sameElement: topElement === element || element.contains(topElement),
    };
  });

  if (!hitTarget.sameElement) {
    throw new Error(`${route} CTA center is covered: ${JSON.stringify(hitTarget)}`);
  }

  await Promise.all([
    page.waitForURL((url) => normalizePathname(url.href) === expected, { timeout: 30000 }),
    primary.click(),
  ]);
  await page.waitForLoadState("networkidle");
  const actual = normalizePathname(page.url());
  const response = await page.goto(joinUrl(expected), { waitUntil: "networkidle", timeout: 60000 });
  const status = response?.status() ?? 0;
  const entry = { route, slug, href, expected, actual, status, hitTarget, ok: expected === actual && status >= 200 && status < 400 };
  report.clicks.push(entry);

  if (!entry.ok) {
    throw new Error(`${route} CTA expected ${expected}, got ${actual}, status ${status}`);
  }
}

async function captureRoute(browser, routeInfo, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
  });
  const page = await context.newPage();
  const label = `${routeInfo.slug}-${viewport.name}-${viewport.width}x${viewport.height}`;

  await goto(page, routeInfo.route);
  await page.waitForTimeout(420);
  const topScan = await scanLayout(page, `${label}-top`);
  const topShot = await capture(page, `${label}-top`);
  await scrollToStage(page, viewport.name);
  const stageScan = await scanLayout(page, `${label}-stage`);
  const stageShot = await capture(page, `${label}-stage`);

  const entry = {
    route: routeInfo.route,
    slug: routeInfo.slug,
    viewport,
    topScan,
    stageScan,
    screenshots: [topShot, stageShot].filter(Boolean),
  };
  report.captures.push(entry);

  for (const scan of [topScan, stageScan]) {
    if (scan.pageOverflow > 2 || scan.issues.length) {
      report.failures.push({ route: routeInfo.route, viewport, scan });
    }
  }

  await context.close();
}

async function verifyReducedMotion(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await goto(page, "/ru/products/hologram-vitrine");
  await scrollToStage(page, "mobile390");
  const state = await page.evaluate(() => {
    const sticky = document.querySelector(".motion-ready-stage__sticky");
    const image = document.querySelector(".motion-ready-stage__image");
    const stickyStyle = sticky ? getComputedStyle(sticky) : null;
    const imageStyle = image ? getComputedStyle(image) : null;

    return {
      stickyPosition: stickyStyle?.position ?? null,
      imageTransform: imageStyle?.transform ?? null,
      pageOverflow: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
    };
  });
  const screenshot = await capture(page, "reduced-motion-hologram-vitrine-mobile390");
  const entry = { route: "/ru/products/hologram-vitrine", state, screenshot };
  report.reducedMotion.push(entry);

  if (state.stickyPosition !== "relative" || state.pageOverflow > 2) {
    report.failures.push({ reducedMotion: entry });
  }

  await context.close();
}

async function captureScrollVideo(browser, routeInfo) {
  if (!captureVideo) {
    return;
  }

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: path.join(artifactRoot, "videos"), size: { width: 1440, height: 900 } },
  });
  const page = await context.newPage();
  await goto(page, routeInfo.route);
  await page.waitForTimeout(450);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(200);
  await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 1.5, behavior: "smooth" }));
  await page.waitForTimeout(1600);
  await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 2.25, behavior: "smooth" }));
  await page.waitForTimeout(900);
  const video = page.video();
  await context.close();

  if (video) {
    report.videos.push({ route: routeInfo.route, path: await video.path() });
  }
}

async function captureProtected(browser) {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await goto(desktop, "/ru");
  await desktop.waitForTimeout(600);
  const desktopClosed = await capture(desktop, "protected-home-desktop-closed-1440x900");
  await desktop.locator('[data-qa="nav-trigger-products"]').click();
  await desktop.waitForTimeout(420);
  const desktopOpen = await capture(desktop, "protected-home-desktop-products-open-1440x900");
  const desktopState = await desktop.evaluate(() => ({
    overflow: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
    heroHotspots: document.querySelectorAll(".product-scene-prototype__hotspot").length,
    productsOpen: document.querySelector('[data-qa="nav-trigger-products"]')?.getAttribute("aria-expanded"),
    panelVisible: Boolean(document.querySelector('[data-qa="desktop-panel-products"]')),
  }));
  await desktop.close();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await goto(mobile, "/ru");
  await mobile.waitForTimeout(600);
  const mobileClosed = await capture(mobile, "protected-home-mobile-closed-390x844");
  await mobile.locator('[data-qa="mobile-nav-toggle"]').click();
  await mobile.waitForTimeout(520);
  const mobileOpen = await capture(mobile, "protected-home-mobile-menu-open-390x844");
  const mobileState = await mobile.evaluate(() => ({
    overflow: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
    toggleExpanded: document.querySelector('[data-qa="mobile-nav-toggle"]')?.getAttribute("aria-expanded"),
    drawerVisible: Boolean(document.querySelector('[data-qa="mobile-nav-drawer"]')),
  }));
  await mobile.close();

  const entry = {
    screenshots: [desktopClosed, desktopOpen, mobileClosed, mobileOpen].filter(Boolean),
    desktopState,
    mobileState,
  };
  report.protected.push(entry);

  if (
    desktopState.overflow > 2 ||
    desktopState.heroHotspots < 6 ||
    desktopState.productsOpen !== "true" ||
    !desktopState.panelVisible ||
    mobileState.overflow > 2 ||
    mobileState.toggleExpanded !== "true" ||
    !mobileState.drawerVisible
  ) {
    report.failures.push({ protected: entry });
  }
}

async function main() {
  await mkdir(path.join(artifactRoot, "screenshots"), { recursive: true });
  await mkdir(path.join(artifactRoot, "videos"), { recursive: true });
  const browser = await chromium.launch({ executablePath, headless: true });

  try {
    for (const routeInfo of routes) {
      for (const viewport of viewports) {
        await captureRoute(browser, routeInfo, viewport);
      }
    }

    for (const routeInfo of routes) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await verifyClickPath(page, routeInfo.route, routeInfo.slug);
      await page.close();
    }

    await verifyReducedMotion(browser);
    await captureProtected(browser);
    await captureScrollVideo(browser, routes[0]);
    await captureScrollVideo(browser, routes[2]);
  } finally {
    await browser.close();
  }

  await writeFile(path.join(artifactRoot, "standalone-layout-qa-report.json"), `${JSON.stringify(report, null, 2)}\n`);

  if (report.failures.length) {
    console.error(JSON.stringify(report.failures, null, 2));
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        baseUrl,
        captures: report.captures.length,
        clicks: report.clicks.length,
        reducedMotion: report.reducedMotion.length,
        videos: report.videos.length,
        protected: report.protected.length,
        report: path.join(artifactRoot, "standalone-layout-qa-report.json"),
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
