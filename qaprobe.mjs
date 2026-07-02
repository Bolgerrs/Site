import { chromium } from 'playwright';
const EXEC='/usr/bin/google-chrome';
const URL='http://127.0.0.1:8096/products/dac';
const b=await chromium.launch({executablePath:EXEC,args:['--use-angle=swiftshader','--disable-gpu']});
async function probe(w,h,reduced){
  const c=await b.newContext({viewport:{width:w,height:h},reducedMotion:reduced?'reduce':'no-preference'});
  const p=await c.newPage();
  await p.goto(URL,{waitUntil:'networkidle',timeout:60000});
  const t=await p.evaluate(()=>document.body.scrollHeight);
  for(let y=0;y<t;y+=h){await p.evaluate(yy=>scrollTo(0,yy),y);await p.waitForTimeout(120);}
  await p.waitForTimeout(400);
  const r=await p.evaluate(()=>{
    const de=document.documentElement;
    const over=de.scrollWidth-de.clientWidth;
    // find elements wider than viewport
    const wide=[...document.querySelectorAll('*')].filter(e=>{const r=e.getBoundingClientRect();return r.right>window.innerWidth+1||r.left<-1;}).slice(0,6).map(e=>`${e.tagName}.${(e.className&&e.className.toString().slice(0,40))} right=${Math.round(e.getBoundingClientRect().right)}`);
    const imgs=[...document.querySelectorAll('img')];
    const broken=imgs.filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.currentSrc||i.src);
    // reveal elements stuck invisible
    const hidden=[...document.querySelectorAll('[data-reveal]')].filter(e=>{const s=getComputedStyle(e);return parseFloat(s.opacity)<0.05;}).length;
    return {scrollW:de.scrollWidth,clientW:de.clientWidth,over,wide,imgCount:imgs.length,broken,hiddenReveals:hidden};
  });
  console.log(JSON.stringify({vp:`${w}x${h}`,reduced,...r},null,1));
  await c.close();
}
await probe(1440,900,false);
await probe(390,844,false);
await probe(390,844,true);
await b.close();
