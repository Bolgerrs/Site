import React from "react";

import { getPageEditorSnapshot } from "../../lib/payload/page-editor.ts";

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function createActionSteps(data: Record<string, unknown>, visibleSectionCount: number) {
  const steps = [];

  if (!getText(data.title)) {
    steps.push("Добавьте заголовок, по которому владелец сразу узнает страницу.");
  }

  if (!getText(data.heroSummary) && !getText(data.introBody)) {
    steps.push("Опишите первый экран: коротко объясните, что видит и зачем открывает эту страницу клиент.");
  }

  if (!getText(data.heroPrimaryCtaLabel) || !getText(data.heroPrimaryCtaTarget)) {
    steps.push("Укажите главную кнопку и ее переход, чтобы у страницы был понятный следующий шаг.");
  }

  if (!data.heroMedia && !data.coverMedia) {
    steps.push("Подберите hero-медиа или обложку, чтобы первый экран не оставался текстовым черновиком.");
  }

  if (visibleSectionCount === 0) {
    steps.push("Добавьте хотя бы один видимый блок во вкладке `Блоки`, иначе страница будет пустой.");
  }

  return steps.slice(0, 4);
}

export async function PageEditorSidebarField({
  data,
  payload,
}: {
  data: Record<string, unknown>;
  payload: Parameters<typeof getPageEditorSnapshot>[0];
}) {
  const snapshot = await getPageEditorSnapshot(payload, data);
  const visibleSectionCount = snapshot.sectionSummaries.filter((item) => item.visible).length;
  const actionSteps = createActionSteps(data, visibleSectionCount);

  return (
    <aside className="montelar-page-editor-sidebar">
      <section className="montelar-page-editor-sidebar__section">
        <div className="montelar-page-editor-card__eyebrow">Что сделать сейчас</div>
        {actionSteps.length > 0 ? (
          <ul className="montelar-page-editor-checklist">
            {actionSteps.map((step) => (
              <li className="is-attention" key={step}>
                <strong>Следующий шаг</strong>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="montelar-page-editor-card__note">
            Первый экран заполнен. Проверьте preview и затем перейдите к выпуску или переводу страницы.
          </p>
        )}
      </section>
      <section className="montelar-page-editor-sidebar__section">
        <div className="montelar-page-editor-card__eyebrow">Перед выпуском</div>
        {snapshot.blockers.length > 0 ? (
          <ul className="montelar-page-editor-blockers">
            {snapshot.blockers.map((item) => (
              <li key={item.id}>
                <strong>{item.label}</strong>
                <span>{item.detail}</span>
                {item.href ? <a href={item.href}>Перейти</a> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="montelar-page-editor-card__note">
            Жестких блокеров не найдено. Откройте preview, быстро проверьте переводы и после этого выпускайте страницу.
          </p>
        )}
      </section>
    </aside>
  );
}
