import { chromium } from 'playwright';
const BASE = 'http://127.0.0.1:8096';
const EXEC = '/usr/bin/google-chrome';

// A) verify all dac images serve + decode when fully waited
async function imgCheck() {
  const b = await chromium.launch({ executablePath: EXEC, args: ['--use-angle=swiftshader'] });
  const p = await b.newContext().then((c) => c.newPage());
  await p.setViewportSize({ width: 768, height: 1024 });
  await p.goto(`${BASE}/products/dac`, { waitUntil: 'networkidle', timeout: 60000 });
  // scroll fully then wait for decode of every dac img
  await p.evaluate(async () => {
    await new Promise((r) => { let t = 0; const i = setInterval(() => { window.scrollBy(0, 600); t += 600; if (t >= document.body.scrollHeight + 1500) { clearInterval(i); r(); } }, 80); });
  });
  await p.waitForTimeout(1500);
  const res = await p.evaluate(async () => {
    const imgs = [...document.querySelectorAll('.dac-lp2 img')];
    await Promise.all(imgs.map((i) => i.decode().catch(() => {})));
    return imgs.map((i) => ({ src: (i.currentSrc || i.src).split('/').pop(), nw: i.naturalWidth, complete: i.complete, loading: i.getAttribute('loading') }));
  });
  console.log('--- IMG DECODE (768, fully waited) ---');
  for (const r of res) console.log(`${r.nw === 0 ? 'BAD' : 'ok '} ${r.src} nw=${r.nw} loading=${r.loading}`);
  await b.close();
}

// B) which elements are opacity 0 under reduced-motion
async function reducedCheck() {
  const b = await chromium.launch({ executablePath: EXEC, args: ['--use-angle=swiftshader'] });
  const c = await b.newContext({ reducedMotion: 'reduce' });
  const p = await c.newPage();
  await p.setViewportSize({ width: 1440, height: 900 });
  await p.goto(`${BASE}/products/dac`, { waitUntil: 'networkidle', timeout: 60000 });
  await p.evaluate(async () => { await new Promise((r) => { let t = 0; const i = setInterval(() => { window.scrollBy(0, 600); t += 600; if (t >= document.body.scrollHeight + 1500) { clearInterval(i); r(); } }, 80); }); });
  await p.waitForTimeout(1200);
  const els = await p.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('.dac-lp2-v8 *')) {
      const cs = getComputedStyle(el);
      if (parseFloat(cs.opacity) === 0 && el.offsetParent !== null) {
        const r = el.getBoundingClientRect();
        out.push({ cls: el.className?.toString?.().slice(0, 80) || el.tagName, tag: el.tagName, w: Math.round(r.width), h: Math.round(r.height), anim: cs.animationName, transition: cs.transition.slice(0, 40) });
      }
    }
    return out;
  });
  console.log('\n--- REDUCED-MOTION opacity:0 visible elements (1440) ---');
  for (const e of els) console.log(`${e.tag}.${e.cls}  ${e.w}x${e.h} anim=${e.anim}`);
  await b.close();
}

await imgCheck();
await reducedCheck();
