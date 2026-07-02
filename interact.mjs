import { chromium } from 'playwright';
const URL = 'http://127.0.0.1:8096/products/dac';
const OUT = '/root/qa-out';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
await page.goto(URL, { waitUntil: 'networkidle' });

// scroll through to trigger reveals + count-up
await page.evaluate(async () => {
  await new Promise(r => { let t = 0; const id = setInterval(() => { window.scrollBy(0, 500); t += 500; if (t > document.body.scrollHeight) { clearInterval(id); r(); } }, 80); });
});
await page.waitForTimeout(1500);

// 1. count-up final values
const counts = await page.$$eval('.dac-lp2-tile-num', els => els.map(e => e.textContent));

// 2. accordion: click first toggle, check panel opens
await page.evaluate(() => window.scrollTo(0, 0));
const firstToggle = page.locator('.dac-lp2-acc-toggle').first();
await firstToggle.scrollIntoViewIfNeeded();
const beforeOpen = await page.locator('.dac-lp2-acc-panel').first().getAttribute('data-open');
await firstToggle.click();
await page.waitForTimeout(700);
const afterOpen = await page.locator('.dac-lp2-acc-panel').first().getAttribute('data-open');

// 3. hotspot: read active title, click a different spot, re-read
const panel = page.locator('.dac-lp2-panel-stage');
await panel.scrollIntoViewIfNeeded();
await page.waitForTimeout(400);
const title0 = await page.locator('.dac-lp2-readout-title').textContent();
await page.locator('.dac-lp2-spot[aria-label^="AES"]').click();
await page.waitForTimeout(300);
const title1 = await page.locator('.dac-lp2-readout-title').textContent();

// 4. coverflow drag changes caption
const gallery = page.locator('.dac-coverflow').first();
await gallery.scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
const cap0 = await page.locator('.dac-three-caption strong').first().textContent();
const box = await gallery.boundingBox();
if (box) {
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5, { steps: 18 });
  await page.mouse.up();
  await page.waitForTimeout(900);
}
const cap1 = await page.locator('.dac-three-caption strong').first().textContent();

console.log(JSON.stringify({
  counts,
  accordion: { beforeOpen, afterOpen, ok: beforeOpen === 'false' && afterOpen === 'true' },
  hotspot: { title0, title1, ok: title0 !== title1 && title1?.includes('AES') },
  coverflow: { cap0, cap1, ok: cap0 !== cap1 },
  pageErrors: errs,
}, null, 2));
await browser.close();
