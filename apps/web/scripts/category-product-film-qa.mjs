import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = (process.env.MONTELAR_QA_BASE_URL || "http://127.0.0.1:8093").replace(/\/$/, "");
const repoRoot = process.cwd().endsWith(path.join("apps", "web")) ? path.resolve(process.cwd(), "../..") : process.cwd();
const artifactRoot = path.resolve(
  repoRoot,
  process.env.MONTELAR_QA_ARTIFACT_DIR ||
    "docs/strategy/artifacts/visual-qa/MNT-SITE-VIS-021/2026-05-22-rework-fit-clickpath",
);
const executablePath =
  process.env.MONTELAR_QA_BROWSER ||
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
  "/usr/bin/chromium-browser";
const route = process.env.MONTELAR_QA_ROUTE || "/ru/category-product-film-prototype";
const publicSmokeRoute = process.env.MONTELAR_QA_PUBLIC_SMOKE_ROUTE || "/ru/audio/speakers";
const recordVideo = process.env.MONTELAR_QA_RECORD_VIDEO !== "0";

const viewports = [
  { name: "desktop", width: 1440, height: 900, video: true },
  { name: "laptop", width: 1366, height: 768, video: false },
  { name: "tablet", width: 768, height: 1024, video: false },
  { name: "mobile", width: 390, height: 844, video: true },
];

function screenshotPath(name) {
  return path.join(artifactRoot, "screenshots", name);
}

function normalizePathname(value) {
  const url = new URL(value, baseUrl);
  return url.pathname.replace(/\/$/, "") || "/";
}

