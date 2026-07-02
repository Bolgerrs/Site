import React from "react";

import {
  canPublishForm,
  getFormsEditorSnapshot,
  getFormPreviewUrl,
  getFormsWorkspaceRoleLabel,
} from "../../lib/payload/forms-editor.ts";
import { getAdminUser } from "../../lib/payload/access.ts";

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getSurface(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : "overview";
}

function getStatusTone(status: string) {
  switch (status) {
    case "published":
      return "steady";
    case "review":
      return "attention";
    case "hidden":
    case "archived":
      return "alert";
    default:
      return "planned";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "draft":
      return "черновик";
    case "review":
      return "на проверке";
    case "published":
      return "опубликовано";
    case "hidden":
      return "скрыто";
    case "archived":
      return "архив";
    default:
      return status;
  }
}

function getApprovalLabel(status: string) {
  switch (status) {
    case "pending":
      return "ожидает";
    case "needs-review":
      return "нужна проверка";
    case "approved":
      return "согласовано";
    case "rejected":
      return "отклонено";
    default:
      return status;
  }
}

function getChecklistReadyCount(
  checklist: Array<{
    state: string;
  }>,
) {
  return checklist.filter((item) => item.state === "ready").length;
}

export async function FormsEditorWorkspaceField({
  data,
  field,
  req,
  payload,
}: {
  data: Record<string, unknown>;
  field: { admin?: { custom?: { surface?: string } } };
  payload: Parameters<typeof getFormsEditorSnapshot>[0];
  req: Parameters<typeof getFormPreviewUrl>[1];
}) {
  const surface = getSurface(field.admin?.custom?.surface);
  const snapshot = await getFormsEditorSnapshot(payload, data);
  const role = getAdminUser(req.user)?.role ?? null;
  const status = getText(data.status) || "draft";
  const locale = getText(data.locale).toUpperCase() || "EN";
  const approvalStatus = getText(data.approvalStatus) || "pending";
  const formMode = getText(data.formMode) || "product-inquiry";
  const submissionChannel = getText(data.submissionChannel) || "cms-lead";
  const previewUrl = await getFormPreviewUrl(data, req);
  const publishAllowed = await canPublishForm(req.user, req);
  const readyCount = getChecklistReadyCount(snapshot.checklist);
  const blockerHref = snapshot.blockers[0]?.href || snapshot.linkedWorkspaces[0]?.href || "#";
  const productName =
    getText((data.product as { publicLabel?: unknown; name?: unknown } | null | undefined)?.publicLabel) ||
    getText((data.product as { publicLabel?: unknown; name?: unknown } | null | undefined)?.name);

  if (surface === "structure") {
    return (
      <section className="montelar-forms-editor-card">
        <div className="montelar-forms-editor-card__eyebrow">Структура формы</div>
        <p className="montelar-forms-editor-card__note">
          Здесь можно безопасно менять группы и поля формы без поломки управляемой схемы. Снимок
          `submittedLabelSnapshot` сохраняется для истории уже отправленных заявок.
        </p>
        <div className="montelar-forms-editor-card__metrics">
          <article>
            <strong>{snapshot.fieldCount}</strong>
            <span>активных полей</span>
          </article>
          <article>
            <strong>{Array.isArray(data.fieldGroups) ? data.fieldGroups.length : 0}</strong>
            <span>групп полей</span>
          </article>
        </div>
        {snapshot.fieldSummaries.length > 0 ? (
          <div className="montelar-forms-editor-fields">
            {snapshot.fieldSummaries.map((entry) => (
              <a href={entry.href || "#field-fields"} key={entry.fieldKey}>
                <div>
                  <strong>{entry.label}</strong>
                  <span>
                    {entry.fieldType} · {entry.required ? "обязательное" : "необязательное"}
                  </span>
                </div>
                <b>{entry.leadMappingKey || "нет привязки"}</b>
              </a>
            ))}
          </div>
        ) : (
          <p className="montelar-forms-editor-card__note">
            Добавьте хотя бы одно поле, прежде чем форма сможет выйти из черновика.
          </p>
        )}
      </section>
    );
  }

  if (surface === "context") {
    return (
      <section className="montelar-forms-editor-card">
        <div className="montelar-forms-editor-card__eyebrow">Связь с продуктом</div>
        <div className="montelar-forms-editor-card__metrics">
          <article>
            <strong>{snapshot.localeCoverageCount}</strong>
            <span>локальных форм для продукта</span>
          </article>
          <article>
            <strong>{getText(data.allowedVariantModes) || "product-only"}</strong>
            <span>режим варианта</span>
          </article>
        </div>
        <div className="montelar-forms-editor-links">
          {snapshot.linkedWorkspaces
            .filter((entry) => entry.id === "product" || entry.id === "forms")
            .map((entry) => (
              <a href={entry.href} key={entry.id}>
                <strong>{entry.label}</strong>
                <span>{entry.description}</span>
              </a>
            ))}
        </div>
      </section>
    );
  }

  if (surface === "routing") {
    return (
      <section className="montelar-forms-editor-card">
        <div className="montelar-forms-editor-card__eyebrow">Маршрут и уведомления</div>
        <div className="montelar-forms-editor-card__metrics">
          <article>
            <strong>{submissionChannel}</strong>
            <span>канал отправки</span>
          </article>
          <article>
            <strong>{Array.isArray(data.notificationEmails) ? data.notificationEmails.length : 0}</strong>
            <span>получателей уведомлений</span>
          </article>
        </div>
        <p className="montelar-forms-editor-card__note">
          Здесь настраивается только операционная доставка заявки. Дальнейшая обработка остаётся во входящих
          заявках, а не в служебной схеме формы.
        </p>
      </section>
    );
  }

  if (surface === "consent") {
    return (
      <section className="montelar-forms-editor-card">
        <div className="montelar-forms-editor-card__eyebrow">Согласие и приватность</div>
        <p className="montelar-forms-editor-card__note">
          Здесь появляются блокеры публикации, если не заполнен профиль согласия, текст приватности или
          юридическая проверка.
        </p>
        <dl className="montelar-forms-editor-meta">
          <div>
            <dt>Профиль согласия</dt>
            <dd>{getText(data.consentProfile) || "не задан"}</dd>
          </div>
          <div>
            <dt>Режим приватности</dt>
            <dd>{getText(data.privacyNoticeLinkMode) || "global-policy"}</dd>
          </div>
          <div>
            <dt>Проверка владельца</dt>
            <dd>{data.ownerReviewRequired === true ? "обязательна" : "не обязательна"}</dd>
          </div>
        </dl>
      </section>
    );
  }

  if (surface === "translations") {
    return (
      <section className="montelar-forms-editor-card">
        <div className="montelar-forms-editor-card__eyebrow">Переводы</div>
        <div className="montelar-forms-editor-card__metrics">
          <article>
            <strong>{snapshot.translationCount}</strong>
            <span>всего переводов</span>
          </article>
          <article>
            <strong>{snapshot.publishedTranslationCount}</strong>
            <span>опубликованных локалей</span>
          </article>
          <article>
            <strong>{snapshot.reviewTranslationCount}</strong>
            <span>на проверке</span>
          </article>
          <article>
            <strong>{snapshot.launchLocaleCount}</strong>
            <span>целевых локалей запуска</span>
          </article>
        </div>
        <div className="montelar-forms-editor-links">
          {snapshot.linkedWorkspaces
            .filter((entry) => entry.id === "translations")
            .map((entry) => (
              <a href={entry.href} key={entry.id}>
                <strong>{entry.label}</strong>
                <span>{entry.description}</span>
              </a>
            ))}
        </div>
      </section>
    );
  }

  if (surface === "lead-mapping") {
    return (
      <section className="montelar-forms-editor-card">
        <div className="montelar-forms-editor-card__eyebrow">Связь с лидами</div>
        <p className="montelar-forms-editor-card__note">
          Уже отправленные заявки сохраняют свой снимок названий полей. Новые отправки получают обновлённый
          `submittedFieldSnapshotTemplate` из текущих определений формы.
        </p>
        <div className="montelar-forms-editor-links">
          {snapshot.linkedWorkspaces
            .filter((entry) => entry.id === "leads")
            .map((entry) => (
              <a href={entry.href} key={entry.id}>
                <strong>{entry.label}</strong>
                <span>{entry.count} заявок связано с этой формой</span>
              </a>
            ))}
        </div>
      </section>
    );
  }

  if (surface === "preview") {
    return (
      <section className="montelar-forms-editor-card">
        <div className="montelar-forms-editor-card__eyebrow">Предпросмотр и публикация</div>
        <p className="montelar-forms-editor-card__note">
          Предпросмотр идёт по реальному маршруту заявки, чтобы администратор видел форму в рабочем рендере
          ещё до публикации.
        </p>
        <div className="montelar-forms-editor-links">
          <a href={previewUrl || "#"} rel="noreferrer" target="_blank">
            <strong>Открыть предпросмотр</strong>
            <span>Безопасный черновой маршрут заявки для этой формы</span>
          </a>
          <a
            href={status === "published" ? snapshot.formPublicUrl : snapshot.productPublicUrl}
            rel="noreferrer"
            target="_blank"
          >
            <strong>{status === "published" ? "Открыть публичный маршрут заявки" : "Открыть родительский продукт"}</strong>
            <span>
              {status === "published"
                ? "Текущий публичный маршрут локальной формы"
                : publishAllowed
                  ? "Снимите блокеры и затем выпускайте форму через управляемый workflow"
                  : "Публикация доступна только Owner/Admin"}
            </span>
          </a>
        </div>
      </section>
    );
  }

  if (surface === "notes") {
    return (
      <section className="montelar-forms-editor-card">
        <div className="montelar-forms-editor-card__eyebrow">Внутренние заметки</div>
        <p className="montelar-forms-editor-card__note">{getFormsWorkspaceRoleLabel(role)}</p>
        <p className="montelar-forms-editor-card__note">
          Здесь остаются пояснения по маршрутизации, юридические пометки и owner-checkpoint. Публичные тексты
          живут в видимых полях формы, а не в скрытых служебных заметках.
        </p>
      </section>
    );
  }

  return (
    <section className="montelar-forms-editor-hero">
      <div>
        <div className="montelar-forms-editor-card__eyebrow">Рабочее пространство формы</div>
        <h2>{getText(data.title) || "Новый черновик формы заявки"}</h2>
        <p className="montelar-forms-editor-card__note">
          Здесь форма остаётся привязанной к продукту, локалям и безопасной обработке заявок без превращения
          редактора в сырой конструктор схем.
        </p>
        <div className="montelar-forms-editor-card__metrics">
          <article>
            <strong>{readyCount}</strong>
            <span>готовых проверок</span>
          </article>
          <article>
            <strong>{snapshot.blockers.length}</strong>
            <span>блокеров</span>
          </article>
        </div>
        <div className="montelar-forms-editor-inline-meta">
          <span className={`montelar-admin-state montelar-admin-state--${getStatusTone(status)}`}>{getStatusLabel(status)}</span>
          <span>{getApprovalLabel(approvalStatus)}</span>
          <span>исходная локаль {locale}</span>
          <span>{formMode}</span>
          <span>{productName || "продукт пока не привязан"}</span>
        </div>
      </div>
      <div className="montelar-forms-editor-links">
        <a href={previewUrl || "#"} rel="noreferrer" target="_blank">
          <strong>Открыть предпросмотр</strong>
          <span>Черновой маршрут заявки для проверки формы</span>
        </a>
        <a
          href={status === "published" ? snapshot.formPublicUrl : blockerHref}
          rel={status === "published" ? "noreferrer" : undefined}
          target={status === "published" ? "_blank" : undefined}
        >
          <strong>{status === "published" ? "Открыть публичный маршрут заявки" : "Убрать блокеры публикации"}</strong>
          <span>
            {status === "published"
              ? "Текущий публичный маршрут локальной заявки"
              : snapshot.blockers.length > 0
                ? "Откройте первую блокирующую зависимость"
                : publishAllowed
                  ? "Маршрут, согласие и локали выглядят готовыми к проверке и выпуску"
                  : "Публикация доступна только Owner/Admin"}
          </span>
        </a>
      </div>
      <div className="montelar-forms-editor-workspaces">
        {snapshot.linkedWorkspaces.map((entry) => (
          <a href={entry.href} key={entry.id}>
            <strong>{entry.label}</strong>
            <span>{entry.description}</span>
            <b>{entry.count}</b>
          </a>
        ))}
      </div>
    </section>
  );
}
