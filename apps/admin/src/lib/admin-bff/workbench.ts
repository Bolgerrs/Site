import type { Action, EditableSurface, InspectorState, Issue, PublishPlan, WorkbenchState } from "./dtos.ts";
import { getAdminLayerFromPath } from "./raw-layer.ts";
import { getAdminBffRoleFixture } from "./fixtures.ts";
import type { AdminDashboardSnapshot } from "../payload/admin-dashboard.ts";
import type { AdminRole } from "../payload/roles.ts";

const allOperatorRoles = [
  "owner",
  "admin",
  "content-editor",
  "lead-manager",
  "translator",
  "media-manager",
  "developer",
] as const satisfies readonly AdminRole[];

const publishingRoles = ["owner", "admin", "content-editor", "developer"] as const satisfies readonly AdminRole[];
const mediaRoles = ["owner", "admin", "media-manager", "developer"] as const satisfies readonly AdminRole[];
const leadRoles = ["owner", "admin", "lead-manager", "developer"] as const satisfies readonly AdminRole[];
const translationRoles = ["owner", "admin", "content-editor", "translator", "developer"] as const satisfies readonly AdminRole[];

export const baseWorkbenchSurfaces = [
  {
    description: "Первый экран, очереди и готовность к публикации.",
    href: "/admin",
    id: "dashboard",
    kind: "dashboard",
    label: "Панель",
    layer: "owner",
    primaryActionId: "open-dashboard",
    roleAccess: allOperatorRoles,
    status: "available",
  },
  {
    description: "Дерево страниц, блоки и спокойное редактирование.",
    href: "/admin/site",
    id: "site",
    kind: "page",
    label: "Сайт",
    layer: "owner",
    primaryActionId: "edit-site",
    roleAccess: publishingRoles,
    status: "available",
  },
  {
    description: "Каталог, карточки и готовность продуктов.",
    href: "/admin/products",
    id: "products",
    kind: "product",
    label: "Продукты",
    layer: "owner",
    primaryActionId: "edit-products",
    roleAccess: publishingRoles,
    status: "available",
  },
  {
    description: "Фото, видео, документы, замены и права.",
    href: "/admin/media",
    id: "media",
    kind: "media",
    label: "Медиа",
    layer: "owner",
    primaryActionId: "review-media",
    roleAccess: mediaRoles,
    status: "available",
  },
  {
    description: "Клиентские обращения, статусы и следующий шаг.",
    href: "/admin/leads",
    id: "leads",
    kind: "workflow",
    label: "Заявки",
    layer: "owner",
    primaryActionId: "review-leads",
    roleAccess: leadRoles,
    status: "available",
  },
  {
    description: "Пустые и устаревшие тексты по языкам.",
    href: "/admin/translations",
    id: "translations",
    kind: "translation",
    label: "Переводы",
    layer: "owner",
    primaryActionId: "review-translations",
    roleAccess: translationRoles,
    status: "available",
  },
  {
    description: "Проверки перед публикацией и исправимые проблемы.",
    href: "/admin/checks",
    id: "checks",
    kind: "workflow",
    label: "Проверки",
    layer: "owner",
    primaryActionId: "run-checks",
    roleAccess: publishingRoles,
    status: "available",
  },
  {
    description: "Контакты, бренд и простые настройки сайта.",
    href: "/admin/settings",
    id: "settings",
    kind: "settings",
    label: "Настройки",
    layer: "site-admin",
    primaryActionId: "edit-settings",
    roleAccess: ["owner", "admin", "developer"],
    status: "available",
  },
  {
    description: "Служебный слой только для редких действий.",
    href: "/admin/advanced",
    id: "advanced",
    kind: "settings",
    label: "Расширенные",
    layer: "advanced",
    primaryActionId: "open-advanced",
    roleAccess: ["owner", "developer"],
    status: "restricted",
  },
] as const satisfies readonly EditableSurface[];

function hasRoleAccess(role: AdminRole, surface: EditableSurface) {
  return surface.roleAccess.includes(role);
}

function createBaseActions(surfaces: readonly EditableSurface[]): Action[] {
  return surfaces.map((surface) => ({
    description: surface.description,
    href: surface.href,
    id: surface.primaryActionId ?? `open-${surface.id}`,
    intent: surface.layer === "advanced" ? "navigate" : "command",
    label: surface.label,
    surfaceId: surface.id,
    tone: surface.status === "restricted" ? "attention" : "neutral",
  }));
}

function createIssue(input: {
  actionId?: string;
  count: number;
  description: string;
  id: string;
  severity?: Issue["severity"];
  surfaceId: string;
  title: string;
}): Issue | null {
  if (input.count <= 0) {
    return null;
  }

  return {
    ...(input.actionId ? { actionId: input.actionId } : {}),
    description: input.description,
    id: input.id,
    severity: input.severity ?? "warning",
    status: "open",
    surfaceId: input.surfaceId,
    title: input.title,
  } satisfies Issue;
}

