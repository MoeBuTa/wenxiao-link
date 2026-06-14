"use client";

import { VStack } from "@chakra-ui/react";

import { BlogUpload } from "../../components/admin/BlogUpload";
import { CrudEditor } from "../../components/admin/CrudEditor";

export default function AdminBlogPage() {
  return (
    <VStack align="stretch" spacing={4}>
      <BlogUpload />
      <CrudEditor
        resource="blog"
        query="?all=1"
        loadDetail
        title="Blog"
        description="Write posts in markdown. Unpublished drafts are hidden from the public blog."
        fields={[
          { key: "title", label: "Title", type: "text" },
          { key: "slug", label: "Slug", type: "text", help: "URL path, e.g. my-first-post (letters, numbers, hyphens)." },
          { key: "date", label: "Date", type: "text", placeholder: "2026-06-12" },
          { key: "published", label: "Published", type: "bool" },
          { key: "tags", label: "Tags", type: "tags" },
          { key: "summary", label: "Summary", type: "textarea", rows: 2 },
          { key: "body", label: "Body", type: "markdown", rows: 16 },
        ]}
        makeEmpty={() => ({
          title: "",
          slug: "",
          date: "",
          summary: "",
          tags: [],
          body: "",
          published: true,
        })}
        itemTitle={(i) => `${i.title}${i.published ? "" : " (draft)"}`}
      />
    </VStack>
  );
}
