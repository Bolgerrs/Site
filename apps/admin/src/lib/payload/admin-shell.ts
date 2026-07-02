import { hasAdminRole, type AdminRole, type AdminUserLike } from "./roles.ts";

export type AdminWorkspace = {
  description: string;
  href: string;
  id: string;
  label: string;
  state: "live" | "planned" | "restricted";
  summary: string;
  visibility: readonly AdminRole[];
};

export type AdminWorkspaceGroup = {
  description: string;
  id: string;
  label: string;
  workspaceIds: readonly AdminWorkspace["id"][];
};

export type AdminNavigationProfile = {
  compactWorkspaceIds: readonly AdminWorkspace["id"][];
  groups: readonly AdminWorkspaceGroup[];
  roleLead: string;
};

export type AdminNavigationContext = {
  compactWorkspaces: AdminWorkspace[];
  currentWorkspace: AdminWorkspace;
  groups: Array<AdminWorkspaceGroup & { workspaces: AdminWorkspace[] }>;
  roleLabel: string;
  roleLead: string;
};

export const adminRoleLabels: Record<AdminRole, string> = {
  owner: "Владелец",
  admin: "Администратор",
  "content-editor": "Контент",
  "lead-manager": "Лиды",
  translator: "Переводы",
  "media-manager": "Медиа",
  developer: "Разработчик",
};

export const adminWorkspaceGroups: readonly AdminWorkspace[] = [
  {
    id: "overview",
    label: "Панель",
    href: "/admin",
    summary: "Сводка, приоритеты, публикация и быстрые входы.",
    description: "Первый экран владельца без коллекционного шума.",
    state: "live",
    visibility: ["owner", "admin", "content-editor", "lead-manager", "translator", "media-manager", "developer"],
  },
  {
    id: "catalog",
    label: "Продукты",
    href: "/admin/products",
    summary: "Направления, категории, продукты и порядок показа.",
    description: "Весь продуктовый слой сайта в одном рабочем разделе.",
    state: "live",
    visibility: ["owner", "admin", "content-editor", "developer"],
  },
  {
    id: "pages",
    label: "Сайт",
    href: "/admin/site",
    summary: "Дерево страниц, блоки, медиа, формы и публикация.",
    description: "Страницы и блоки для менеджера без технических обходов.",
    state: "live",
    visibility: ["owner", "admin", "content-editor", "translator", "developer"],
  },
  {
    id: "forms",
    label: "Формы",
    href: "/admin/site-admin",
    summary: "Сценарии заявок и поля контакта.",
    description: "Поддерживающий слой для продуктовых и лидовых сценариев.",
    state: "live",
    visibility: ["owner", "admin", "content-editor", "lead-manager", "developer"],
  },
  {
    id: "leads",
    label: "Заявки",
    href: "/admin/leads",
    summary: "Входящие обращения, статусы и следующий шаг.",
    description: "Рабочий инбокс клиентских обращений.",
    state: "live",
    visibility: ["owner", "admin", "content-editor", "lead-manager", "translator", "developer"],
  },
  {
    id: "crm",
    label: "CRM",
    href: "/admin#crm",
    summary: "Контакты и история общения.",
    description: "Глубокий слой для будущей CRM, скрыт из обычного маршрута.",
    state: "restricted",
    visibility: ["owner", "admin", "lead-manager", "developer"],
  },
  {
    id: "translations",
    label: "Переводы",
    href: "/admin/translations",
    summary: "Языки, пустые поля и устаревшие тексты.",
    description: "Контроль готовности переводов к публикации.",
    state: "live",
    visibility: ["owner", "admin", "translator", "content-editor", "developer"],
  },
  {
    id: "media",
    label: "Медиа",
    href: "/admin/media",
    summary: "Фото, видео, документы, права и замены.",
    description: "Библиотека материалов и мест их использования.",
    state: "live",
    visibility: ["owner", "admin", "media-manager", "developer"],
  },
  {
    id: "creative",
    label: "Креатив",
    href: "/admin#creative",
    summary: "Референсы, генерации и согласования.",
    description: "Глубокий творческий слой, не основной маршрут владельца.",
    state: "restricted",
    visibility: ["owner", "admin", "content-editor", "media-manager", "developer"],
  },
  {
    id: "seo",
    label: "Проверки",
    href: "/admin/checks",
    summary: "Блокеры публикации, метаданные и сигналы готовности.",
    description: "Единый owner-friendly health-центр без raw SEO-таблиц на первом слое.",
    state: "live",
    visibility: ["owner", "admin", "content-editor", "translator", "developer"],
  },
  {
    id: "settings",
    label: "Настройки",
    href: "/admin/settings",
    summary: "Контакты и главные кнопки владельца плюс переход ко второму слою настроек сайта.",
    description: "Первый шаг для владельца. Рабочий слой настроек сайта и технический fallback вынесены отдельно.",
    state: "live",
    visibility: ["owner", "admin", "developer"],
  },
  {
    id: "advanced",
    label: "Расширенные",
    href: "/admin/advanced",
    summary: "Пользователи, аудит и редкие служебные настройки.",
    description: "Технический слой для владельца и разработчика, не для ежедневной работы.",
    state: "restricted",
    visibility: ["owner", "developer"],
  },
] as const;

