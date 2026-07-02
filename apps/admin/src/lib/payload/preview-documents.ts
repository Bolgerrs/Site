import type { Payload, Where } from "payload";

import type { AdminLocale } from "./locales.ts";

export type PreviewDocumentType = "direction" | "form" | "page" | "product";

type PreviewRequest = {
  locale: string;
  productSlug?: string;
  routePath?: string;
  slug?: string;
  type: PreviewDocumentType;
};

type PayloadFindResponse<T> = {
  docs: T[];
};

const previewVisibleStatuses = ["draft", "review", "published", "hidden"] as const;

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function findDocs<T>(
  payload: Payload,
  collection: "pages" | "product-directions" | "productInquiryForms" | "products",
  locale: string,
  where: Where,
): Promise<T[]> {
  const result = (await payload.find({
    collection,
    depth: 2,
    draft: true,
    limit: 20,
    locale: locale as AdminLocale,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        {
          status: {
            in: [...previewVisibleStatuses],
          },
        },
        where,
      ],
    },
  })) as unknown as PayloadFindResponse<T>;

  return result.docs ?? [];
}

export async function getPreviewDocument(
  payload: Payload,
  request: PreviewRequest,
): Promise<Record<string, unknown> | null> {
  const locale = getText(request.locale) || "en";

  switch (request.type) {
    case "direction": {
      const slug = getText(request.slug);

      if (!slug) {
        return null;
      }

      return (
        (await findDocs<Record<string, unknown>>(payload, "product-directions", locale, {
          slug: {
            equals: slug,
          },
        }))[0] ?? null
      );
    }

    case "product": {
      const slug = getText(request.slug);

      if (!slug) {
        return null;
      }

      return (
        (await findDocs<Record<string, unknown>>(payload, "products", locale, {
          slug: {
            equals: slug,
          },
        }))[0] ?? null
      );
    }

    case "page": {
      const routePath = getText(request.routePath);
      const slug = getText(request.slug);

      if (!routePath && !slug) {
        return null;
      }

      const docs = await findDocs<Record<string, unknown>>(payload, "pages", locale, {
        or: [
          ...(routePath
            ? [
                {
                  routePath: {
                    equals: routePath,
                  },
                },
                {
                  previewPath: {
                    equals: routePath,
                  },
                },
              ]
            : []),
          ...(slug
            ? [
                {
                  slug: {
                    equals: slug,
                  },
                },
              ]
            : []),
        ],
      });

      return docs[0] ?? null;
    }

    case "form": {
      const productSlug = getText(request.productSlug);
      const slug = getText(request.slug);

      if (!productSlug && !slug) {
        return null;
      }

      const docs = await findDocs<Record<string, unknown>>(payload, "productInquiryForms", locale, {
        and: [
          {
            isPrimaryForLocale: {
              equals: true,
            },
          },
          ...(slug
            ? [
                {
                  slug: {
                    equals: slug,
                  },
                },
              ]
            : []),
        ],
      });

      if (productSlug) {
        return (
          docs.find((doc) => {
            const product = doc.product;

            if (product && typeof product === "object" && "slug" in product) {
              return getText((product as { slug?: unknown }).slug) === productSlug;
            }

            return false;
          }) ?? null
        );
      }

      return docs[0] ?? null;
    }
  }
}
