import React from "react";

import { getFormsEditorSnapshot } from "../../lib/payload/forms-editor.ts";

export async function FormsEditorSidebarField({
  data,
  payload,
}: {
  data: Record<string, unknown>;
  payload: Parameters<typeof getFormsEditorSnapshot>[0];
}) {
  const snapshot = await getFormsEditorSnapshot(payload, data);

  return (
    <aside className="montelar-forms-editor-sidebar">
      <section className="montelar-forms-editor-sidebar__section">
        <div className="montelar-forms-editor-card__eyebrow">Readiness</div>
        <ul className="montelar-forms-editor-checklist">
          {snapshot.checklist.map((item) => (
            <li className={`is-${item.state}`} key={item.id}>
              <strong>{item.label}</strong>
              <span>{item.detail}</span>
              {item.href ? <a href={item.href}>Open</a> : null}
            </li>
          ))}
        </ul>
      </section>
      <section className="montelar-forms-editor-sidebar__section">
        <div className="montelar-forms-editor-card__eyebrow">Publish blockers</div>
        {snapshot.blockers.length > 0 ? (
          <ul className="montelar-forms-editor-blockers">
            {snapshot.blockers.map((item) => (
              <li key={item.id}>
                <strong>{item.label}</strong>
                <span>{item.detail}</span>
                {item.href ? <a href={item.href}>Open</a> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="montelar-forms-editor-card__note">
            No hard blockers are detected from the current form snapshot. Confirm preview, routing and locale
            intent before final publish.
          </p>
        )}
      </section>
    </aside>
  );
}
