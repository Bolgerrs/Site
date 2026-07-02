import Script from "next/script";

const monitoringScript = String.raw`
(() => {
  const endpoint = "/api/rum";
  const maxEvents = 24;
  const state = {
    sent: 0,
    seen: new Set(),
    sessionId: "",
    startedAt: Date.now(),
  };

  try {
    state.sessionId = sessionStorage.getItem("montelarRumSession") || "";
    if (!state.sessionId) {
      state.sessionId = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
      sessionStorage.setItem("montelarRumSession", state.sessionId);
    }
  } catch (_) {
    state.sessionId = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  const now = () => Math.round(performance.now());
  const compact = (value, max = 900) => {
    if (value == null) return null;
    return String(value).slice(0, max);
  };
  const getConnection = () => {
    const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!c) return null;
    return {
      effectiveType: c.effectiveType || null,
      downlink: typeof c.downlink === "number" ? c.downlink : null,
      rtt: typeof c.rtt === "number" ? c.rtt : null,
      saveData: Boolean(c.saveData),
    };
  };
  const getContext = () => ({
    sessionId: state.sessionId,
    url: location.href,
    path: location.pathname,
    referrer: document.referrer || null,
    title: document.title || null,
    lang: document.documentElement.lang || null,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      dpr: window.devicePixelRatio || 1,
      orientation: screen.orientation?.type || null,
    },
    connection: getConnection(),
    time: now(),
    visibility: document.visibilityState,
  });
  const eventKey = (type, data) => [type, data?.message, data?.resourceUrl, data?.source, location.pathname].filter(Boolean).join("|").slice(0, 260);
  const send = (type, data = {}) => {
    if (state.sent >= maxEvents) return;
    const key = eventKey(type, data);
    if (state.seen.has(key)) return;
    state.seen.add(key);
    state.sent += 1;

    const payload = JSON.stringify({ type, ...getContext(), ...data });
    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        if (navigator.sendBeacon(endpoint, blob)) return;
      }
    } catch (_) {}

    try {
      fetch(endpoint, {
        method: "POST",
        body: payload,
        headers: { "content-type": "application/json" },
        keepalive: true,
        credentials: "same-origin",
      }).catch(() => {});
    } catch (_) {}
  };
  const classifyMessage = (message) => {
    const text = String(message || "");
    if (/ChunkLoadError|Loading chunk|dynamically imported module|failed to fetch dynamically imported module/i.test(text)) {
      return "chunk-load-error";
    }
    if (/hydration|hydrate|did not match|Minified React error/i.test(text)) {
      return "runtime-error";
    }
    return "runtime-error";
  };

  window.addEventListener("error", (event) => {
    const target = event.target;
    if (target && target !== window && (target.src || target.href || target.currentSrc)) {
      const tag = target.tagName ? target.tagName.toLowerCase() : "resource";
      send("failed-resource", {
        tag,
        rel: compact(target.rel, 80),
        resourceUrl: compact(target.currentSrc || target.src || target.href, 1000),
        outerHTML: compact(target.outerHTML, 500),
      });
      return;
    }

    const message = event.message || event.error?.message || "window error";
    send(classifyMessage(message), {
      message: compact(message),
      source: compact(event.filename, 500),
      line: event.lineno || null,
      column: event.colno || null,
      stack: compact(event.error?.stack, 1000),
    });
  }, true);

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const message = reason?.message || reason || "unhandled rejection";
    send(classifyMessage(message) === "chunk-load-error" ? "chunk-load-error" : "unhandled-rejection", {
      message: compact(message),
      stack: compact(reason?.stack, 1000),
    });
  });

  const originalConsoleError = console.error;
  console.error = (...args) => {
    try {
      const message = args.map((item) => item?.message || item).join(" ");
      if (/ChunkLoadError|Loading chunk|hydration|hydrate|failed to fetch dynamically imported module|Minified React error/i.test(message)) {
        send(classifyMessage(message) === "chunk-load-error" ? "chunk-load-error" : "console-error", {
          message: compact(message),
        });
      }
    } catch (_) {}
    return originalConsoleError.apply(console, args);
  };

  const checkRenderHealth = () => {
    const main = document.querySelector("#main-content");
    const shell = document.querySelector(".site-shell");
    const header = document.querySelector(".site-header, header");
    const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    const scripts = Array.from(document.scripts).filter((script) => /_next\/static/.test(script.src || ""));
    const criticalImages = Array.from(document.images).slice(0, 20).map((image) => ({
      src: compact(image.currentSrc || image.src, 260),
      complete: image.complete,
      naturalWidth: image.naturalWidth || 0,
      naturalHeight: image.naturalHeight || 0,
      loading: image.loading || null,
    }));
    const badCriticalImages = criticalImages.filter((image) => image.src && image.complete && image.naturalWidth === 0);
    const nav = performance.getEntriesByType("navigation")[0];
    const bodyTextLength = (document.body?.innerText || "").trim().length;
    const problems = [];

    if (!shell) problems.push("site-shell-missing");
    if (!main) problems.push("main-missing");
    if (!header) problems.push("header-missing");
    if (bodyTextLength < 120) problems.push("body-text-too-short");
    if (stylesheets.length === 0) problems.push("stylesheet-links-missing");
    if (scripts.length === 0) problems.push("next-scripts-missing");
    if (badCriticalImages.length) problems.push("critical-image-broken");

    if (problems.length) {
      send("render-health", {
        severity: "fail",
        problems,
        bodyTextLength,
        stylesheetCount: stylesheets.length,
        nextScriptCount: scripts.length,
        badCriticalImages,
        nav: nav ? {
          type: nav.type,
          duration: Math.round(nav.duration),
          domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
          load: Math.round(nav.loadEventEnd),
          transferSize: nav.transferSize || null,
        } : null,
      });
      return;
    }

    if (nav && nav.loadEventEnd > 0 && nav.loadEventEnd > 7000) {
      send("slow-page", {
        duration: Math.round(nav.duration),
        domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
        load: Math.round(nav.loadEventEnd),
        transferSize: nav.transferSize || null,
        encodedBodySize: nav.encodedBodySize || null,
      });
    }
  };

  window.addEventListener("load", () => {
    setTimeout(checkRenderHealth, 800);
    setTimeout(checkRenderHealth, 3500);
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      send("render-health", { severity: "info", problems: ["bfcache-restore"], bodyTextLength: (document.body?.innerText || "").trim().length });
    }
  });
})();
`;

export function ProductionMonitoringScript() {
  return (
    <Script id="montelar-production-monitoring" strategy="beforeInteractive">
      {monitoringScript}
    </Script>
  );
}
