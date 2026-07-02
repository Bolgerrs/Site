import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
const EXEC='/usr/bin/google-chrome';
const OUT=process.env.OUT||'/root/qa-dac'; mkdirSync(OUT,{recursive:true});
const URL=process.env.URL||'http://127.0.0.1:8096/products/dac';
const W=parseInt(process.env.W||'1440'), H=parseInt(process.env.H||'900');
const TAG=process.env.TAG||'desk';
const b=await chromium.launch({executablePath:EXEC,args:['--use-angle=swiftshader','--disable-gpu']});
const c=await b.newContext({viewport:{width:W,height:H},locale:process.env.LOC||'en-US',deviceScaleFactor:1});
const p=await c.newPage();
await p.goto(URL,{waitUntil:'networkidle',timeout:60000});
// trigger reveals by scrolling through
const total=await p.evaluate(()=>document.body.scrollHeight);
for(let y=0;y<total;y+=H){ await p.evaluate(yy=>window.scrollTo(0,yy),y); await p.waitForTimeout(250);}
await p.evaluate(()=>window.scrollTo(0,0)); await p.waitForTimeout(400);
await p.screenshot({path:`${OUT}/${TAG}-full.png`,fullPage:true});
console.log(`${TAG}: pageH=${total} w=${W}`);
await b.close();
