import type { FieldDef } from "./Field";

// Resources editable inline via the edit-mode drawer. Blog is intentionally
// excluded (it keeps its dedicated /admin/blog editor); the profile singleton
// is handled separately via ProfileEditor.
export type ResourceKey = "news" | "education" | "experience" | "skills" | "projects";

export type ResourceConfig = {
  resource: ResourceKey;
  label: string; // drawer title noun, e.g. "news item"
  fields: FieldDef[];
  makeEmpty: () => Record<string, any>;
};

// `order` is no longer an editable field — education/experience/skills/projects
// are reordered by drag-and-drop, and news/blog sort by date. New draggable
// items default to a high order so they append to the end until dragged.
export const RESOURCES: Record<ResourceKey, ResourceConfig> = {
  news: {
    resource: "news",
    label: "news item",
    fields: [
      { key: "date", label: "Date", type: "text", placeholder: "2026-04", help: "YYYY-MM" },
      { key: "text", label: "Text", type: "textarea", rows: 8, help: "Plain text; write links as [text](url)." },
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
    ],
    makeEmpty: () => ({ degree: "", institution: "", period: "", detail: "", order: 9999 }),
  },
  experience: {
    resource: "experience",
    label: "experience entry",
    fields: [
      { key: "role", label: "Role", type: "text" },
      { key: "org", label: "Organization", type: "text" },
      { key: "period", label: "Period", type: "text", placeholder: "2024/11 – 2025/07" },
      { key: "detail", label: "Detail", type: "textarea", rows: 6 },
    ],
    makeEmpty: () => ({ role: "", org: "", period: "", detail: "", order: 9999 }),
  },
  skills: {
    resource: "skills",
    label: "skill group",
    fields: [
      { key: "group", label: "Group", type: "text", placeholder: "Agentic / LLM" },
      { key: "items", label: "Items", type: "tags", rows: 4, help: "Comma-separated skills." },
    ],
    makeEmpty: () => ({ group: "", items: [], order: 9999 }),
  },
  projects: {
    resource: "projects",
    label: "project",
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "repoUrl", label: "Repo URL", type: "text" },
      { key: "stars", label: "Stars", type: "number" },
      { key: "tags", label: "Tags", type: "tags", rows: 3, help: "Comma-separated; first 3 shown." },
      { key: "description", label: "Description", type: "textarea", rows: 5 },
    ],
    makeEmpty: () => ({ name: "", description: "", tags: [], repoUrl: "", stars: null, highlight: false, order: 9999 }),
  },
};
