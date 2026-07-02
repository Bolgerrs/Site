import type { Metadata } from "next";
import {
  AdminPreviewRoutePage,
  generateAdminPreviewMetadata,
} from "@/components/admin-preview-route-page";

export async function generateMetadata(): Promise<Metadata> {
  return generateAdminPreviewMetadata();
}

export default function AdminPreviewPage() {
  return <AdminPreviewRoutePage />;
}
