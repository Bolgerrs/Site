import { BrandRoutePage, generateBrandRouteMetadata } from "@/components/brand-route-page";

export async function generateMetadata() {
  return generateBrandRouteMetadata();
}

export default function BrandPage() {
  return <BrandRoutePage />;
}
