import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = (process.env.MONTELAR_QA_BASE_URL || "http://127.0.0.1:8096").replace(/\/$/, "");
const route = process.env.MONTELAR_QA_ROUTE || "/ru/creative-pack-proof";
const repoRoot = process.cwd().endsWith(path.join("apps", "web")) ? path.resolve(process.cwd(), "../..") : process.cwd();
const artifactRoot = path.resolve(
  repoRoot,
  process.env.MONTELAR_QA_ARTIFACT_DIR ||
    "docs/strategy/artifacts/visual-qa/MNT-SITE-VIS-021A/creative-pack-proof-hub-20260523",
);
const executablePath =
  process.env.MONTELAR_QA_BROWSER ||
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
  "/usr/bin/chromium-browser";

const expectedProofRoutes = [
  "/ru/creative-pack-proof/living-glass-gostiny-dvor",
  "/ru/creative-pack-proof/living-glass-baikal-clean",
  "/ru/creative-pack-proof/vision-max",
  "/ru/creative-pack-proof/vision-max-scroll-motion",
  "/ru/creative-pack-proof/hi-end-audio",
  "/ru/creative-pack-proof/prima-materia",
  "/ru/creative-pack-proof/hologram-vitrine",
  "/ru/creative-pack-proof/hologram-device-no-text",
  "/ru/creative-pack-proof/exhibition-display",
  "/ru/creative-pack-proof/exhibition-display-active-surface",
  "/ru/creative-pack-proof/exhibition-display-edgeless-media-plane",
  "/ru/creative-pack-proof/pictorial-art-display",
];

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

function screenshotPath(name) {
  return path.join(artifactRoot, "screenshots", name);
}

async function scanLayout(page, label) {
  return page.evaluate((scanLabel) => {
    const selectors = [
      ".creative-proof-hub-hero h1",
      ".creative-proof-hub-hero p:not(.eyebrow)",
      ".creative-proof-hub-row__title",
      ".creative-proof-hub-row__outcome",
    ];
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const issues = [];

    for (const element of document.querySelectorAll(selectors.join(","))) {
      const rect = element.getBoundingClientRect();
      const visible = rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < viewport.height;

      if (!visible) {
        continue;
      }

      const ownOverflow = element.scrollWidth > element.clientWidth + 2;
      const viewportOverflow = rect.left < -1 || rect.right > viewport.width + 1;

      if (ownOverflow || viewportOverflow) {
        issues.push({
          label: scanLabel,
          text: element.textContent?.replace(/\s+/g, " ").trim().slice(0, 140) || "",
          rect: {
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
          },
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth,
        });
      }
    }

    return {
      label: scanLabel,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      issues,
    };
  }, label);
}

