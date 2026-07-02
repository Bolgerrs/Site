import {
  ContactRoutePage,
  generateContactRouteMetadata,
} from "@/components/contact-route-page";

export async function generateMetadata() {
  return generateContactRouteMetadata();
}

export default function ContactPage() {
  return <ContactRoutePage />;
}
