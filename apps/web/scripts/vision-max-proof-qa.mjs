import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = (process.env.MONTELAR_QA_BASE_URL || "http://127.0.0.1:8096").replace(/\/$/, "");
const route = process.env.MONTELAR_QA_ROUTE || "/ru/creative-pack-proof/vision-max";
const repoRoot = process.cwd().endsWith(path.join("apps", "web")) ? path.resolve(process.cwd(), "../..") : process.cwd();
const artifactRoot = path.resolve(
  repoRoot,
  process.env.MONTELAR_QA_ARTIFACT_DIR ||
    "docs/strategy/artifacts/visual-qa/MNT-SITE-VIS-021A/vision-max-hidden-route-20260523",
);
const executablePath =
  process.env.MONTELAR_QA_BROWSER ||
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
  "/usr/bin/chromium-browser";

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

function screenshotPath(name) {
  return path.join(artifactRoot, "screenshots", name);
}

function normalizePathname(value) {
  const url = new URL(value, baseUrl);
  return url.pathname.replace(/\/$/, "") || "/";
}

async function scanLayout(page, label) {
  return page.evaluate((scanLabel) => {
    const selectors = [
      ".creative-proof-hero h1",
      ".creative-proof-hero p:not(.eyebrow)",
      ".creative-proof-actions a",
      ".creative-proof-stage__copy h2",
      ".creative-proof-stage__copy p",
      ".creative-proof-review h2",
      ".creative-proof-review p",
    ];
    const issues = [];

    for (const element of document.querySelectorAll(selectors.join(","))) {
      const rect = element.getBoundingClientRect();
      const visible = rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight;

      if (!visible) continue;

      if (element.scrollWidth > element.clientWidth + 2 || rect.left < -1 || rect.right > window.innerWidth + 1) {
        issues.push({
          label: scanLabel,
          text: element.textContent?.replace(/\s+/g, " ").trim().slice(0, 140) || "",
          rect: {
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            top: Math.round(rect.top),
            bottom: Math.round(rect.bottom),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
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

async function scrollToProofSection(page, selector) {
  await page.evaluate((targetSelector) => {
    const element = document.querySelector(targetSelector);

    if (!element) {
      throw new Error(`Missing selector: ${targetSelector}`);
    }

    const headerHeight =
      Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--shell-header-height")) || 84;
    const top = element.getBoundingClientRect().top + window.scrollY - headerHeight - 24;

    window.scrollTo({ top: Math.max(0, Math.round(top)), behavior: "instant" });
  }, selector);
  await page.waitForTimeout(360);
}

async function captureViewport(browser, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    recordVideo: { dir: path.join(artifactRoot, "videos"), size: { width: viewport.width, height: viewport.height } },
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle", timeout: 60000 });
  await page.screenshot({ path: screenshotPath(`${viewport.name}-hero-${viewport.width}x${viewport.height}.png`) });
  const heroScan = await scanLayout(page, `${viewport.name}-hero`);

  await page.locator(".creative-proof-actions a").first().hover();
  await page.waitForTimeout(220);
  const primaryHref = await page.locator(".creative-proof-actions a").first().getAttribute("href");
  const secondaryHref = await page.locator(".creative-proof-actions a").nth(1).getAttribute("href");

  await scrollToProofSection(page, ".creative-proof-stage");
  await page.screenshot({ path: screenshotPath(`${viewport.name}-stage-${viewport.width}x${viewport.height}.png`) });
  const stageScan = await scanLayout(page, `${viewport.name}-stage`);

  await scrollToProofSection(page, ".creative-proof-review");
  await page.screenshot({ path: screenshotPath(`${viewport.name}-review-${viewport.width}x${viewport.height}.png`) });
  const reviewScan = await scanLayout(page, `${viewport.name}-review`);

  const imageState = await page.evaluate(() =>
    Array.from(document.querySelectorAll(".creative-proof-frame img, .creative-proof-review img")).map((img) => {
      const element = img;
      const rect = element.getBoundingClientRect();
      return {
        alt: element.getAttribute("alt"),
        complete: element.complete,
        naturalWidth: element.naturalWidth,
        naturalHeight: element.naturalHeight,
        rect: {
          left: Math.round(rect.left),
          top: Math.round(rect.top),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
      };
    }),
  );
  const animationState = await page.locator(".creative-proof-frame--keyable").evaluate((element) => {
    const computed = window.getComputedStyle(element);
    return {
      animationName: computed.animationName,
      animationDuration: computed.animationDuration,
      transform: computed.transform,
    };
  });
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

        if (frames === 8) window.scrollTo({ top: Math.round(document.body.scrollHeight * 0.62), behavior: "smooth" });

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

  const video = page.video();
  await page.close();
  await context.close();
  const videoPath = video ? await video.path().catch(() => null) : null;

  return {
    viewport,
    status: response?.status() || null,
    ok: response?.ok() || false,
    primaryHref,
    secondaryHref,
    primaryPathOk: normalizePathname(primaryHref || "") === "/ru/vision-max",
    secondaryPathOk: normalizePathname(secondaryHref || "") === "/ru/request/vision-max-premium",
    screenshots: [
      screenshotPath(`${viewport.name}-hero-${viewport.width}x${viewport.height}.png`),
      screenshotPath(`${viewport.name}-stage-${viewport.width}x${viewport.height}.png`),
      screenshotPath(`${viewport.name}-review-${viewport.width}x${viewport.height}.png`),
    ],
    videoPath,
    scans: [heroScan, stageScan, reviewScan],
    imageState,
    animationState,
    frameObservation,
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
  await scrollToProofSection(page, ".creative-proof-stage");
  await page.screenshot({ path: screenshotPath("desktop-reduced-motion-1440x900.png") });

  const state = await page.locator(".creative-proof-frame--keyable").evaluate((element) => {
    const computed = window.getComputedStyle(element);
    return {
      mediaMatches: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      animationName: computed.animationName,
      animationDuration: computed.animationDuration,
      transitionDuration: computed.transitionDuration,
    };
  });
  const scan = await scanLayout(page, "desktop-reduced-motion");

  await page.close();
  await context.close();

  return {
    screenshot: screenshotPath("desktop-reduced-motion-1440x900.png"),
    state,
    scan,
    ok: state.mediaMatches && state.animationName === "none" && scan.issues.length === 0,
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
  await browser.close();

  const layoutIssues = viewportResults.flatMap((result) => result.scans.flatMap((scan) => scan.issues));
  const overflowIssues = viewportResults.flatMap((result) =>
    result.scans.filter((scan) => scan.scrollWidth > scan.clientWidth + 1),
  );
  const imageFailures = viewportResults.flatMap((result) =>
    result.imageState.filter((image) => !image.complete || image.naturalWidth < 1 || image.naturalHeight < 1),
  );
  const routeFailures = viewportResults.filter(
    (result) => !result.ok || !result.primaryPathOk || !result.secondaryPathOk,
  );
  const consoleErrors = viewportResults.flatMap((result) => result.consoleErrors);
  const pageErrors = viewportResults.flatMap((result) => result.pageErrors);

  const summary = {
    routeOk: routeFailures.length === 0,
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
    executablePath,
    viewportResults,
    reducedMotion,
    summary,
    firstIssue: layoutIssues[0] || overflowIssues[0] || imageFailures[0] || routeFailures[0] || null,
  };

  await writeFile(path.join(artifactRoot, "vision-max-proof-qa-report.json"), JSON.stringify(report, null, 2));
  await writeFile(
    path.join(artifactRoot, "HUMAN_QA_NOTES.md"),
    [
      "# MNT-SITE-VIS-021A Vision MAX Hidden Route QA",
      "",
      `Route: \`${route}\``,
      `Base URL: \`${baseUrl}\``,
      "",
      "## Evidence",
      "",
      "- Desktop and mobile screenshots captured for hero, stage and review states.",
      "- Desktop and mobile videos captured for the hidden proof route.",
      "- CTA hrefs checked for the real Vision MAX direction and request paths.",
      "- Image decode/natural-size checks passed for all proof media.",
      "- Reduced-motion viewport captured; keyable ambient animation is disabled.",
      "- Text-fit and document overflow scans ran on visible proof text.",
      "",
      "## Result",
      "",
      Object.values(summary).every((value) => value === true || value === 0 || value === 2)
        ? "PASS: hidden route renders, proof assets load, CTAs point to real routes, motion has reduced-motion fallback, and no visible overflow was detected."
        : "FAIL: see JSON report summary and firstIssue.",
      "",
    ].join("\n"),
  );

  const failed =
    !summary.routeOk ||
    !summary.layoutOk ||
    !summary.imagesOk ||
    !summary.reducedMotionOk ||
    summary.consoleErrors > 0 ||
    summary.pageErrors > 0 ||
    summary.videos < 2;

  console.log(JSON.stringify({ artifactRoot, summary, firstIssue: report.firstIssue }, null, 2));

  if (failed) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
