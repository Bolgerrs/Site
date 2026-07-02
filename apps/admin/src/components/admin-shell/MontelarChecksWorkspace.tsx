"use client";

import { useAuth, useConfig } from "@payloadcms/ui";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { formatAdminURL } from "payload/shared";
import React from "react";

import type {
  CheckRepairAction,
  ChecksWorkspaceCard,
  ChecksWorkspaceSnapshot,
} from "@/lib/payload/checks-workspace.ts";
import { hasAdminRole } from "@/lib/payload/roles.ts";

const emptySnapshot: ChecksWorkspaceSnapshot = {
  activeCheck: "site-health",
  canPublish: false,
  canRead: false,
  checks: [],
  emptyState: "Проверки пока недоступны.",
  generatedAt: "",
  summary: {
    attention: 0,
    automated: 0,
    manual: 0,
    ok: 0,
    publishBlockers: 0,
    watch: 0,
  },
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

function stateTone(state: ChecksWorkspaceCard["state"]) {
  switch (state) {
    case "attention":
      return "alert";
    case "watch":
      return "attention";
    case "manual":
      return "planned";
    default:
      return "steady";
  }
}

function buildCheckQuery(searchParams: URLSearchParams, check: string) {
  const next = new URLSearchParams(searchParams.toString());
  next.set("check", check);
  return next.toString();
}

export function MontelarChecksWorkspace() {
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCheck = searchParams.get("check") ?? "site-health";
  const [snapshot, setSnapshot] = React.useState<ChecksWorkspaceSnapshot>(emptySnapshot);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [fixingAction, setFixingAction] = React.useState("");
  const canReachWorkspace = hasAdminRole(user, [
    "owner",
    "admin",
    "content-editor",
    "translator",
    "developer",
  ]);

  React.useEffect(() => {
    if (!canReachWorkspace) {
      setIsLoading(false);
      setError("У вашей роли нет доступа к разделу «Проверки».");
      return;
    }

    let cancelled = false;

    async function loadSnapshot() {
      setIsLoading(true);
      setError("");

      try {
        const query = new URLSearchParams();
        if (activeCheck) {
          query.set("check", activeCheck);
        }

        const response = await fetch(`/api/internal/owner/checks?${query.toString()}`, {
          credentials: "include",
          headers: {
            "Cache-Control": "no-store",
          },
        });
        const payload = (await response.json()) as ChecksWorkspaceSnapshot & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error || "Не удалось загрузить раздел «Проверки».");
        }

        if (!cancelled) {
          setSnapshot(payload);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Не удалось загрузить раздел «Проверки».",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadSnapshot();

    return () => {
      cancelled = true;
    };
  }, [activeCheck, canReachWorkspace]);

  if (!canReachWorkspace) {
    return (
      <section className="montelar-checks-workspace montelar-checks-workspace--empty">
        <h1>Проверки</h1>
        <p>Раздел доступен только ролям, которые готовят сайт к публикации.</p>
      </section>
    );
  }

  const selectedCheck =
    snapshot.checks.find((card) => card.id === snapshot.activeCheck) ??
    snapshot.checks.find((card) => card.state === "attention") ??
    snapshot.checks[0] ??
    null;

  async function startRepair(issueId: string, action: CheckRepairAction) {
    setFixingAction(`${issueId}:${action.id}`);
    setError("");

    try {
      const response = await fetch(
        `/api/internal/owner/checks/${encodeURIComponent(selectedCheck?.id ?? "site-health")}/issues/${encodeURIComponent(issueId)}/fix`,
        {
          body: JSON.stringify({ actionId: action.id }),
          credentials: "include",
          headers: {
            "Cache-Control": "no-store",
            "Content-Type": "application/json",
          },
          method: "POST",
        },
      );
      const payload = (await response.json()) as { error?: string; targetHref?: string };

      if (!response.ok || !payload.targetHref) {
        throw new Error(payload.error || "Не удалось открыть исправление.");
      }

      router.push(resolveAdminHref(adminRoute, payload.targetHref));
    } catch (repairError) {
      setError(repairError instanceof Error ? repairError.message : "Не удалось открыть исправление.");
    } finally {
      setFixingAction("");
    }
  }

  return (
    <section className="montelar-checks-workspace" aria-labelledby="montelar-checks-title">
      <div className="montelar-checks-hero">
        <div className="montelar-checks-hero__copy">
          <span className="montelar-admin-shell__eyebrow">Проверки</span>
          <h1 id="montelar-checks-title">Что мешает выпуску и что ещё нужно проверить</h1>
          <p>
            Здесь только понятные сигналы для владельца: публикация, SEO, медиа, переводы и
            структура страниц. Если проверка пока ведётся вручную, это явно отмечено без фальшивого зелёного статуса.
          </p>
          <div className="montelar-checks-hero__actions">
            <Link href={resolveAdminHref(adminRoute, "/admin")}>
              <strong>Вернуться на панель</strong>
              <span>Очереди внимания и быстрые действия</span>
            </Link>
            <Link href={resolveAdminHref(adminRoute, "/admin/site")}>
              <strong>Открыть сайт</strong>
              <span>Страницы, блоки и публикация</span>
            </Link>
          </div>
        </div>

        <dl className="montelar-checks-hero__rail">
          <div>
            <dt>Блокеры выпуска</dt>
            <dd>{snapshot.summary.publishBlockers}</dd>
          </div>
          <div>
            <dt>Нужны правки</dt>
            <dd>{snapshot.summary.attention}</dd>
          </div>
          <div>
            <dt>Нужно проверить</dt>
            <dd>{snapshot.summary.watch}</dd>
          </div>
          <div>
            <dt>Пока вручную</dt>
            <dd>{snapshot.summary.manual}</dd>
          </div>
        </dl>
      </div>

      {error ? <p className="montelar-checks-error">{error}</p> : null}

      {isLoading ? (
        <article className="montelar-checks-panel">
          <div className="montelar-checks-panel__topline">
            <span>Проверки</span>
            <span className="montelar-admin-state montelar-admin-state--planned">собираем данные</span>
          </div>
          <h2>Подтягиваем сигналы</h2>
          <p>Публикация, SEO, переводы и медиа подтягиваются из текущего состояния админки.</p>
        </article>
      ) : null}

      {!isLoading && snapshot.checks.length === 0 ? (
        <article className="montelar-checks-panel">
          <h2>Проверки пусты</h2>
          <p>{snapshot.emptyState}</p>
        </article>
      ) : null}

      {snapshot.checks.length > 0 ? (
        <div className="montelar-checks-layout">
          <div className="montelar-checks-grid">
            {snapshot.checks.map((card) => {
              const isActive = selectedCheck?.id === card.id;
              return (
                <button
                  className={isActive ? "montelar-checks-card is-active" : "montelar-checks-card"}
                  key={card.id}
                  onClick={() => {
                    router.push(`/admin/checks?${buildCheckQuery(searchParams, card.id)}`);
                  }}
                  type="button"
                >
                  <div className="montelar-checks-card__topline">
                    <span>{card.automation === "manual" ? "ручная проверка" : "автопроверка"}</span>
                    <span className={`montelar-admin-state montelar-admin-state--${stateTone(card.state)}`}>
                      {card.statusLabel}
                    </span>
                  </div>
                  <strong>{card.title}</strong>
                  <p>{card.description}</p>
                  <div className="montelar-checks-card__meta">
                    <b>{card.count}</b>
                    <small>{card.detail}</small>
                  </div>
                </button>
              );
            })}
          </div>

          <article className="montelar-checks-panel montelar-checks-panel--detail">
            {selectedCheck ? (
              <>
                <div className="montelar-checks-panel__topline">
                  <span>{selectedCheck.title}</span>
                  <span className={`montelar-admin-state montelar-admin-state--${stateTone(selectedCheck.state)}`}>
                    {selectedCheck.statusLabel}
                  </span>
                </div>
                <h2>{selectedCheck.count > 0 ? `${selectedCheck.count} пункт(ов)` : "Сейчас без открытых пунктов"}</h2>
                <p>{selectedCheck.description}</p>
                <p>{selectedCheck.detail}</p>

                {selectedCheck.issues.length > 0 ? (
                  <div className="montelar-checks-panel__list">
                    <strong>Очередь исправлений</strong>
                    <ul>
                      {selectedCheck.issues.slice(0, 8).map((issue) => (
                        <li key={issue.id}>
                          <span>
                            <b>{issue.affectedObject}</b>
                            <small>{issue.title}</small>
                            <em>{issue.reason}</em>
                          </span>
                          {issue.actions.map((action) => (
                            <button
                              disabled={fixingAction === `${issue.id}:${action.id}`}
                              key={action.id}
                              onClick={() => {
                                void startRepair(issue.id, action);
                              }}
                              type="button"
                            >
                              {fixingAction === `${issue.id}:${action.id}` ? "Открываем..." : action.label}
                            </button>
                          ))}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="montelar-checks-panel__list">
                    <strong>Что видно сейчас</strong>
                    <p>
                      {selectedCheck.automation === "manual"
                        ? "Этот сигнал пока ведётся вручную. Владелец видит это как ручной контроль перед публикацией."
                        : "По этой категории открытых пунктов сейчас нет."}
                    </p>
                  </div>
                )}

                {selectedCheck.openItemsHref && selectedCheck.openItemsLabel ? (
                  <div className="montelar-checks-panel__actions">
                    <Link href={resolveAdminHref(adminRoute, selectedCheck.openItemsHref)}>
                      <strong>{selectedCheck.openItemsLabel}</strong>
                      <span>Открыть связанные элементы и исправить очередь</span>
                    </Link>
                  </div>
                ) : null}
              </>
            ) : null}
          </article>
        </div>
      ) : null}
    </section>
  );
}
