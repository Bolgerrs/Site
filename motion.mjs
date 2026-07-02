import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto('http://127.0.0.1:8096/products/dac', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
const H = await page.evaluate(() => document.body.scrollHeight);
const frames = 26;
for (let i = 0; i < frames; i++) {
  const y = Math.round((H - 800) * (i / (frames - 1)));
  await page.evaluate(yy => window.scrollTo({ top: yy, behavior: 'instant' }), y);
  await page.waitForTimeout(220);
  await page.screenshot({ path: `/root/qa-out/f${String(i).padStart(2,'0')}.png` });
}
await browser.close();
console.log('frames done');
