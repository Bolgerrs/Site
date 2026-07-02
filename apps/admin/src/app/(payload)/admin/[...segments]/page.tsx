import type { Metadata } from "next";

import config from "@payload-config";
import { RootPage, generatePageMetadata } from "@payloadcms/next/views";

import { importMap } from "../typedImportMap";

type Args = {
  params: Promise<{
    segments?: string[];
  }>;
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

const normalizeParams = async (
  params: Awaited<Args["params"]>,
): Promise<{ segments: string[] }> => ({
  segments: params.segments && params.segments.length > 0 ? params.segments : [],
});

const normalizeSearchParams = async (searchParams: Awaited<Args["searchParams"]>) =>
  Object.fromEntries(
    Object.entries(searchParams).filter((entry): entry is [string, string | string[]] => entry[1] !== undefined),
  );

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({
    config,
    params: params.then(async (value) => {
      const normalized = await normalizeParams(value);
      return {
        segments: normalized.segments,
      };
    }),
    searchParams: searchParams.then(normalizeSearchParams),
  });

export default async function AdminPage({ params, searchParams }: Args) {
  const normalized = await normalizeParams(await params);

  return RootPage({
    config,
    importMap,
    params: Promise.resolve(normalized),
    searchParams: searchParams.then(normalizeSearchParams),
  });
}
