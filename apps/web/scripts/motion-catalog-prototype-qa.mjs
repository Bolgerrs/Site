import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = (process.env.MONTELAR_QA_BASE_URL || "http://127.0.0.1:8093").replace(/\/$/, "");
const repoRoot = process.cwd().endsWith(path.join("apps", "web")) ? path.resolve(process.cwd(), "../..") : process.cwd();
const artifactRoot = process.env.MONTELAR_QA_ARTIFACT_DIR
  ? path.isAbsolute(process.env.MONTELAR_QA_ARTIFACT_DIR)
    ? process.env.MONTELAR_QA_ARTIFACT_DIR
    : path.resolve(repoRoot, process.env.MONTELAR_QA_ARTIFACT_DIR)
  : path.resolve(repoRoot, "docs/strategy/artifacts/visual-modernization-2026-05-14/MNT-SITE-VIS-016/after");
const executablePath =
  process.env.MONTELAR_QA_BROWSER ||
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
  "/usr/bin/chromium-browser";

const route = process.env.MONTELAR_QA_ROUTE || "/ru/motion-catalog-prototype";
const interactionRoutes = Array.from(new Set([route, "/en/motion-catalog-prototype"]));

const viewports = [
  { name: "desktop", width: 1440, height: 900, video: true },
  { name: "mobile", width: 390, height: 844, video: true },
  { name: "laptop", width: 1366, height: 768, video: false },
  { name: "tablet", width: 768, height: 1024, video: false },
];

async function measureViewport(page) {
  return page.evaluate(() => {
    const overflowElements = Array.from(document.querySelectorAll("body *"))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          className: element.className?.toString?.() || element.tagName,
          tagName: element.tagName,
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        };
      })
      .filter((rect) => rect.width > 0 && (rect.left < -1 || rect.right > window.innerWidth + 1))
      .slice(0, 20);

    return {
      title: document.title,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      overflowElements,
      activeLabel: document.querySelector(".motion-catalog__rail-button[aria-current='true'] strong")?.textContent?.trim() || null,
      reducedMotionActive: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    };
  });
}

async function frameObservation(page) {
  return page.evaluate(async () => {
    let frames = 0;
    let maxDelta = 0;
    let previous = performance.now();
    const start = previous;

    return new Promise((resolve) => {
      function tick(now) {
        frames += 1;
        maxDelta = Math.max(maxDelta, now - previous);
        previous = now;

        if (now - start >= 1200) {
          resolve({ frames, durationMs: Math.round(now - start), maxDeltaMs: Math.round(maxDelta) });
          return;
        }

        requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    });
  });
}

async function captureCase(browser, viewport) {
  const videoDir = path.join(artifactRoot, "videos");
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    recordVideo: viewport.video ? { dir: videoDir, size: { width: viewport.width, height: viewport.height } } : undefined,
  });
  const page = await context.newPage();
  const shotsDir = path.join(artifactRoot, "screenshots");

  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(shotsDir, `${viewport.name}-${viewport.width}x${viewport.height}-top.png`), fullPage: false });

  await page.mouse.wheel(0, Math.round(viewport.height * 1.4));
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(shotsDir, `${viewport.name}-${viewport.width}x${viewport.height}-scroll.png`), fullPage: false });

  const state = await measureViewport(page);
  const observation = await frameObservation(page);

  await page.close();
  let videoPath = null;

  if (viewport.video) {
    const video = page.video();
    videoPath = video ? await video.path() : null;
  }

  await context.close();

  return {
    viewport,
    route,
    screenshots: [
      path.join(shotsDir, `${viewport.name}-${viewport.width}x${viewport.height}-top.png`),
      path.join(shotsDir, `${viewport.name}-${viewport.width}x${viewport.height}-scroll.png`),
    ],
    videoPath,
    state,
    observation,
  };
}

async function captureReducedMotion(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const shotsDir = path.join(artifactRoot, "screenshots");

  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(shotsDir, "desktop-reduced-motion-1440x900.png"), fullPage: false });
  const state = await measureViewport(page);

  await page.close();
  await context.close();

  return {
    viewport: { name: "desktop-reduced-motion", width: 1440, height: 900 },
    route,
    screenshots: [path.join(shotsDir, "desktop-reduced-motion-1440x900.png")],
    state,
  };
}

