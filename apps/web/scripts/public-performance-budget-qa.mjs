import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const repoRoot = process.cwd().endsWith(path.join("apps", "web")) ? path.resolve(process.cwd(), "../..") : process.cwd();
const baseUrl = (process.env.MONTELAR_QA_BASE_URL || "http://127.0.0.1:8093").replace(/\/$/, "");
const artifactRoot = process.env.MONTELAR_QA_ARTIFACT_DIR
  ? path.resolve(repoRoot, process.env.MONTELAR_QA_ARTIFACT_DIR)
  : path.resolve(
      repoRoot,
      "docs/strategy/artifacts/visual-modernization-2026-05-21/MNT-SITE-VIS-026-performance-budget",
    );

const chromiumPath =
  process.env.MONTELAR_QA_BROWSER ||
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
  "/usr/bin/chromium-browser";
const yandexPath = process.env.YANDEX_BROWSER_PATH || "/opt/yandex/browser/yandex-browser";
const runYandex = process.env.MONTELAR_QA_SKIP_YANDEX === "1" ? false : existsSync(yandexPath);

const routes = [
  { name: "home", route: "/ru", type: "homepage", motion: true },
  { name: "category-audio", route: "/ru/audio", type: "category", motion: false },
  { name: "product-prima-materia", route: "/ru/products/prima-materia-lux-speaker", type: "product", motion: false },
  { name: "contact", route: "/ru/contact", type: "contact", motion: false },
  { name: "product-motion-prototype", route: "/ru/product-motion-prototype", type: "prototype", motion: true },
];

const browserPlans = [
  { name: "chromium", executablePath: chromiumPath, viewports: ["desktop", "mobile"] },
  ...(runYandex ? [{ name: "yandex", executablePath: yandexPath, viewports: ["desktop"] }] : []),
];

const viewports = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
};

const budgets = {
  cls: 0.1,
  lcpMs: 3000,
  inpMs: 200,
  horizontalOverflowPx: 2,
  maxFrameDeltaMs: 120,
  minObservedFps: 35,
  maxLongTasks: 8,
  maxTotalTransferKb: 8200,
};

const report = {
  task: "MNT-SITE-VIS-026",
  generatedAt: new Date().toISOString(),
  baseUrl,
  runYandex,
  budgets,
  checks: [],
  artifacts: { screenshots: [], videos: [], traces: [] },
  warnings: [],
  failures: [],
};

function routeUrl(route) {
  return `${baseUrl}${route}`;
}

function fileSafe(value) {
  return value.replace(/[^a-z0-9-]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
}

function addFailure(message, details = {}) {
  report.failures.push({ message, ...details });
}

function addWarning(message, details = {}) {
  report.warnings.push({ message, ...details });
}

async function ensureDirs({ clean = false } = {}) {
  await mkdir(artifactRoot, { recursive: true });
  if (clean) {
    await rm(path.join(artifactRoot, "screenshots"), { recursive: true, force: true });
    await rm(path.join(artifactRoot, "videos"), { recursive: true, force: true });
    await rm(path.join(artifactRoot, "traces"), { recursive: true, force: true });
  }
  await mkdir(path.join(artifactRoot, "screenshots"), { recursive: true });
  await mkdir(path.join(artifactRoot, "videos"), { recursive: true });
  await mkdir(path.join(artifactRoot, "traces"), { recursive: true });
}

async function addVitalsObservers(page) {
  await page.addInitScript(() => {
    window.__montelarVitals = {
      cls: 0,
      lcp: 0,
      eventDurations: [],
      longTasks: [],
      hadObserverError: false,
    };

    try {
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            window.__montelarVitals.cls += entry.value;
          }
        }
      }).observe({ type: "layout-shift", buffered: true });

      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const last = entries[entries.length - 1];
        if (last) {
          window.__montelarVitals.lcp = last.startTime;
        }
      }).observe({ type: "largest-contentful-paint", buffered: true });

      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          window.__montelarVitals.eventDurations.push(entry.duration);
        }
      }).observe({ type: "event", buffered: true, durationThreshold: 16 });

      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          window.__montelarVitals.longTasks.push(entry.duration);
        }
      }).observe({ type: "longtask", buffered: true });
    } catch {
      window.__montelarVitals.hadObserverError = true;
    }
  });
}

