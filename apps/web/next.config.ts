import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const appRoot = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(appRoot, "../..");

const nextConfig: NextConfig = {
  distDir: process.env.MONTELAR_NEXT_DIST_DIR || ".next",
  images: {
    formats: ["image/webp"],
    maximumDiskCacheSize: 500_000_000,
    minimumCacheTTL: 2_678_400,
    qualities: [75, 82],
  },
  reactStrictMode: true,
  turbopack: {
    root: workspaceRoot,
  },
};

export default nextConfig;
