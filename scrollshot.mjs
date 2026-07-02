import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
const BASE = 'http://127.0.0.1:8096';
const EXEC = '/usr/bin/google-chrome';
const OUT = process.env.OUT || '/root/qa-v8/scroll';
mkdirSync(OUT, { recursive: true });

const tag = process.env.TAG || 'm390';
const W = parseInt(process.env.W || '390');
const H = parseInt(process.env.H || '844');
const URL = process.env.URL || `${BASE}/products/dac`;

const b = await chromium.launch({ executablePath: EXEC, args: ['--use-angle=swiftshader'] });
const c = await b.newContext({ viewport: { width: W, height: H }, locale: process.env.LOC || 'en-US' });
const p = await c.newPage();
await p.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
const total = await p.evaluate(() => document.body.scrollHeight);
const steps = Math.ceil(total / H);
for (let i = 0; i < steps; i++) {
  await p.evaluate((y) => window.scrollTo(0, y), i * H);
  await p.waitForTimeout(650); // let IO reveal + settle
  await p.screenshot({ path: `${OUT}/${tag}-${String(i).padStart(2, '0')}.png` });
}
console.log(`${tag}: ${steps} frames, pageH=${total}`);
await b.close();
