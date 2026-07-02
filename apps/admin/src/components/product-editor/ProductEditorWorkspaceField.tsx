import React from "react";

import {
  canPublishProduct,
  getProductEditorSnapshot,
  getProductPreviewUrl,
  getProductWorkspaceRoleLabel,
} from "../../lib/payload/product-editor.ts";
import { getAdminUser } from "../../lib/payload/access.ts";
import { buildAdvancedCollectionHref } from "../../lib/admin-bff/raw-layer.ts";

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

function getChecklistReadyCount(
  checklist: Array<{
    state: string;
  }>,
) {
  return checklist.filter((item) => item.state === "ready").length;
}

export async function ProductEditorWorkspaceField({
  data,
  field,
  req,
  payload,
}: {
  data: Record<string, unknown>;
  field: { admin?: { custom?: { surface?: string } } };
  payload: Parameters<typeof getProductEditorSnapshot>[0];
  req: Parameters<typeof getProductPreviewUrl>[1];
}) {
  const surface = getSurface(field.admin?.custom?.surface);
  const snapshot = await getProductEditorSnapshot(payload, data);
  const role = getAdminUser(req.user)?.role ?? null;
  const status = getText(data.status) || "draft";
  const hierarchy = [
    getText((data.direction as { name?: unknown; publicLabel?: unknown } | null | undefined)?.publicLabel),
    getText((data.category as { publicLabel?: unknown } | null | undefined)?.publicLabel),
    getText((data.line as { publicLabel?: unknown } | null | undefined)?.publicLabel),
  ].filter(Boolean);
  const previewUrl = await getProductPreviewUrl(data, req);
  const publicUrl = snapshot.publicUrl;
  const publishAllowed = await canPublishProduct(req.user, req);
  const readyCount = getChecklistReadyCount(snapshot.checklist);

  if (surface === "media") {
    return (
      <section className="montelar-product-editor-card">
        <div className="montelar-product-editor-card__eyebrow">Медиа и документы</div>
        <div className="montelar-product-editor-card__metrics">
          <article>
            <strong>{snapshot.approvedPublicMediaCount}</strong>
            <span>готовых публичных медиа</span>
          </article>
          <article>
            <strong>{snapshot.approvedDocumentCount}</strong>
            <span>готовых документов</span>
          </article>
        </div>
        <div className="montelar-product-editor-links">
          {snapshot.linkedWorkspaces
            .filter((entry) => entry.id === "media" || entry.id === "documents")
            .map((entry) => (
              <a href={entry.href} key={entry.id}>
                <strong>{entry.label}</strong>
                <span>{entry.count} записей</span>
              </a>
            ))}
        </div>
      </section>
    );
  }

  if (surface === "inquiry") {
    return (
      <section className="montelar-product-editor-card">
        <div className="montelar-product-editor-card__eyebrow">Форма заявки</div>
        <p className="montelar-product-editor-card__note">
          {snapshot.approvedPrimaryFormCount > 0
            ? "Основная форма для исходной локали подтверждена и готова к публичному маршруту."
            : "Перед выпуском добавьте одну утвержденную основную форму."}
        </p>
        <div className="montelar-product-editor-links">
          {snapshot.linkedWorkspaces
            .filter((entry) => entry.id === "forms")
            .map((entry) => (
              <a href={entry.href} key={entry.id}>
                <strong>{entry.label}</strong>
                <span>{entry.count} привязанных форм</span>
              </a>
            ))}
        </div>
      </section>
    );
  }

  if (surface === "variants") {
    return (
      <section className="montelar-product-editor-card">
        <div className="montelar-product-editor-card__eyebrow">Варианты и спецификации</div>
        <p className="montelar-product-editor-card__note">
          Варианты остаются отдельным слоем, но менеджер видит их готовность, базовую конфигурацию и
          публичные claims без технического перегруза.
        </p>
        <div className="montelar-product-editor-links">
          {snapshot.linkedWorkspaces
            .filter((entry) => entry.id === "variants")
            .map((entry) => (
              <a href={entry.href} key={entry.id}>
                <strong>{entry.label}</strong>
                <span>{entry.count} вариантов</span>
              </a>
            ))}
        </div>
      </section>
    );
  }

  if (surface === "translations") {
    return (
      <section className="montelar-product-editor-card">
        <div className="montelar-product-editor-card__eyebrow">Переводы</div>
        <div className="montelar-product-editor-card__metrics">
          <article>
            <strong>{snapshot.translationCount}</strong>
            <span>всего переводов</span>
          </article>
          <article>
            <strong>{snapshot.publishedTranslationCount}</strong>
            <span>опубликованных локалей</span>
          </article>
        </div>
        <div className="montelar-product-editor-links">
          {snapshot.linkedWorkspaces
            .filter((entry) => entry.id === "translations")
            .map((entry) => (
              <a href={entry.href} key={entry.id}>
                <strong>{entry.label}</strong>
                <span>{entry.count} записей</span>
              </a>
            ))}
        </div>
      </section>
    );
  }

  if (surface === "seo") {
    return (
      <section className="montelar-product-editor-card">
        <div className="montelar-product-editor-card__eyebrow">Короткое SEO и маршрут</div>
        <p className="montelar-product-editor-card__note">
          Публичный URL: <code>{publicUrl}</code>
        </p>
        <div className="montelar-product-editor-links">
          {snapshot.linkedWorkspaces
            .filter((entry) => entry.id === "seo")
            .map((entry) => (
              <a href={entry.href} key={entry.id}>
                <strong>{entry.label}</strong>
                <span>{snapshot.seoApprovedCount} готовых SEO-записей</span>
              </a>
            ))}
        </div>
      </section>
    );
  }

  if (surface === "publish") {
    return (
      <section className="montelar-product-editor-card">
        <div className="montelar-product-editor-card__eyebrow">Preview и публикация</div>
        <p className="montelar-product-editor-card__note">
          Спокойный owner flow: сначала черновик, затем review, затем выпуск после проверки блокеров и
          публичного маршрута.
        </p>
        <div className="montelar-product-editor-card__metrics">
          <article>
            <strong>{readyCount}</strong>
            <span>готовых проверок</span>
          </article>
          <article>
            <strong>{snapshot.blockers.length}</strong>
            <span>блокеров</span>
          </article>
        </div>
        <div className="montelar-product-editor-links">
          <a href={previewUrl || "#"} rel="noreferrer" target="_blank">
            <strong>Открыть предпросмотр</strong>
            <span>Безопасная черновая версия страницы продукта</span>
          </a>
          <a
            href={status === "published" ? publicUrl : snapshot.linkedWorkspaces[5]?.href || "#"}
            rel={status === "published" ? "noreferrer" : undefined}
            target={status === "published" ? "_blank" : undefined}
        >
            <strong>{status === "published" ? "Открыть live-страницу" : "Убрать блокеры публикации"}</strong>
            <span>
              {status === "published"
                ? "Текущий публичный маршрут"
                : snapshot.blockers.length > 0
                  ? "Сначала откройте первую блокирующую зависимость"
                  : "SEO и маршрут выглядят готовыми к review/publish"}
            </span>
          </a>
        </div>
      </section>
    );
  }

  if (surface === "creative") {
    const sourceArtifact = getText(data.sourceOfTruthArtifact);
    const referenceCount = Array.isArray(data.sourceArtifactReferences)
      ? data.sourceArtifactReferences.length
      : 0;

    return (
      <section className="montelar-product-editor-card">
        <div className="montelar-product-editor-card__eyebrow">Креатив и референсы</div>
        <p className="montelar-product-editor-card__note">
          Здесь хранится связка с утвержденными артефактами и референсами. Публичные изображения по-прежнему
          приходят из управляемых медиа и документов, а не из случайных заметок.
        </p>
        <dl className="montelar-product-editor-meta">
          <div>
            <dt>Основной артефакт</dt>
            <dd>{sourceArtifact || "Еще не привязан"}</dd>
          </div>
          <div>
            <dt>Референсные артефакты</dt>
            <dd>{referenceCount}</dd>
          </div>
        </dl>
      </section>
    );
  }

  if (surface === "notes") {
    return (
      <section className="montelar-product-editor-card">
        <div className="montelar-product-editor-card__eyebrow">Внутренние заметки</div>
        <p className="montelar-product-editor-card__note">{getProductWorkspaceRoleLabel(role)}</p>
        <p className="montelar-product-editor-card__note">
          Здесь остаются комментарии к выпуску, naming и owner-checkpoint. Публичный текст продукта живет
          во вкладке контента, а не в служебных полях.
        </p>
      </section>
    );
  }

  return (
    <section className="montelar-product-editor-hero">
      <div>
        <div className="montelar-product-editor-card__eyebrow">Рабочее пространство продукта</div>
        <h2>{getText(data.publicLabel) || getText(data.name) || "Новый продукт"}</h2>
        <p className="montelar-product-editor-card__note">
          Здесь продукт проходит путь от иерархии и описания до медиа, формы, переводов и SEO без погружения
          в raw collection lists.
        </p>
        <div className="montelar-product-editor-card__metrics">
          <article>
            <strong>{readyCount}</strong>
            <span>готовых проверок</span>
          </article>
          <article>
            <strong>{snapshot.blockers.length}</strong>
            <span>блокеров</span>
          </article>
        </div>
        <div className="montelar-product-editor-inline-meta">
          <span className={`montelar-admin-state montelar-admin-state--${getStatusTone(status)}`}>{getStatusLabel(status)}</span>
          <span>{hierarchy.length > 0 ? hierarchy.join(" / ") : "Иерархия еще не собрана"}</span>
          <span>исходная локаль {getText(data.primaryLocale).toUpperCase() || "EN"}</span>
        </div>
      </div>
      <div className="montelar-product-editor-links">
        <a href={buildAdvancedCollectionHref("products", { label: "Список продуктов", query: "sort=order&limit=25" })}>
          <strong>Открыть список продуктов</strong>
          <span>Вернуться к каталогу со статусами, семействами и порядком</span>
        </a>
        <a href={buildAdvancedCollectionHref("products", { action: "create", label: "Создать продукт" })}>
          <strong>Создать продукт</strong>
          <span>Новый черновик до подключения форм, медиа и SEO</span>
        </a>
      </div>
      <div className="montelar-product-editor-links">
        <a href={buildAdvancedCollectionHref("product-categories", { label: "Категории продуктов", query: "sort=order&limit=25" })}>
          <strong>Открыть категории</strong>
          <span>Назначение категорий, cover и порядок вывода</span>
        </a>
        <a href={buildAdvancedCollectionHref("product-categories", { action: "create", label: "Создать категорию" })}>
          <strong>Создать категорию</strong>
          <span>Новый контейнер для каталога и связанных продуктов</span>
        </a>
      </div>
      <div className="montelar-product-editor-links">
        <a href={previewUrl || "#"} rel="noreferrer" target="_blank">
          <strong>Открыть предпросмотр</strong>
          <span>Безопасная черновая версия продукта</span>
        </a>
        <a
          href={status === "published" ? publicUrl : snapshot.linkedWorkspaces[5]?.href || "#"}
          rel={status === "published" ? "noreferrer" : undefined}
          target={status === "published" ? "_blank" : undefined}
        >
          <strong>{status === "published" ? "Открыть live-страницу" : "Подготовить публичный маршрут"}</strong>
          <span>
            {status === "published"
              ? "Текущий публичный маршрут"
              : publishAllowed
                ? "Сначала завершите SEO и снимите блокеры публикации"
                : "Публикация доступна только Owner/Admin"}
          </span>
        </a>
      </div>
      <div className="montelar-product-editor-workspaces">
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
