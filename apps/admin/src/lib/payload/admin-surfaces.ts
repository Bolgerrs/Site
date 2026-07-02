import type { CollectionConfig } from "payload";

import { getAdminUser } from "./access.ts";
import { hasAdminRole, type AdminRole } from "./roles.ts";

export type AdminSurfaceClassification =
  | "owner-primary"
  | "owner-secondary"
  | "developer-only";

export type AdminCollectionSurface = {
  adminRoles: readonly AdminRole[];
  classification: AdminSurfaceClassification;
  group: string;
  href: `/admin/collections/${string}`;
  labels: {
    plural: string;
    singular: string;
  };
  slug: string;
  summary: string;
};

export const adminCollectionSurfaces = [
  {
    slug: "products",
    classification: "owner-primary",
    group: "Owner: catalog",
    labels: {
      singular: "Каталожный продукт",
      plural: "Каталожные продукты",
    },
    href: "/admin/collections/products",
    summary: "Главная product workspace surface.",
    adminRoles: ["owner", "admin", "content-editor", "developer"],
  },
  {
    slug: "product-directions",
    classification: "owner-primary",
    group: "Owner: catalog",
    labels: {
      singular: "Направление каталога",
      plural: "Направления каталога",
    },
    href: "/admin/collections/product-directions",
    summary: "Верхний уровень продуктовой карты.",
    adminRoles: ["owner", "admin", "content-editor", "developer"],
  },
  {
    slug: "product-categories",
    classification: "owner-primary",
    group: "Owner: catalog",
    labels: {
      singular: "Категория каталога",
      plural: "Категории каталога",
    },
    href: "/admin/collections/product-categories",
    summary: "Категории внутри направлений.",
    adminRoles: ["owner", "admin", "content-editor", "developer"],
  },
  {
    slug: "product-lines",
    classification: "owner-primary",
    group: "Owner: catalog",
    labels: {
      singular: "Линейка каталога",
      plural: "Линейки каталога",
    },
    href: "/admin/collections/product-lines",
    summary: "Линейки и семейства продуктов.",
    adminRoles: ["owner", "admin", "content-editor", "developer"],
  },
  {
    slug: "pages",
    classification: "owner-primary",
    group: "Owner: site content",
    labels: {
      singular: "Страница сайта",
      plural: "Страницы сайта",
    },
    href: "/admin/collections/pages",
    summary: "Основные страницы и route-level content.",
    adminRoles: ["owner", "admin", "content-editor", "translator", "developer"],
  },
  {
    slug: "page-sections",
    classification: "owner-primary",
    group: "Owner: site content",
    labels: {
      singular: "Секция страницы",
      plural: "Секции страниц",
    },
    href: "/admin/collections/page-sections",
    summary: "Narrative and module sections behind pages.",
    adminRoles: ["owner", "admin", "content-editor", "translator", "developer"],
  },
  {
    slug: "productInquiryForms",
    classification: "owner-primary",
    group: "Owner: leads and forms",
    labels: {
      singular: "Форма заявки",
      plural: "Формы заявок",
    },
    href: "/admin/collections/productInquiryForms",
    summary: "Governed inquiry forms, not a raw builder maze.",
    adminRoles: ["owner", "admin", "content-editor", "lead-manager", "developer"],
  },
  {
    slug: "leads",
    classification: "owner-primary",
    group: "Owner: leads and forms",
    labels: {
      singular: "Лид",
      plural: "Лиды",
    },
    href: "/admin/collections/leads",
    summary: "Incoming requests and follow-up records.",
    adminRoles: ["owner", "admin", "lead-manager", "developer"],
  },
  {
    slug: "translations",
    classification: "owner-primary",
    group: "Owner: localization",
    labels: {
      singular: "Перевод",
      plural: "Переводы",
    },
    href: "/admin/collections/translations",
    summary: "Localized content records and workflow state.",
    adminRoles: ["owner", "admin", "content-editor", "translator", "developer"],
  },
  {
    slug: "media-assets",
    classification: "owner-primary",
    group: "Owner: media library",
    labels: {
      singular: "Медиа-asset",
      plural: "Медиа-asset library",
    },
    href: "/admin/collections/media-assets",
    summary: "Primary approved asset library.",
    adminRoles: ["owner", "admin", "media-manager", "developer"],
  },
  {
    slug: "product-documents",
    classification: "owner-primary",
    group: "Owner: media library",
    labels: {
      singular: "Документ продукта",
      plural: "Документы продуктов",
    },
    href: "/admin/collections/product-documents",
    summary: "PDF, spec sheets and governed downloads.",
    adminRoles: ["owner", "admin", "media-manager", "developer"],
  },
  {
    slug: "seo-entries",
    classification: "owner-secondary",
    group: "Owner: supporting records",
    labels: {
      singular: "SEO запись",
      plural: "SEO записи",
    },
    href: "/admin/collections/seo-entries",
    summary: "Supporting SEO records behind guided page/product flows.",
    adminRoles: ["owner", "admin", "content-editor", "translator", "developer"],
  },
  {
    slug: "locales",
    classification: "owner-secondary",
    group: "Owner: supporting records",
    labels: {
      singular: "Локаль запуска",
      plural: "Локали запуска",
    },
    href: "/admin/collections/locales",
    summary: "Launch-locale controls behind translation workflow.",
    adminRoles: ["owner", "admin", "translator", "developer"],
  },
  {
    slug: "product-variants",
    classification: "owner-secondary",
    group: "Owner: supporting records",
    labels: {
      singular: "Вариант продукта",
      plural: "Варианты продуктов",
    },
    href: "/admin/collections/product-variants",
    summary: "Supporting variant records for product editor.",
    adminRoles: ["owner", "admin", "content-editor", "developer"],
  },
  {
    slug: "product-media",
    classification: "owner-secondary",
    group: "Owner: supporting records",
    labels: {
      singular: "Медиа-привязка",
      plural: "Медиа-привязки",
    },
    href: "/admin/collections/product-media",
    summary: "Technical media placements behind curated media workflow.",
    adminRoles: ["owner", "admin", "media-manager", "developer"],
  },
  {
    slug: "navigation-menus",
    classification: "owner-secondary",
    group: "Owner: supporting records",
    labels: {
      singular: "Навигационное меню",
      plural: "Навигационные меню",
    },
    href: "/admin/collections/navigation-menus",
    summary: "Supporting navigation records behind guided site governance.",
    adminRoles: ["owner", "admin", "content-editor", "developer"],
  },
  {
    slug: "site-settings",
    classification: "owner-secondary",
    group: "Owner: supporting records",
    labels: {
      singular: "Настройка сайта",
      plural: "Настройки сайта",
    },
    href: "/admin/collections/site-settings",
    summary: "Global settings and guardrails, not daily editing.",
    adminRoles: ["owner", "admin", "developer"],
  },
  {
    slug: "admin-users",
    classification: "developer-only",
    group: "Developer: platform",
    labels: {
      singular: "Пользователь платформы",
      plural: "Пользователи платформы",
    },
    href: "/admin/collections/admin-users",
    summary: "Users, roles and bootstrap access.",
    adminRoles: ["owner", "developer"],
  },
  {
    slug: "audit-events",
    classification: "developer-only",
    group: "Developer: platform",
    labels: {
      singular: "Аудит-событие",
      plural: "Аудит-события",
    },
    href: "/admin/collections/audit-events",
    summary: "Sensitive audit trail and operator history.",
    adminRoles: ["owner", "developer"],
  },
  {
    slug: "system-media",
    classification: "developer-only",
    group: "Developer: platform",
    labels: {
      singular: "Системный файл",
      plural: "Системные файлы",
    },
    href: "/admin/collections/system-media",
    summary: "Technical runtime media, not owner-facing assets.",
    adminRoles: ["owner", "developer"],
  },
] as const satisfies readonly AdminCollectionSurface[];

