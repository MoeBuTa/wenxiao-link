"use client";

import { CrudEditor } from "../../components/admin/CrudEditor";

export default function AdminNewsPage() {
  return (
    <CrudEditor
      resource="news"
      title="News"
      description="Newest items show first (sorted by date). Write inline links directly as [text](url)."
      fields={[
        { key: "date", label: "Date", type: "text", placeholder: "2026-04", help: "YYYY-MM" },
        { key: "text", label: "Text", type: "textarea", rows: 6, help: "Plain text; write links as [text](url)." },
        { key: "order", label: "Order", type: "number", help: "Tiebreaker within the same date." },
      ]}
      makeEmpty={() => ({ date: "", text: "", order: 0 })}
      itemTitle={(i) => `${i.date} — ${String(i.text).replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").slice(0, 60)}`}
    />
  );
}
