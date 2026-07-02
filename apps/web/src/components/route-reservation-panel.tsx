import Link from "next/link";
import type { SiteLocale } from "@/config/i18n";
import { withLocale } from "@/config/site-routes";

type Reservation = {
  href: string;
  label: string;
};

type RouteReservationPanelProps = {
  title: string;
  intro: string;
  items: readonly Reservation[];
  locale: SiteLocale;
};

export function RouteReservationPanel({
  title,
  intro,
  items,
  locale,
}: RouteReservationPanelProps) {
  return (
    <section className="route-panel">
      <p className="eyebrow">{title}</p>
      <p className="route-intro compact">{intro}</p>
      <div className="route-link-list">
        {items.map((item) => (
          <Link
            key={item.href}
            className="route-link-card compact"
            href={withLocale(item.href, locale)}
          >
            <span className="route-link-label">{item.label}</span>
            <span className="route-link-href">{withLocale(item.href, locale)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
