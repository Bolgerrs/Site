import React from "react";

import {
  canPublishCategory,
  getCategoryEditorActionHrefs,
  getCategoryEditorSnapshot,
  getCategoryPreviewUrl,
  getCategoryWorkspaceRoleLabel,
} from "../../lib/payload/category-editor.ts";
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

function getChecklistReadyCount(checklist: Array<{ state: string }>) {
  return checklist.filter((item) => item.state === "ready").length;
}

export async function CategoryEditorWorkspaceField({
  data,
  field,
  req,
  payload,
}: {
  data: Record<string, unknown>;
  field: { admin?: { custom?: { surface?: string } } };
  payload: Parameters<typeof getCategoryEditorSnapshot>[0];
  req: Parameters<typeof getCategoryPreviewUrl>[1];
}) {
  const surface = getSurface(field.admin?.custom?.surface);
  const snapshot = await getCategoryEditorSnapshot(payload, data);
  const actionHrefs = getCategoryEditorActionHrefs();
  const role = getAdminUser(req.user)?.role ?? null;
  const status = getText(data.status) || "draft";
  const previewUrl = await getCategoryPreviewUrl(data, req);
  const publishAllowed = await canPublishCategory(req.user, req);
  const primaryLocale = getText(data.primaryLocale).toUpperCase() || "EN";
  const readyCount = getChecklistReadyCount(snapshot.checklist);
  const blockerHref = snapshot.blockers[0]?.href || snapshot.linkedWorkspaces[3]?.href || "#";

  if (surface === "relations") {
    return (
      <section className="montelar-product-editor-card">
        <div className="montelar-product-editor-card__eyebrow">Продукты и подкатегории</div>
        <p className="montelar-product-editor-card__note">
          Здесь менеджер видит, какие продукты и семейства уже живут внутри категории, и быстро переходит
          к назначению, порядку или созданию новой подкатегории.
        </p>
        <div className="montelar-product-editor-card__metrics">
          <article>
            <strong>{snapshot.productCount}</strong>
            <span>продуктов в категории</span>
          </article>
          <article>
            <strong>{snapshot.lineCount}</strong>
            <span>подкатегорий и семейств</span>
          </article>
        </div>
        <div className="montelar-product-editor-links">
          <a href={actionHrefs.createProduct}>
            <strong>Создать продукт</strong>
            <span>Новый черновик с последующим назначением в эту категорию</span>
          </a>
          <a href={actionHrefs.createLine}>
            <strong>Создать подкатегорию</strong>
            <span>Открыть безопасный редактор для нового семейства внутри категории</span>
          </a>
        </div>
        <div className="montelar-product-editor-workspaces">
          {snapshot.linkedWorkspaces
            .filter((entry) => entry.id === "products" || entry.id === "lines")
            .map((entry) => (
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

  if (surface === "translations") {
    return (
      <section className="montelar-product-editor-card">
        <div className="montelar-product-editor-card__eyebrow">Переводы и короткое SEO</div>
        <div className="montelar-product-editor-card__metrics">
          <article>
            <strong>{snapshot.translationCount}</strong>
            <span>всего переводов</span>
          </article>
          <article>
            <strong>{snapshot.publishedTranslationCount}</strong>
            <span>опубликованных локалей</span>
          </article>
          <article>
            <strong>{snapshot.seoCount}</strong>
            <span>SEO-записей</span>
          </article>
          <article>
            <strong>{snapshot.seoApprovedCount}</strong>
            <span>готовых SEO</span>
          </article>
        </div>
        <div className="montelar-product-editor-workspaces">
          {snapshot.linkedWorkspaces
            .filter((entry) => entry.id === "translations" || entry.id === "seo")
            .map((entry) => (
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

  if (surface === "publish") {
    return (
      <section className="montelar-product-editor-card">
        <div className="montelar-product-editor-card__eyebrow">Preview и публикация</div>
        <p className="montelar-product-editor-card__note">
          Категория проходит тот же спокойный путь: черновик, проверка cover и текста, preview, затем выпуск.
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
            <span>Безопасный просмотр категории до live-выпуска</span>
          </a>
          <a
            href={status === "published" ? snapshot.publicUrl : blockerHref}
            rel={status === "published" ? "noreferrer" : undefined}
            target={status === "published" ? "_blank" : undefined}
          >
            <strong>{status === "published" ? "Открыть live-категорию" : "Убрать блокеры выпуска"}</strong>
            <span>
              {status === "published"
                ? "Текущий публичный маршрут категории"
                : snapshot.blockers.length > 0
                  ? "Сначала откройте первую блокирующую зависимость"
                  : publishAllowed
                    ? "Категория выглядит готовой к review/publish"
                    : "Публикация доступна только Owner/Admin"}
            </span>
          </a>
        </div>
      </section>
    );
  }

  if (surface === "notes") {
    return (
      <section className="montelar-product-editor-card">
        <div className="montelar-product-editor-card__eyebrow">Внутренние заметки</div>
        <p className="montelar-product-editor-card__note">{getCategoryWorkspaceRoleLabel(role)}</p>
        <p className="montelar-product-editor-card__note">
          Здесь хранятся заметки по порядку, выпуску и смыслу категории. Публичный текст и cover остаются
          в своих вкладках, а не в служебных комментариях.
        </p>
      </section>
    );
  }

  return (
    <section className="montelar-product-editor-hero">
      <div>
        <div className="montelar-product-editor-card__eyebrow">Рабочее пространство категории</div>
        <h2>{getText(data.publicLabel) || getText(data.name) || "Новая категория"}</h2>
        <p className="montelar-product-editor-card__note">
          Здесь менеджер управляет именем, описанием, cover, порядком, продуктами и подкатегориями без
          погружения в сырые коллекции Payload.
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
          <span className={`montelar-admin-state montelar-admin-state--${getStatusTone(status)}`}>{status}</span>
          <span>{primaryLocale} source locale</span>
          <span>{getText(data.categoryKind) || "category"}</span>
        </div>
      </div>
      <div className="montelar-product-editor-links">
        <a href={actionHrefs.categoryList}>
          <strong>Открыть список категорий</strong>
          <span>Вернуться к структуре категорий и их порядку</span>
        </a>
        <a href={actionHrefs.createCategory}>
          <strong>Создать категорию</strong>
          <span>Добавить новый черновик категории</span>
        </a>
      </div>
      <div className="montelar-product-editor-links">
        <a href={actionHrefs.createLine}>
          <strong>Создать подкатегорию</strong>
          <span>Открыть safe flow для нового семейства внутри категории</span>
        </a>
        <a href={actionHrefs.productList}>
          <strong>Открыть продукты</strong>
          <span>Назначение, порядок, скрытие и выпуск карточек внутри каталога</span>
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