async function collectPageState(page) {
  return page.evaluate(() => {
    const overflowElements = Array.from(document.querySelectorAll("body *"))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tagName: element.tagName,
          className: element.className?.toString?.() || "",
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        };
      })
      .filter((item) => item.width > 0 && (item.left < -2 || item.right > window.innerWidth + 2))
      .slice(0, 16);

    const resources = performance.getEntriesByType("resource");
    const transferBytes = resources.reduce((sum, entry) => sum + (entry.transferSize || 0), 0);
    const nav = performance.getEntriesByType("navigation")[0];
    const vitals = window.__montelarVitals || {};
    const eventDurations = vitals.eventDurations || [];

    return {
      title: document.title,
      userAgent: navigator.userAgent,
      url: location.href,
      scrollHeight: document.documentElement.scrollHeight,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
      overflowElements,
      transferKb: Math.round(transferBytes / 1024),
      resourceCount: resources.length,
      domContentLoadedMs: nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : null,
      loadMs: nav ? Math.round(nav.loadEventEnd - nav.startTime) : null,
      cls: Number((vitals.cls || 0).toFixed(4)),
      lcpMs: vitals.lcp ? Math.round(vitals.lcp) : null,
      inpCandidateMs: eventDurations.length ? Math.round(Math.max(...eventDurations)) : null,
      longTasks: (vitals.longTasks || []).map((duration) => Math.round(duration)).slice(0, 20),
      observerError: Boolean(vitals.hadObserverError),
      reducedMotionActive: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    };
  });
}

