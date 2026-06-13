import type { Metadata } from "next";

import { getProjects } from "../lib/content";
import { ProjectsClient } from "../components/ProjectsClient";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Projects",
  description: "Open-source research systems and engineering projects.",
};

export default async function ProjectsPage() {
  const projects = await getProjects();
  return <ProjectsClient projects={projects} />;
}
