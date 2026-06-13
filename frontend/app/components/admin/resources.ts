import type { FieldDef } from "./Field";

// Resources editable inline via the edit-mode drawer. Blog is intentionally
// excluded for now (it keeps its dedicated /admin/blog editor); the profile
// singleton is handled separately via ProfileEditor.
export type ResourceKey = "news" | "education" | "experience" | "skills" | "projects";

export type ResourceConfig = {
  resource: ResourceKey;
  label: string; // drawer title noun, e.g. "News item"
  fields: FieldDef[];
  makeEmpty: () => Record<string, any>;
};

export const RESOURCES: Record<ResourceKey, ResourceConfig> = {
  news: {
    resource: "news",
    label: "news item",
    fields: [
      { key: "date", label: "Date", type: "text", placeholder: "2026-04", help: "YYYY-MM" },
      { key: "text", label: "Text", type: "textarea", rows: 8, help: "Plain text; write links as [text](url)." },
      { key: "order", label: "Order", type: "number", help: "Tiebreaker within the same date." },
    ],
    makeEmpty: () => ({ date: "", text: "", order: 0 }),
  },
  education: {
    resource: "education",
    label: "education entry",
    fields: [
      { key: "degree", label: "Degree", type: "text" },
      { key: "institution", label: "Institution", type: "text" },
      { key: "period", label: "Period", type: "text", placeholder: "2024/03 – 2027/03" },
      { key: "detail", label: "Detail", type: "text" },
      { key: "order", label: "Order", type: "number" },
    ],
    makeEmpty: () => ({ degree: "", institution: "", period: "", detail: "", order: 0 }),
  },
  experience: {
    resource: "experience",
    label: "experience entry",
    fields: [
      { key: "role", label: "Role", type: "text" },
      { key: "org", label: "Organization", type: "text" },
      { key: "period", label: "Period", type: "text", placeholder: "2024/11 – 2025/07" },
      { key: "order", label: "Order", type: "number" },
      { key: "detail", label: "Detail", type: "textarea", rows: 6 },
    ],
    makeEmpty: () => ({ role: "", org: "", period: "", detail: "", order: 0 }),
  },
  skills: {
    resource: "skills",
    label: "skill group",
    fields: [
      { key: "group", label: "Group", type: "text", placeholder: "Agentic / LLM" },
      { key: "items", label: "Items", type: "tags", rows: 4, help: "Comma-separated skills." },
      { key: "order", label: "Order", type: "number" },
    ],
    makeEmpty: () => ({ group: "", items: [], order: 0 }),
  },
  projects: {
    resource: "projects",
    label: "project",
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "repoUrl", label: "Repo URL", type: "text" },
      { key: "stars", label: "Stars", type: "number" },
      { key: "order", label: "Order", type: "number" },
      { key: "tags", label: "Tags", type: "tags", rows: 3, help: "Comma-separated; first 3 shown." },
      { key: "description", label: "Description", type: "textarea", rows: 5 },
    ],
    makeEmpty: () => ({ name: "", description: "", tags: [], repoUrl: "", stars: null, highlight: false, order: 0 }),
  },
};
