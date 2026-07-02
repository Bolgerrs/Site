import {
  ProductRequestRoutePage,
  generateProductRequestRouteMetadata,
} from "@/components/product-request-route-page";

type ProductRequestPageProps = {
  params: Promise<{
    productSlug: string;
  }>;
};

export async function generateMetadata({
  params,
}: ProductRequestPageProps) {
  const { productSlug } = await params;

  return generateProductRequestRouteMetadata(productSlug);
}

export default async function ProductRequestPage({
  params,
}: ProductRequestPageProps) {
  const { productSlug } = await params;

  return <ProductRequestRoutePage productSlug={productSlug} />;
}
