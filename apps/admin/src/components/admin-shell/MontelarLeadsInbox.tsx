"use client";

import { useAuth, useConfig } from "@payloadcms/ui";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { formatAdminURL } from "payload/shared";
import React from "react";

import { buildAdvancedCollectionHref } from "@/lib/admin-bff/raw-layer.ts";
import type { LeadInboxCard, LeadInboxFilterId, LeadInboxSnapshot } from "@/lib/payload/leads-inbox.ts";
import { hasAdminRole } from "@/lib/payload/roles.ts";

const emptySnapshot: LeadInboxSnapshot = {
  activeFilter: "all",
  availablePriorities: ["low", "normal", "high", "vip", "urgent"],
  availableStatuses: ["new", "reviewed", "contacted", "qualified", "proposal_in_progress", "closed", "spam"],
  canExport: false,
  canUpdate: false,
  canViewPii: false,
  cards: [],
  emptyState: "Заявок пока нет.",
  filters: [],
  generatedAt: "",
};

function getFilter(searchParams: ReturnType<typeof useSearchParams>) {
  const value = searchParams.get("filter");
  return (value && ["all", "new", "in-progress", "closed"].includes(value) ? value : "all") as LeadInboxFilterId;
}

function resolveAdminHref(adminRoute: string, href: string) {
  if (href.startsWith("/admin")) {
    const [rawPath, rawSearch = ""] = href.replace(/^\/admin/, "").split("?", 2);
    const path = (rawPath || "/") as `/${string}`;
    const resolved = formatAdminURL({ adminRoute, path });
    return rawSearch ? `${resolved}?${rawSearch}` : resolved;
  }

  return href;
}

