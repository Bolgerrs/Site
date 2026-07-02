import React from "react";

import { getProductEditorSnapshot } from "../../lib/payload/product-editor.ts";

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function ProductEditorSidebarField({
  data,
  payload,
}: {
  data: Record<string, unknown>;
  payload: Parameters<typeof getProductEditorSnapshot>[0];
}) {
  const snapshot = await getProductEditorSnapshot(payload, data);
  const primaryLocale = getText(data.primaryLocale).toUpperCase() || "EN";

  return (
    <aside className="montelar-product-editor-sidebar">
      <section className="montelar-product-editor-sidebar__section">
        <div className="montelar-product-editor-card__eyebrow">Готовность продукта</div>
        <ul className="montelar-product-editor-checklist">
          {snapshot.checklist.map((item) => (
            <li className={`is-${item.state}`} key={item.id}>
              <strong>{item.label}</strong>
              <span>{item.detail}</span>
              {item.href ? <a href={item.href}>Открыть</a> : null}
            </li>
          ))}
        </ul>
      </section>
      <section className="montelar-product-editor-sidebar__section">
        <div className="montelar-product-editor-card__eyebrow">Блокеры выпуска</div>
        {snapshot.blockers.length > 0 ? (
          <ul className="montelar-product-editor-blockers">
            {snapshot.blockers.map((item) => (
              <li key={item.id}>
                <strong>{item.label}</strong>
                <span>{item.detail}</span>
                {item.href ? <a href={item.href}>Исправить</a> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="montelar-product-editor-card__note">
            Жестких блокеров не найдено. Перед финальным выпуском подтвердите формы, SEO и публикационный
            контур для локали {primaryLocale}.
          </p>
        )}
      </section>
    </aside>
  );
}
