"use client";

import { useAuth, useConfig } from "@payloadcms/ui";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { formatAdminURL } from "payload/shared";
import React from "react";

import type {
  TranslationWorkspaceContentField,
  TranslationWorkspaceCard,
  TranslationWorkspaceFilterId,
  TranslationWorkspaceSnapshot,
  TranslationWorkspaceUserOption,
} from "@/lib/payload/translations-workspace.ts";
import { hasAdminRole } from "@/lib/payload/roles.ts";

type SurfaceId = "all" | "buttons" | "categories" | "documents" | "forms" | "pages" | "products" | "seo";

const emptySnapshot: TranslationWorkspaceSnapshot = {
  activeFilter: "all",
  activeLocale: "all",
  activeSearch: "",
  canAssign: false,
  canCreate: false,
  canPublish: false,
  canUpdate: false,
  cards: [],
  emptyState: "По текущим фильтрам переводы не найдены.",
  filters: [],
  generatedAt: "",
  localeSummaries: [],
  reviewerOptions: [],
  totalVisibleCards: 0,
  translatorOptions: [],
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

function buildQuery(searchParams: URLSearchParams, key: string, value: string | null) {
  const next = new URLSearchParams(searchParams);
  if (!value || value === "all") {
    next.delete(key);
  } else {
    next.set(key, value);
  }
  return next.toString();
}

function getSurfaceMeta(card: Pick<TranslationWorkspaceCard, "fieldScope" | "ownerCollection">) {
  if (card.fieldScope.includes("button")) {
    return {
      description: "Тексты первого экрана и кнопок, ведущих на форму, страницу или продукт.",
      id: "buttons" as const,
      label: "Кнопки",
    };
  }

  switch (card.ownerCollection) {
    case "pages":
    case "page-sections":
      return {
        description: "Главные страницы, их блоки и редакционные тексты.",
        id: "pages" as const,
        label: "Страницы",
      };
    case "product-categories":
      return {
        description: "Категории и уровни каталога.",
        id: "categories" as const,
        label: "Категории",
      };
    case "product-inquiry-forms":
      return {
        description: "Формы заявки, кнопки отправки и thank-you тексты.",
        id: "forms" as const,
        label: "Формы",
      };
    case "seo-entries":
      return {
        description: "SEO title, description, публичные адреса и OG.",
        id: "seo" as const,
        label: "SEO",
      };
    case "product-documents":
      return {
        description: "PDF, паспорта и их подписи.",
        id: "documents" as const,
        label: "Документы",
      };
    default:
      return {
        description: "Направления, линейки, товары и продуктовые тексты.",
        id: "products" as const,
        label: "Товары",
      };
  }
}

function getOwnerCollectionLabel(card: Pick<TranslationWorkspaceCard, "ownerCollection" | "ownerCollectionLabel">) {
  switch (card.ownerCollection) {
    case "pages":
      return "Страница";
    case "page-sections":
      return "Блок страницы";
    case "product-directions":
      return "Направление";
    case "product-categories":
      return "Категория";
    case "product-lines":
      return "Линейка";
    case "products":
      return "Товар";
    case "product-variants":
      return "Вариант";
    case "product-inquiry-forms":
      return "Форма";
    case "product-documents":
      return "Документ";
    case "media-assets":
      return "Медиа";
    case "seo-entries":
      return "SEO";
    default:
      return card.ownerCollectionLabel;
  }
}

function getScopeLabel(fieldScope: string) {
  switch (fieldScope) {
    case "full-record":
      return "весь объект";
    case "editorial-copy":
      return "тексты и редакционный блок";
    case "form-copy":
      return "тексты формы";
    case "route-and-seo":
      return "публичный адрес и SEO";
    case "document-labels":
      return "название и подписи";
    case "media-metadata":
      return "alt и подписи медиа";
    default:
      return fieldScope.replace(/-/g, " ");
  }
}

function getStatusTone(card: TranslationWorkspaceCard) {
  if (card.isMissing || card.staleSourceState === "source-changed" || card.publishReadiness === "blocked") {
    return "alert";
  }

  if (card.status === "review" || card.status === "approved") {
    return "attention";
  }

  if (card.status === "published") {
    return "steady";
  }

  return "planned";
}

function getStatusLabel(card: TranslationWorkspaceCard) {
  if (card.isMissing) {
    return "пусто";
  }

  switch (card.status) {
    case "draft":
      return "черновик";
    case "in-progress":
      return "в работе";
    case "review":
      return "на проверке";
    case "approved":
      return "согласовано";
    case "published":
      return "опубликовано";
    case "blocked":
      return "заблокировано";
    default:
      return card.status;
  }
}

function getLocaleLabel(snapshot: TranslationWorkspaceSnapshot, code: string) {
  const locale = snapshot.localeSummaries.find((entry) => entry.code === code);
  if (!locale) {
    return code.toUpperCase();
  }

  return `${locale.nativeLabel} (${locale.englishLabel}, ${locale.code.toUpperCase()})`;
}

function getFreshnessLabel(staleSourceState: string) {
  switch (staleSourceState) {
    case "source-changed":
      return "После перевода изменился исходный текст или публичный адрес.";
    case "review-required":
      return "Исходник требует редакционной проверки перед публикацией.";
    case "blocked":
      return "Актуальность заблокирована, пока не исправлен источник или публичный адрес.";
    default:
      return "Перевод совпадает с текущим снимком исходника.";
  }
}

function getPublishReadinessLabel(publishReadiness: string) {
  switch (publishReadiness) {
    case "ready":
      return "Готово к публикации после финального подтверждения.";
    case "ready-with-fallback":
      return "Можно публиковать с резервной версией, но нужен контроль владельца.";
    case "blocked":
      return "Публикация остановлена из-за публичного адреса, проверки или другой зависимости.";
    default:
      return "Пока не готово к публикации.";
  }
}

function getPublishBlockedReasonLabel(reason: string) {
  switch (reason) {
    case "missing-route":
      return "Для этой локали ещё не готов публичный адрес.";
    case "review-missing":
      return "Ещё нет подтверждения проверяющего.";
    case "freshness-blocked":
      return "Исходник изменился, перевод нужно проверить заново.";
    case "owner-workspace-blocked":
      return "Страница, товар или форма-источник ещё не готовы к публикации.";
    default:
      return reason.replace(/-/g, " ");
  }
}

function getWarningLabel(warning: string) {
  switch (warning) {
    case "Missing translation record":
      return "Нет версии перевода";
    case "Source changed after translation":
      return "Исходник изменился после перевода";
    case "Source requires review":
      return "Исходник ждёт проверки";
    case "Publish blocked":
      return "Публикация заблокирована";
    case "Reviewer missing":
      return "Не назначен проверяющий";
    case "Missing route":
      return "Нет публичного адреса";
    default:
      return warning;
  }
}

function getFilterLabel(filterId: TranslationWorkspaceFilterId) {
  switch (filterId) {
    case "all":
      return "Все";
    case "missing":
      return "Пустые";
    case "draft":
      return "В работе";
    case "review":
      return "На проверке";
    case "approved":
      return "Согласованные";
    case "published":
      return "Опубликованные";
    case "stale":
      return "Устаревшие";
    default:
      return filterId;
  }
}

function getWorkflowStageLabel(stage: string) {
  switch (stage) {
    case "queued":
      return "в очереди";
    case "machine-draft":
      return "машинный черновик";
    case "human-edit":
      return "ручная правка";
    case "brand-review":
      return "проверка бренда";
    case "seo-review":
      return "SEO-проверка";
    case "legal-review":
      return "юридическая проверка";
    case "ready-for-publish":
      return "готово к публикации";
    default:
      return stage;
  }
}

function getOwnerWorkspaceLabel(card: TranslationWorkspaceCard) {
  switch (card.ownerCollection) {
    case "pages":
      return "Открыть страницу";
    case "page-sections":
      return "Открыть страницу и блок";
    case "product-categories":
      return "Открыть категорию";
    case "products":
    case "product-lines":
    case "product-directions":
    case "product-variants":
      return "Открыть товарный редактор";
    case "product-inquiry-forms":
      return "Открыть форму";
    case "seo-entries":
      return "Открыть SEO";
    default:
      return `Открыть: ${getOwnerCollectionLabel(card).toLowerCase()}`;
  }
}

function WorkflowSelect({
  disabled,
  label,
  onChange,
  options,
  value,
}: {
  disabled: boolean;
  label: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <label>
      <span>{label}</span>
      <select disabled={disabled} onChange={(event) => onChange(event.target.value)} value={value}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function UserSelect({
  disabled,
  label,
  onChange,
  options,
  value,
}: {
  disabled: boolean;
  label: string;
  onChange: (value: string) => void;
  options: readonly TranslationWorkspaceUserOption[];
  value: string;
}) {
  return (
    <label>
      <span>{label}</span>
      <select disabled={disabled} onChange={(event) => onChange(event.target.value)} value={value}>
        <option value="">Не назначен</option>
        {options.map((option) => (
          <option key={option.id} value={String(option.id)}>
            {option.label} · {option.role}
          </option>
        ))}
      </select>
    </label>
  );
}

function TranslationContentForm({
  canUpdate,
  card,
  onError,
  onSaved,
}: {
  canUpdate: boolean;
  card: TranslationWorkspaceCard;
  onError: (message: string) => void;
  onSaved: () => void;
}) {
  const [isSaving, setIsSaving] = React.useState(false);
  const [fields, setFields] = React.useState<TranslationWorkspaceContentField[]>(card.contentFields);
  const [previewNotes, setPreviewNotes] = React.useState("");

  React.useEffect(() => {
    setFields(card.contentFields);
    setPreviewNotes("");
  }, [card.contentFields, card.id]);

  function updateField(fieldKey: string, value: string) {
    setFields((current) =>
      current.map((field) => (field.fieldKey === fieldKey ? { ...field, targetValue: value } : field)),
    );
  }

  async function saveContent() {
    if (card.isMissing || !card.recordId) {
      onError("Сначала создайте черновик перевода.");
      return;
    }

    setIsSaving(true);
    onError("");

    try {
      const response = await fetch(`/api/internal/translations-workspace/${card.recordId}/content`, {
        body: JSON.stringify({
          fields: fields.map((field) => ({
            fieldKey: field.fieldKey,
            value: field.targetValue,
            valueType: field.valueType,
          })),
          previewNotes,
        }),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Не удалось сохранить переводимый текст.");
      }

      onSaved();
    } catch (error) {
      onError(error instanceof Error ? error.message : "Не удалось сохранить переводимый текст.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="montelar-translations-panel">
      <div className="montelar-translations-panel__topline">
        <span>Исходник и перевод</span>
        <span>{canUpdate && !card.isMissing ? "можно редактировать" : "только просмотр"}</span>
      </div>
      <div className="montelar-translations-content-grid">
        {fields.length > 0 ? (
          fields.map((field) => (
            <article className="montelar-translations-content-field" key={field.fieldKey}>
              <div className="montelar-translations-content-field__topline">
                <span>{field.label}</span>
                <small>{field.surface}</small>
              </div>
              <div className="montelar-translations-content-field__columns">
                <label>
                  <span>Исходник</span>
                  <textarea readOnly rows={field.valueType === "long-text" ? 5 : 3} value={field.sourceValue} />
                </label>
                <label>
                  <span>Перевод</span>
                  <textarea
                    disabled={!canUpdate || card.isMissing || isSaving}
                    onChange={(event) => updateField(field.fieldKey, event.target.value)}
                    rows={field.valueType === "long-text" ? 5 : 3}
                    value={field.targetValue}
                  />
                </label>
              </div>
              {field.riskLabel ? <p>{field.riskLabel}</p> : null}
            </article>
          ))
        ) : (
          <p>Для этого объекта пока нет извлеченных видимых полей. Откройте исходный редактор и проверьте контент вручную.</p>
        )}
      </div>
      <label className="montelar-translations-content-note">
        <span>Заметка для preview и проверки верстки</span>
        <textarea
          disabled={!canUpdate || card.isMissing || isSaving}
          onChange={(event) => setPreviewNotes(event.target.value)}
          rows={3}
          value={previewNotes}
        />
      </label>
      {canUpdate && !card.isMissing ? (
        <button className="montelar-translations-save" disabled={isSaving} onClick={() => void saveContent()} type="button">
          {isSaving ? "Сохраняю текст..." : "Сохранить переводимый текст"}
        </button>
      ) : null}
    </section>
  );
}

function TranslationWorkflowForm({
  card,
  canAssign,
  canPublish,
  canUpdate,
  onCreated,
  onError,
  onSaved,
  reviewerOptions,
  translatorOptions,
}: {
  canAssign: boolean;
  canPublish: boolean;
  canUpdate: boolean;
  card: TranslationWorkspaceCard;
  onCreated: (recordId: string) => void;
  onError: (message: string) => void;
  onSaved: () => void;
  reviewerOptions: readonly TranslationWorkspaceUserOption[];
  translatorOptions: readonly TranslationWorkspaceUserOption[];
}) {
  const [isSaving, setIsSaving] = React.useState(false);
  const [status, setStatus] = React.useState(card.isMissing ? "draft" : card.status);
  const [workflowStage, setWorkflowStage] = React.useState(card.workflowStage);
  const [publishReadiness, setPublishReadiness] = React.useState(card.publishReadiness);
  const [translatorAssigneeId, setTranslatorAssigneeId] = React.useState(
    card.translatorAssigneeId ? String(card.translatorAssigneeId) : "",
  );
  const [reviewerAssigneeId, setReviewerAssigneeId] = React.useState(
    card.reviewerAssigneeId ? String(card.reviewerAssigneeId) : "",
  );
  const [changeReason, setChangeReason] = React.useState("");
  const [internalNotes, setInternalNotes] = React.useState("");

  async function createTranslation() {
    setIsSaving(true);
    onError("");

    try {
      const response = await fetch("/api/internal/translations-workspace", {
        body: JSON.stringify({
          ownerCollection: card.ownerCollection,
          ownerKey: card.ownerKey,
          targetLocale: card.targetLocale,
        }),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as { error?: string; id?: number | string };

      if (!response.ok || !payload.id) {
        throw new Error(payload.error || "Не удалось создать версию перевода.");
      }

      onCreated(String(payload.id));
    } catch (error) {
      onError(error instanceof Error ? error.message : "Не удалось создать версию перевода.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveTranslation() {
    setIsSaving(true);
    onError("");

    try {
      const response = await fetch(`/api/internal/translations-workspace/${card.recordId}`, {
        body: JSON.stringify({
          changeReason,
          internalNotes,
          publishReadiness,
          reviewerAssigneeId,
          status,
          translatorAssigneeId,
          workflowStage,
        }),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Не удалось обновить перевод.");
      }

      onSaved();
    } catch (error) {
      onError(error instanceof Error ? error.message : "Не удалось обновить перевод.");
    } finally {
      setIsSaving(false);
    }
  }

  if (card.isMissing) {
    return (
      <section className="montelar-translations-panel">
        <div className="montelar-translations-panel__topline">
          <span>Создать перевод</span>
          <span>{canUpdate ? "можно редактировать" : "только просмотр"}</span>
        </div>
        <p>
          Для этого объекта ещё нет рабочего перевода на <strong>{card.targetLocale.toUpperCase()}</strong>. Сначала
          создайте черновик, затем переведите его через проверку и готовность к публикации.
        </p>
        {canUpdate ? (
          <button className="montelar-translations-save" disabled={isSaving} onClick={() => void createTranslation()} type="button">
            {isSaving ? "Создаю черновик..." : "Создать черновик перевода"}
          </button>
        ) : (
          <p>Создание новой локали доступно только ролям, которые ведут переводческий процесс.</p>
        )}
      </section>
    );
  }

  return (
    <section className="montelar-translations-panel">
      <div className="montelar-translations-panel__topline">
        <span>Действия по переводу</span>
        <span>{canUpdate ? "можно редактировать" : "только просмотр"}</span>
      </div>
      <div className="montelar-translations-form">
        <WorkflowSelect
          disabled={!canUpdate || isSaving}
          label="Статус"
          onChange={setStatus}
          options={[
            { label: "Черновик", value: "draft" },
            { label: "В работе", value: "in-progress" },
            { label: "На проверке", value: "review" },
            { label: "Согласовано", value: "approved" },
            { label: "Опубликовано", value: "published" },
            { label: "Заблокировано", value: "blocked" },
          ]}
          value={status}
        />
        <WorkflowSelect
          disabled={!canUpdate || isSaving}
          label="Этап"
          onChange={setWorkflowStage}
          options={[
            { label: "В очереди", value: "queued" },
            { label: "Машинный черновик", value: "machine-draft" },
            { label: "Ручная правка", value: "human-edit" },
            { label: "Проверка бренда", value: "brand-review" },
            { label: "SEO-проверка", value: "seo-review" },
            { label: "Юридическая проверка", value: "legal-review" },
            { label: "Готово к публикации", value: "ready-for-publish" },
          ]}
          value={workflowStage}
        />
        <WorkflowSelect
          disabled={!canPublish || isSaving}
          label="Готовность к публикации"
          onChange={setPublishReadiness}
          options={[
            { label: "Пока не готово", value: "not-ready" },
            { label: "Готово", value: "ready" },
            { label: "Готово с fallback", value: "ready-with-fallback" },
            { label: "Заблокировано", value: "blocked" },
          ]}
          value={publishReadiness}
        />
        <UserSelect
          disabled={!canAssign || isSaving}
          label="Переводчик"
          onChange={setTranslatorAssigneeId}
          options={translatorOptions}
          value={translatorAssigneeId}
        />
        <UserSelect
          disabled={!canAssign || isSaving}
          label="Проверяющий"
          onChange={setReviewerAssigneeId}
          options={reviewerOptions}
          value={reviewerAssigneeId}
        />
        <label className="montelar-translations-form__full">
          <span>Почему изменили</span>
          <input disabled={!canUpdate || isSaving} onChange={(event) => setChangeReason(event.target.value)} value={changeReason} />
        </label>
        <label className="montelar-translations-form__full">
          <span>Внутренняя заметка</span>
          <textarea
            disabled={!canUpdate || isSaving}
            onChange={(event) => setInternalNotes(event.target.value)}
            rows={4}
            value={internalNotes}
          />
        </label>
      </div>
      {canUpdate ? (
        <button className="montelar-translations-save" disabled={isSaving} onClick={() => void saveTranslation()} type="button">
          {isSaving ? "Сохраняю..." : "Сохранить изменения"}
        </button>
      ) : null}
    </section>
  );
}

export function MontelarTranslationsWorkspace() {
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = React.useState("");
  const [reloadToken, setReloadToken] = React.useState(0);
  const [error, setError] = React.useState("");
  const [snapshot, setSnapshot] = React.useState<TranslationWorkspaceSnapshot>(emptySnapshot);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isError, setIsError] = React.useState(false);
  const filter = (searchParams.get("filter") ?? "all") as TranslationWorkspaceFilterId;
  const locale = searchParams.get("locale") ?? "all";
  const surface = (searchParams.get("surface") ?? "all") as SurfaceId;
  const ownerCollection = searchParams.get("ownerCollection") ?? "";
  const ownerKey = searchParams.get("ownerKey") ?? "";
  const authResolved = typeof user !== "undefined";
  const canReachWorkspace = hasAdminRole(user, ["owner", "admin", "content-editor", "translator", "developer"]);

  const query = new URLSearchParams();
  if (filter && filter !== "all") {
    query.set("filter", filter);
  }
  if (locale && locale !== "all") {
    query.set("locale", locale);
  }
  if (ownerCollection) {
    query.set("ownerCollection", ownerCollection);
  }
  if (ownerKey) {
    query.set("ownerKey", ownerKey);
  }
  if (searchParams.get("q")) {
    query.set("q", searchParams.get("q") as string);
  }
  query.set("refresh", String(reloadToken));
  const queryString = query.toString();

  React.useEffect(() => {
    if (!authResolved || !canReachWorkspace) {
      return;
    }

    let isActive = true;
    const controller = new AbortController();

    async function loadSnapshot() {
      setIsLoading(true);
      setIsError(false);

      try {
        const response = await fetch(`/api/internal/translations-workspace?${queryString}`, {
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`translations-workspace:${response.status}`);
        }

        const nextSnapshot = (await response.json()) as TranslationWorkspaceSnapshot;

        if (!isActive) {
          return;
        }

        setSnapshot(nextSnapshot);
      } catch (nextError) {
        if (!isActive || controller.signal.aborted) {
          return;
        }

        console.error(nextError);
        setSnapshot(emptySnapshot);
        setIsError(true);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadSnapshot();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [authResolved, canReachWorkspace, queryString]);

  const surfaceCards =
    surface === "all" ? snapshot.cards : snapshot.cards.filter((card) => getSurfaceMeta(card).id === surface);
  const activeSelectedId = selectedId || surfaceCards[0]?.id || "";
  const selectedCard =
    surfaceCards.find((card) => card.id === activeSelectedId) ??
    surfaceCards.find((card) => String(card.recordId) === activeSelectedId) ??
    surfaceCards[0] ??
    null;
  const publicSiteOrigin = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://89.150.34.66:8093").replace(/\/+$/, "");
  const selectedCardPublicUrl =
    selectedCard && selectedCard.publicRouteHint.startsWith("/")
      ? `${publicSiteOrigin}${selectedCard.publicRouteHint}`
      : "";
  const selectedSurfaceMeta =
    surface === "all"
      ? { description: "Все переводы по страницам, товарам, формам, SEO и кнопкам.", label: "Все направления" }
      : getSurfaceMeta(selectedCard ?? surfaceCards[0] ?? { fieldScope: "", ownerCollection: "pages" });
  const ownerScopeEntries = Array.from(
    surfaceCards.reduce(
      (map, card) => {
        const id = `${card.ownerCollection}:${card.ownerKey}`;
        const current = map.get(id);
        if (current) {
          current.count += 1;
          if (card.filterMatch === "stale" || card.isMissing) {
            current.priority += 2;
          } else if (card.filterMatch === "review") {
            current.priority += 1;
          }
          return map;
        }

        map.set(id, {
          count: 1,
          href: resolveAdminHref(
            adminRoute,
            `/admin/translations?ownerCollection=${card.ownerCollection}&ownerKey=${card.ownerKey}${
              locale !== "all" ? `&locale=${locale}` : ""
            }${filter !== "all" ? `&filter=${filter}` : ""}${surface !== "all" ? `&surface=${surface}` : ""}`,
          ),
          id,
          label: card.ownerLabel,
          ownerCollection: card.ownerCollection,
          ownerKey: card.ownerKey,
          priority: card.filterMatch === "stale" || card.isMissing ? 2 : card.filterMatch === "review" ? 1 : 0,
          surfaceLabel: getSurfaceMeta(card).label,
        });
        return map;
      },
      new Map<
        string,
        {
          count: number;
          href: string;
          id: string;
          label: string;
          ownerCollection: string;
          ownerKey: string;
          priority: number;
          surfaceLabel: string;
        }
      >(),
    ).values(),
  )
    .sort((left, right) => {
      if (right.priority !== left.priority) {
        return right.priority - left.priority;
      }
      if (right.count !== left.count) {
        return right.count - left.count;
      }
      return left.label.localeCompare(right.label);
    })
    .slice(0, 12);

  function replaceQuery(key: string, value: string | null) {
    const nextQuery = buildQuery(new URLSearchParams(searchParams.toString()), key, value);
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextValue = String(formData.get("q") ?? "").trim();
    replaceQuery("q", nextValue || null);
  }

  if (!authResolved) {
    return (
      <section className="montelar-translations-workspace montelar-translations-workspace--empty">
        <div className="montelar-translations-workspace__hero">
          <div>
            <p className="montelar-admin-dashboard__eyebrow">Переводы Montelar</p>
            <h1>Проверяю доступ к переводам</h1>
            <p>Смотрю вашу роль и права на рабочие очереди локалей.</p>
          </div>
        </div>
      </section>
    );
  }

  if (!canReachWorkspace) {
    return (
      <section className="montelar-translations-workspace montelar-translations-workspace--empty">
        <div className="montelar-translations-workspace__hero">
          <div>
            <p className="montelar-admin-dashboard__eyebrow">Переводы Montelar</p>
            <h1>Этот раздел недоступен для вашей роли</h1>
            <p>Вернитесь в панель или откройте рабочее пространство, которое подходит вашей роли.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="montelar-translations-workspace">
      <div className="montelar-translations-workspace__hero">
        <div>
          <p className="montelar-admin-dashboard__eyebrow">Переводы Montelar</p>
          <h1>Переводы по страницам, товарам и формам</h1>
          <p>
            Здесь видно, что не переведено, что устарело и что уже готово к публикации. Очереди привязаны к
            страницам, товарам, формам, кнопкам и SEO, а не к скрытым системным данным.
          </p>
        </div>
        <dl className="montelar-admin-dashboard__rail">
          <div>
            <dt>Сейчас в списке</dt>
            <dd>{surfaceCards.length}</dd>
          </div>
          <div>
            <dt>Очередь</dt>
            <dd>{getFilterLabel(snapshot.activeFilter)}</dd>
          </div>
          <div>
            <dt>Локаль</dt>
            <dd>{snapshot.activeLocale === "all" ? "Все" : snapshot.activeLocale.toUpperCase()}</dd>
          </div>
          <div>
            <dt>Фокус</dt>
            <dd>{selectedSurfaceMeta.label}</dd>
          </div>
        </dl>
      </div>

      <div className="montelar-translations-toolbar">
        <form className="montelar-translations-search" onSubmit={submitSearch}>
          <input
            defaultValue={searchParams.get("q") ?? ""}
            name="q"
            placeholder="Найти страницу, товар, публичный адрес, локаль или ответственного"
          />
          <button type="submit">Найти</button>
        </form>
        {ownerCollection && ownerKey ? (
          <Link href={resolveAdminHref(adminRoute, `/admin/translations${surface !== "all" ? `?surface=${surface}` : ""}`)}>
            Сбросить выбор страницы или товара
          </Link>
        ) : null}
      </div>

      <div className="montelar-translations-layout">
        <aside className="montelar-translations-sidebar">
          <section className="montelar-translations-sidebar__panel">
            <div className="montelar-translations-sidebar__title">Очереди</div>
            <div className="montelar-translations-filter-list">
              {snapshot.filters.map((entry) => (
                <button
                  className={entry.id === filter ? "montelar-translations-filter is-active" : "montelar-translations-filter"}
                  key={entry.id}
                  onClick={() => replaceQuery("filter", entry.id === "all" ? null : entry.id)}
                  type="button"
                >
                  <span>{getFilterLabel(entry.id)}</span>
                  <small>{entry.description}</small>
                  <strong>{entry.count}</strong>
                </button>
              ))}
            </div>
          </section>

          <section className="montelar-translations-sidebar__panel">
            <div className="montelar-translations-sidebar__title">Локали</div>
            <div className="montelar-translations-locale-list">
              <button
                className={locale === "all" ? "montelar-translations-locale is-active" : "montelar-translations-locale"}
                onClick={() => replaceQuery("locale", null)}
                type="button"
              >
                <div>
                  <strong>Все локали</strong>
                  <span>Общий список к запуску</span>
                </div>
              </button>
              {snapshot.localeSummaries.map((entry) => (
                <button
                  className={entry.code === locale ? "montelar-translations-locale is-active" : "montelar-translations-locale"}
                  key={entry.code}
                  onClick={() => replaceQuery("locale", entry.code)}
                  type="button"
                >
                  <div>
                    <strong>{entry.nativeLabel}</strong>
                    <span>{entry.englishLabel} · {entry.code.toUpperCase()}</span>
                  </div>
                  <small>
                    пусто {entry.missing} · проверка {entry.review} · устарело {entry.stale}
                  </small>
                </button>
              ))}
            </div>
          </section>

          <section className="montelar-translations-sidebar__panel">
            <div className="montelar-translations-sidebar__title">Тип работ</div>
            <div className="montelar-translations-filter-list">
              {([
                { description: "Весь переводческий контур.", id: "all", label: "Все направления" },
                { description: "Главные страницы и блоки.", id: "pages", label: "Страницы" },
                { description: "Направления, линейки и карточки товаров.", id: "products", label: "Товары" },
                { description: "Категории и уровни каталога.", id: "categories", label: "Категории" },
                { description: "Первый экран и кнопки.", id: "buttons", label: "Кнопки" },
                { description: "Формы заявки и thank-you сообщения.", id: "forms", label: "Формы" },
                { description: "Публичные адреса, title и description.", id: "seo", label: "SEO" },
                { description: "PDF и сопроводительные подписи.", id: "documents", label: "Документы" },
              ] as const).map((entry) => {
                const count =
                  entry.id === "all"
                    ? snapshot.cards.length
                    : snapshot.cards.filter((card) => getSurfaceMeta(card).id === entry.id).length;
                return (
                  <button
                    className={surface === entry.id ? "montelar-translations-filter is-active" : "montelar-translations-filter"}
                    key={entry.id}
                    onClick={() => replaceQuery("surface", entry.id === "all" ? null : entry.id)}
                    type="button"
                  >
                    <span>{entry.label}</span>
                    <small>{entry.description}</small>
                    <strong>{count}</strong>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="montelar-translations-sidebar__panel">
            <div className="montelar-translations-sidebar__title">Страница или товар</div>
            <div className="montelar-translations-owner-list">
              {ownerScopeEntries.length > 0 ? (
                ownerScopeEntries.map((entry) => {
                  const isActive = ownerCollection === entry.ownerCollection && ownerKey === entry.ownerKey;
                  return (
                    <Link
                      className={isActive ? "montelar-translations-owner is-active" : "montelar-translations-owner"}
                      href={entry.href}
                      key={entry.id}
                    >
                      <span>{entry.surfaceLabel}</span>
                      <strong>{entry.label}</strong>
                      <small>{entry.count} задач(и) в текущем срезе</small>
                    </Link>
                  );
                })
              ) : (
                <p>Сузьте локаль, очередь или поиск, чтобы выбрать конкретную страницу, товар или форму.</p>
              )}
            </div>
          </section>
        </aside>

        <div className="montelar-translations-list">
          {isLoading ? (
            <article className="montelar-translations-card montelar-translations-card--placeholder">
              <strong>Загружаю очереди переводов...</strong>
              <p>Собираю пустые, устаревшие и активные задачи по локалям.</p>
            </article>
          ) : null}
          {isError ? (
            <article className="montelar-translations-card montelar-translations-card--placeholder">
              <strong>Раздел сейчас недоступен</strong>
              <p>Обновите страницу или вернитесь позже: очередь переводов сейчас не загрузилась.</p>
            </article>
          ) : null}
          {!isLoading && !isError && surfaceCards.length === 0 ? (
            <article className="montelar-translations-card montelar-translations-card--placeholder">
              <strong>{snapshot.emptyState}</strong>
              <p>Попробуйте другую локаль, очередь или вернитесь ко всем направлениям.</p>
            </article>
          ) : null}
          {surfaceCards.map((card) => (
            <button
              className={selectedCard?.id === card.id ? "montelar-translations-card is-active" : "montelar-translations-card"}
              key={card.id}
              onClick={() => setSelectedId(card.id)}
              type="button"
            >
              <div className="montelar-translations-card__topline">
                <span>{getOwnerCollectionLabel(card)}</span>
                <span className={`montelar-admin-state montelar-admin-state--${getStatusTone(card)}`}>{getStatusLabel(card)}</span>
              </div>
              <strong>{card.ownerLabel}</strong>
              <p>
                {getLocaleLabel(snapshot, card.sourceLocale)} → {getLocaleLabel(snapshot, card.targetLocale)} ·{" "}
                {getScopeLabel(card.fieldScope)}
              </p>
              <div className="montelar-translations-card__meta">
                <span>{getSurfaceMeta(card).label}</span>
                <span>{getWorkflowStageLabel(card.workflowStage)}</span>
                <span>{card.translatorAssigneeLabel || "без ответственного"}</span>
              </div>
              {card.warningLabels.length > 0 ? (
                <div className="montelar-translations-card__warnings">
                  {card.warningLabels.slice(0, 3).map((warning) => (
                    <span key={warning}>{getWarningLabel(warning)}</span>
                  ))}
                </div>
              ) : null}
            </button>
          ))}
        </div>

        <div className="montelar-translations-detail">
          {selectedCard ? (
            <>
              <section className="montelar-translations-detail__hero">
                <div className="montelar-translations-detail__topline">
                  <span>{getOwnerCollectionLabel(selectedCard)}</span>
                  <span>
                    {getLocaleLabel(snapshot, selectedCard.sourceLocale)} →{" "}
                    {getLocaleLabel(snapshot, selectedCard.targetLocale)}
                  </span>
                </div>
                <h2>{selectedCard.ownerLabel}</h2>
                <p>Здесь собраны исходный текст, целевой язык, риск устаревания, SEO-переход и готовность к публикации.</p>
                <div className="montelar-translations-detail__actions">
                  <Link href={resolveAdminHref(adminRoute, selectedCard.ownerHref)}>{getOwnerWorkspaceLabel(selectedCard)}</Link>
                  {selectedCardPublicUrl ? (
                    <a href={selectedCardPublicUrl} rel="noreferrer" target="_blank">
                      {selectedCard.status === "published" ? "Открыть опубликованную страницу" : "Открыть текущую live-версию"}
                    </a>
                  ) : null}
                  {selectedCard.seoWorkspaceHref ? (
                    <Link href={resolveAdminHref(adminRoute, selectedCard.seoWorkspaceHref)}>Открыть SEO</Link>
                  ) : null}
                </div>
              </section>

              <section className="montelar-translations-detail__grid">
                <article className="montelar-translations-detail__panel">
                  <div className="montelar-translations-detail__panel-title">Обзор</div>
                  <dl>
                    <div>
                      <dt>Выбранный объект</dt>
                      <dd>{selectedCard.ownerKey}</dd>
                    </div>
                    <div>
                      <dt>Исходная локаль</dt>
                      <dd>{getLocaleLabel(snapshot, selectedCard.sourceLocale)}</dd>
                    </div>
                    <div>
                      <dt>Целевая локаль</dt>
                      <dd>{getLocaleLabel(snapshot, selectedCard.targetLocale)}</dd>
                    </div>
                    <div>
                      <dt>Статус</dt>
                      <dd>{getStatusLabel(selectedCard)}</dd>
                    </div>
                    <div>
                      <dt>Этап</dt>
                      <dd>{getWorkflowStageLabel(selectedCard.workflowStage)}</dd>
                    </div>
                    <div>
                      <dt>Актуальность</dt>
                      <dd>{getFreshnessLabel(selectedCard.staleSourceState)}</dd>
                    </div>
                    <div>
                      <dt>Готовность к публикации</dt>
                      <dd>{getPublishReadinessLabel(selectedCard.publishReadiness)}</dd>
                    </div>
                    <div>
                      <dt>Переводчик</dt>
                      <dd>{selectedCard.translatorAssigneeLabel || "Не назначен"}</dd>
                    </div>
                    <div>
                      <dt>Проверяющий</dt>
                      <dd>{selectedCard.reviewerAssigneeLabel || "Не назначен"}</dd>
                    </div>
                  </dl>
                </article>

                <article className="montelar-translations-detail__panel">
                  <div className="montelar-translations-detail__panel-title">Исходный текст</div>
                  <dl>
                    <div>
                      <dt>Заголовок</dt>
                      <dd>{selectedCard.sourceTitleSnapshot || "Заголовок ещё не зафиксирован"}</dd>
                    </div>
                    <div>
                      <dt>Версия исходного текста</dt>
                      <dd>{selectedCard.sourceRevisionKey || "Версия ещё не зафиксирована"}</dd>
                    </div>
                    <div>
                      <dt>Адрес источника</dt>
                      <dd>{selectedCard.ownerRoutePath || "Публичный адрес ещё не задан"}</dd>
                    </div>
                    <div>
                      <dt>Адрес локали</dt>
                      <dd>{selectedCard.targetRoutePath || "Пока не задан"}</dd>
                    </div>
                  </dl>
                </article>

                <article className="montelar-translations-detail__panel">
                  <div className="montelar-translations-detail__panel-title">Риски и зависимости</div>
                  {selectedCard.warningLabels.length > 0 ? (
                    <ul>
                      {selectedCard.warningLabels.map((warning) => (
                        <li key={warning}>{getWarningLabel(warning)}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>Сейчас активных предупреждений нет.</p>
                  )}
                  {selectedCard.publishBlockedReasons.length > 0 ? (
                    <ul>
                      {selectedCard.publishBlockedReasons.map((reason) => (
                        <li key={reason}>{getPublishBlockedReasonLabel(reason)}</li>
                      ))}
                    </ul>
                  ) : null}
                  <p>{getFreshnessLabel(selectedCard.staleSourceState)}</p>
                  <p>{getPublishReadinessLabel(selectedCard.publishReadiness)}</p>
                  {selectedCard.staleReason ? <p>Комментарий по устареванию: {selectedCard.staleReason}</p> : null}
                </article>
              </section>

              <section className="montelar-translations-detail__panel">
                <div className="montelar-translations-detail__panel-title">Целевая локаль и аудит</div>
                <dl>
                  <div>
                    <dt>Заголовок локали</dt>
                    <dd>{selectedCard.targetTitle || "Пока не заполнен"}</dd>
                  </div>
                  <div>
                      <dt>Короткий адрес локали</dt>
                    <dd>{selectedCard.targetSlug || "Пока не заполнен"}</dd>
                  </div>
                  <div>
                    <dt>Структурных полей</dt>
                    <dd>{selectedCard.structuredFieldCount}</dd>
                  </div>
                  <div>
                    <dt>Адрес для просмотра</dt>
                    <dd>{selectedCard.publicRouteHint}</dd>
                  </div>
                  <div>
                    <dt>Причина изменения</dt>
                    <dd>{selectedCard.changeReason || "Причина ещё не указана"}</dd>
                  </div>
                  <div>
                    <dt>Внутренние заметки</dt>
                    <dd>{selectedCard.internalNotes || "Внутренних заметок пока нет"}</dd>
                  </div>
                </dl>
              </section>

              <TranslationContentForm
                canUpdate={snapshot.canUpdate}
                card={selectedCard}
                key={`${selectedCard.id}:content`}
                onError={setError}
                onSaved={() => {
                  setReloadToken((token) => token + 1);
                }}
              />

              <TranslationWorkflowForm
                canAssign={snapshot.canAssign}
                canPublish={snapshot.canPublish}
                canUpdate={snapshot.canUpdate}
                card={selectedCard}
                key={selectedCard.id}
                onCreated={(recordId) => {
                  setSelectedId(recordId);
                  setReloadToken((token) => token + 1);
                }}
                onError={setError}
                onSaved={() => {
                  setReloadToken((token) => token + 1);
                }}
                reviewerOptions={snapshot.reviewerOptions}
                translatorOptions={snapshot.translatorOptions}
              />
              {error ? <div className="montelar-translations-error">{error}</div> : null}
            </>
          ) : (
            <section className="montelar-translations-detail__empty">
              <p>Выберите карточку перевода, чтобы посмотреть исходник, блокеры локали и действия.</p>
            </section>
          )}
        </div>
      </div>
    </section>
  );
}