function createDefaultPublishPlan(issues: Issue[]): PublishPlan {
  const blockers = issues.filter((issue) => issue.severity === "blocker" || issue.severity === "critical");

  return {
    blockers,
    id: "site-publish-readiness",
    label: "Готовность к публикации",
    status: blockers.length > 0 ? "blocked" : issues.length > 0 ? "review" : "clear",
    steps: [
      {
        id: "content",
        label: "Контент и страницы",
        status: issues.some((issue) => issue.surfaceId === "site" || issue.surfaceId === "products") ? "pending" : "ready",
      },
      {
        id: "media",
        label: "Медиа и права",
        status: issues.some((issue) => issue.surfaceId === "media") ? "pending" : "ready",
      },
      {
        id: "locale",
        label: "Локали и переводы",
        status: issues.some((issue) => issue.surfaceId === "translations") ? "pending" : "ready",
      },
    ],
    summary: blockers.length > 0 ? "Есть блокеры выпуска." : issues.length > 0 ? "Есть очереди на проверку." : "Критичных блокеров не найдено.",
  };
}

function createInspectorState(input: {
  actions: Action[];
  issues: Issue[];
  title: string;
  summary: string;
}): InspectorState {
  return {
    actions: input.actions.slice(0, 4),
    facts: [
      {
        label: "Доступные действия",
        value: String(input.actions.length),
      },
      {
        label: "Открытые вопросы",
        value: String(input.issues.length),
      },
    ],
    issues: input.issues.slice(0, 5),
    summary: input.summary,
    title: input.title,
    tone: input.issues.some((issue) => issue.severity === "critical" || issue.severity === "blocker")
      ? "critical"
      : input.issues.length > 0
        ? "attention"
        : "positive",
  };
}

export function createSessionWorkbenchState(input: {
  generatedAt?: string;
  routePath: string;
  role: AdminRole;
  userId?: number | string | null;
}): WorkbenchState {
  const fixture = getAdminBffRoleFixture(input.role);
  const surfaces = baseWorkbenchSurfaces.filter((surface) => hasRoleAccess(input.role, surface));
  const actions = createBaseActions(surfaces);
  const issues: Issue[] = [];
  const publishPlan = createDefaultPublishPlan(issues);

  return {
    actions,
    capabilities: {
      advanced: fixture.surfaceIds.includes("advanced"),
      commands: true,
      ownerLayer: true,
      publish: hasRoleAccess(input.role, baseWorkbenchSurfaces.find((surface) => surface.id === "checks")!),
      siteAdmin: fixture.surfaceIds.includes("settings"),
    },
    currentLayer: getAdminLayerFromPath(input.routePath),
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    id: "owner-session",
    inspector: createInspectorState({
      actions,
      issues,
      summary: "Роль, доступы и действия собраны в рабочей панели Montelar.",
      title: fixture.label,
    }),
    issues,
    publishPlan,
    role: input.role,
    surfaces,
    summary: "Единое состояние панели владельца.",
    title: "Панель Montelar",
    userId: input.userId ?? null,
  };
}

export function createDashboardWorkbenchState(input: {
  dashboard: AdminDashboardSnapshot;
  generatedAt?: string;
  role: AdminRole;
  routePath?: string;
  userId?: number | string | null;
}): WorkbenchState {
  const surfaces = baseWorkbenchSurfaces.filter((surface) => hasRoleAccess(input.role, surface));
  const actions = [
    ...createBaseActions(surfaces),
    ...input.dashboard.releaseActions
      .filter((action) => action.visibility.includes(input.role))
      .map(
        (action): Action => ({
          description: action.description,
          href: action.href,
          id: `release-${action.id}`,
          intent: action.id.includes("preview") ? "preview" : "publish",
          label: action.label,
          surfaceId: "checks",
          tone: "neutral",
        }),
      ),
  ];
  const issues = [
    ...input.dashboard.widgets
      .filter((widget) => widget.visibility.includes(input.role))
      .map((widget) => {
        const actionId = widget.actions[0] ? `open-${widget.id}` : "";

        return createIssue({
          ...(actionId ? { actionId } : {}),
          count: widget.count,
          description: widget.description,
          id: `queue-${widget.id}`,
          severity: widget.tone === "alert" ? "critical" : "warning",
          surfaceId:
            widget.workspaceLabel === "Лиды"
              ? "leads"
              : widget.workspaceLabel === "Медиа" || widget.workspaceLabel === "Креатив"
                ? "media"
                : widget.workspaceLabel === "Переводы"
                  ? "translations"
                  : widget.workspaceLabel === "Публикация"
                    ? "checks"
                    : "dashboard",
          title: widget.label,
        });
      })
      .filter((issue): issue is Issue => Boolean(issue)),
  ];
  const publishPlan = createDefaultPublishPlan(issues);

  return {
    actions,
    capabilities: {
      advanced: surfaces.some((surface) => surface.id === "advanced"),
      commands: true,
      ownerLayer: true,
      publish: surfaces.some((surface) => surface.id === "checks"),
      siteAdmin: surfaces.some((surface) => surface.id === "settings"),
    },
    currentLayer: getAdminLayerFromPath(input.routePath ?? "/admin"),
    generatedAt: input.generatedAt ?? input.dashboard.generatedAt,
    id: "dashboard-workbench",
    inspector: createInspectorState({
      actions,
      issues,
      summary: publishPlan.summary,
      title: "Панель Montelar",
    }),
    issues,
    publishPlan,
    role: input.role,
    surfaces,
    summary: "Сводка нормализована для общей панели.",
    title: "Панель Montelar",
    userId: input.userId ?? null,
  };
}
