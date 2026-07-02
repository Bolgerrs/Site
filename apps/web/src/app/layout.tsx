import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { AtomicMediaReadyScript } from "@/components/atomic-media-ready-script";
import { SiteShell } from "@/components/site-shell";
import { ProductionMonitoringScript } from "@/components/production-monitoring-script";
import { montelarDesignTokens } from "@/lib/design/tokens";
import { getRequestLocale } from "@/lib/request-locale";
import { buildRootMetadata } from "@/lib/seo/metadata";
import "./globals.css";
import "./tailwind.css";

export const metadata: Metadata = buildRootMetadata();

export const viewport: Viewport = {
  themeColor: montelarDesignTokens.color.sand,
};

const YANDEX_METRIKA_ID = 109830010;

type RootLayoutProps = {
  children: ReactNode;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  const locale = await getRequestLocale();

  return (
    <html className="notranslate" lang={locale} translate="no" style={{ backgroundColor: "#0a0908", color: "#f2ebdf", colorScheme: "dark" }}>
      <head>
        <ProductionMonitoringScript />
        <Script id="montelar-atomic-media-bootstrap" strategy="beforeInteractive">
          {`document.documentElement.classList.add("media-atomic-enabled");`}
        </Script>
        <meta name="google" content="notranslate" />
        <meta name="yandex" content="notranslate" />
        <link
          rel="preload"
          as="image"
          href="/images/home/product-scene/hero-upscaled-logo-ai-slogan-1920-20260613v2.webp"
          imageSrcSet="/images/home/product-scene/hero-upscaled-logo-ai-slogan-960-20260613v2.webp 960w, /images/home/product-scene/hero-upscaled-logo-ai-slogan-1440-20260613v2.webp 1440w, /images/home/product-scene/hero-upscaled-logo-ai-slogan-1920-20260613v2.webp 1920w, /images/home/product-scene/hero-upscaled-logo-ai-slogan-2880-20260613v2.webp 2880w, /images/home/product-scene/hero-upscaled-logo-ai-slogan-3840-20260613v2.webp 3840w"
          imageSizes="100vw"
          fetchPriority="high"
        />
      </head>
      <body>
        <SiteShell locale={locale}>{children}</SiteShell>
        <AtomicMediaReadyScript />
        <Script id="yandex-metrika" strategy="afterInteractive">
          {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,"script","https://mc.yandex.ru/metrika/tag.js?id=${YANDEX_METRIKA_ID}","ym");ym(${YANDEX_METRIKA_ID},"init",{ssr:true,webvisor:true,clickmap:true,ecommerce:"dataLayer",referrer:document.referrer,url:location.href,accurateTrackBounce:true,trackLinks:true});`}
        </Script>
        <noscript>
          <div>
            <img
              src={`https://mc.yandex.ru/watch/${YANDEX_METRIKA_ID}`}
              style={{ position: "absolute", left: "-9999px" }}
              alt=""
            />
          </div>
        </noscript>
      </body>
    </html>
  );
}
