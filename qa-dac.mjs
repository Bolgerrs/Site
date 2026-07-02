import { chromium } from 'playwright';

const URL = process.env.QA_URL || 'http://127.0.0.1:8096/products/dac';
const OUT = process.env.QA_OUT || '/root/montelar-contour-work/qa-out';
import { mkdirSync } from 'fs';
mkdirSync(OUT, { recursive: true });

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let total = 0;
      const step = 400;
      const timer = setInterval(() => {
        window.scrollBy(0, step);
        total += step;
        if (total >= document.body.scrollHeight + 1200) {
          clearInterval(timer);
          resolve();
        }
      }, 120);
    });
  });
  await page.waitForTimeout(800);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
}

async function run(name, vw, vh) {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: vw, height: vh } });
  const errors = [];
  const failed = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('requestfailed', (r) => failed.push(r.url()));
  const resp = await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await autoScroll(page);
  // overflow check
  const overflow = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
    bodyH: document.body.scrollHeight,
  }));
  // broken images
  const brokenImgs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('img'))
      .filter((i) => i.complete && i.naturalWidth === 0)
      .map((i) => i.currentSrc || i.src)
  );
  await page.screenshot({ path: `${OUT}/${name}-full.png`, fullPage: true });
  console.log(JSON.stringify({
    name, status: resp.status(), vw,
    scrollW: overflow.scrollW, clientW: overflow.clientW,
    overflow: overflow.scrollW - overflow.clientW,
    bodyH: overflow.bodyH,
    consoleErrors: errors.slice(0, 8),
    failedReq: failed.slice(0, 8),
    brokenImgs,
  }, null, 2));
  await browser.close();
}

await run('desktop', 1440, 900);
await run('mobile', 390, 844);
console.log('QA DONE');
