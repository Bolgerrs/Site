import { headers } from "next/headers";
import {
  defaultSiteLocale,
  isSiteLocale,
  localeHeaderName,
  type SiteLocale,
} from "@/config/i18n";

export async function getRequestLocale(): Promise<SiteLocale> {
  const headerStore = await headers();
  const requestLocale = headerStore.get(localeHeaderName);

  return isSiteLocale(requestLocale) ? requestLocale : defaultSiteLocale;
}
