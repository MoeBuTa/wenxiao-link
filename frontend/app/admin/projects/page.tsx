"use client";

import { CrudEditor } from "../../components/admin/CrudEditor";

export default function AdminProjectsPage() {
  return (
    <CrudEditor
      resource="projects"
      title="Projects"
      description="Cards are sorted by star count. Keep descriptions short — they're trimmed to two lines."
      fields={[
        { key: "name", label: "Name", type: "text" },
        { key: "repoUrl", label: "Repo URL", type: "text" },
        { key: "stars", label: "Stars", type: "number" },
        { key: "order", label: "Order", type: "number" },
        { key: "tags", label: "Tags", type: "tags", help: "Comma-separated; first 3 shown." },
        { key: "description", label: "Description", type: "textarea", rows: 2 },
      ]}
      makeEmpty={() => ({
        name: "",
        description: "",
        tags: [],
        repoUrl: "",
        stars: null,
        highlight: false,
        order: 0,
      })}
      itemTitle={(i) => i.name}
    />
  );
}
