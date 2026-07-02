import Link from "next/link";
import { withLocale } from "@/config/site-routes";
import { getRequestLocale } from "@/lib/request-locale";

export default async function NotFound() {
  const locale = await getRequestLocale();

  return (
    <section className="route-page">
      <div className="route-panel">
        <p className="eyebrow">Page not found</p>
        <h1>Page unavailable</h1>
        <p className="route-intro">
          The page may have moved, changed language or is no longer published.
        </p>
        <Link className="route-back-link" href={withLocale("/", locale)}>
          Return to Montelar
        </Link>
      </div>
    </section>
  );
}
