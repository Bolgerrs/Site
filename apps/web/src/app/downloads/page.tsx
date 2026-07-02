import {
  DownloadsRoutePage,
  generateDownloadsRouteMetadata,
} from "@/components/downloads-route-page";

export async function generateMetadata() {
  return generateDownloadsRouteMetadata();
}

export default function DownloadsPage() {
  return <DownloadsRoutePage />;
}