async function observeScroll(page, routePlan) {
  const distanceMultiplier = routePlan.type === "prototype" ? 2.2 : routePlan.motion ? 1.8 : 1.2;

  return page.evaluate(async (distanceMultiplierArg) => {
    const maxDistance = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const distance = Math.min(maxDistance, Math.round(window.innerHeight * distanceMultiplierArg));
    const startY = window.scrollY;
    const duration = 1500;
    const start = performance.now();
    const deltas = [];
    let previous = start;
    let frames = 0;

    return new Promise((resolve) => {
      function tick(now) {
        const elapsed = Math.min(duration, now - start);
        const progress = elapsed / duration;
        const targetY = startY + distance * progress;

        window.scrollTo(0, targetY);
        deltas.push(now - previous);
        previous = now;
        frames += 1;

        if (elapsed >= duration) {
          const sorted = [...deltas].sort((a, b) => a - b);
          const maxDeltaMs = Math.round(Math.max(...deltas));
          const p95DeltaMs = Math.round(sorted[Math.floor(sorted.length * 0.95)] || maxDeltaMs);
          const droppedFrames = deltas.filter((delta) => delta > 50).length;
          const observedFps = Math.round((frames / (now - start)) * 1000);

          resolve({
            distance,
            frames,
            observedFps,
            maxDeltaMs,
            p95DeltaMs,
            droppedFrames,
            finalScrollY: Math.round(window.scrollY),
          });
          return;
        }

        requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    });
  }, distanceMultiplier);
}

async function runInteractionProbe(page, routePlan, viewportName) {
  if (viewportName === "mobile") {
    const toggle = page.locator('[data-qa="mobile-nav-toggle"]');
    if (await toggle.count()) {
      await toggle.first().click();
      await page.waitForTimeout(260);
      await page.keyboard.press("Escape").catch(() => null);
    }
  } else {
    const products = page.locator('[data-qa="nav-trigger-products"]');
    if (await products.count()) {
      await products.first().hover();
      await page.waitForTimeout(160);
    }
  }

  if (routePlan.type === "contact") {
    const firstInput = page.locator("input, textarea, select").first();
    if (await firstInput.count()) {
      await firstInput.focus();
      await page.keyboard.type("QA", { delay: 10 }).catch(() => null);
    }
  }
}

function evaluateBudgets(result) {
  const prefix = `${result.browser}/${result.viewport}/${result.route.name}`;

  if (result.status < 200 || result.status >= 400) {
    addFailure(`${prefix}: route returned ${result.status}`, { url: result.url });
  }
  if (result.state.horizontalOverflow > budgets.horizontalOverflowPx) {
    addFailure(`${prefix}: horizontal overflow ${result.state.horizontalOverflow}px`, {
      overflowElements: result.state.overflowElements,
    });
  }
  if (result.state.cls > budgets.cls) {
    addWarning(`${prefix}: CLS candidate ${result.state.cls} exceeds ${budgets.cls}`);
  }
  if (result.state.lcpMs && result.state.lcpMs > budgets.lcpMs) {
    addWarning(`${prefix}: LCP candidate ${result.state.lcpMs}ms exceeds ${budgets.lcpMs}ms`);
  }
  if (result.state.inpCandidateMs && result.state.inpCandidateMs > budgets.inpMs) {
    addWarning(`${prefix}: INP/event candidate ${result.state.inpCandidateMs}ms exceeds ${budgets.inpMs}ms`);
  }
  if (result.state.longTasks.length > budgets.maxLongTasks) {
    addWarning(`${prefix}: long task count ${result.state.longTasks.length} exceeds ${budgets.maxLongTasks}`);
  }
  if (result.state.transferKb > budgets.maxTotalTransferKb) {
    addWarning(`${prefix}: transfer ${result.state.transferKb}KB exceeds ${budgets.maxTotalTransferKb}KB`);
  }
  if (result.scroll.maxDeltaMs > budgets.maxFrameDeltaMs) {
    addWarning(`${prefix}: scroll max frame delta ${result.scroll.maxDeltaMs}ms exceeds ${budgets.maxFrameDeltaMs}ms`);
  }
  if (result.scroll.observedFps < budgets.minObservedFps) {
    addWarning(`${prefix}: observed scroll FPS ${result.scroll.observedFps} below ${budgets.minObservedFps}`);
  }
}

async function captureCase(browser, browserPlan, routePlan, viewportName, reducedMotion = false) {
  const viewport = viewports[viewportName];
  const nameParts = [
    browserPlan.name,
    viewportName,
    reducedMotion ? "reduced-motion" : "default",
    routePlan.name,
  ];
  const safeName = fileSafe(nameParts.join("-"));
  const context = await browser.newContext({
    viewport,
    reducedMotion: reducedMotion ? "reduce" : "no-preference",
    recordVideo: routePlan.motion ? { dir: path.join(artifactRoot, "videos"), size: viewport } : undefined,
  });
  const shouldTrace = routePlan.motion || reducedMotion;
  if (shouldTrace) {
    await context.tracing.start({ screenshots: true, snapshots: false, sources: false });
  }

  const page = await context.newPage();
  await addVitalsObservers(page);

  const response = await page.goto(routeUrl(routePlan.route), { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(500);

  const topScreenshot = path.join(artifactRoot, "screenshots", `${safeName}-top.png`);
  await page.screenshot({ path: topScreenshot, fullPage: false });
  report.artifacts.screenshots.push(topScreenshot);

  const scroll = await observeScroll(page, routePlan);
  await page.waitForTimeout(250);

  const scrollScreenshot = path.join(artifactRoot, "screenshots", `${safeName}-scroll.png`);
  await page.screenshot({ path: scrollScreenshot, fullPage: false });
  report.artifacts.screenshots.push(scrollScreenshot);

  await runInteractionProbe(page, routePlan, viewportName);
  await page.waitForTimeout(180);

  const state = await collectPageState(page);
  const status = response?.status() ?? 0;
  const result = {
    browser: browserPlan.name,
    executablePath: browserPlan.executablePath,
    viewport: viewportName,
    reducedMotion,
    route: routePlan,
    status,
    url: page.url(),
    state,
    scroll,
    screenshots: [topScreenshot, scrollScreenshot],
  };

  evaluateBudgets(result);
  report.checks.push(result);

  await page.close();
  const video = await page.video()?.path().catch(() => null);
  if (video) {
    result.video = video;
    report.artifacts.videos.push(video);
  }

  if (shouldTrace) {
    const trace = path.join(artifactRoot, "traces", `${safeName}.zip`);
    await context.tracing.stop({ path: trace });
    report.artifacts.traces.push(trace);
  }
  await context.close();
}

async function runBrowser(browserPlan) {
  if (!existsSync(browserPlan.executablePath)) {
    addWarning(`${browserPlan.name}: executable not found`, { executablePath: browserPlan.executablePath });
    return;
  }

  const browser = await chromium.launch({
    executablePath: browserPlan.executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    for (const viewportName of browserPlan.viewports) {
      for (const routePlan of routes) {
        await captureCase(browser, browserPlan, routePlan, viewportName, false);
      }
    }

    await captureCase(browser, browserPlan, routes[0], browserPlan.viewports[0], true);
  } finally {
    await browser.close();
  }
}

async function writeSummary() {
  const lines = [
    "# MNT-SITE-VIS-026 Performance QA Run",
    "",
    `Generated: ${report.generatedAt}`,
    `Base URL: ${baseUrl}`,
    `Yandex included: ${runYandex ? "yes" : "no"}`,
    "",
    "## Budgets",
    "",
    `- Horizontal overflow: <= ${budgets.horizontalOverflowPx}px hard fail.`,
    `- CLS: <= ${budgets.cls} warning gate where measurable.`,
    `- LCP: <= ${budgets.lcpMs}ms warning gate where measurable.`,
    `- INP/event candidate: <= ${budgets.inpMs}ms warning gate where measurable.`,
    `- Scroll observation: >= ${budgets.minObservedFps}fps and max frame delta <= ${budgets.maxFrameDeltaMs}ms warning gate.`,
    "",
    "## Routes",
    "",
    ...report.checks.map(
      (check) =>
        `- ${check.browser}/${check.viewport}${check.reducedMotion ? "/reduced-motion" : ""} ${check.route.route}: status ${check.status}, overflow ${check.state.horizontalOverflow}px, CLS ${check.state.cls}, LCP ${check.state.lcpMs ?? "n/a"}ms, FPS ${check.scroll.observedFps}, max frame ${check.scroll.maxDeltaMs}ms.`,
    ),
    "",
    "## Artifacts",
    "",
    `- Screenshots: ${report.artifacts.screenshots.length}`,
    `- Videos: ${report.artifacts.videos.length}`,
    `- Traces: ${report.artifacts.traces.length}`,
    "",
    "## Warnings",
    "",
    ...(report.warnings.length ? report.warnings.map((item) => `- ${item.message}`) : ["- None."]),
    "",
    "## Failures",
    "",
    ...(report.failures.length ? report.failures.map((item) => `- ${item.message}`) : ["- None."]),
  ];

  await writeFile(path.join(artifactRoot, "performance-qa-run.md"), `${lines.join("\n")}\n`);
}

async function main() {
  await ensureDirs({ clean: true });

  for (const browserPlan of browserPlans) {
    await runBrowser(browserPlan);
  }

  await writeSummary();
  await writeFile(path.join(artifactRoot, "performance-qa-report.json"), JSON.stringify(report, null, 2));

  console.log(
    JSON.stringify(
      {
        artifactRoot,
        checks: report.checks.length,
        warnings: report.warnings.length,
        failures: report.failures.length,
        screenshots: report.artifacts.screenshots.length,
        videos: report.artifacts.videos.length,
        traces: report.artifacts.traces.length,
      },
      null,
      2,
    ),
  );

  if (report.failures.length > 0) {
    process.exit(1);
  }

  process.exit(0);
}

main().catch(async (error) => {
  addFailure(error.message, { stack: error.stack });
  await ensureDirs();
  await writeFile(path.join(artifactRoot, "performance-qa-report.json"), JSON.stringify(report, null, 2));
  console.error(error);
  process.exit(1);
});
