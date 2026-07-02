import path from "node:path";
import sharp from "sharp";
import { buildConfig, type SharpDependency } from "payload";
import { fileURLToPath } from "node:url";

import { createCoreCollections } from "./collections/index.ts";
import { adminRuntime, createDatabaseAdapter } from "./lib/runtime.ts";
import {
  defaultAdminLocale,
  payloadLocalizationLocales,
} from "./lib/payload/locales.ts";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const allowedCorsOrigins = [
  process.env.NEXT_PUBLIC_SITE_URL,
  process.env.NEXT_PUBLIC_ADMIN_URL,
  "http://127.0.0.1:3001",
  "http://localhost:3001",
].filter((origin): origin is string => Boolean(origin));

const payloadSharp = sharp as unknown as SharpDependency;

export default buildConfig({
  admin: {
    components: {
      beforeDashboard: ["./components/admin-shell/MontelarAdminDashboard.tsx#MontelarAdminDashboard"],
      beforeNav: ["./components/admin-shell/MontelarAdminHeader.tsx#MontelarAdminHeader"],
      beforeNavLinks: ["./components/admin-shell/MontelarAdminNav.tsx#MontelarAdminNav"],
      afterNavLinks: ["./components/admin-shell/MontelarAdminDevLinks.tsx#MontelarAdminDevLinks"],
      graphics: {
        Icon: "./components/admin-shell/MontelarAdminBrand.tsx#MontelarAdminIcon",
        Logo: "./components/admin-shell/MontelarAdminBrand.tsx#MontelarAdminLogo",
      },
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      description:
        "Private Montelar CMS for multilingual catalog, forms, media, and lead operations.",
      titleSuffix: " - Montelar Admin",
    },
    user: "admin-users",
  },
  collections: createCoreCollections({
    uploadsDir: adminRuntime.uploadsDir,
  }),
  cors: allowedCorsOrigins,
  db: createDatabaseAdapter(),
  graphQL: {
    disablePlaygroundInProduction: true,
  },
  localization: {
    defaultLocale: defaultAdminLocale,
    fallback: true,
    locales: payloadLocalizationLocales,
  },
  secret: adminRuntime.payloadSecret,
  sharp: payloadSharp,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
});
