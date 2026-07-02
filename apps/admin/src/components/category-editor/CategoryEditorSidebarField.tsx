import React from "react";

import { getCategoryEditorSnapshot } from "../../lib/payload/category-editor.ts";

export async function CategoryEditorSidebarField({
  data,
  payload,
}: {
  data: Record<string, unknown>;
  payload: Parameters<typeof getCategoryEditorSnapshot>[0];
}) {
  const snapshot = await getCategoryEditorSnapshot(payload, data);

  return (
    <aside className="montelar-product-editor-sidebar">
      <section className="montelar-product-editor-sidebar__section">
        <div className="montelar-product-editor-card__eyebrow">Готовность категории</div>
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
            Жестких блокеров не найдено. Перед выпуском проверьте cover, переводы и маршрут категории.
          </p>
        )}
      </section>
    </aside>
  );
}
