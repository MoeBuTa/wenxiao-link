"use client";

import { CrudEditor } from "../../components/admin/CrudEditor";

export default function AdminEducationPage() {
  return (
    <CrudEditor
      resource="education"
      title="Education"
      fields={[
        { key: "degree", label: "Degree", type: "text" },
        { key: "institution", label: "Institution", type: "text" },
        { key: "period", label: "Period", type: "text", placeholder: "2024/03 – 2027/03" },
        { key: "detail", label: "Detail", type: "text" },
        { key: "order", label: "Order", type: "number" },
      ]}
      makeEmpty={() => ({ degree: "", institution: "", period: "", detail: "", order: 0 })}
      itemTitle={(i) => `${i.degree} — ${i.institution}`}
    />
  );
}
