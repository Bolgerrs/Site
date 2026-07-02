import type { Metadata } from "next";
import {
  generateProductRouteMetadata,
  ProductRoutePage,
} from "@/components/product-route-page";

type ProductDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  return generateProductRouteMetadata(slug);
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { slug } = await params;
  return <ProductRoutePage productSlug={slug} />;
}