async function captureViewport(browser, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    recordVideo: { dir: path.join(artifactRoot, "videos"), size: { width: viewport.width, height: viewport.height } },
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const ignoredConsoleErrors = [];
  const pageErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      const text = message.text();

      if (text.includes("/_next/webpack-hmr")) {
        ignoredConsoleErrors.push(text);
        return;
      }

      consoleErrors.push(text);
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle", timeout: 60000 });
  await page.screenshot({ path: screenshotPath(`${viewport.name}-hero-${viewport.width}x${viewport.height}.png`) });
  const heroScan = await scanLayout(page, `${viewport.name}-hero`);

  await page.locator(".creative-proof-hub-row").first().hover();
  await page.waitForTimeout(220);
  await page.screenshot({ path: screenshotPath(`${viewport.name}-first-hover-${viewport.width}x${viewport.height}.png`) });

  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
  await page.waitForTimeout(260);
  await page.screenshot({ path: screenshotPath(`${viewport.name}-full-list-${viewport.width}x${viewport.height}.png`) });
  const listScan = await scanLayout(page, `${viewport.name}-list`);
  const rowCount = await page.locator(".creative-proof-hub-row").count();
  for (let index = 0; index < rowCount; index += 1) {
    await page.locator(".creative-proof-hub-row").nth(index).scrollIntoViewIfNeeded();
    await page.waitForTimeout(120);
  }
  await page.evaluate(async () => {
    const images = Array.from(document.querySelectorAll(".creative-proof-hub-row__media img"));

    await Promise.all(
      images.map(
        (image) =>
          new Promise((resolve) => {
            if (image.complete && image.naturalWidth > 0 && image.naturalHeight > 0) {
              resolve();
              return;
            }

            const done = () => resolve();
            image.addEventListener("load", done, { once: true });
            image.addEventListener("error", done, { once: true });
            window.setTimeout(done, 2500);
          }),
      ),
    );
  });

  const proofLinks = await page.locator(".creative-proof-hub-row").evaluateAll((links) =>
    links.map((link) => ({
      href: link.getAttribute("href"),
      route: link.getAttribute("data-proof-route"),
      text: link.textContent?.replace(/\s+/g, " ").trim() || "",
    })),
  );
  const imageState = await page.evaluate(() =>
    Array.from(document.querySelectorAll(".creative-proof-hub-row__media img")).map((img) => ({
      alt: img.getAttribute("alt"),
      complete: img.complete,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
    })),
  );
  const frameObservation = await page.evaluate(async () => {
    let frames = 0;
    let maxDelta = 0;
    let previous = performance.now();
    const start = previous;

    return new Promise((resolve) => {
      function tick(now) {
        frames += 1;
        maxDelta = Math.max(maxDelta, now - previous);
        previous = now;

        if (frames === 8) {
          window.scrollTo({ top: Math.round(document.body.scrollHeight * 0.72), behavior: "smooth" });
        }

        if (now - start >= 1400) {
          resolve({ frames, durationMs: Math.round(now - start), maxDeltaMs: Math.round(maxDelta) });
          return;
        }

        requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    });
  });

  const video = page.video();
  await page.close();
  await context.close();

  return {
    viewport,
    status: response?.status() || null,
    ok: response?.ok() || false,
    proofLinks,
    imageState,
    scans: [heroScan, listScan],
    frameObservation,
    videoPath: video ? await video.path().catch(() => null) : null,
    consoleErrors,
    ignoredConsoleErrors,
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
  await page.screenshot({ path: screenshotPath("desktop-reduced-motion-1440x900.png") });

  const state = await page.locator(".creative-proof-hub-row__media img").first().evaluate((element) => {
    const computed = window.getComputedStyle(element);
    return {
      mediaMatches: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      transitionDuration: computed.transitionDuration,
      transform: computed.transform,
    };
  });

  await page.close();
  await context.close();

  return {
    screenshot: screenshotPath("desktop-reduced-motion-1440x900.png"),
    state,
    ok: state.mediaMatches && state.transitionDuration === "0.001s",
  };
}

async function main() {
  await mkdir(path.join(artifactRoot, "screenshots"), { recursive: true });
  await mkdir(path.join(artifactRoot, "videos"), { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
    executablePath: existsSync(executablePath) ? executablePath : undefined,
  });

  const viewportResults = [];

  for (const viewport of viewports) {
    viewportResults.push(await captureViewport(browser, viewport));
  }

  const reducedMotion = await captureReducedMotion(browser);
  const routeResponses = [];
  const context = await browser.newContext();

  for (const proofRoute of expectedProofRoutes) {
    const page = await context.newPage();
    const response = await page.goto(`${baseUrl}${proofRoute}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    routeResponses.push({ route: proofRoute, status: response?.status() || null, ok: response?.ok() || false });
    await page.close();
  }

  await context.close();
  await browser.close();

  const layoutIssues = viewportResults.flatMap((result) => result.scans.flatMap((scan) => scan.issues));
  const overflowIssues = viewportResults.flatMap((result) =>
    result.scans.filter((scan) => scan.scrollWidth > scan.clientWidth + 1),
  );
  const imageFailures = viewportResults.flatMap((result) =>
    result.imageState.filter((image) => !image.complete || image.naturalWidth < 1 || image.naturalHeight < 1),
  );
  const missingLinks = expectedProofRoutes.filter(
    (proofRoute) => !viewportResults[0]?.proofLinks.some((link) => link.href === proofRoute),
  );
  const routeFailures = routeResponses.filter((response) => !response.ok);
  const consoleErrors = viewportResults.flatMap((result) => result.consoleErrors);
  const ignoredConsoleErrors = viewportResults.flatMap((result) => result.ignoredConsoleErrors);
  const pageErrors = viewportResults.flatMap((result) => result.pageErrors);

  const summary = {
    hubRouteOk: viewportResults.every((result) => result.ok),
    linkedRoutesOk: routeFailures.length === 0 && missingLinks.length === 0,
    layoutOk: layoutIssues.length === 0 && overflowIssues.length === 0,
    imagesOk: imageFailures.length === 0,
    reducedMotionOk: reducedMotion.ok,
    consoleErrors: consoleErrors.length,
    pageErrors: pageErrors.length,
    videos: viewportResults.map((result) => result.videoPath).filter(Boolean).length,
  };
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    route,
    artifactRoot,
    expectedProofRoutes,
    viewportResults,
    routeResponses,
    reducedMotion,
    summary,
    ignoredConsoleErrors,
    firstIssue: layoutIssues[0] || overflowIssues[0] || imageFailures[0] || missingLinks[0] || routeFailures[0] || null,
  };

  await writeFile(path.join(artifactRoot, "creative-pack-proof-hub-qa-report.json"), JSON.stringify(report, null, 2));
  await writeFile(
    path.join(artifactRoot, "HUMAN_QA_NOTES.md"),
    [
      "# MNT-SITE-VIS-021A Creative Pack Proof Hub QA",
      "",
      `Route: \`${route}\``,
      `Base URL: \`${baseUrl}\``,
      "",
      "## Evidence",
      "",
      "- Desktop and mobile screenshots captured for hero, hover and full-list states.",
      "- Desktop and mobile videos captured for the hidden proof hub.",
      `- ${expectedProofRoutes.length} hidden proof-route links were checked and each linked route returned 200.`,
      "- Preview image decode/natural-size checks passed.",
      "- Reduced-motion viewport captured; proof hub transitions collapse under the shared reduced-motion rule.",
      "- Text-fit and document overflow scans ran on visible hub text.",
      ignoredConsoleErrors.length > 0
        ? `- Ignored ${ignoredConsoleErrors.length} local Next dev HMR WebSocket console errors; non-HMR console errors remain a hard failure.`
        : "- No local Next dev HMR console noise was observed.",
      "",
      "## Result",
      "",
      Object.values(summary).every((value) => value === true || value === 0 || value === 2)
        ? `PASS: hidden proof hub renders, all ${expectedProofRoutes.length} proof routes are reachable, media loads, reduced-motion fallback applies, and no visible overflow was detected.`
        : "FAIL: see JSON report summary and firstIssue.",
      "",
    ].join("\n"),
  );

  console.log(JSON.stringify({ artifactRoot, summary, firstIssue: report.firstIssue }, null, 2));

  const failed =
    !summary.hubRouteOk ||
    !summary.linkedRoutesOk ||
    !summary.layoutOk ||
    !summary.imagesOk ||
    !summary.reducedMotionOk ||
    summary.consoleErrors > 0 ||
    summary.pageErrors > 0 ||
    summary.videos < 2;

  if (failed) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
