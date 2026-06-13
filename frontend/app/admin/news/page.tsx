"use client";

import { CrudEditor } from "../../components/admin/CrudEditor";

export default function AdminNewsPage() {
  return (
    <CrudEditor
      resource="news"
      title="News"
      description="Newest items show first (sorted by date). Use the link button to add inline links."
      fields={[
        { key: "date", label: "Date", type: "text", placeholder: "2026-04", help: "YYYY-MM" },
        { key: "text", label: "Text", type: "markdown", rows: 2, help: "Supports [text](url) links." },
        { key: "order", label: "Order", type: "number", help: "Tiebreaker within the same date." },
      ]}
      makeEmpty={() => ({ date: "", text: "", order: 0 })}
      itemTitle={(i) => `${i.date} — ${String(i.text).replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").slice(0, 60)}`}
    />
  );
}
