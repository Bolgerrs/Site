import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args:['--use-angle=swiftshader'] });
for (const [tag,w,h] of [['mob',390,844],['desk',1440,900]]) {
  const p = await (await b.newContext({viewport:{width:w,height:h}})).newPage();
  await p.goto('http://127.0.0.1:8096/products/dac', {waitUntil:'networkidle'});
  const el = await p.$('.dac-lp2-panel-stage, .dac-lp2-callout-figure, [class*="callout"]');
  const fig = await p.evaluateHandle(() => {
    const dots = document.querySelector('.dac-lp2-callout-dot');
    return dots ? dots.closest('figure, .dac-lp2-panel, section') : null;
  });
  const target = (await fig.asElement()) || el;
  if (target) await target.screenshot({path:`/root/qa-v8/callout-${tag}.png`});
  await p.close();
}
await b.close(); console.log('ok');
