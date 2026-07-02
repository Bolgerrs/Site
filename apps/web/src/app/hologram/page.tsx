import type { Metadata } from "next";
import {
  DirectionRoutePage,
  generateDirectionRouteMetadata,
} from "@/components/direction-route-page";
import { getLocaleCopy } from "@/lib/copy/site-copy";
import { getRequestLocale } from "@/lib/request-locale";
import { HologramMotion } from "./hologram-motion";

export async function generateMetadata(): Promise<Metadata> {
  return generateDirectionRouteMetadata(
    "hologram",
    "Hologram",
    "3D holographic advertising that floats in the air and stops attention — for retail, events and exhibitions.",
    "/hologram",
  );
}

export default function HologramPage() {
  return getRequestLocale().then((locale) => {
    const mm = getLocaleCopy(locale, { en: "mm", de: "mm", es: "mm", fr: "mm", zh: "毫米", ja: "mm", ru: "мм" });
    const t = (en: string, ru: string) => getLocaleCopy(locale, { en, de: en, es: en, fr: en, zh: en, ja: en, ru });
    return (
      <>
      <DirectionRoutePage
        directionSlug="hologram"
        fallbackTitle="Hologram"
        fallbackDescription="3D holographic advertising that floats in the air and stops attention."
        intro={t(
          "A volumetric image that lives in the air — with no glasses and no screen. A hologram turns a window, a launch or a booth into an event people stop for.",
          "Объёмное изображение, которое живёт в воздухе — без очков и без экрана. Голограмма превращает витрину, презентацию или стенд в событие, мимо которого не проходят.",
        )}
        notes={[]}
        hideStatement
        hideProducts
        hideCta
        ctaTitle={t("Show your product the way no one has seen it.", "Покажите продукт так, как его ещё не видели.")}
        details={
          <>
            <section className="dir-line holo-spec" aria-labelledby="holo-spec-eyebrow">
              <div className="dir-wrap">
                <p className="holo-uses holo-uses--lead" data-reveal>
                  {t(
                    "Storefronts & retail · Launches & events · Exhibition stands · Brand activations",
                    "Витрины и ритейл · Презентации и события · Выставочные стенды · Бренд-активации",
                  )}
                </p>
                <div className="holo-ledger" data-reveal>
                <p className="dir-eyebrow" id="holo-spec-eyebrow">{t("Hologram · format and price", "Голограмма · формат и стоимость")}</p>
                <div className="holo-spec-grid">
                  <div className="holo-spec-cell">
                    <span className="holo-spec-label">{t("Dimensions", "Габариты")}</span>
                    <span className="holo-spec-value">2700 × 1200 <span className="holo-spec-unit">{mm}</span></span>
                  </div>
                  <div className="holo-spec-cell">
                    <span className="holo-spec-label">{t("Unit price", "Стоимость голограммы")}</span>
                    <span className="holo-spec-value">2 199 999 <span className="holo-spec-cur">₽</span></span>
                  </div>
                  <div className="holo-spec-cell">
                    <span className="holo-spec-label">{t("Rental · up to 10 h", "Аренда до 10 часов")}</span>
                    <span className="holo-spec-value">110 990 <span className="holo-spec-cur">₽</span></span>
                  </div>
                  <div className="holo-spec-cell">
                    <span className="holo-spec-label">{t("Exhibition format · 3 days", "Выставочный формат 3 дня")}</span>
                    <span className="holo-spec-value">210 990 <span className="holo-spec-cur">₽</span></span>
                  </div>
                </div>
                <div className="holo-spec-includes">
                  <span className="holo-spec-includes-label">{t("Included in the rental", "Входит в аренду")}</span>
                  <p>
                    {t(
                      "Creation and generation of advertising holograms from the client's materials or simply an idea, as well as delivery, installation and on-site support.",
                      "Создание и генерация рекламных голограмм по материалам заказчика или просто идее, а также доставка, установка и сопровождение.",
                    )}
                  </p>
                </div>
                </div>
              </div>
            </section>

            <section className="dir-line holo-pitch" data-reveal aria-labelledby="holo-pitch-eyebrow">
              <div className="dir-wrap">
                <p className="dir-eyebrow" id="holo-pitch-eyebrow">{t("The presence effect", "Эффект присутствия")}</p>
                <h2 className="holo-pitch-title">{t("Advertising you can't scroll past.", "Реклама, которую невозможно пролистнуть.")}</h2>
                <p className="holo-pitch-body">
                  {t(
                    "A 3D object hovering in the air works as a magnet for the eye where ordinary signage gets ignored: it holds attention, increases time spent with the brand and stays in memory as an experience rather than a banner.",
                    "3D-объект в воздухе работает как магнит для взгляда там, где привычная вывеска теряется: удерживает внимание, увеличивает время контакта с брендом и запоминается как впечатление, а не как баннер.",
                  )}
                </p>
              </div>
            </section>
          </>
        }
      />
      <HologramMotion />
      </>
    );
  });
}