function formatDateTime(value: string) {
  if (!value) {
    return "Не назначено";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getNextActionTone(state: LeadInboxCard["nextActionState"]) {
  switch (state) {
    case "overdue":
      return "alert";
    case "today":
      return "attention";
    case "planned":
      return "steady";
    default:
      return "planned";
  }
}

function getStatusTone(status: string) {
  switch (status) {
    case "spam":
    case "closed":
      return "alert";
    case "qualified":
    case "proposal_in_progress":
      return "steady";
    case "contacted":
    case "reviewed":
      return "attention";
    default:
      return "planned";
  }
}

function formatStatusLabel(status: string) {
  switch (status) {
    case "new":
      return "Новая";
    case "reviewed":
      return "Просмотрена";
    case "contacted":
      return "Связались";
    case "qualified":
      return "Квалифицирована";
    case "proposal_in_progress":
      return "Готовим предложение";
    case "closed":
      return "Закрыта";
    case "spam":
      return "Спам";
    default:
      return status;
  }
}

function formatPriorityLabel(priority: string) {
  switch (priority) {
    case "low":
      return "Низкий";
    case "normal":
      return "Обычный";
    case "high":
      return "Высокий";
    case "vip":
      return "VIP";
    case "urgent":
      return "Срочно";
    default:
      return priority;
  }
}

function formatNotificationStatus(status: string) {
  switch (status) {
    case "delivered":
      return "Доставлено";
    case "queued":
      return "В очереди";
    case "pending":
      return "Ожидает отправки";
    case "failed":
      return "Ошибка";
    default:
      return status || "Не отправлялось";
  }
}

function formatRoutingMode(mode: string) {
  switch (mode) {
    case "hq-direct":
      return "Прямо владельцу";
    case "partner-candidate":
      return "Нужна проверка партнера";
    case "partner-assigned":
      return "Передано партнеру";
    case "service-desk":
      return "Сервисная очередь";
    default:
      return mode || "Базовый маршрут";
  }
}

function formatPartnerHandoffStatus(status: string) {
  switch (status) {
    case "not-applicable":
      return "Не требуется";
    case "pending":
      return "Ждет решения";
    case "assigned":
      return "Назначен партнер";
    case "confirmed":
      return "Подтверждено";
    default:
      return status || "Не требуется";
  }
}

function toDateTimeLocalInput(value: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}T${hours}:${minutes}`;
}

function LeadWorkflowForm({
  canUpdate,
  lead,
  onError,
  onSaved,
  priorities,
  statuses,
}: {
  canUpdate: boolean;
  lead: LeadInboxCard;
  onError: (message: string) => void;
  onSaved: () => void;
  priorities: readonly string[];
  statuses: readonly string[];
}) {
  const [isSaving, setIsSaving] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [assignedTeam, setAssignedTeam] = React.useState(lead.assignedTeam);
  const [assignedToUser, setAssignedToUser] = React.useState(lead.assignedToUser);
  const [nextActionAt, setNextActionAt] = React.useState(toDateTimeLocalInput(lead.nextActionAt));
  const [status, setStatus] = React.useState(lead.status);
  const [priority, setPriority] = React.useState(lead.priority);

  async function saveLead() {
    setIsSaving(true);
    onError("");

    try {
      const response = await fetch(`/api/internal/leads-inbox/${lead.id}`, {
        body: JSON.stringify({
          assignedTeam,
          assignedToUser,
          nextActionAt,
          note,
          priority,
          status,
        }),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Не удалось обновить заявку.");
      }

      onSaved();
      setNote("");
    } catch (saveError) {
      onError(saveError instanceof Error ? saveError.message : "Не удалось обновить заявку.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="montelar-leads-panel">
      <div className="montelar-leads-panel__topline">
        <span>Следующий шаг</span>
        <span>{canUpdate ? "можно редактировать" : "только просмотр"}</span>
      </div>
      <div className="montelar-leads-form">
        <label>
          <span>Этап</span>
          <select disabled={!canUpdate || isSaving} onChange={(event) => setStatus(event.target.value)} value={status}>
            {statuses.map((entry) => (
              <option key={entry} value={entry}>
                {formatStatusLabel(entry)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Приоритет</span>
          <select
            disabled={!canUpdate || isSaving}
            onChange={(event) => setPriority(event.target.value)}
            value={priority}
          >
            {priorities.map((entry) => (
              <option key={entry} value={entry}>
                {formatPriorityLabel(entry)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Команда</span>
          <input
            disabled={!canUpdate || isSaving}
            onChange={(event) => setAssignedTeam(event.target.value)}
            placeholder="Например, concierge"
            value={assignedTeam}
          />
        </label>
        <label>
          <span>Ответственный</span>
          <input
            disabled={!canUpdate || isSaving}
            onChange={(event) => setAssignedToUser(event.target.value)}
            placeholder="Имя или email"
            value={assignedToUser}
          />
        </label>
        <label>
          <span>Следующий контакт</span>
          <input
            disabled={!canUpdate || isSaving}
            onChange={(event) => setNextActionAt(event.target.value)}
            type="datetime-local"
            value={nextActionAt}
          />
        </label>
        <label className="montelar-leads-form__full">
          <span>Комментарий для команды</span>
          <textarea
            disabled={!canUpdate || isSaving}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Что договорились, что сделать дальше, что важно не забыть."
            rows={4}
            value={note}
          />
        </label>
      </div>
      {canUpdate ? (
        <button className="montelar-leads-save" disabled={isSaving} onClick={() => void saveLead()} type="button">
          {isSaving ? "Сохраняю..." : "Сохранить изменения"}
        </button>
      ) : (
        <p className="montelar-admin-dashboard__notice">
          Этот пользователь видит контекст заявки, но не может менять статус или ответственного.
        </p>
      )}
    </section>
  );
}

export function MontelarLeadsInbox() {
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const filter = getFilter(searchParams);
  const [selectedLeadId, setSelectedLeadId] = React.useState<string>("");
  const [reloadToken, setReloadToken] = React.useState(0);
  const [error, setError] = React.useState("");
  const [snapshot, setSnapshot] = React.useState<LeadInboxSnapshot>(emptySnapshot);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isError, setIsError] = React.useState(false);
  const canReachWorkspace = hasAdminRole(user, [
    "owner",
    "admin",
    "content-editor",
    "lead-manager",
    "translator",
    "developer",
  ]);

  React.useEffect(() => {
    if (!canReachWorkspace) {
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setIsLoading(true);
        setIsError(false);
      }
    });

    const url = `/api/internal/leads-inbox?filter=${encodeURIComponent(filter)}&refresh=${reloadToken}`;

    void fetch(url, { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Не удалось загрузить очередь заявок.");
        }

        return (await response.json()) as LeadInboxSnapshot;
      })
      .then((nextSnapshot) => {
        if (!cancelled) {
          setSnapshot(nextSnapshot);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSnapshot(emptySnapshot);
          setIsError(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [canReachWorkspace, filter, reloadToken]);

  const selectedLead = snapshot.cards.find((card) => String(card.id) === selectedLeadId) ?? snapshot.cards[0] ?? null;

  if (!canReachWorkspace) {
    return (
      <section className="montelar-leads-workspace montelar-leads-workspace--empty">
        <div className="montelar-leads-workspace__hero">
          <div>
            <p className="montelar-admin-dashboard__eyebrow">Заявки</p>
            <h1>Раздел недоступен для этой роли</h1>
            <p>Откройте панель или рабочее пространство, которое назначено вашему типу доступа.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="montelar-leads-workspace" aria-labelledby="montelar-leads-workspace-title">
      <div className="montelar-leads-workspace__hero">
        <div>
          <p className="montelar-admin-dashboard__eyebrow">Заявки</p>
          <h1 id="montelar-leads-workspace-title">Входящие обращения, статусы и следующий шаг</h1>
          <p>
            Менеджер видит четыре понятные очереди, открывает карточку клиента, назначает ответственного,
            ставит следующий контакт и фиксирует договоренности без перехода в служебные разделы.
          </p>
          {snapshot.canExport ? (
            <p>
              <a
                className="montelar-admin-dashboard__link"
                href={`/api/internal/leads-inbox/export?filter=${encodeURIComponent(filter)}`}
              >
                Экспортировать текущую очередь
              </a>
            </p>
          ) : (
            <p>Экспорт остается у владельца и администратора. Остальным доступна только обработка заявок.</p>
          )}
        </div>
        <dl className="montelar-admin-dashboard__rail">
          <div>
            <dt>Сейчас открыто</dt>
            <dd>{snapshot.filters.find((entry) => entry.id === filter)?.label || "Все заявки"}</dd>
          </div>
          <div>
            <dt>Видимость данных</dt>
            <dd>{snapshot.canViewPii ? "Контакты видны" : "Контакты скрыты"}</dd>
          </div>
          <div>
            <dt>Права на изменения</dt>
            <dd>{snapshot.canUpdate ? "Можно обновлять" : "Только просмотр"}</dd>
          </div>
          <div>
            <dt>Последнее обновление</dt>
            <dd>{snapshot.generatedAt ? formatDateTime(snapshot.generatedAt) : "Ожидается"}</dd>
          </div>
        </dl>
      </div>

      <div className="montelar-leads-workspace__filters" role="tablist" aria-label="Очереди заявок">
        {snapshot.filters.map((entry) => {
          const href = `${resolveAdminHref(adminRoute, "/admin/leads")}?filter=${encodeURIComponent(entry.id)}`;
          const active = entry.id === filter;

          return (
            <button
              aria-selected={active}
              className={active ? "montelar-leads-filter is-active" : "montelar-leads-filter"}
              key={entry.id}
              onClick={() => router.push(href)}
              role="tab"
              type="button"
            >
              <span>{entry.label}</span>
              <strong>{entry.count}</strong>
              <small>{entry.description}</small>
            </button>
          );
        })}
      </div>

      {isError ? <div className="montelar-admin-dashboard__notice">Не удалось загрузить очередь заявок.</div> : null}
      {error ? <div className="montelar-admin-dashboard__notice">{error}</div> : null}

      <div className="montelar-leads-workspace__layout">
        <div className="montelar-leads-workspace__list">
          {isLoading ? (
            <article className="montelar-admin-dashboard__card montelar-admin-dashboard__card--placeholder">
              <span>Заявки</span>
              <strong>Загружаю очередь</strong>
              <p>Подтягиваю карточки, статусы и ближайшие действия.</p>
            </article>
          ) : null}

          {!isLoading && snapshot.cards.length === 0 ? (
            <article className="montelar-admin-dashboard__card montelar-admin-dashboard__card--placeholder">
              <span>Заявки</span>
              <strong>{snapshot.emptyState}</strong>
              <p>Выберите другую очередь или дождитесь нового обращения с сайта.</p>
            </article>
          ) : null}

          {snapshot.cards.map((card) => (
            <button
              className={String(card.id) === String(selectedLead?.id) ? "montelar-lead-card is-selected" : "montelar-lead-card"}
              key={card.id}
              onClick={() => setSelectedLeadId(String(card.id))}
              type="button"
            >
              <div className="montelar-lead-card__topline">
                <span>{card.referenceCode}</span>
                <span className={`montelar-admin-state montelar-admin-state--${getStatusTone(card.status)}`}>
                  {formatStatusLabel(card.status)}
                </span>
              </div>
              <strong>{card.canViewPii ? card.displayName || "Имя не указано" : card.product}</strong>
              <p>{card.latestActivitySummary || "Комментарий еще не добавлен."}</p>
              <div className="montelar-lead-card__meta">
                <span>{card.product}</span>
                <span>{card.form}</span>
                <span>{card.locale.toUpperCase()} · {card.ageLabel}</span>
              </div>
              <div className="montelar-lead-card__meta">
                <span>{card.sourceLabel || "Источник не указан"}</span>
                <span className={`montelar-lead-pill montelar-lead-pill--${getNextActionTone(card.nextActionState)}`}>
                  {card.nextActionLabel}
                </span>
              </div>
              <div className="montelar-lead-card__meta">
                <span>Приоритет: {formatPriorityLabel(card.priority)}</span>
                <span>{card.assignedToUser || card.assignedTeam || "Без ответственного"}</span>
                <span>{card.canViewPii ? "Контакты открыты" : "Контакты скрыты"}</span>
              </div>
              {!snapshot.canViewPii ? (
                <div className="montelar-lead-card__mask">
                  Контактные данные скрыты для этой роли. Статус, продукт и следующий шаг остаются видимыми.
                </div>
              ) : null}
            </button>
          ))}
        </div>

        <div className="montelar-leads-workspace__detail">
          {selectedLead ? (
            <>
              <section className="montelar-leads-panel">
                <div className="montelar-leads-panel__topline">
                  <span>Карточка клиента</span>
                  <Link
                    href={resolveAdminHref(
                      adminRoute,
                      buildAdvancedCollectionHref("leads", {
                        id: selectedLead.id,
                        label: "Полная заявка",
                      }),
                    )}
                  >
                    Расширенный режим
                  </Link>
                </div>
                <h2>{selectedLead.canViewPii ? selectedLead.displayName || selectedLead.referenceCode : selectedLead.referenceCode}</h2>
                <div className="montelar-leads-panel__grid">
                  <div>
                    <dt>Статус</dt>
                    <dd>{formatStatusLabel(selectedLead.status)}</dd>
                  </div>
                  <div>
                    <dt>Приоритет</dt>
                    <dd>{formatPriorityLabel(selectedLead.priority)}</dd>
                  </div>
                  <div>
                    <dt>Продукт</dt>
                    <dd>{selectedLead.product || "Не указан"}</dd>
                  </div>
                  <div>
                    <dt>Форма</dt>
                    <dd>{selectedLead.form || "Не указана"}</dd>
                  </div>
                  <div>
                    <dt>Источник</dt>
                    <dd>{selectedLead.sourceLabel || "Не указан"}</dd>
                  </div>
                  <div>
                    <dt>Тип запроса</dt>
                    <dd>{selectedLead.requestType || "Не указан"}</dd>
                  </div>
                  <div>
                    <dt>Создана</dt>
                    <dd>{formatDateTime(selectedLead.createdAt)}</dd>
                  </div>
                  <div>
                    <dt>Последний контакт</dt>
                    <dd>{formatDateTime(selectedLead.lastContactedAt)}</dd>
                  </div>
                  <div>
                    <dt>Следующий контакт</dt>
                    <dd>{selectedLead.nextActionLabel}</dd>
                  </div>
                  <div>
                    <dt>Ответственный</dt>
                    <dd>{selectedLead.assignedToUser || selectedLead.assignedTeam || "Не назначен"}</dd>
                  </div>
                  <div>
                    <dt>Страна</dt>
                    <dd>{snapshot.canViewPii ? selectedLead.country || "Не указана" : "Скрыто"}</dd>
                  </div>
                  <div>
                    <dt>Согласие</dt>
                    <dd>{selectedLead.consentLabel}</dd>
                  </div>
                </div>
                {snapshot.canViewPii ? (
                  <div className="montelar-leads-panel__pii">
                    <div>
                      <dt>Имя</dt>
                      <dd>{selectedLead.displayName || "Не указано"}</dd>
                    </div>
                    <div>
                      <dt>Компания</dt>
                      <dd>{selectedLead.company || "Не указана"}</dd>
                    </div>
                    <div>
                      <dt>Email</dt>
                      <dd>{selectedLead.email || "Не указан"}</dd>
                    </div>
                    <div>
                      <dt>Телефон</dt>
                      <dd>{selectedLead.phone || "Не указан"}</dd>
                    </div>
                    <div className="montelar-leads-panel__message">
                      <dt>Сообщение клиента</dt>
                      <dd>{selectedLead.message || "Свободный комментарий не оставлен."}</dd>
                    </div>
                  </div>
                ) : (
                  <div className="montelar-admin-dashboard__notice">
                    Для этой роли контакты скрыты. Сохраняются только продукт, очередь, история и следующий шаг.
                  </div>
                )}
              </section>

              <LeadWorkflowForm
                canUpdate={snapshot.canUpdate}
                key={String(selectedLead.id)}
                lead={selectedLead}
                onError={setError}
                onSaved={() => setReloadToken((value) => value + 1)}
                priorities={snapshot.availablePriorities}
                statuses={snapshot.availableStatuses}
              />

              <section className="montelar-leads-panel">
                <div className="montelar-leads-panel__topline">
                  <span>Маршрут и уведомления</span>
                  <span>{selectedLead.notificationRecipientsCount} получател(я)</span>
                </div>
                <div className="montelar-leads-panel__grid">
                  <div>
                    <dt>Маршрут</dt>
                    <dd>{formatRoutingMode(selectedLead.routingMode)}</dd>
                  </div>
                  <div>
                    <dt>Статус уведомлений</dt>
                    <dd>{formatNotificationStatus(selectedLead.notificationStatus)}</dd>
                  </div>
                  <div>
                    <dt>Правило назначения</dt>
                    <dd>{selectedLead.routingRuleKey || "fallback-owner"}</dd>
                  </div>
                  <div>
                    <dt>Передача партнеру</dt>
                    <dd>{formatPartnerHandoffStatus(selectedLead.partnerHandoffStatus)}</dd>
                  </div>
                  <div>
                    <dt>Последняя отправка</dt>
                    <dd>{formatDateTime(selectedLead.notificationLastAttemptAt)}</dd>
                  </div>
                  <div>
                    <dt>Безопасный адрес</dt>
                    <dd>{selectedLead.notificationSafeTargetApplied ? "Да" : "Нет"}</dd>
                  </div>
                </div>
                <div className="montelar-admin-dashboard__notice">
                  {selectedLead.routingSuggestion || "Подсказка по назначению пока не добавлена."}
                </div>
                {selectedLead.sourcePagePath ? (
                  <div className="montelar-admin-dashboard__notice">
                    Страница-источник: {selectedLead.sourcePagePath}
                  </div>
                ) : null}
                {selectedLead.notificationAttempts.length > 0 ? (
                  <div className="montelar-leads-timeline">
                    {selectedLead.notificationAttempts.map((attempt) => (
                      <article key={`${attempt.attemptedAt}-${attempt.eventPath}`}>
                        <div>
                          <strong>
                            {formatNotificationStatus(attempt.status)} · {attempt.deliveryMode}
                          </strong>
                          <span>{formatDateTime(attempt.attemptedAt)}</span>
                        </div>
                        <p>
                          Получателей: {attempt.recipientCount}, ответ сервиса: {attempt.responseStatus}
                          {attempt.safeTargetApplied ? ", включен безопасный адрес." : "."}
                        </p>
                        <small>{attempt.error || attempt.eventPath}</small>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="montelar-admin-dashboard__notice">История уведомлений пока не записана.</p>
                )}
              </section>

              <section className="montelar-leads-panel">
                <div className="montelar-leads-panel__topline">
                  <span>Комментарии и история</span>
                  <span>{selectedLead.activityTimeline.length} событий</span>
                </div>
                {selectedLead.ownerNotes ? (
                  <div className="montelar-leads-panel__note">
                    <dt>Внутренние договоренности</dt>
                    <dd>{selectedLead.ownerNotes}</dd>
                  </div>
                ) : null}
                <div className="montelar-leads-timeline">
                  {selectedLead.activityTimeline.map((entry) => (
                    <article key={`${entry.type}-${entry.at}-${entry.summary}`}>
                      <div>
                        <strong>{entry.summary}</strong>
                        <span>{formatDateTime(entry.at)}</span>
                      </div>
                      <p>{entry.detail || "Дополнительная деталь не указана."}</p>
                      <small>{entry.actor || "system"}</small>
                    </article>
                  ))}
                </div>
              </section>

              <section className="montelar-leads-panel">
                <div className="montelar-leads-panel__topline">
                  <span>Что пришло из формы</span>
                  <span>{selectedLead.submittedFields.length} полей</span>
                </div>
                {selectedLead.submittedFields.length > 0 ? (
                  <div className="montelar-leads-panel__field-list">
                    {selectedLead.submittedFields.map((field) => (
                      <div key={`${field.label}-${field.value}`}>
                        <dt>{field.label}</dt>
                        <dd>{field.value}</dd>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="montelar-admin-dashboard__notice">
                    Поля формы не показаны для этой роли или не были сохранены в заявке.
                  </p>
                )}
              </section>
            </>
          ) : (
            <section className="montelar-leads-panel montelar-leads-panel--empty">
              <h2>Выберите заявку</h2>
              <p>Откройте карточку слева, чтобы увидеть клиента, историю и следующий шаг.</p>
            </section>
          )}
        </div>
      </div>
    </section>
  );
}
