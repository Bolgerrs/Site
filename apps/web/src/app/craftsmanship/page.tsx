import {
  CraftsmanshipRoutePage,
  generateCraftsmanshipRouteMetadata,
} from "@/components/craftsmanship-route-page";

export async function generateMetadata() {
  return generateCraftsmanshipRouteMetadata();
}

export default function CraftsmanshipPage() {
  return <CraftsmanshipRoutePage />;
}
