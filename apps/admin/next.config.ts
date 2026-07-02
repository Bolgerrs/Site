import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const appRoot = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(appRoot, "../..");

function collectAllowedOrigins(...values: Array<string | undefined>) {
  const allowed = new Set<string>();

  for (const value of values) {
    const trimmed = value?.trim();

    if (!trimmed) {
      continue;
    }

    try {
      const url = new URL(trimmed);

      if (url.host) {
        allowed.add(url.host);
      }

      if (url.hostname) {
        allowed.add(url.hostname);
      }
    } catch {
      allowed.add(trimmed.replace(/^https?:\/\//, "").replace(/\/$/, ""));
    }
  }

  return Array.from(allowed);
}

const serverActionAllowedOrigins = collectAllowedOrigins(
  process.env.NEXT_PUBLIC_ADMIN_URL,
  process.env.NEXT_PUBLIC_SITE_URL,
  "http://127.0.0.1:3001",
  "http://localhost:3001",
  "http://127.0.0.1:3002",
  "http://localhost:3002",
);

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: serverActionAllowedOrigins,
    },
  },
  reactStrictMode: true,
  turbopack: {
    root: workspaceRoot,
  },
};

export default nextConfig;