const workspaceById = new Map(adminWorkspaceGroups.map((workspace) => [workspace.id, workspace]));

const adminNavigationProfiles: Record<AdminRole, AdminNavigationProfile> = {
  owner: {
    roleLead: "Первый слой собран вокруг повседневных задач владельца. Глубокие настройки вынесены отдельно.",
    compactWorkspaceIds: ["overview", "pages", "catalog", "media", "leads", "translations", "seo", "settings", "advanced"],
    groups: [
      {
        id: "owner-main",
        label: "Основные разделы",
        description: "Ровно те разделы, где владелец понимает куда идти без технического перевода.",
        workspaceIds: ["overview", "pages", "catalog", "media", "leads", "translations", "seo", "settings", "advanced"],
      },
      {
        id: "owner-support",
        label: "Связанные потоки",
        description: "Редкие поддерживающие поверхности, которые пока ещё не встроены в сценарии страниц и продуктов.",
        workspaceIds: ["forms"],
      },
    ],
  },
  admin: {
    roleLead: "Открыты только рабочие зоны без raw Payload-шума.",
    compactWorkspaceIds: ["overview", "pages", "catalog", "media", "leads", "translations", "seo", "settings"],
    groups: [
      {
        id: "admin-main",
        label: "Основные разделы",
        description: "Контент, продукты, медиа, заявки, переводы, проверки и настройки сайта.",
        workspaceIds: ["overview", "pages", "catalog", "media", "leads", "translations", "seo", "settings"],
      },
      {
        id: "admin-support",
        label: "Связанные потоки",
        description: "Поддерживающие рабочие поверхности вне первого слоя.",
        workspaceIds: ["forms", "creative", "crm"],
      },
    ],
  },
  "content-editor": {
    roleLead: "Редактор видит страницы, продукты, переводы и проверки без CRM и технических настроек.",
    compactWorkspaceIds: ["pages", "catalog", "translations", "seo"],
    groups: [
      {
        id: "content-main",
        label: "Контент",
        description: "Все редакторские задачи в одном коротком меню.",
        workspaceIds: ["pages", "catalog", "translations", "seo", "overview"],
      },
      {
        id: "content-support",
        label: "Связанные потоки",
        description: "Формы пока остаются отдельной surface до следующего UX-pass.",
        workspaceIds: ["forms"],
      },
    ],
  },
  "lead-manager": {
    roleLead: "Лид-инбокс остается первой задачей, а формы и CRM помечены только как supporting layer.",
    compactWorkspaceIds: ["leads", "overview"],
    groups: [
      {
        id: "lead-primary",
        label: "Клиентский поток",
        description: "Очередь новых и overdue обращений, next action и supporting form logic.",
        workspaceIds: ["leads"],
      },
      {
        id: "lead-support",
        label: "Контекст",
        description: "Обзор и later CRM слой остаются рядом, но не вытесняют лиды.",
        workspaceIds: ["overview", "forms", "crm"],
      },
    ],
  },
  translator: {
    roleLead: "Видит переводческий поток первым, а страницы и проверки остаются рядом как publishing context.",
    compactWorkspaceIds: ["translations", "overview", "pages", "seo"],
    groups: [
      {
        id: "translator-primary",
        label: "Переводческий поток",
        description: "Stale, blocked и review-required locale work без owner-only clutter.",
        workspaceIds: ["translations", "pages"],
      },
      {
        id: "translator-support",
        label: "Публикационный контекст",
        description: "SEO и общий обзор остаются доступными для проверки release readiness.",
        workspaceIds: ["seo", "overview"],
      },
    ],
  },
  "media-manager": {
    roleLead: "Фокусируется на media rights, approvals и placement readiness без каталожного шума.",
    compactWorkspaceIds: ["media", "overview", "creative"],
    groups: [
      {
        id: "media-primary",
        label: "Медиа-контур",
        description: "Assets, rights, approvals и творческие кандидаты в одной роли.",
        workspaceIds: ["media", "creative"],
      },
      {
        id: "media-support",
        label: "Контекст",
        description: "Обзор дня остается для координации с owner/admin.",
        workspaceIds: ["overview"],
      },
    ],
  },
  developer: {
    roleLead: "Сначала видит owner-friendly слой, затем отдельный технический fallback для диагностики.",
    compactWorkspaceIds: ["overview", "pages", "catalog", "media", "leads", "translations", "seo", "settings", "advanced"],
    groups: [
      {
        id: "dev-main",
        label: "Основные разделы",
        description: "Сначала проверяем owner-friendly интерфейс, а не raw collections.",
        workspaceIds: ["overview", "pages", "catalog", "media", "leads", "translations", "seo", "settings", "advanced"],
      },
      {
        id: "dev-support",
        label: "Связанные потоки",
        description: "Формы, creative и CRM остаются доступными, но не доминируют в первом слое.",
        workspaceIds: ["forms", "creative", "crm"],
      },
    ],
  },
};

