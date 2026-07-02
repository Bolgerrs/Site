import Link from "next/link";
import React from "react";

import { createSessionWorkbenchState } from "@/lib/admin-bff/workbench.ts";
import { createAdminPagePayloadRequest, requireAuthenticatedAdmin } from "@/lib/admin-bff/session.ts";
import { getRoleBadgeLabel } from "@/lib/payload/admin-shell.ts";

const menuItems = [
  { href: "/admin", id: "dashboard", label: "Панель", summary: "С чего начать и что под контролем" },
  { href: "/admin/site", id: "site", label: "Сайт", summary: "Страницы, блоки и публикация" },
  { href: "/admin/products", id: "products", label: "Продукты", summary: "Каталог и карточки" },
  { href: "/admin/media", id: "media", label: "Медиа", summary: "Фото, видео и документы" },
  { href: "/admin/leads?filter=all", id: "leads", label: "Заявки", summary: "Клиенты и обращения" },
  { href: "/admin/translations", id: "translations", label: "Переводы", summary: "Языки и пустые тексты" },
  { href: "/admin/checks", id: "checks", label: "Проверки", summary: "SEO, ссылки и готовность" },
  { href: "/admin/settings", id: "settings", label: "Настройки", summary: "Контакты и бренд" },
  { href: "/admin/advanced", id: "advanced", label: "Расширенные", summary: "Служебный слой" },
] as const;

type Props = {
  active: (typeof menuItems)[number]["id"] | "overview";
  children: React.ReactNode;
  layer?: "owner" | "admin" | "raw";
};

function getSurfaceId(active: Props["active"]) {
  if (active === "overview") {
    return "dashboard";
  }

  return active;
}

function getRoutePath(active: Props["active"]) {
  const surfaceId = getSurfaceId(active);
  return menuItems.find((item) => item.id === surfaceId)?.href ?? "/admin";
}

function getPrimaryAction(surfaceId: string) {
  switch (surfaceId) {
    case "dashboard":
      return { href: "/admin/site", label: "Изменить главную" };
    case "site":
      return { href: "http://89.150.34.66:8093/en", label: "Предпросмотр сайта", external: true };
    case "products":
      return { href: "/admin/products?mode=create", label: "Добавить продукт" };
    case "media":
      return { href: "/admin/media?filter=needs-rights", label: "Проверить медиа" };
    case "leads":
      return { href: "/admin/leads?filter=new", label: "Новые заявки" };
    case "translations":
      return { href: "/admin/translations?filter=missing", label: "Пустые переводы" };
    case "checks":
      return { href: "/admin/checks", label: "Открыть проблемы" };
    case "settings":
      return { href: "/admin/settings", label: "Изменить контакты" };
    default:
      return { href: "/admin/site", label: "Вернуться к сайту" };
  }
}

function getPublishStatusLabel(status: ReturnType<typeof createSessionWorkbenchState>["publishPlan"]["status"] | undefined) {
  switch (status) {
    case "blocked":
      return "есть блокеры";
    case "review":
      return "нужна проверка";
    case "draft":
      return "есть черновики";
    case "clear":
      return "готово";
    default:
      return "данные готовятся";
  }
}

export async function MontelarAdminAppShell({ active, children, layer = "owner" }: Props) {
  const surfaceId = getSurfaceId(active);
  const routePath = getRoutePath(active);
  const req = await createAdminPagePayloadRequest(routePath);
  const user = requireAuthenticatedAdmin(req);
  const workbench = createSessionWorkbenchState({
    routePath,
    role: user.role,
    userId: user.id ?? null,
  });
  const surfaces = workbench?.surfaces?.length
    ? workbench.surfaces
    : menuItems.map((item) => ({
        description: item.summary,
        href: item.href,
        id: item.id,
        kind: "workflow" as const,
        label: item.label,
        layer: item.id === "advanced" ? ("advanced" as const) : ("owner" as const),
        roleAccess: [],
        status: item.id === "advanced" ? ("restricted" as const) : ("available" as const),
  }));
  const currentSurface = surfaces.find((surface) => surface.id === surfaceId) ?? surfaces[0];
  const primaryAction = getPrimaryAction(currentSurface?.id ?? surfaceId);
  const resolvedPrimaryHref = primaryAction.href;
  const inspectorActions = workbench?.inspector.actions ?? [];
  const inspectorFacts = workbench?.inspector.facts ?? [];
  const inspectorIssues = workbench?.inspector.issues ?? [];

  return (
    <section className="montelar-site-workspace montelar-site-product montelar-site-console" data-layer={layer}>
      <aside className="montelar-site-console__rail" aria-label="Меню админки">
        <div className="montelar-site-console__brand">
          <span>M</span>
          <div>
            <strong>Montelar</strong>
            <p>админка сайта</p>
          </div>
        </div>

        <nav className="montelar-site-console__nav" aria-label="Главное меню">
          {surfaces.map((surface) => (
            <Link
              className={surface.id === surfaceId ? "is-active" : ""}
              href={surface.href}
              key={surface.id}
            >
              <strong>{surface.label}</strong>
              <span>{surface.description}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <div className="montelar-site-console__main">
        <header className="montelar-owner-shell-topbar">
          <div className="montelar-owner-shell-topbar__context">
            <span>{getRoleBadgeLabel(user)}</span>
            <strong>{currentSurface?.label ?? "Панель"}</strong>
            <p>{currentSurface?.description ?? "Единая рабочая панель Montelar."}</p>
          </div>
          <div className="montelar-owner-shell-topbar__actions">
            <Link href="http://89.150.34.66:8093/en" target="_blank">
              Посмотреть сайт
            </Link>
            <Link className="is-primary" href={resolvedPrimaryHref} target={primaryAction.external ? "_blank" : undefined}>
              {primaryAction.label}
            </Link>
          </div>
        </header>

        <div className="montelar-owner-shell-grid">
          <main className="montelar-owner-shell-grid__work">{children}</main>
          <aside className="montelar-owner-shell-inspector" aria-label="Инспектор раздела">
            <section>
              <span>Текущий раздел</span>
              <strong>{currentSurface?.label ?? "Панель"}</strong>
              <p>{workbench?.inspector.summary ?? currentSurface?.description ?? "Данные раздела загружаются."}</p>
            </section>

            <section>
              <span>Публикация</span>
              <strong>{getPublishStatusLabel(workbench?.publishPlan.status)}</strong>
              <p>{workbench?.publishPlan.summary ?? "Готовность выпуска собирается из рабочих разделов."}</p>
            </section>

            {inspectorFacts.length > 0 ? (
              <dl className="montelar-owner-shell-inspector__facts">
                {inspectorFacts.map((fact) => (
                  <div key={fact.label}>
                    <dt>{fact.label}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            {inspectorIssues.length > 0 ? (
              <section>
                <span>Что проверить</span>
                <div className="montelar-owner-shell-inspector__list">
                  {inspectorIssues.map((issue) => (
                    <article key={issue.id}>
                      <strong>{issue.title}</strong>
                      <p>{issue.description}</p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {inspectorActions.length > 0 ? (
              <section>
                <span>Дополнительно</span>
                <div className="montelar-owner-shell-inspector__actions">
                  {inspectorActions.slice(0, 4).map((action) =>
                    action.href ? (
                      <Link href={action.href} key={action.id}>
                        {action.label}
                      </Link>
                    ) : (
                      <button disabled key={action.id} type="button">
                        {action.label}
                      </button>
                    ),
                  )}
                </div>
              </section>
            ) : null}
          </aside>
        </div>
      </div>
    </section>
  );
}