async function visibleTextFit(page, label) {
  return page.evaluate((scanLabel) => {
    const selectors = [
      ".category-film-hero h1",
      ".category-film-hero p:not(.eyebrow)",
      ".category-film-stage__rail-button",
      ".category-film-stage__rail-button strong",
      ".category-film-stage__copy h1",
      ".category-film-stage__copy p:not(.eyebrow)",
      ".category-film-stage__metric",
      ".category-film-stage__primary",
      ".category-film-stage__secondary",
      ".category-film-stage__products a",
      ".category-film-stage__products span",
      ".category-film-stage__products small",
      ".category-film-close h2",
      ".category-film-close__link",
    ];
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const issues = [];

    for (const element of document.querySelectorAll(selectors.join(","))) {
      const rect = element.getBoundingClientRect();
      const visible = rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < viewport.height;

      if (!visible) {
        continue;
      }

      const computed = window.getComputedStyle(element);
      const className = element.className?.toString?.() || element.tagName.toLowerCase();
      const text = element.textContent?.replace(/\s+/g, " ").trim().slice(0, 120) || "";
      const ownHorizontalOverflow = element.scrollWidth > element.clientWidth + 2;
      const insideHorizontalScroller = Boolean(element.closest(".category-film-stage__rail"));
      const overflowsViewport =
        (!insideHorizontalScroller && rect.left < -1) ||
        (!insideHorizontalScroller && rect.right > viewport.width + 1);

      if (overflowsViewport || (ownHorizontalOverflow && rect.right > viewport.width + 1)) {
        issues.push({
          label: scanLabel,
          selector: element.tagName.toLowerCase(),
          className,
          text,
          rect: {
            top: Math.round(rect.top),
            right: Math.round(rect.right),
            bottom: Math.round(rect.bottom),
            left: Math.round(rect.left),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
          scroll: {
            width: element.scrollWidth,
            height: element.scrollHeight,
            clientWidth: element.clientWidth,
            clientHeight: element.clientHeight,
          },
          overflow: computed.overflow,
        });
      }
    }

    return {
      label: scanLabel,
      viewport,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      issues,
    };
  }, label);
}

async function frameObservation(page) {
  return page.evaluate(async () => {
    let frames = 0;
    let maxDelta = 0;
    let previous = performance.now();
    const start = previous;

    window.scrollTo({ top: 0, behavior: "instant" });

    return new Promise((resolve) => {
      function tick(now) {
        frames += 1;
        maxDelta = Math.max(maxDelta, now - previous);
        previous = now;

        if (frames === 8) {
          window.scrollTo({ top: Math.round(window.innerHeight * 1.8), behavior: "smooth" });
        }

        if (now - start >= 1600) {
          resolve({
            frames,
            durationMs: Math.round(now - start),
            maxDeltaMs: Math.round(maxDelta),
            scrollY: Math.round(window.scrollY),
          });
          return;
        }

        requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    });
  });
}

async function scrollToSelector(page, selector, offset = 0) {
  await page.evaluate(
    ({ targetSelector, topOffset }) => {
      const element = document.querySelector(targetSelector);

      if (!element) {
        throw new Error(`Missing selector: ${targetSelector}`);
      }

      const top = element.getBoundingClientRect().top + window.scrollY + topOffset;
      window.scrollTo({ top, behavior: "instant" });
    },
    { targetSelector: selector, topOffset: offset },
  );
  await page.waitForTimeout(420);
}

async function captureViewport(browser, viewport) {
  const videoDir = path.join(artifactRoot, "videos");
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    recordVideo:
      recordVideo && viewport.video
        ? { dir: videoDir, size: { width: viewport.width, height: viewport.height } }
        : undefined,
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle", timeout: 60000 });
  await page.screenshot({ path: screenshotPath(`${viewport.name}-top-${viewport.width}x${viewport.height}.png`), fullPage: false });
  const topFit = await visibleTextFit(page, `${viewport.name}-top`);

  if (viewport.name === "desktop") {
    const productsTrigger = page.locator(".desktop-nav-trigger").first();
    await productsTrigger.hover();
    await page.waitForTimeout(420);
    await page.screenshot({ path: screenshotPath("desktop-products-menu-open-1440x900.png"), fullPage: false });
  }

  if (viewport.name === "mobile") {
    await page.locator("[data-qa='mobile-nav-toggle']").click();
    await page.waitForTimeout(420);
    await page.screenshot({ path: screenshotPath("mobile-menu-open-390x844.png"), fullPage: false });
    await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle", timeout: 60000 });
  }

  await scrollToSelector(page, ".category-film-stage", viewport.name === "mobile" ? -92 : -20);

  if (viewport.name === "mobile" || viewport.name === "tablet") {
    if (viewport.name === "mobile") {
      await page.locator(".category-film-stage__rail").evaluate((element) => {
        element.scrollLeft = element.scrollWidth;
      });
      await page.waitForTimeout(180);
    }

    const secondRailButton = page.locator(".category-film-stage__rail-button").nth(1);
    const railBox = await secondRailButton.boundingBox();

    if (!railBox) {
      throw new Error(`${viewport.name}: second category rail button is not visible`);
    }

    await page.mouse.click(railBox.x + railBox.width / 2, railBox.y + railBox.height / 2);
    await page.waitForTimeout(360);
  } else {
    await page.locator(".category-film-stage__products a").first().hover();
    await page.waitForTimeout(300);
  }

  await page.screenshot({ path: screenshotPath(`${viewport.name}-stage-${viewport.width}x${viewport.height}.png`), fullPage: false });
  const stageFit = await visibleTextFit(page, `${viewport.name}-stage`);

  await scrollToSelector(page, ".category-film-close", 20);
  await page.screenshot({ path: screenshotPath(`${viewport.name}-close-${viewport.width}x${viewport.height}.png`), fullPage: false });
  const closeFit = await visibleTextFit(page, `${viewport.name}-close`);
  const observation = await frameObservation(page);
  const languageHref = await page.locator(".header-locale-switcher a[href^='/en'], .mobile-nav-locale-row a[href^='/en']").first().getAttribute("href").catch(() => null);

  const video = page.video();
  await page.close();
  await context.close();
  const videoPath = video ? await video.path().catch(() => null) : null;

  return {
    viewport,
    screenshots: [
      screenshotPath(`${viewport.name}-top-${viewport.width}x${viewport.height}.png`),
      screenshotPath(`${viewport.name}-stage-${viewport.width}x${viewport.height}.png`),
      screenshotPath(`${viewport.name}-close-${viewport.width}x${viewport.height}.png`),
    ],
    videoPath,
    languageHref,
    textFit: [topFit, stageFit, closeFit],
    observation,
    consoleErrors,
    pageErrors,
  };
}

async function captureReducedMotion(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();

  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle", timeout: 60000 });
  await scrollToSelector(page, ".category-film-stage", -20);
  await page.screenshot({ path: screenshotPath("desktop-reduced-motion-1440x900.png"), fullPage: false });
  const state = await page.evaluate(() => ({
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    stageReducedMotion: document.querySelector(".category-film-stage")?.getAttribute("data-reduced-motion") || null,
  }));
  const fit = await visibleTextFit(page, "desktop-reduced-motion");

  await page.close();
  await context.close();

  return { screenshot: screenshotPath("desktop-reduced-motion-1440x900.png"), state, fit };
}

async function verifyClickTarget(browser, target) {
  const context = await browser.newContext({ viewport: { width: target.viewportWidth || 1440, height: target.viewportHeight || 900 } });
  const page = await context.newPage();
  const sourcePath = normalizePathname(route);
  const expectedPath = normalizePathname(target.expectedHref);

  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle", timeout: 60000 });

  if (target.sceneIndex) {
    await scrollToSelector(page, ".category-film-stage", -20);
    await page.locator(".category-film-stage__rail-button").nth(target.sceneIndex).click();
    await page.waitForTimeout(360);
  } else if (target.scrollToStage) {
    await scrollToSelector(page, ".category-film-stage", -20);
  }

  const locator = page.locator(target.selector).first();
  const href = await locator.getAttribute("href");
  const rect = await locator.boundingBox();
  let finalUrl = null;
  let destinationTitle = null;

  if (normalizePathname(href || "") !== expectedPath) {
    throw new Error(`${target.name}: expected href ${expectedPath}, got ${href}`);
  }

  await Promise.all([
    page.waitForURL((url) => normalizePathname(url.href) === expectedPath, { timeout: 10000 }),
    locator.click(),
  ]);
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => undefined);
  finalUrl = page.url();
  destinationTitle = await page.title();

  const finalPath = normalizePathname(finalUrl);
  const ok = finalPath === expectedPath && finalPath !== sourcePath;

  await page.close();
  await context.close();

  return {
    name: target.name,
    selector: target.selector,
    href,
    expectedPath,
    sourcePath,
    finalUrl,
    finalPath,
    destinationTitle,
    clickableRect: rect
      ? {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        }
      : null,
    ok,
  };
}

async function verifyPublicSmoke(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const response = await page.goto(`${baseUrl}${publicSmokeRoute}`, { waitUntil: "networkidle", timeout: 60000 });

  await page.screenshot({ path: screenshotPath("public-audio-speakers-smoke-1440x900.png"), fullPage: false });
  const title = await page.title();
  await page.close();
  await context.close();

  return {
    route: publicSmokeRoute,
    status: response?.status() || null,
    title,
    screenshot: screenshotPath("public-audio-speakers-smoke-1440x900.png"),
    ok: response?.ok() || false,
  };
}

async function main() {
  await mkdir(path.join(artifactRoot, "screenshots"), { recursive: true });
  await mkdir(path.join(artifactRoot, "videos"), { recursive: true });

  const launchOptions = {
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
    executablePath: existsSync(executablePath) ? executablePath : undefined,
  };
  const browser = await chromium.launch(launchOptions);
  const viewportResults = [];

  for (const viewport of viewports) {
    viewportResults.push(await captureViewport(browser, viewport));
  }

  const reducedMotion = await captureReducedMotion(browser);
  const clickTargets = [
    {
      name: "category primary CTA",
      selector: ".category-film-stage__primary[href='/ru/audio/speakers']",
      expectedHref: "/ru/audio/speakers",
      scrollToStage: true,
    },
    {
      name: "request secondary CTA",
      selector: ".category-film-stage__secondary[href='/ru/request/monolith-reference']",
      expectedHref: "/ru/request/monolith-reference",
      scrollToStage: true,
    },
    {
      name: "product link Monolith",
      selector: ".category-film-stage__products a[href='/ru/products/monolith-reference']",
      expectedHref: "/ru/products/monolith-reference",
      scrollToStage: true,
    },
    {
      name: "display category CTA",
      selector: ".category-film-stage__primary[href='/ru/invisible-display']",
      expectedHref: "/ru/invisible-display",
      sceneIndex: 1,
    },
    {
      name: "display product link",
      selector: ".category-film-stage__products a[href='/ru/products/living-glass-oled']",
      expectedHref: "/ru/products/living-glass-oled",
      sceneIndex: 1,
    },
    {
      name: "display request CTA",
      selector: ".category-film-stage__secondary[href='/ru/request/living-glass-oled']",
      expectedHref: "/ru/request/living-glass-oled",
      sceneIndex: 1,
    },
  ];
  const clickPaths = [];

  for (const target of clickTargets) {
    clickPaths.push(await verifyClickTarget(browser, target));
  }

  const publicSmoke = await verifyPublicSmoke(browser);
  await browser.close();

  const textFitIssues = viewportResults.flatMap((result) => result.textFit.flatMap((scan) => scan.issues));
  const consoleErrors = viewportResults.flatMap((result) => result.consoleErrors);
  const pageErrors = viewportResults.flatMap((result) => result.pageErrors);
  const reducedMotionIssues = reducedMotion.fit.issues;
  const clickPathFailures = clickPaths.filter((result) => !result.ok);
  const viewportOverflowFailures = viewportResults.flatMap((result) =>
    result.textFit.filter((scan) => scan.scrollWidth > scan.clientWidth + 1),
  );

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    route,
    browser: { executablePath, recordVideo },
    artifactRoot,
    screenshots: viewportResults.flatMap((result) => result.screenshots).concat([
      screenshotPath("desktop-products-menu-open-1440x900.png"),
      screenshotPath("mobile-menu-open-390x844.png"),
      reducedMotion.screenshot,
      publicSmoke.screenshot,
    ]),
    videos: viewportResults.map((result) => result.videoPath).filter(Boolean),
    viewportResults,
    reducedMotion,
    clickPaths,
    publicSmoke,
    summary: {
      textFitIssues: textFitIssues.length,
      reducedMotionIssues: reducedMotionIssues.length,
      clickPathFailures: clickPathFailures.length,
      viewportOverflowFailures: viewportOverflowFailures.length,
      consoleErrors: consoleErrors.length,
      pageErrors: pageErrors.length,
      publicSmokeOk: publicSmoke.ok,
      clickPathsOk: clickPathFailures.length === 0,
      textFitOk: textFitIssues.length === 0 && viewportOverflowFailures.length === 0 && reducedMotionIssues.length === 0,
    },
  };

  await writeFile(
    path.join(artifactRoot, "category-product-film-fit-clickpath-qa-report.json"),
    JSON.stringify(report, null, 2),
  );
  await writeFile(
    path.join(artifactRoot, "HUMAN_QA_NOTES.md"),
    [
      "# MNT-SITE-VIS-021 Fit And Click-Path QA",
      "",
      `Route: \`${route}\``,
      `Base URL: \`${baseUrl}\``,
      "",
      "## Browser Evidence",
      "",
      "- Desktop, laptop, tablet and mobile screenshots captured for top, stage and close states.",
      "- Desktop products-menu and mobile menu-open adjacency screenshots captured.",
      "- Desktop and mobile videos captured for scroll-linked motion.",
      "- Reduced-motion state captured and checked.",
      "- Public smoke route `/ru/audio/speakers` captured.",
      "",
      "## Fit Scanner",
      "",
      `- Text/crop/overlap issues: ${textFitIssues.length + reducedMotionIssues.length}.`,
      `- Document horizontal overflow scans: ${viewportOverflowFailures.length}.`,
      "",
      "## Click-Path Scanner",
      "",
      "- Regular user clicks are required to navigate away from the prototype route.",
      "- The scanner fails if `finalPath` remains `/ru/category-product-film-prototype` or differs from the expected href.",
      `- Click-path failures: ${clickPathFailures.length}.`,
      "",
      "## Smoothness",
      "",
      "- Chromium frame observations are recorded per viewport in the JSON report.",
      "- Yandex smoothness is recorded separately when the script is run with `MONTELAR_QA_BROWSER=/usr/bin/yandex-browser-stable`.",
      "",
      "## Result",
      "",
      report.summary.textFitOk && report.summary.clickPathsOk && report.summary.publicSmokeOk
        ? "PASS: no visible text-fit issues, no false-green click paths, no public smoke failure."
        : "FAIL: see JSON report summary and issue arrays.",
      "",
    ].join("\n"),
  );

  const failed =
    textFitIssues.length > 0 ||
    reducedMotionIssues.length > 0 ||
    viewportOverflowFailures.length > 0 ||
    clickPathFailures.length > 0 ||
    consoleErrors.length > 0 ||
    pageErrors.length > 0 ||
    !publicSmoke.ok;

  console.log(
    JSON.stringify(
      {
        artifactRoot,
        summary: report.summary,
        firstTextFitIssue: textFitIssues[0] || reducedMotionIssues[0] || null,
        firstClickPathFailure: clickPathFailures[0] || null,
      },
      null,
      2,
    ),
  );

  if (failed) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
