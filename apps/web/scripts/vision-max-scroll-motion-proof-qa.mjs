import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = (process.env.MONTELAR_QA_BASE_URL || "http://127.0.0.1:8096").replace(/\/$/, "");
const route = process.env.MONTELAR_QA_ROUTE || "/ru/creative-pack-proof/vision-max-scroll-motion";
const repoRoot = process.cwd().endsWith(path.join("apps", "web")) ? path.resolve(process.cwd(), "../..") : process.cwd();
const artifactRoot = path.resolve(
  repoRoot,
  process.env.MONTELAR_QA_ARTIFACT_DIR ||
    "docs/strategy/artifacts/visual-qa/MNT-SITE-VIS-021A/vision-max-scroll-motion-hidden-route-20260523",
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
      ".creative-proof-motion-brief h2",
      ".creative-proof-motion-brief p",
      ".scroll-frame-sequence__readout strong",
      ".scroll-frame-sequence__readout p",
      ".creative-proof-review h2",
      ".creative-proof-review p",
    ];
    const issues = [];

    for (const element of document.querySelectorAll(selectors.join(","))) {
      const rect = element.getBoundingClientRect();
      const visible = rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight;

      if (!visible) continue;

      if (
        element.scrollWidth > element.clientWidth + 2 ||
        rect.left < -1 ||
        rect.right > window.innerWidth + 1 ||
        rect.bottom > window.innerHeight + 1
      ) {
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

async function scrollToSelector(page, selector, offset = 24) {
  await page.evaluate(
    ({ targetSelector, topOffset }) => {
      const element = document.querySelector(targetSelector);

      if (!element) {
        throw new Error(`Missing selector: ${targetSelector}`);
      }

      const headerHeight =
        Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--shell-header-height")) || 84;
      const top = element.getBoundingClientRect().top + window.scrollY - headerHeight - topOffset;

      window.scrollTo({ top: Math.max(0, Math.round(top)), behavior: "instant" });
    },
    { targetSelector: selector, topOffset: offset },
  );
  await page.waitForTimeout(520);
}

async function observeCanvas(page) {
  return page.evaluate(async () => {
    const stage = document.querySelector(".scroll-frame-sequence__stage");
    const canvas = document.querySelector(".scroll-frame-sequence__canvas");
    const readout = document.querySelector(".scroll-frame-sequence__readout strong");

    if (!(stage instanceof HTMLElement) || !(canvas instanceof HTMLCanvasElement)) {
      return { ok: false, reason: "missing-stage-or-canvas" };
    }

    const waitForReady = async () => {
      const start = performance.now();
      while (!stage.classList.contains("is-ready") && performance.now() - start < 8000) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    };

    const sampleCanvas = () => {
      const context = canvas.getContext("2d");
      if (!context || canvas.width < 1 || canvas.height < 1) {
        return { nonTransparent: 0, width: canvas.width, height: canvas.height };
      }

      const sample = context.getImageData(
        Math.max(0, Math.floor(canvas.width * 0.35)),
        Math.max(0, Math.floor(canvas.height * 0.28)),
        Math.max(1, Math.floor(canvas.width * 0.3)),
        Math.max(1, Math.floor(canvas.height * 0.34)),
      ).data;
      let nonTransparent = 0;

      for (let index = 3; index < sample.length; index += 4) {
        if (sample[index] > 4) nonTransparent += 1;
      }

      return { nonTransparent, width: canvas.width, height: canvas.height };
    };

    await waitForReady();
    const firstTitle = readout?.textContent?.trim() || "";
    const firstSample = sampleCanvas();
    const section = document.querySelector(".scroll-frame-sequence");
    const rect = section?.getBoundingClientRect();
    const targetY = rect ? window.scrollY + rect.top + rect.height * 0.78 : document.body.scrollHeight * 0.58;

    window.scrollTo({ top: Math.round(targetY), behavior: "smooth" });
    await new Promise((resolve) => setTimeout(resolve, 1400));

    const secondTitle = readout?.textContent?.trim() || "";
    const secondSample = sampleCanvas();

    return {
      ok:
        stage.classList.contains("is-ready") &&
        firstSample.nonTransparent > 100 &&
        secondSample.nonTransparent > 100 &&
        firstTitle !== secondTitle,
      stageReady: stage.classList.contains("is-ready"),
      firstTitle,
      secondTitle,
      firstSample,
      secondSample,
    };
  });
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

  await scrollToSelector(page, ".scroll-frame-sequence", viewport.name === "desktop" ? 0 : 12);
  await page.screenshot({ path: screenshotPath(`${viewport.name}-motion-start-${viewport.width}x${viewport.height}.png`) });
  const canvasObservation = await observeCanvas(page);
  await page.screenshot({ path: screenshotPath(`${viewport.name}-motion-end-${viewport.width}x${viewport.height}.png`) });
  const motionScan = await scanLayout(page, `${viewport.name}-motion`);

  await scrollToSelector(page, ".creative-proof-review");
  await page.screenshot({ path: screenshotPath(`${viewport.name}-review-${viewport.width}x${viewport.height}.png`) });
  const reviewScan = await scanLayout(page, `${viewport.name}-review`);

  const imageState = await page.evaluate(() =>
    Array.from(document.querySelectorAll(".scroll-frame-sequence__poster, .creative-proof-review img")).map((img) => {
      const element = img;
      return {
        alt: element.getAttribute("alt"),
        complete: element.complete,
        naturalWidth: element.naturalWidth,
        naturalHeight: element.naturalHeight,
      };
    }),
  );
  const frameState = await page.locator(".scroll-frame-sequence__stage").evaluate((element) => ({
    frameBasePath: element.getAttribute("data-frame-base-path"),
    frameCount: Number(element.getAttribute("data-frame-count") || 0),
    frameFit: element.getAttribute("data-frame-fit"),
    ready: element.classList.contains("is-ready"),
  }));

  const video = page.video();
  await page.close();
  await context.close();

  return {
    viewport,
    status: response?.status() || null,
    ok: response?.ok() || false,
    primaryHref,
    secondaryHref,
    primaryPathOk: normalizePathname(primaryHref || "") === "/ru/creative-pack-proof/vision-max",
    secondaryPathOk: normalizePathname(secondaryHref || "") === "/ru/request/vision-max-premium",
    screenshots: [
      screenshotPath(`${viewport.name}-hero-${viewport.width}x${viewport.height}.png`),
      screenshotPath(`${viewport.name}-motion-start-${viewport.width}x${viewport.height}.png`),
      screenshotPath(`${viewport.name}-motion-end-${viewport.width}x${viewport.height}.png`),
      screenshotPath(`${viewport.name}-review-${viewport.width}x${viewport.height}.png`),
    ],
    videoPath: video ? await video.path().catch(() => null) : null,
    scans: [heroScan, motionScan, reviewScan],
    imageState,
    frameState,
    canvasObservation,
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
  await scrollToSelector(page, ".scroll-frame-sequence", 0);
  await page.screenshot({ path: screenshotPath("desktop-reduced-motion-1440x900.png") });

  const state = await page.locator(".scroll-frame-sequence").evaluate((element) => {
    const canvas = element.querySelector(".scroll-frame-sequence__canvas");
    const stage = element.querySelector(".scroll-frame-sequence__stage");
    const computed = window.getComputedStyle(element);
    return {
      mediaMatches: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      sectionHeight: Math.round(element.getBoundingClientRect().height),
      minHeight: computed.minHeight,
      canvasReady: canvas?.classList.contains("is-ready") || false,
      stageReady: stage?.classList.contains("is-ready") || false,
    };
  });
  const scan = await scanLayout(page, "desktop-reduced-motion");

  await page.close();
  await context.close();

  return {
    screenshot: screenshotPath("desktop-reduced-motion-1440x900.png"),
    state,
    scan,
    ok: state.mediaMatches && state.sectionHeight >= 500 && state.stageReady && scan.issues.length === 0,
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
  const frameFailures = viewportResults.filter(
    (result) =>
      result.frameState.frameCount !== 48 ||
      !result.frameState.ready ||
      result.frameState.frameFit !== "cover" ||
      !result.canvasObservation.ok,
  );
  const consoleErrors = viewportResults.flatMap((result) => result.consoleErrors);
  const pageErrors = viewportResults.flatMap((result) => result.pageErrors);

  const summary = {
    routeOk: routeFailures.length === 0,
    layoutOk: layoutIssues.length === 0 && overflowIssues.length === 0,
    imagesOk: imageFailures.length === 0,
    frameSequenceOk: frameFailures.length === 0,
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
    firstIssue:
      layoutIssues[0] ||
      overflowIssues[0] ||
      imageFailures[0] ||
      routeFailures[0] ||
      frameFailures[0] ||
      null,
  };

  await writeFile(path.join(artifactRoot, "vision-max-scroll-motion-proof-qa-report.json"), JSON.stringify(report, null, 2));
  await writeFile(
    path.join(artifactRoot, "HUMAN_QA_NOTES.md"),
    [
      "# MNT-SITE-VIS-021A Vision MAX Scroll-Motion Hidden Route QA",
      "",
      `Route: \`${route}\``,
      `Base URL: \`${baseUrl}\``,
      "",
      "## Evidence",
      "",
      "- Desktop and mobile screenshots captured for hero, motion start, motion end and review states.",
      "- Desktop and mobile videos captured while the scroll-controlled canvas advanced through the sequence.",
      "- CTA hrefs checked for the static proof route and Vision MAX request path.",
      "- Poster and contact-sheet image decode/natural-size checks passed.",
      "- Canvas pixel sampling confirmed nonblank frame rendering, and readout text changed after scroll.",
      "- Reduced-motion viewport captured with a stable frame-sequence section.",
      "- Text-fit and document overflow scans ran on visible proof text.",
      "",
      "## Result",
      "",
      Object.values(summary).every((value) => value === true || value === 0 || value === 2)
        ? "PASS: hidden scroll-motion route renders, frame sequence advances, proof assets load, CTAs point to real routes, reduced-motion fallback applies, and no visible overflow was detected."
        : "FAIL: see JSON report summary and firstIssue.",
      "",
    ].join("\n"),
  );

  console.log(JSON.stringify({ artifactRoot, summary, firstIssue: report.firstIssue }, null, 2));

  const failed =
    !summary.routeOk ||
    !summary.layoutOk ||
    !summary.imagesOk ||
    !summary.frameSequenceOk ||
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
