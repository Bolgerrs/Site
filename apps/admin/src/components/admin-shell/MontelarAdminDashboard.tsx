"use client";

import { useAuth, useConfig, usePayloadAPI } from "@payloadcms/ui";
import { formatAdminURL } from "payload/shared";
import Link from "next/link";

import {
  type AdminDashboardFeedItem,
  type AdminDashboardHealthItem,
  type AdminDashboardReleaseAction,
  type AdminDashboardSnapshot,
  type AdminDashboardStatusCard,
  type AdminDashboardWidget,
  getVisibleAdminDashboardQuickActions,
} from "@/lib/payload/admin-dashboard.ts";
import { getRoleBadgeLabel } from "@/lib/payload/admin-shell.ts";
import { hasAdminRole } from "@/lib/payload/roles.ts";

const emptySnapshot: AdminDashboardSnapshot = {
  generatedAt: "",
  healthItems: [],
  latestChanges: [],
  latestLeads: [],
  releaseActions: [],
  statusCards: [],
  widgets: [],
};

function resolveAdminHref(adminRoute: string, href: string) {
  if (href.startsWith("/admin")) {
    const [rawPath, rawSearch = ""] = href.replace(/^\/admin/, "").split("?", 2);
    const path = (rawPath || "/") as `/${string}`;
    const resolved = formatAdminURL({ adminRoute, path });

    return rawSearch ? `${resolved}?${rawSearch}` : resolved;
  }

  return href;
}

function formatWidgetCount(count: number) {
  return Intl.NumberFormat("ru-RU").format(count);
}

function getWidgetToneLabel(widget: AdminDashboardWidget) {
  if (widget.count === 0) {
    return "спокойно";
  }

  return widget.tone === "alert" ? "срочно" : widget.tone === "attention" ? "внимание" : "в работе";
}

function getHealthStateLabel(item: AdminDashboardHealthItem) {
  return item.state === "attention" ? "требует решения" : item.state === "watch" ? "проверить" : "в норме";
}

function getVisibleStatusCards(
  userRole: string | null | undefined,
  cards: readonly AdminDashboardStatusCard[],
) {
  if (!userRole) {
    return [];
  }

  return cards.filter((card) => card.visibility.includes(userRole as never));
}

function getVisibleHealthItems(
  userRole: string | null | undefined,
  items: readonly AdminDashboardHealthItem[],
) {
  if (!userRole) {
    return [];
  }

  return items.filter((item) => item.visibility.includes(userRole as never));
}

function getVisibleReleaseActions(
  userRole: string | null | undefined,
  actions: readonly AdminDashboardReleaseAction[],
) {
  if (!userRole) {
    return [];
  }

  return actions.filter((action) => action.visibility.includes(userRole as never));
}

