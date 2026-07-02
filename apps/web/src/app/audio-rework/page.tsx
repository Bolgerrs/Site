import { getRequestLocale } from "@/lib/request-locale";
import { getLocaleCopy } from "@/lib/copy/site-copy";
import { AudioReworkMotion } from "./audio-rework-motion";

const THEME = `

/* ============ scoped rework theme (first variant) ============ */
.rwk{
  --black:#0E0A07; --black-2:#140E0A; --bronze:#6F4A2E; --bronze-soft:#A57D52;
  --bronze-lit:#C49A6A; --sand:#E9DECB; --sand-dim:#B9AC97; --ivory:#FCF7F0;
  --line:rgba(165,125,82,.20); --line-strong:rgba(196,154,106,.34);
  --serif:"Helvetica Neue",Helvetica,Arial,system-ui,sans-serif; --mono:"Helvetica Neue",Helvetica,Arial,system-ui,sans-serif;
  --ease:cubic-bezier(.22,1,.36,1); --shell:clamp(20px,5vw,84px);
  background:var(--black); color:var(--sand);
  font-family:var(--serif); font-weight:400; line-height:1.6; -webkit-font-smoothing:antialiased; overflow-x:clip;
}
.rwk em{font-style:normal!important;font-weight:500}
.rwk ::selection{background:var(--bronze);color:var(--ivory)}
.rwk img{display:block;width:100%;height:100%;object-fit:cover}
.rwk a{color:inherit;text-decoration:none}
.rwk .mono{font-family:var(--mono);font-weight:400;font-size:.69rem;letter-spacing:.34em;text-transform:uppercase;color:var(--bronze-soft)}

.rwk .hero{position:relative;height:100svh;min-height:620px;max-height:1040px;overflow:hidden;display:flex;align-items:flex-end;margin-top:0}
.rwk .hero-media{position:absolute;inset:0;z-index:0;will-change:transform,filter;filter:blur(2.5px)}
.rwk .hero-media::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(14,10,7,.32) 0%,rgba(14,10,7,0) 16%,rgba(14,10,7,0) 60%,rgba(14,10,7,.42) 100%)}
.rwk .hero-media img{transform:scaleX(-1) scale(1.06)}
.rwk .hero-dim{position:absolute;inset:0;z-index:1;opacity:.55;pointer-events:none;background:linear-gradient(180deg,rgba(11,8,5,.14) 0%,transparent 26%,rgba(11,8,5,.5) 72%,rgba(11,8,5,.9) 100%),radial-gradient(115% 95% at 0% 100%,rgba(11,8,5,.6),transparent 58%)}
.rwk .hero-reveal{opacity:1;will-change:opacity,transform}
.rwk .hero-cue{position:absolute;right:var(--shell);bottom:clamp(40px,7vh,84px);z-index:3;display:flex;align-items:center;gap:12px;color:var(--sand-dim);transition:opacity .35s var(--ease)}
.rwk .hero-cue .bar{position:relative;width:1px;height:40px;background:var(--line-strong);overflow:hidden}
.rwk .hero-cue .bar::after{content:"";position:absolute;left:0;top:-40px;width:100%;height:40px;background:var(--bronze-lit);animation:rwkdrop 2.4s var(--ease) infinite}
@media(prefers-reduced-motion:reduce){.rwk .hero-reveal{opacity:1!important}.rwk .hero-dim{opacity:.45!important}.rwk .hero-media{filter:none!important}.rwk .hero-cue .bar::after{animation:none}}
.rwk .hero-inner{position:relative;z-index:2;width:100%;padding:0 var(--shell) clamp(40px,7vh,84px)}
.rwk .hero-eyebrow{display:flex;align-items:center;gap:16px;margin-bottom:26px}
.rwk .hero-eyebrow .tick{height:1px;width:46px;background:var(--line-strong)}
.rwk .hero h1{font-family:var(--serif);font-weight:300;font-size:clamp(2.5rem,7.6vw,6.2rem);line-height:.98;letter-spacing:-.02em;color:var(--ivory);font-optical-sizing:auto;margin:0}
.rwk-ru .hero h1{font-size:clamp(2.05rem,5.9vw,4.7rem)}
.rwk .hero h1 em{font-weight:300;color:var(--bronze-lit)}
.rwk .hero-sub{max-width:38ch;margin:30px 0 0;font-size:clamp(1.05rem,1.7vw,1.35rem);line-height:1.5;color:var(--sand);font-weight:300}
.rwk .hero-foot{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-top:clamp(34px,6vh,68px);border-top:1px solid var(--line);padding-top:20px;flex-wrap:wrap}
.rwk .hero-foot .mono{color:var(--sand-dim)}
.rwk .scrollcue{display:flex;align-items:center;gap:12px;color:var(--sand-dim)}
.rwk .scrollcue .bar{position:relative;width:1px;height:40px;background:var(--line-strong);overflow:hidden}
.rwk .scrollcue .bar::after{content:"";position:absolute;left:0;top:-40px;width:100%;height:40px;background:var(--bronze-lit);animation:rwkdrop 2.4s var(--ease) infinite}
@keyframes rwkdrop{0%{top:-40px}60%,100%{top:40px}}

.rwk section{position:relative}
.rwk .wrap{padding:clamp(80px,13vh,170px) var(--shell)}
.rwk .eyebrow-row{display:flex;align-items:center;gap:16px;margin-bottom:40px}
.rwk .eyebrow-row .tick{height:1px;width:38px;background:var(--line-strong)}

.rwk .statement .lede{font-size:clamp(1.9rem,4.6vw,4rem);line-height:1.08;font-weight:300;letter-spacing:-.015em;color:var(--ivory);max-width:18ch;margin:0}
.rwk .statement .lede em{color:var(--bronze-lit)}
.rwk .statement .grid{display:grid;grid-template-columns:1.4fr 1fr;gap:clamp(40px,6vw,120px);align-items:end}
.rwk .statement .aside{font-size:1.02rem;color:var(--sand-dim);line-height:1.7;max-width:42ch;margin:0}
@media(max-width:880px){.rwk .statement .grid{grid-template-columns:1fr}}

.rwk .disciplines{background:linear-gradient(180deg,var(--black) 0%,var(--black-2) 100%);border-top:1px solid var(--line)}
.rwk .disc-head{display:flex;justify-content:space-between;align-items:flex-end;gap:30px;flex-wrap:wrap;margin-bottom:18px}
.rwk .disc-head h2{font-size:clamp(1.8rem,3.4vw,3rem);font-weight:300;letter-spacing:-.01em;color:var(--ivory);line-height:1.05;margin:0;max-width:20ch}
.rwk .disc-list{margin-top:24px}
.rwk .disc{display:grid;grid-template-columns:1fr auto;gap:clamp(18px,4vw,60px);align-items:baseline;padding:34px 0;border-top:1px solid var(--line);position:relative;transition:padding-left .5s var(--ease)}
.rwk .disc:last-child{border-bottom:1px solid var(--line)}
.rwk .disc .num{font-family:var(--mono);font-size:.78rem;letter-spacing:.2em;color:var(--bronze)}
.rwk .disc .body h3{font-size:clamp(1.5rem,3.2vw,2.5rem);font-weight:300;color:var(--ivory);letter-spacing:-.01em;transition:color .45s var(--ease);margin:0}
.rwk .disc .body p{margin:10px 0 0;color:var(--sand-dim);max-width:52ch;font-size:1rem}
.rwk .disc .meta{font-family:var(--mono);font-size:.66rem;letter-spacing:.22em;text-transform:uppercase;color:var(--bronze-soft);text-align:right;white-space:nowrap}
.rwk .disc .glow{position:absolute;left:0;top:0;bottom:0;width:0;background:linear-gradient(90deg,rgba(111,74,46,.16),transparent);z-index:-1;transition:width .55s var(--ease)}
.rwk .disc:hover{padding-left:26px}
.rwk .disc:hover .body h3{color:var(--bronze-lit)}
.rwk .disc:hover .glow{width:60%}
@media(max-width:680px){.rwk .disc{grid-template-columns:1fr}.rwk .disc .meta{text-align:left;margin-top:10px}}

.rwk .atmos{position:relative;display:grid;grid-template-columns:1fr 1fr;gap:clamp(30px,4.5vw,80px);align-items:center;border-top:1px solid var(--line);background:var(--black-2);padding:clamp(60px,9vh,120px) var(--shell)}
.rwk .atmos .quote-col{display:flex;flex-direction:column;justify-content:center}
.rwk .atmos .media-col{position:relative}
.rwk .atmos-media{position:relative;width:100%;aspect-ratio:2752/1536;overflow:hidden;border:1px solid var(--line)}
.rwk .atmos-media img{object-fit:cover}
.rwk .atmos blockquote{font-size:clamp(1.5rem,2.9vw,2.7rem);line-height:1.2;font-weight:300;letter-spacing:-.01em;color:var(--ivory);margin:0;max-width:24ch}
.rwk .atmos blockquote em{color:var(--bronze-lit)}
.rwk .atmos .by{margin-top:28px;display:flex;align-items:center;gap:14px}
.rwk .atmos .by .tick{height:1px;width:34px;background:var(--line-strong)}
@media(max-width:880px){.rwk .atmos{grid-template-columns:1fr}.rwk .atmos .media-col{order:2}}

.rwk .conductor{position:relative;overflow:hidden;border-top:1px solid var(--line)}
.rwk .conductor .grid{display:grid;grid-template-columns:1fr 1fr;min-height:clamp(520px,80vh,760px)}
.rwk .conductor .media{position:relative;overflow:hidden}
.rwk .conductor .media img{transform:scale(1.04);transition:transform 1.6s var(--ease)}
.rwk .conductor:hover .media img{transform:scale(1.09)}
.rwk .conductor .media::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent 60%,var(--black) 100%)}
.rwk .conductor .copy{display:flex;flex-direction:column;justify-content:center;padding:clamp(50px,7vw,96px) var(--shell)}
.rwk .conductor h2{font-size:clamp(2rem,4vw,3.4rem);font-weight:300;line-height:1.04;letter-spacing:-.015em;color:var(--ivory);margin:0 0 24px}
.rwk .conductor h2 em{color:var(--bronze-lit)}
.rwk .conductor p{color:var(--sand-dim);font-size:1.08rem;line-height:1.78;max-width:44ch;margin:0}
@media(max-width:880px){.rwk .conductor .grid{grid-template-columns:1fr}.rwk .conductor .media{min-height:54vh}.rwk .conductor .media::after{background:linear-gradient(180deg,transparent 55%,var(--black) 100%)}}

.rwk .cta{border-top:1px solid var(--line);background:radial-gradient(120% 120% at 50% -10%,rgba(111,74,46,.18),transparent 60%),var(--black)}
.rwk .cta .inner{text-align:center;max-width:880px;margin:0 auto}
.rwk .cta h2{font-size:clamp(2.2rem,5.4vw,4.6rem);font-weight:300;line-height:1.02;letter-spacing:-.02em;color:var(--ivory);margin:0}
.rwk .cta h2 em{color:var(--bronze-lit)}
.rwk .cta .sub{margin:26px auto 0;max-width:48ch;color:var(--sand-dim);font-size:1.08rem}
.rwk .steps{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;margin-top:64px;background:var(--line);border:1px solid var(--line)}
.rwk .step{background:var(--black);padding:32px 26px;text-align:left}
.rwk .step .n{font-family:var(--mono);font-size:.68rem;letter-spacing:.24em;color:var(--bronze);margin-bottom:14px}
.rwk .step h4{font-weight:400;color:var(--ivory);font-size:1.15rem;margin:0 0 8px}
.rwk .step p{color:var(--sand-dim);font-size:.92rem;line-height:1.6;margin:0}
@media(max-width:760px){.rwk .steps{grid-template-columns:1fr}}
.rwk .btn{display:inline-flex;align-items:center;gap:14px;margin-top:56px;padding:17px 34px;border:1px solid var(--line-strong);border-radius:999px;font-family:var(--mono);font-size:.7rem;letter-spacing:.26em;text-transform:uppercase;color:var(--ivory);background:transparent;transition:background .5s var(--ease),border-color .5s var(--ease)}
.rwk .btn .arrow{transition:transform .5s var(--ease)}
.rwk .btn:hover{background:var(--bronze);border-color:var(--bronze)}
.rwk .btn:hover .arrow{transform:translateX(6px)}

.rwk .foot{border-top:1px solid var(--line);padding:clamp(64px,9vh,108px) var(--shell) 44px;background:var(--black-2)}
.rwk .foot-top{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:44px}
.rwk .foot-word{font-family:var(--serif);font-weight:300;font-size:clamp(2rem,4vw,3rem);letter-spacing:.02em;color:var(--ivory);line-height:1}
.rwk .foot-tag{margin-top:16px;color:var(--sand-dim);max-width:32ch;font-size:.98rem;line-height:1.7}
.rwk .foot-col h4{font-family:var(--mono);font-weight:400;font-size:.66rem;letter-spacing:.24em;text-transform:uppercase;color:var(--bronze-soft);margin:0 0 18px}
.rwk .foot-col a{display:block;padding:9px 0;color:var(--sand-dim);font-size:1rem;border-bottom:1px solid var(--line);transition:color .35s var(--ease),padding-left .35s var(--ease)}
.rwk .foot-col a:hover{color:var(--ivory);padding-left:8px}
.rwk .foot-bot{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-top:clamp(50px,7vh,78px);padding-top:26px;border-top:1px solid var(--line);color:var(--sand-dim);font-family:var(--mono);font-size:.64rem;letter-spacing:.08em}
@media(max-width:820px){.rwk .foot-top{grid-template-columns:1fr 1fr}.rwk .foot-word{grid-column:1/-1}}

.rwk [data-reveal]{opacity:0;transform:translateY(34px);transition:opacity 1.1s var(--ease),transform 1.1s var(--ease)}
.rwk [data-reveal].in{opacity:1;transform:none}
.rwk [data-reveal][data-d="1"]{transition-delay:.08s}
.rwk [data-reveal][data-d="2"]{transition-delay:.16s}
.rwk [data-reveal][data-d="3"]{transition-delay:.24s}
.rwk [data-reveal][data-d="4"]{transition-delay:.32s}
@media(prefers-reduced-motion:reduce){.rwk [data-reveal]{opacity:1;transform:none;transition:none}.rwk .scrollcue .bar::after{animation:none}}

/* ---- unified section rhythm (lower page): one eyebrow style, one heading scale ---- */
.rwk .sec-h{font-family:var(--serif);font-weight:300;font-size:clamp(1.9rem,3.6vw,3.1rem);line-height:1.07;letter-spacing:-.015em;color:var(--ivory);margin:0 0 18px;max-width:26ch}
.rwk .statement .lede{font-size:clamp(1.85rem,3.7vw,3.2rem);line-height:1.1;max-width:22ch}
.rwk .conductor h2{font-size:clamp(1.9rem,3.6vw,3.1rem);line-height:1.07;margin:0 0 22px}
.rwk .cta h2{font-size:clamp(2rem,4.1vw,3.4rem);line-height:1.06}
.rwk .conductor .copy{padding:clamp(64px,11vh,140px) clamp(40px,5vw,86px)}
.rwk .disc-list{margin-top:34px}

/* =============== chrome: clean header (no frame band) + hide stock footer =============== */
body:has(.rwk){--rc-bronze:#A57D52;--rc-bronze-lit:#C49A6A;--rc-ivory:#FCF7F0;--rc-dim:#B9AC97;--rc-hair:rgba(196,154,106,.26);--rc-mono:"Helvetica Neue",Helvetica,Arial,system-ui,sans-serif;--rc-serif:"Helvetica Neue",Helvetica,Arial,system-ui,sans-serif;--rc-ease:cubic-bezier(.22,1,.36,1)}
body:has(.rwk) .shell-footer{display:none!important}
body:has(.rwk) .site-shell{padding:0!important}
body:has(.rwk) .shell-main{width:100%!important;max-width:none!important;padding:0!important;margin:0!important}
body:has(.rwk) .shell-header{position:fixed!important;top:0;left:0;right:0;z-index:80;background:transparent!important;border-bottom:0!important;box-shadow:none!important;transition:background .55s var(--rc-ease),backdrop-filter .55s var(--rc-ease)!important}
body:has(.rwk) .shell-header::before{display:none!important}
body:has(.rwk) .shell-header::after{content:""!important;position:absolute;left:0;right:0;bottom:0;height:1px;z-index:2;pointer-events:none;background:linear-gradient(90deg,rgba(196,154,106,0) 0%,rgba(196,154,106,.16) 12%,rgba(224,184,126,.85) 50%,rgba(196,154,106,.16) 88%,rgba(196,154,106,0) 100%);box-shadow:0 0 10px rgba(214,170,108,.28)}
body:has(.rwk) .shell-header.rwk-solid{background:rgba(11,8,5,.82)!important;-webkit-backdrop-filter:blur(16px) saturate(116%);backdrop-filter:blur(16px) saturate(116%);border-bottom-color:var(--rc-hair)!important}
body:has(.rwk) .shell-header .eyebrow{font-family:var(--rc-mono)!important;letter-spacing:.3em!important;text-transform:uppercase;color:var(--rc-bronze)!important;font-size:.55rem!important}
body:has(.rwk) .shell-header .slogan-term{font-family:var(--rc-serif)!important;font-weight:300!important;color:var(--rc-ivory)!important}
body:has(.rwk) .shell-header .slogan-prefix{font-family:var(--rc-mono)!important;letter-spacing:.16em!important;color:var(--rc-dim)!important}
body:has(.rwk) .brand-mark{transform:scale(1.3)!important;transform-origin:center}
body:has(.rwk) .shell-header .brand-copy,body:has(.rwk) .shell-header .shell-context-copy{font-family:var(--rc-serif)!important;color:var(--rc-dim)!important;font-weight:300!important}
body:has(.rwk) .desktop-nav-link,body:has(.rwk) .desktop-nav-trigger{font-family:var(--rc-mono)!important;text-transform:uppercase;letter-spacing:.22em!important;font-size:.83rem!important;color:var(--rc-dim)!important;background:none;border:0;cursor:pointer;padding:6px 0!important;position:relative;transition:color .4s var(--rc-ease)!important}
body:has(.rwk) .desktop-nav-link:hover,body:has(.rwk) .desktop-nav-trigger:hover,body:has(.rwk) .desktop-nav-trigger.is-active{color:var(--rc-ivory)!important}
body:has(.rwk) .desktop-nav-link::after,body:has(.rwk) .desktop-nav-trigger::after{content:"";position:absolute;left:0;bottom:-2px;width:0;height:1px;background:var(--rc-bronze-lit);transition:width .4s var(--rc-ease)}
body:has(.rwk) .desktop-nav-link:hover::after,body:has(.rwk) .desktop-nav-trigger:hover::after,body:has(.rwk) .desktop-nav-trigger[aria-expanded="true"]::after{width:100%}
body:has(.rwk) .header-action-stack,body:has(.rwk) .header-cta-row,body:has(.rwk) .shell-chip-row,body:has(.rwk) .header-action-stack *,body:has(.rwk) .header-cta-row *{border:0!important;background:transparent!important;box-shadow:none!important;border-radius:0!important}
body:has(.rwk) .header-action-stack{gap:22px!important;padding:0!important}
body:has(.rwk) .header-cta-row{gap:20px!important}
body:has(.rwk) .header-phone-link,body:has(.rwk) .shell-chip{display:none!important}
body:has(.rwk) .locale-switcher-trigger{font-family:var(--rc-mono)!important;letter-spacing:.16em!important;color:var(--rc-dim)!important;text-transform:uppercase;font-size:.8rem!important;gap:7px!important}
body:has(.rwk) .locale-switcher-trigger:hover{color:var(--rc-ivory)!important}
body:has(.rwk) .locale-switcher-label{display:none!important}
body:has(.rwk) .locale-switcher-chevron{color:var(--rc-bronze)!important}
body:has(.rwk) .locale-switcher-list{background:rgba(11,8,5,.97)!important;border:1px solid var(--rc-hair)!important;border-radius:4px!important;-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px)}
body:has(.rwk) .header-cta{font-family:var(--rc-mono)!important;text-transform:uppercase;letter-spacing:.2em!important;font-size:.8rem!important;color:var(--rc-bronze-lit)!important;padding:6px 0!important;position:relative}
body:has(.rwk) .header-cta::after{content:""!important;position:absolute;left:0;bottom:-1px;width:0;height:1px;background:var(--rc-bronze-lit);transition:width .4s var(--rc-ease)}
body:has(.rwk) .header-cta:hover{color:var(--rc-ivory)!important}
body:has(.rwk) .header-cta:hover::after{width:100%!important}
body:has(.rwk) .product-mega-panel{background:rgba(11,8,5,.97)!important;-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);border-top:1px solid var(--rc-hair)!important;border-bottom:1px solid var(--rc-hair)!important}
body:has(.rwk) .product-mega-rail-label{font-family:var(--rc-serif)!important;font-weight:300!important;color:var(--rc-ivory)!important;letter-spacing:-.01em!important}
body:has(.rwk) .product-mega-rail-copy{font-family:var(--rc-serif)!important;color:var(--rc-dim)!important}
body:has(.rwk) .product-mega-rail-item{transition:padding-left .4s var(--rc-ease)!important}
body:has(.rwk) .product-mega-rail-item:hover{padding-left:10px!important}
/* header legibility over photo (no scrim band — brighten text + soft shadow) */
body:has(.rwk) .desktop-nav-link,body:has(.rwk) .desktop-nav-trigger{color:#ECE3D3!important;text-shadow:0 1px 14px rgba(8,5,3,.65)}
body:has(.rwk) .locale-switcher-trigger{color:#ECE3D3!important;text-shadow:0 1px 14px rgba(8,5,3,.65)}
body:has(.rwk) .header-cta{text-shadow:0 1px 14px rgba(8,5,3,.65)}
body:has(.rwk) .shell-header .eyebrow,body:has(.rwk) .shell-header .slogan-term,body:has(.rwk) .shell-header .slogan-prefix,body:has(.rwk) .shell-header .brand-copy,body:has(.rwk) .shell-header .shell-context-copy{text-shadow:0 1px 12px rgba(8,5,3,.6)}
body:has(.rwk) .hero-eyebrow .mono{color:#E4D9C6!important;text-shadow:0 1px 12px rgba(8,5,3,.7)}
`;

