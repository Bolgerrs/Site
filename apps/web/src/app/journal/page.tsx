import {
  generateJournalRouteMetadata,
  JournalRoutePage,
} from "@/components/journal-route-page";

export async function generateMetadata() {
  return generateJournalRouteMetadata();
}

export default function JournalPage() {
  return <JournalRoutePage />;
}