const adminCollectionSurfaceMap = new Map<string, AdminCollectionSurface>(
  adminCollectionSurfaces.map((surface) => [surface.slug, surface]),
);

export function getAdminCollectionSurface(slug: string) {
  return adminCollectionSurfaceMap.get(slug);
}

export function getVisibleRawAdminCollections(role: AdminRole | null) {
  if (!role) {
    return [];
  }

  return adminCollectionSurfaces.filter((surface) =>
    (surface.adminRoles as readonly AdminRole[]).includes(role),
  );
}

export function applyAdminSurfaceProfile(config: CollectionConfig): CollectionConfig {
  const surface = getAdminCollectionSurface(config.slug);

  if (!surface) {
    return config;
  }

  const existingAdminAccess = config.access?.admin;

  return {
    ...config,
    access: {
      ...(config.access ?? {}),
      admin: async (args) => {
        const user = getAdminUser(args.req.user);
        const requestUrl = typeof args.req.url === "string" ? args.req.url : "";
        const userCollection =
          user && typeof user === "object" && "collection" in user && typeof user.collection === "string"
            ? user.collection
            : null;
        const isOwnUserCollection = userCollection === config.slug;
        const targetsOwnRawCollection = requestUrl.includes(`/collections/${config.slug}`);

        if (isOwnUserCollection && !targetsOwnRawCollection) {
          if (!existingAdminAccess) {
            return true;
          }

          return Boolean(await existingAdminAccess(args));
        }

        if (!hasAdminRole(user, surface.adminRoles)) {
          return false;
        }

        if (!existingAdminAccess) {
          return true;
        }

        return Boolean(await existingAdminAccess(args));
      },
    },
    admin: {
      ...(config.admin ?? {}),
      group: surface.group,
    },
    labels: surface.labels,
  };
}
