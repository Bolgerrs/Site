import {
  generateTechnologyRouteMetadata,
  TechnologyRoutePage,
} from "@/components/technology-route-page";

export async function generateMetadata() {
  return generateTechnologyRouteMetadata();
}

export default function TechnologyPage() {
  return <TechnologyRoutePage />;
}
