import {
  generateProjectsRouteMetadata,
  ProjectsRoutePage,
} from "@/components/projects-route-page";

export async function generateMetadata() {
  return generateProjectsRouteMetadata();
}

export default function ProjectsPage() {
  return <ProjectsRoutePage />;
}
