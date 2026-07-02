import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = process.env.QA_BASE || 'http://127.0.0.1:8096';
const OUT = process.env.QA_OUT || '/root/qa-v8';
mkdirSync(OUT, { recursive: true });

const EXEC = '/usr/bin/google-chrome';

const BREAKS = [
  { name: '360', w: 360, h: 800 },
  { name: '390', w: 390, h: 844 },
  { name: '414', w: 414, h: 896 },
  { name: '768', w: 768, h: 1024 },
  { name: '1024', w: 1024, h: 768 },
  { name: '1280', w: 1280, h: 800 },
  { name: '1440', w: 1440, h: 900 },
  { name: '1920', w: 1920, h: 1080 },
  { name: '2560', w: 2560, h: 1440 },
];

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((res) => {
      let total = 0; const step = 500;
      const t = setInterval(() => {
        window.scrollBy(0, step); total += step;
        if (total >= document.body.scrollHeight + 1500) { clearInterval(t); res(); }
      }, 90);
    });
  });
  await page.waitForTimeout(700);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
}

async function audit(ctx, label, url, w, h, opts = {}) {
  const page = await ctx.newPage();
  await page.setViewportSize({ width: w, height: h });
  const errors = []; const failed = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  page.on('requestfailed', (r) => failed.push(r.url()));
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await autoScroll(page);

  const data = await page.evaluate(() => {
    const de = document.documentElement;
    // images under the v8 landing
    const imgs = [...document.querySelectorAll('.dac-lp2-v8 img, .dac-lp2 img')];
    const broken = imgs.filter((i) => !i.complete || i.naturalWidth === 0)
      .map((i) => i.currentSrc || i.src);
    const imgCount = imgs.length;
    // reduced-motion opacity:0 trap
    const zeroOpacity = [...document.querySelectorAll('.dac-lp2-v8 *')]
      .filter((el) => {
        const o = parseFloat(getComputedStyle(el).opacity);
        return o === 0 && el.offsetParent !== null;
      }).length;
    // callout dots present
    const callouts = document.querySelectorAll('.dac-lp2-callout-dot, .dac-lp2-callout-badge').length;
    // any element wider than viewport (overflow source)
    const vw = de.clientWidth;
    let widest = null;
    for (const el of document.querySelectorAll('.dac-lp2-v8 *')) {
      const r = el.getBoundingClientRect();
      if (r.right > vw + 2 && r.width <= vw + 60) {
        if (!widest || r.right > widest.right) {
          widest = { right: Math.round(r.right), cls: el.className?.toString?.().slice(0, 60) || el.tagName };
        }
      }
    }
    return {
      scrollW: de.scrollWidth, clientW: de.clientWidth,
      bodyText: document.body.innerText.slice(0, 0),
      imgCount, broken, zeroOpacity, callouts, widest,
    };
  });
  const overflow = data.scrollW - data.clientW;
  await page.screenshot({ path: `${OUT}/${label}.png`, fullPage: !!opts.full }).catch(() => {});
  await page.close();
  return { label, w, h, overflow, errors, failed: failed.filter((u) => !u.includes('favicon')), ...data };
}

(async () => {
  const results = [];
  // 1) default (EN) breakpoints
  const b1 = await chromium.launch({ executablePath: EXEC, args: ['--use-angle=swiftshader'] });
  const c1 = await b1.newContext();
  for (const bp of BREAKS) {
    results.push(await audit(c1, `en-${bp.name}`, `${BASE}/products/dac`, bp.w, bp.h, { full: bp.name === '390' || bp.name === '1440' }));
  }
  await b1.close();

  // 2) RU at key breakpoints
  const b2 = await chromium.launch({ executablePath: EXEC, args: ['--use-angle=swiftshader'] });
  const c2 = await b2.newContext({ locale: 'ru-RU' });
  for (const bp of [{ name: '390', w: 390, h: 844 }, { name: '1440', w: 1440, h: 900 }]) {
    results.push(await audit(c2, `ru-${bp.name}`, `${BASE}/ru/products/dac`, bp.w, bp.h, { full: true }));
  }
  await b2.close();

  // 3) reduced-motion
  const b3 = await chromium.launch({ executablePath: EXEC, args: ['--use-angle=swiftshader'] });
  const c3 = await b3.newContext({ reducedMotion: 'reduce' });
  results.push(await audit(c3, `reduced-1440`, `${BASE}/products/dac`, 1440, 900));
  await b3.close();

  // 4) no-WebGL fail-safe (disable-webgl)
  const b4 = await chromium.launch({ executablePath: EXEC, args: ['--disable-webgl', '--disable-webgl2'] });
  const c4 = await b4.newContext();
  results.push(await audit(c4, `nowebgl-1440`, `${BASE}/products/dac`, 1440, 900, { full: true }));
  await b4.close();

  // summary
  console.log('\n===== QA v8 SUMMARY =====');
  let fail = 0;
  for (const r of results) {
    const flags = [];
    if (r.overflow > 2) { flags.push(`OVERFLOW +${r.overflow} (${r.widest ? r.widest.cls : '?'})`); fail++; }
    if (r.broken.length) { flags.push(`BROKEN_IMG ${r.broken.length}: ${r.broken.join(',')}`); fail++; }
    if (r.errors.length) { flags.push(`CONSOLE ${r.errors.length}: ${r.errors.slice(0,2).join(' | ')}`); fail++; }
    if (r.failed.length) { flags.push(`REQFAIL ${r.failed.length}: ${r.failed.slice(0,2).join(',')}`); fail++; }
    if (r.label.startsWith('reduced') && r.zeroOpacity > 0) { flags.push(`REDUCED_OPACITY0 ${r.zeroOpacity}`); fail++; }
    console.log(`${flags.length ? 'XX' : 'ok'} ${r.label} imgs=${r.imgCount} callouts=${r.callouts} zop=${r.zeroOpacity} ${flags.join(' ;; ')}`);
  }
  console.log(`\nTOTAL FAIL FLAGS: ${fail}`);
})();
