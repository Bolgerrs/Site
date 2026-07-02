#!/usr/bin/env python3
"""Idempotent patch: add conductor-cables product to mock-data.ts and a route branch."""
import re, sys, io

WEB = "/root/montelar-staging/apps/web"
MOCK = f"{WEB}/src/lib/cms/mock-data.ts"
ROUTE = f"{WEB}/src/components/product-route-page.tsx"

# ---- 1) mock-data.ts: insert product entry after the conductor-clock entry ----
src = open(MOCK, encoding="utf-8").read()
if "prod-conductor-cables" in src:
    print("mock-data: already has prod-conductor-cables")
else:
    entry = '''    {
      id: "prod-conductor-cables",
      slug: "conductor-cables",
      name: "Montelar Reference AC Architecture",
      shortDescription: "Силовые кабели референсного класса Montelar Power Collection — монокристаллические проводники XPOCC/OCC и чистое серебро, двойной тефлоновый диэлектрик и многослойное шуморассеивание. Три модели: Reference Grey, Extremo Power и флагман Solution AG11.",
      directionSlug: "hi-end-audio",
      categorySlug: "perfect-conductors",
      routePath: "/products/conductor-cables",
      inquiryRoutePath: "/request/conductor-cables",
      availabilityMode: "by-request",
      pdpSectionPlan: ["hero", "material-story", "finish-language", "system-fit", "inquiry"],
      status: "published",
      seo: seo("Montelar Reference AC Architecture | Montelar", "Силовые кабели Montelar Reference AC Architecture — монокристалл, чистое серебро, тефлон, многослойное шуморассеивание. Reference Grey / Extremo Power / Solution AG11. От 109 990 ₽.", "/products/conductor-cables", locale),
    },
'''
    # find the conductor-clock entry's closing "},\n" then the following "  ];"
    marker = 'id: "prod-conductor-clock",'
    idx = src.find(marker)
    if idx == -1:
        print("ERROR: conductor-clock entry not found"); sys.exit(1)
    # find the closing "},\n" of that object (first occurrence after idx)
    close = src.find("\n    },\n", idx)
    if close == -1:
        print("ERROR: could not find end of conductor-clock object"); sys.exit(1)
    insert_at = close + len("\n    },\n")
    src = src[:insert_at] + entry + src[insert_at:]
    open(MOCK, "w", encoding="utf-8").write(src)
    print("mock-data: inserted prod-conductor-cables")

# ---- 2) product-route-page.tsx: import + branch ----
r = open(ROUTE, encoding="utf-8").read()
changed = False
if "ConductorCablesLanding" not in r:
    # add import right after the ConductorClockLanding import
    imp_anchor = 'import { ConductorClockLanding } from "@/components/conductor-clock-landing";'
    if imp_anchor not in r:
        print("ERROR: clock import anchor not found"); sys.exit(1)
    r = r.replace(imp_anchor, imp_anchor + '\nimport { ConductorCablesLanding } from "@/components/conductor-cables-landing";')
    changed = True
if 'product.slug === "conductor-cables"' not in r:
    # add branch after the conductor-clock branch block
    branch_anchor = '''  if (product.slug === "conductor-clock") {
    return (
      <ConductorClockLanding
        locale={locale}
        requestPath={productRequestPath(product.slug, locale)}
        categoryPath={withLocale("/audio/perfect-conductors", locale)}
      />
    );
  }
'''
    if branch_anchor not in r:
        print("ERROR: clock branch anchor not found (formatting differs)"); sys.exit(1)
    new_branch = branch_anchor + '''
  // Bespoke super-landing for the Montelar Reference AC Architecture power cables (slug "conductor-cables")
  if (product.slug === "conductor-cables") {
    return (
      <ConductorCablesLanding
        locale={locale}
        requestPath={productRequestPath(product.slug, locale)}
        categoryPath={withLocale("/audio/perfect-conductors", locale)}
      />
    );
  }
'''
    r = r.replace(branch_anchor, new_branch)
    changed = True
if changed:
    open(ROUTE, "w", encoding="utf-8").write(r)
    print("route-page: patched")
else:
    print("route-page: already patched")
print("DONE")
