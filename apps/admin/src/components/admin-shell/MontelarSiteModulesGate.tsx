import Link from "next/link";

import type { ComponentVisualGateSnapshot } from "@/lib/admin-bff/component-visual-gate.ts";

type Props = {
  snapshot: ComponentVisualGateSnapshot;
};

function stateLabel(value: string) {
  switch (value) {
    case "ready-for-publish":
      return "готово";
    case "draft":
      return "черновик";
    case "not-readable-for-role":
      return "нет доступа";
    default:
      return "нужна связка";
  }
}

function stateTone(value: string) {
  switch (value) {
    case "ready-for-publish":
      return "steady";
    case "draft":
      return "attention";
    case "not-readable-for-role":
      return "restricted";
    default:
      return "planned";
  }
}

export function MontelarSiteModulesGate({ snapshot }: Props) {
  return (
    <section className="montelar-site-modules" aria-labelledby="montelar-site-modules-title">
      <div className="montelar-site-modules__hero">
        <div>
          <span className="montelar-admin-shell__eyebrow">Карта визуальных блоков</span>
          <h1 id="montelar-site-modules-title">Что на сайте управляется из админки</h1>
          <p>
            Здесь собраны публичные визуальные поверхности Montelar: главная сцена, шапка, меню,
            языки, баннеры маршрутов, footer и контактные действия. Экран показывает, что уже
            редактируется сейчас и что требует отдельной связки с публичным сайтом.
          </p>
        </div>
        <dl className="montelar-site-modules__rail">
          <div>
            <dt>Блоков</dt>
            <dd>{snapshot.summary.modules}</dd>
          </div>
          <div>
            <dt>Готовы сейчас</dt>
            <dd>{snapshot.summary.fullyEditableNow}</dd>
          </div>
          <div>
            <dt>Маршрутов</dt>
            <dd>{snapshot.summary.routes}</dd>
          </div>
          <div>
            <dt>Сигналов</dt>
            <dd>{snapshot.summary.issues}</dd>
          </div>
        </dl>
      </div>

      {snapshot.textFailures.length > 0 ? (
        <article className="montelar-site-modules__alert">
          <strong>Найдены лишние технические слова</strong>
          <p>{snapshot.textFailures.slice(0, 3).join(" · ")}</p>
        </article>
      ) : null}

      <div className="montelar-site-modules__layout">
        <div className="montelar-site-modules__grid">
          {snapshot.modules.map((module) => (
            <article className="montelar-site-modules__card" key={module.id}>
              <div className="montelar-site-modules__topline">
                <span>{module.layer === "owner" ? "владелец" : module.layer === "site-admin" ? "сайт-админ" : "разработчик"}</span>
                <span className={`montelar-admin-state montelar-admin-state--${stateTone(module.settingState)}`}>
                  {stateLabel(module.settingState)}
                </span>
              </div>
              <h2>{module.label}</h2>
              <p>{module.publicUsage[0] ?? "Публичная поверхность сайта."}</p>
              <dl>
                <div>
                  <dt>Редактируется</dt>
                  <dd>{module.coverage.editableNow}</dd>
                </div>
                <div>
                  <dt>Потом</dt>
                  <dd>{module.coverage.plannedCommands + module.coverage.notCmsBacked}</dd>
                </div>
                <div>
                  <dt>Проверки</dt>
                  <dd>{module.validationErrors.length}</dd>
                </div>
              </dl>
              <div className="montelar-site-modules__routes">
                {module.routePaths.slice(0, 4).map((routePath) => (
                  <span key={routePath}>{routePath}</span>
                ))}
              </div>
              {module.editorTargets[0] ? (
                <Link href={module.editorTargets[0].editorHref}>
                  <strong>Открыть цель</strong>
                  <span>{module.editorTargets[0].fieldLabel}</span>
                </Link>
              ) : null}
            </article>
          ))}
        </div>

        <aside className="montelar-site-modules__side">
          <article>
            <h2>Что нужно снять скриншотом</h2>
            <ul>
              {snapshot.publicEvidenceTargets.map((target) => (
                <li key={target.id}>
                  <b>{target.label}</b>
                  <span>{target.routePath}</span>
                </li>
              ))}
            </ul>
          </article>

          <article>
            <h2>Очередь связок</h2>
            {snapshot.issues.length > 0 ? (
              <ul>
                {snapshot.issues.slice(0, 8).map((issue) => (
                  <li key={issue.id}>
                    <b>{issue.moduleLabel}</b>
                    <span>{issue.title}</span>
                    <Link href={issue.editorHref}>Открыть</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Все визуальные блоки имеют понятные экраны правки и не требуют отдельной связки.</p>
            )}
          </article>
        </aside>
      </div>
    </section>
  );
}
