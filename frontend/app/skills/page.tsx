import type { Metadata } from "next";

import { getAgentSkills } from "../lib/content";
import { SkillsClient } from "../components/SkillsClient";

export const metadata: Metadata = {
  title: "Skills",
  description: "Claude Code plugins, agent skills, and tooling installed and in active use.",
};

export default async function SkillsPage() {
  const skills = await getAgentSkills();
  return <SkillsClient skills={skills} />;
}
