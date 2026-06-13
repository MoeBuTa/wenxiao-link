"use client";

import { CrudEditor } from "../../components/admin/CrudEditor";

export default function AdminSkillsPage() {
  return (
    <CrudEditor
      resource="skills"
      title="Skills"
      fields={[
        { key: "group", label: "Group", type: "text", placeholder: "Agentic / LLM" },
        { key: "order", label: "Order", type: "number" },
        { key: "items", label: "Items", type: "tags", help: "Comma-separated skills." },
      ]}
      makeEmpty={() => ({ group: "", items: [], order: 0 })}
      itemTitle={(i) => i.group}
    />
  );
}