function DashboardFeedSection({
  adminRoute,
  emptyDescription,
  items,
  title,
}: {
  adminRoute: string;
  emptyDescription: string;
  items: AdminDashboardFeedItem[];
  title: string;
}) {
  return (
    <section className="montelar-admin-workbench__panel">
      <div className="montelar-admin-workbench__panel-head">
        <strong>{title}</strong>
      </div>

      {items.length === 0 ? (
        <p className="montelar-admin-workbench__empty">{emptyDescription}</p>
      ) : (
        <div className="montelar-admin-workbench__activity-list">
          {items.map((item) => (
            <Link href={resolveAdminHref(adminRoute, item.href)} key={item.id}>
              <strong>{item.label}</strong>
              <small>{item.meta}</small>
              <span>{item.status}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export function MontelarAdminDashboard() {
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig();
  const { user } = useAuth();
  const [{ data, isError, isLoading }] = usePayloadAPI("/api/internal/admin-dashboard", {
    initialData: emptySnapshot,
  });
  const snapshot = (data as AdminDashboardSnapshot | undefined) ?? emptySnapshot;
  const userRole = user?.role ?? null;
  const visibleWidgets = snapshot.widgets.filter((widget) => hasAdminRole(user, widget.visibility));
  const visibleQuickActions = getVisibleAdminDashboardQuickActions(userRole, visibleWidgets);
  const visibleStatusCards = getVisibleStatusCards(userRole, snapshot.statusCards);
  const visibleHealthItems = getVisibleHealthItems(userRole, snapshot.healthItems);
  const visibleReleaseActions = getVisibleReleaseActions(userRole, snapshot.releaseActions);
  const urgentQueues = visibleWidgets.filter((widget) => widget.count > 0).length;
  const primaryQuickActions = visibleQuickActions.slice(0, 6);
  const secondaryQuickActions = visibleQuickActions.slice(primaryQuickActions.length);
  const statusRows = [
    ["Роль", getRoleBadgeLabel(user)],
    ["Срочные очереди", urgentQueues > 0 ? `${urgentQueues} требуют решения` : "критичных очередей нет"],
    ["Доступные действия", `${visibleQuickActions.length} прямых входов`],
    ["Срез данных", snapshot.generatedAt ? "панель обновлена" : "данные готовятся"],
  ] as const;

  return (
    <section className="montelar-admin-dashboard montelar-admin-workbench" aria-labelledby="montelar-admin-dashboard-title">
      <header className="montelar-admin-workbench__header">
        <div>
          <p className="montelar-admin-dashboard__eyebrow">Панель Montelar</p>
          <h1 id="montelar-admin-dashboard-title">Выберите, что хотите изменить на сайте</h1>
          <p>
            Первые действия ведут сразу к главной, страницам, продуктам, медиа, заявкам и проверке перед
            публикацией. Очереди и служебный контроль остаются ниже, когда они действительно нужны.
          </p>
        </div>

        <dl className="montelar-admin-workbench__facts">
          {statusRows.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="montelar-admin-workbench__layout">
        <main className="montelar-admin-workbench__main">
          <section className="montelar-admin-workbench__panel montelar-admin-workbench__panel--primary">
            <div className="montelar-admin-workbench__panel-head">
              <strong>С чего начать</strong>
              <span>{primaryQuickActions.length} действий</span>
            </div>
            <div className="montelar-admin-workbench__priority-list">
              {primaryQuickActions.map((action) => (
                <Link
                  className="montelar-admin-workbench__priority-link"
                  href={resolveAdminHref(adminRoute, action.href)}
                  key={action.id}
                >
                  <div className="montelar-admin-workbench__priority-copy">
                    <span>{action.summary}</span>
                    <strong>{action.label}</strong>
                    <p>{action.description}</p>
                  </div>
                  <div className="montelar-admin-workbench__priority-meta">
                    <b>{action.value}</b>
                    <small>Открыть</small>
                  </div>
                </Link>
              ))}
            </div>
            {primaryQuickActions.length === 0 ? (
              <p className="montelar-admin-workbench__empty">
                Для вашей роли пока нет прямых действий. Откройте соседние разделы или проверьте права доступа.
              </p>
            ) : null}
          </section>

          <section className="montelar-admin-workbench__panel">
            <div className="montelar-admin-workbench__panel-head">
              <strong>Что требует внимания</strong>
              <span>{isLoading ? "обновляем" : isError ? "ошибка данных" : `${visibleWidgets.length} потоков`}</span>
            </div>

            {isLoading ? <p className="montelar-admin-workbench__empty">Собираем лиды, публикацию, переводы и медиа.</p> : null}
            {isError ? (
              <p className="montelar-admin-workbench__empty is-error">Сводка временно недоступна. Проверьте admin runtime.</p>
            ) : null}

            <div className="montelar-admin-workbench__table">
              {visibleWidgets.map((widget) => (
                <div className="montelar-admin-workbench__row" id={widget.id} key={widget.id}>
                  <div>
                    <span>{widget.workspaceLabel}</span>
                    <strong>{widget.label}</strong>
                    <p>{widget.description}</p>
                  </div>
                  <div className="montelar-admin-workbench__count">
                    <b>{formatWidgetCount(widget.count)}</b>
                    <small>{widget.summary}</small>
                  </div>
                  <div className="montelar-admin-workbench__row-actions">
                    <span className={`montelar-admin-state montelar-admin-state--${widget.tone}`}>
                      {getWidgetToneLabel(widget)}
                    </span>
                    {widget.actions[0] ? (
                      <Link href={resolveAdminHref(adminRoute, widget.actions[0].href)}>
                        {widget.actions[0].label}
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            {!isLoading && !isError && visibleWidgets.length === 0 ? (
              <p className="montelar-admin-workbench__empty">
                Критичных очередей нет. Откройте быстрые действия справа, чтобы перейти к сайту, продуктам или проверкам.
              </p>
            ) : null}
          </section>

          <section className="montelar-admin-workbench__panel">
            <div className="montelar-admin-workbench__panel-head">
              <strong>Черновики, выпуск и здоровье сайта</strong>
              <span>публикация</span>
            </div>
            <div className="montelar-admin-workbench__table">
              {visibleStatusCards.map((card) => (
                <div className="montelar-admin-workbench__row" key={card.id}>
                  <div>
                    <span>{card.label}</span>
                    <strong>{card.value}</strong>
                    <p>{card.description}</p>
                  </div>
                  <div className="montelar-admin-workbench__row-actions">
                    <Link href={resolveAdminHref(adminRoute, card.href)}>{card.ctaLabel}</Link>
                  </div>
                </div>
              ))}

              {visibleReleaseActions.map((action) => (
                <div className="montelar-admin-workbench__row" key={action.id}>
                  <div>
                    <span>{action.label}</span>
                    <strong>{action.ctaLabel}</strong>
                    <p>{action.description}</p>
                  </div>
                  <div className="montelar-admin-workbench__row-actions">
                    <Link href={resolveAdminHref(adminRoute, action.href)}>{action.ctaLabel}</Link>
                  </div>
                </div>
              ))}

              {visibleHealthItems.map((item) => (
                <div className="montelar-admin-workbench__row" key={item.id}>
                  <div>
                    <span>{item.label}</span>
                    <strong>{item.summary}</strong>
                  </div>
                  <div className="montelar-admin-workbench__row-actions">
                    <span className={`montelar-admin-state montelar-admin-state--${item.state}`}>
                      {getHealthStateLabel(item)}
                    </span>
                    <Link href={resolveAdminHref(adminRoute, item.href)}>{item.ctaLabel}</Link>
                  </div>
                </div>
              ))}
            </div>
            {visibleStatusCards.length === 0 && visibleReleaseActions.length === 0 && visibleHealthItems.length === 0 ? (
              <p className="montelar-admin-workbench__empty">
                Черновики, публикация и здоровье сайта появятся здесь после первого изменения контента.
              </p>
            ) : null}
          </section>
        </main>

        <aside className="montelar-admin-workbench__side">
          <section className="montelar-admin-workbench__panel">
            <div className="montelar-admin-workbench__panel-head">
              <strong>Сегодня под контролем</strong>
              <span>{urgentQueues > 0 ? `${urgentQueues} очереди` : "спокойно"}</span>
            </div>
            <dl className="montelar-admin-workbench__facts montelar-admin-workbench__facts--stacked">
              {statusRows.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            {secondaryQuickActions.length > 0 ? (
              <div className="montelar-admin-workbench__action-list montelar-admin-workbench__action-list--compact">
                {secondaryQuickActions.map((action) => (
                  <Link href={resolveAdminHref(adminRoute, action.href)} key={action.id}>
                    <span>{action.summary}</span>
                    <strong>{action.label}</strong>
                    <small>{action.value}</small>
                  </Link>
                ))}
              </div>
            ) : null}
          </section>

          <DashboardFeedSection
            adminRoute={adminRoute}
            emptyDescription="Новых заявок пока нет."
            items={snapshot.latestLeads}
            title="Последние заявки"
          />
          <DashboardFeedSection
            adminRoute={adminRoute}
            emptyDescription="Сегодня еще не было заметных обновлений."
            items={snapshot.latestChanges}
            title="Что менялось сегодня"
          />
        </aside>
      </div>
    </section>
  );
}
