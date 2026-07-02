export type AdminLayer = "advanced" | "owner" | "site-admin";

type AdvancedRawTarget = {
  label?: string;
  rawHref: string;
};

type CollectionHrefOptions = {
  action?: "create";
  id?: number | string | null;
  label?: string;
  query?: string;
};

function normalizeQuery(query: string | undefined) {
  if (!query) {
    return "";
  }

  return query.startsWith("?") ? query : `?${query}`;
}

export function buildRawCollectionHref(collection: string, options: Omit<CollectionHrefOptions, "label"> = {}) {
  const recordSuffix =
    options.action === "create"
      ? "/create"
      : options.id === null || typeof options.id === "undefined" || options.id === ""
        ? ""
        : `/${options.id}`;

  return `/admin/collections/${collection}${recordSuffix}${normalizeQuery(options.query)}`;
}

export function isRawAdminHref(href: string) {
  return href === "/admin/collections" || href.startsWith("/admin/collections/");
}

export function buildAdvancedRawHref(target: AdvancedRawTarget) {
  const params = new URLSearchParams();
  params.set("raw", target.rawHref);

  if (target.label) {
    params.set("label", target.label);
  }

  return `/admin/advanced?${params.toString()}`;
}

export function buildAdvancedCollectionHref(collection: string, options: CollectionHrefOptions = {}) {
  const rawHref = buildRawCollectionHref(collection, options);

  return options.label
    ? buildAdvancedRawHref({
        label: options.label,
        rawHref,
      })
    : buildAdvancedRawHref({ rawHref });
}

export function wrapRawAdminHref(href: string, label?: string) {
  if (!isRawAdminHref(href)) {
    return href;
  }

  return label ? buildAdvancedRawHref({ label, rawHref: href }) : buildAdvancedRawHref({ rawHref: href });
}

export function getAdminLayerFromPath(pathname: string): AdminLayer {
  if (pathname.startsWith("/admin/advanced") || pathname.startsWith("/admin/collections")) {
    return "advanced";
  }

  if (pathname.startsWith("/admin/site-admin")) {
    return "site-admin";
  }

  return "owner";
}