export default async function AudioReworkPage() {
  const locale = await getRequestLocale();
  const L = (en: string, ru: string) => getLocaleCopy(locale, { en, ru });

  const categories = [
    {
      num: "/ 01",
      name: getLocaleCopy(locale, { en: "Speakers", ru: "Акустика", de: "Lautsprecher", es: "Altavoces", fr: "Enceintes", zh: "扬声器", ja: "スピーカー" }),
      desc: L(
        "Loudspeakers voiced for stable imaging and natural dynamics. Milled enclosures and controlled cabinet resonance — presence without exaggeration.",
        "Акустика, настроенная на стабильную сцену и естественную динамику. Фрезерованные корпуса и контролируемый резонанс — присутствие без преувеличения.",
      ),
      meta: L("Floorstanding · Stand-mount", "Напольная · Полочная"),
    },
    {
      num: "/ 02",
      name: getLocaleCopy(locale, { en: "Streamers", ru: "Стримеры", de: "Streamer", es: "Streamers", fr: "Streamers", zh: "流媒体播放器", ja: "ストリーマー" }),
      desc: L(
        "Network streaming and transport with galvanic isolation and a low noise floor — the quiet digital origin of the signal.",
        "Сетевой стриминг и транспорт с гальванической развязкой и низким уровнем шума — тихий цифровой источник сигнала.",
      ),
      meta: L("Network · Transport", "Сеть · Транспорт"),
    },
    {
      num: "/ 03",
      name: getLocaleCopy(locale, { en: "DAC", ru: "ЦАП", de: "DAC", es: "DAC", fr: "DAC", zh: "DAC", ja: "DAC" }),
      desc: L(
        "Digital-to-analogue conversion tuned for resolution and silence — never for artificial detail or spectacle.",
        "Цифро-аналоговое преобразование, настроенное на разрешение и тишину — без искусственной детальности и эффекта.",
      ),
      meta: L("Conversion", "Преобразование"),
    },
    {
      num: "/ 04",
      name: getLocaleCopy(locale, { en: "Amplifiers", ru: "Усилители", de: "Verstärker", es: "Amplificadores", fr: "Amplificateurs", zh: "放大器", ja: "アンプ" }),
      desc: L(
        "Pre and power stages with high headroom and low distortion — authority and control, heat and noise kept out of the room.",
        "Предварительные и оконечные каскады с высоким запасом и низкими искажениями — власть и контроль, тепло и шум вне комнаты.",
      ),
      meta: L("Pre · Power", "Пред · Оконечник"),
    },
    {
      num: "/ 05",
      name: "Perfect Conductors",
      desc: L(
        "Cable and connection engineered as material — shielding geometry and machined termination, the last architecture of sound. Led by Prima Materia.",
        "Кабель и соединение как инженерный материал — геометрия экранирования и обработанные коннекторы, последняя архитектура звука. Во главе с Prima Materia.",
      ),
      meta: "Prima Materia",
    },
  ];

  const steps = [
    { n: "01", h: L("Listening room", "Комната прослушивания"), p: L("Proportion, placement and the role of the system in the space.", "Пропорции, размещение и роль системы в пространстве.") },
    { n: "02", h: L("Category path", "Путь по категориям"), p: L("Compare categories first; reach individual products once the path is clear.", "Сначала сравниваем категории, к отдельным продуктам — когда путь ясен.") },
    { n: "03", h: L("Consultation", "Консультация"), p: L("Component and conductor matching with a Montelar advisor.", "Подбор компонентов и проводников с консультантом Montelar.") },
  ];

  const footCols = [
    {
      h: L("Atelier", "Ателье"),
      links: [
        [L("Brand", "Бренд"), `/${locale}/brand`],
        [L("Technology", "Технологии"), `/${locale}/technology`],
        [L("Craftsmanship", "Мастерство"), `/${locale}/craftsmanship`],
        [L("Projects", "Проекты"), `/${locale}/projects`],
      ] as [string, string][],
    },
    {
      h: L("Inquiries", "Запросы"),
      links: [
        [L("Journal", "Журнал"), `/${locale}/journal`],
        [L("Downloads", "Загрузки"), `/${locale}/downloads`],
        [L("Contact", "Контакты"), `/${locale}/contact`],
        [L("Request consultation", "Запросить консультацию"), `/${locale}/request/hi-end-audio`],
      ] as [string, string][],
    },
  ];

  return (
    <div className={locale === "ru" ? "rwk rwk-ru" : "rwk"}>
      <style dangerouslySetInnerHTML={{ __html: THEME }} />

      <section className="hero">
        <div className="hero-media" id="heroMedia"><img src="/rework-audio/hero.webp" alt="Montelar Hi-end Audio" /></div>
        <div className="hero-dim" id="heroDim" />
        <div className="hero-inner">
          <div className="hero-eyebrow"><span className="tick" /><span className="mono">{L("Montelar — Hi-end Audio", "Montelar — Hi-end аудио")}</span></div>
          <div className="hero-reveal" id="heroReveal">
            <h1>{L("Sound that ", "Звук, который ")}<em>{L("reveals", "раскрывает")}</em>{L(",", ",")}<br />{L("not performs.", "а не исполняет.")}</h1>
            <p className="hero-sub">{L("A complete audio architecture — from loudspeaker presence in the room to the materiality of a single cable. Reference precision, without spectacle.", "Полная аудиоархитектура — от присутствия акустики в комнате до материальности одного кабеля. Референсная точность, без эффектности.")}</p>
            <div className="hero-foot">
              <span className="mono">{L("Speakers · Streamers · DAC · Amplifiers · Perfect Conductors", "Акустика · Стримеры · ЦАП · Усилители · Perfect Conductors")}</span>
            </div>
          </div>
        </div>
        <div className="hero-cue" id="heroCue"><span className="bar" /></div>
      </section>

      <section className="statement wrap">
        <div className="eyebrow-row" data-reveal><span className="tick" /><span className="mono">{L("The approach", "Подход")}</span></div>
        <div className="grid">
          <p className="lede" data-reveal>{L("Tuned for control, depth and ", "Настроено на контроль, глубину и ")}<em>{L("silence", "тишину")}</em>{L(" — never for spectacle.", " — никогда на эффект.")}</p>
          <p className="aside" data-reveal data-d="1">{L("Montelar components are engineered for long listening: a low noise floor, stable imaging and the full architecture of recorded music. Reference-level performance, held inside objects of architectural restraint and milled-aluminium construction.", "Компоненты Montelar созданы для долгого прослушивания: низкий уровень шума, стабильная сцена и полная архитектура записанной музыки. Референсный уровень в объектах архитектурной сдержанности из фрезерованного алюминия.")}</p>
        </div>
      </section>

      <section className="disciplines wrap">
        <div className="eyebrow-row" data-reveal><span className="tick" /><span className="mono">{L("The lineup", "Линейка")}</span></div>
        <h2 className="sec-h" data-reveal>{L("One architecture, held across five categories.", "Одна архитектура в пяти категориях.")}</h2>
        <div className="disc-list">
          {categories.map((c, i) => (
            <article className="disc" data-reveal data-d={i > 0 ? String(Math.min(i, 3)) : undefined} key={c.name}>
              <span className="glow" />
              <div className="body"><h3>{c.name}</h3><p>{c.desc}</p></div>
              <span className="meta">{c.meta}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="atmos" id="listening">
        <div className="quote-col">
          <blockquote data-reveal>{L("We do not design for spectacle. We design for long listening, stable imaging and the full ", "Мы не проектируем ради эффекта. Мы проектируем для долгого прослушивания, стабильной сцены и полной ")}<em>{L("architecture of recorded music.", "архитектуры записанной музыки.")}</em></blockquote>
          <div className="by" data-reveal data-d="1"><span className="tick" /><span className="mono">{L("Montelar — Architecture of Sound", "Montelar — Архитектура звука")}</span></div>
        </div>
        <div className="media-col"><div className="atmos-media" id="atmosMedia"><img src="/rework-audio/atmosphere.webp" alt="Montelar loudspeakers and amplification" /></div></div>
      </section>

      <section className="conductor" id="conductors">
        <div className="grid">
          <div className="media"><img src="/rework-audio/conductor.webp" alt="Montelar Prima Materia conductor" /></div>
          <div className="copy">
            <div className="eyebrow-row" data-reveal><span className="tick" /><span className="mono">Prima Materia</span></div>
            <h2 data-reveal data-d="1">{L("Cable as engineered ", "Кабель как инженерный ")}<em>{L("material", "материал")}</em>.</h2>
            <p data-reveal data-d="2">{L("Perfect Conductors treats power, signal and speaker connection as part of the system, not an accessory — controlled geometry, multi-layer shielding and precision-machined terminations that lower the noise floor and stabilise delivery. Prima Materia is the reference of the line.", "Perfect Conductors рассматривает питание, сигнал и акустическое соединение как часть системы, а не аксессуар — контролируемая геометрия, многослойное экранирование и точно обработанные коннекторы, снижающие шум и стабилизирующие передачу. Prima Materia — референс линейки.")}</p>
          </div>
        </div>
      </section>

      <section className="cta wrap" id="consult">
        <div className="inner">
          <span className="mono" data-reveal>{L("Consultation", "Консультация")}</span>
          <h2 data-reveal data-d="1" style={{ marginTop: "26px" }}>{L("A calm path from the room to a ", "Спокойный путь от комнаты к ")}<em>{L("private", "частной")}</em>{L(" consultation.", " консультации.")}</h2>
          <p className="sub" data-reveal data-d="2">{L("We begin with the role of the system in your room, narrow by category, then match components and conductors with you directly. No configurator. No checkout.", "Начинаем с роли системы в вашей комнате, сужаем по категории, затем подбираем компоненты и проводники вместе с вами напрямую. Без конфигуратора. Без корзины.")}</p>
          <div className="steps" data-reveal data-d="2">
            {steps.map((s) => (
              <div className="step" key={s.n}><div className="n">{s.n}</div><h4>{s.h}</h4><p>{s.p}</p></div>
            ))}
          </div>
          <a className="btn" href={`/${locale}/request/hi-end-audio`}>{L("Request a consultation", "Запросить консультацию")} <span className="arrow">→</span></a>
        </div>
      </section>

      <footer className="foot">
        <div className="foot-top">
          <div>
            <div className="foot-word">Montelar</div>
            <p className="foot-tag">{L("Architecture of image, sound and AI design. Private cinema, hi-end audio and image systems composed for one room.", "Архитектура изображения, звука и AI дизайна. Частный кинотеатр, hi-end аудио и системы изображения для одной комнаты.")}</p>
          </div>
          {footCols.map((col) => (
            <div className="foot-col" key={col.h}>
              <h4>{col.h}</h4>
              {col.links.map(([label, href]) => <a href={href} key={label}>{label}</a>)}
            </div>
          ))}
        </div>
        <div className="foot-bot">
          <span>{L("© Montelar — Quiet luxury", "© Montelar — Тихая роскошь")}</span>
          <span>{L("Black · brown · beige · white. One environment.", "Чёрный · коричневый · бежевый · белый. Одна среда.")}</span>
        </div>
      </footer>

      <AudioReworkMotion />
    </div>
  );
}