async function captureInteractionPath(browser, routePath) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  const shotsDir = path.join(artifactRoot, "screenshots");
  const targetButton = page.locator(".motion-catalog__rail-button[data-motion-catalog-direction='glass']");
  const activeLink = page.locator(".motion-catalog__copy .motion-catalog__link");

  await page.goto(`${baseUrl}${routePath}`, { waitUntil: "networkidle" });
  await page.mouse.wheel(0, 1260);
  await page.waitForTimeout(650);

  await targetButton.hover();
  await page.waitForTimeout(260);
  await page.screenshot({
    path: path.join(shotsDir, `interaction-${routePath.split("/")[1]}-hover-glass-1440x900.png`),
    fullPage: false,
  });

  const hoverState = await page.evaluate(() => {
    const link = document.querySelector(".motion-catalog__copy .motion-catalog__link");
    const rect = link?.getBoundingClientRect();

    return {
      activeDirection: document.querySelector(".motion-catalog__rail-button[aria-current='true']")?.getAttribute("data-motion-catalog-direction") || null,
      activeLabel: document.querySelector(".motion-catalog__rail-button[aria-current='true'] strong")?.textContent?.trim() || null,
      ctaHref: link?.getAttribute("href") || null,
      ctaText: link?.textContent?.trim() || null,
      ctaRect: rect
        ? {
            top: Math.round(rect.top),
            bottom: Math.round(rect.bottom),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
          }
        : null,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };
  });

  await targetButton.focus();
  await page.waitForTimeout(260);
  await page.screenshot({
    path: path.join(shotsDir, `interaction-${routePath.split("/")[1]}-keyboard-focus-1440x900.png`),
    fullPage: false,
  });

  const focusState = await page.evaluate(() => {
    const focused = document.activeElement;

    return {
      focusedDirection: focused?.getAttribute("data-motion-catalog-direction") || null,
      activeDirection: document.querySelector(".motion-catalog__rail-button[aria-current='true']")?.getAttribute("data-motion-catalog-direction") || null,
      focusedText: focused?.textContent?.trim() || null,
    };
  });

  const linkBox = await activeLink.boundingBox();

  if (linkBox) {
    await Promise.all([
      page.waitForURL(`**${hoverState.ctaHref}`, { timeout: 5000 }),
      page.mouse.click(linkBox.x + linkBox.width / 2, linkBox.y + linkBox.height / 2),
    ]);
  }

  await page.waitForLoadState("networkidle");
  const clickedUrl = page.url();

  await page.close();
  await context.close();

  return {
    route: routePath,
    hoverState,
    focusState,
    clickedUrl,
    expectedHref: hoverState.ctaHref,
    screenshots: [
      path.join(shotsDir, `interaction-${routePath.split("/")[1]}-hover-glass-1440x900.png`),
      path.join(shotsDir, `interaction-${routePath.split("/")[1]}-keyboard-focus-1440x900.png`),
    ],
  };
}

async function main() {
  await mkdir(path.join(artifactRoot, "screenshots"), { recursive: true });
  await mkdir(path.join(artifactRoot, "videos"), { recursive: true });

  const launchOptions = {
    headless: true,
    executablePath: existsSync(executablePath) ? executablePath : undefined,
  };
  const browser = await chromium.launch(launchOptions);
  const results = [];

  for (const viewport of viewports) {
    results.push(await captureCase(browser, viewport));
  }

  results.push(await captureReducedMotion(browser));
  const interactionPaths = [];

  for (const interactionRoute of interactionRoutes) {
    interactionPaths.push(await captureInteractionPath(browser, interactionRoute));
  }

  await browser.close();

  const failures = results.flatMap((result) => {
    const resultFailures = [];

    if (result.state.scrollWidth > result.state.clientWidth + 1) {
      resultFailures.push(`${result.viewport.name}: horizontal overflow ${result.state.scrollWidth}/${result.state.clientWidth}`);
    }

    if (result.state.overflowElements.length > 0) {
      resultFailures.push(`${result.viewport.name}: overflowing elements ${result.state.overflowElements.map((item) => item.className).join(", ")}`);
    }

    return resultFailures;
  });

  for (const interactionPath of interactionPaths) {
    if (interactionPath.hoverState.activeDirection !== "glass") {
      failures.push(`${interactionPath.route}: hover did not activate glass direction`);
    }

    if (!interactionPath.hoverState.ctaRect || interactionPath.hoverState.ctaRect.bottom > interactionPath.hoverState.viewport.height || interactionPath.hoverState.ctaRect.top < 0) {
      failures.push(`${interactionPath.route}: active CTA is not reachable in viewport`);
    }

    if (interactionPath.focusState.focusedDirection !== "glass" || interactionPath.focusState.activeDirection !== "glass") {
      failures.push(`${interactionPath.route}: keyboard focus did not preserve glass active state`);
    }

    if (!interactionPath.expectedHref || !interactionPath.clickedUrl.includes(interactionPath.expectedHref)) {
      failures.push(`${interactionPath.route}: CTA click did not navigate to ${interactionPath.expectedHref}`);
    }
  }

  const report = {
    baseUrl,
    route,
    artifactRoot,
    generatedAt: new Date().toISOString(),
    results,
    interactionPaths,
    failures,
  };

  await writeFile(path.join(artifactRoot, "motion-catalog-prototype-report.json"), JSON.stringify(report, null, 2));

  if (failures.length > 0) {
    console.error(failures.join("\n"));
    process.exit(1);
  }

  console.log(`motion-catalog-qa: ok, results=${results.length}, artifactRoot=${artifactRoot}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
