"use client";

import { CrudEditor } from "../../components/admin/CrudEditor";

export default function AdminExperiencePage() {
  return (
    <CrudEditor
      resource="experience"
      title="Experience"
      fields={[
        { key: "role", label: "Role", type: "text" },
        { key: "org", label: "Organization", type: "text" },
        { key: "period", label: "Period", type: "text", placeholder: "2024/11 – 2025/07" },
        { key: "order", label: "Order", type: "number" },
        { key: "detail", label: "Detail", type: "textarea", rows: 3 },
      ]}
      makeEmpty={() => ({ role: "", org: "", period: "", detail: "", order: 0 })}
      itemTitle={(i) => `${i.role} — ${i.org}`}
    />
  );
}