function getDefaultWorkspaceForRole(role: AdminRole) {
  const [defaultWorkspaceId = "overview"] = adminNavigationProfiles[role].compactWorkspaceIds;

  return workspaceById.get(defaultWorkspaceId) ?? adminWorkspaceGroups[0]!;
}

export function getPrimaryAdminWorkspace(role: AdminRole | null | undefined): AdminWorkspace | null {
  if (!role) {
    return null;
  }

  return getDefaultWorkspaceForRole(role);
}

export function resolveAdminWorkspaceIdFromPath(pathname: string): AdminWorkspace["id"] | null {
  if (!pathname || pathname === "/admin") {
    return "overview";
  }

  if (pathname.startsWith("/admin/leads")) {
    return "leads";
  }

  if (pathname.startsWith("/admin/site")) {
    return "pages";
  }

  if (pathname.startsWith("/admin/translations")) {
    return "translations";
  }

  if (pathname.startsWith("/admin/checks")) {
    return "seo";
  }

  if (pathname.startsWith("/admin/media")) {
    return "media";
  }

  if (pathname.startsWith("/admin/settings")) {
    return "settings";
  }

  if (pathname.startsWith("/admin/site-admin")) {
    return "settings";
  }

  if (pathname.startsWith("/admin/advanced")) {
    return "advanced";
  }

  if (
    pathname.startsWith("/admin/collections/products") ||
    pathname.startsWith("/admin/collections/product-directions") ||
    pathname.startsWith("/admin/collections/product-categories") ||
    pathname.startsWith("/admin/collections/product-lines") ||
    pathname.startsWith("/admin/collections/product-variants")
  ) {
    return "catalog";
  }

  if (
    pathname.startsWith("/admin/collections/pages") ||
    pathname.startsWith("/admin/collections/page-sections")
  ) {
    return "pages";
  }

  if (pathname.startsWith("/admin/collections/productInquiryForms")) {
    return "leads";
  }

  if (pathname.startsWith("/admin/collections/seo-entries")) {
    return "seo";
  }

  if (pathname.startsWith("/admin/collections/locales")) {
    return "translations";
  }

  if (
    pathname.startsWith("/admin/collections/media-assets") ||
    pathname.startsWith("/admin/collections/product-documents") ||
    pathname.startsWith("/admin/collections/product-media")
  ) {
    return "media";
  }

  if (
    pathname.startsWith("/admin/collections/site-settings") ||
    pathname.startsWith("/admin/collections/navigation-menus")
  ) {
    return "settings";
  }

  if (
    pathname.startsWith("/admin/collections/admin-users") ||
    pathname.startsWith("/admin/collections/audit-events") ||
    pathname.startsWith("/admin/collections/system-media")
  ) {
    return "advanced";
  }

  return null;
}

export function getVisibleAdminWorkspaces(user: AdminUserLike): AdminWorkspace[] {
  return adminWorkspaceGroups.filter((workspace) => hasAdminRole(user, workspace.visibility));
}

export function getAdminNavigationContext(
  role: AdminRole | null | undefined,
  pathname = "/admin",
): AdminNavigationContext | null {
  if (!role) {
    return null;
  }

  const profile = adminNavigationProfiles[role];
  const visibleWorkspaces = getVisibleAdminWorkspaces({ role });
  const visibleWorkspaceIds = new Set(visibleWorkspaces.map((workspace) => workspace.id));
  const matchedWorkspaceId = resolveAdminWorkspaceIdFromPath(pathname);
  const currentWorkspace = (
    (matchedWorkspaceId && visibleWorkspaceIds.has(matchedWorkspaceId)
      ? workspaceById.get(matchedWorkspaceId)
      : null) ?? getDefaultWorkspaceForRole(role)
  )!;

  const groups = profile.groups
    .map((group) => {
      const workspaces = group.workspaceIds
        .map((workspaceId) => workspaceById.get(workspaceId))
        .filter((workspace): workspace is AdminWorkspace => Boolean(workspace && visibleWorkspaceIds.has(workspace.id)));

      if (workspaces.length === 0) {
        return null;
      }

      return {
        ...group,
        workspaces,
      };
    })
    .filter((group): group is AdminNavigationContext["groups"][number] => Boolean(group));

  const compactWorkspaces = profile.compactWorkspaceIds
    .map((workspaceId) => workspaceById.get(workspaceId))
    .filter((workspace): workspace is AdminWorkspace => Boolean(workspace && visibleWorkspaceIds.has(workspace.id)));

  if (!compactWorkspaces.some((workspace) => workspace.id === currentWorkspace.id)) {
    compactWorkspaces.unshift(currentWorkspace);
  }

  return {
    compactWorkspaces,
    currentWorkspace,
    groups,
    roleLabel: adminRoleLabels[role],
    roleLead: profile.roleLead,
  };
}

export function getRoleBadgeLabel(user: AdminUserLike): string {
  if (!user?.role) {
    return "Гость";
  }

  return adminRoleLabels[user.role];
}
