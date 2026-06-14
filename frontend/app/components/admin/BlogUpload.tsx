"use client";

import { Box, Button, HStack, Text, useToast } from "@chakra-ui/react";
import { useRef, useState } from "react";

import { ApiError } from "../../lib/api";
import { blogUpload } from "../../lib/admin-client";

// Pick a .md file → a new post is created from it immediately, then the page
// reloads so the editor list below shows it. The markdown may carry optional
// YAML frontmatter (title/date/summary/tags/slug/published); see
// frontend/docs/blog-authoring.md.
export function BlogUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const onFile = async (file: File) => {
    setBusy(true);
    try {
      const text = await file.text();
      const created = await blogUpload<{ slug: string; title: string }>(text);
      toast({ status: "success", title: `Created “${created.title}”`, duration: 2000 });
      window.location.reload();
    } catch (err) {
      toast({ status: "error", title: err instanceof ApiError ? err.message : "Upload failed" });
      setBusy(false);
    }
  };

  return (
    <Box borderWidth="1px" borderColor="border.muted" borderRadius="lg" bg="bg.card" p={4}>
      <HStack justify="space-between" align="center" gap={3}>
        <Box>
          <Text fontWeight="600" color="fg.default">
            Upload markdown
          </Text>
          <Text fontSize="sm" color="fg.muted">
            Pick a .md file (optional YAML frontmatter) — a new post is created from it.
          </Text>
        </Box>
        <Button
          size="sm"
          colorScheme="orange"
          variant="outline"
          isLoading={busy}
          onClick={() => inputRef.current?.click()}
        >
          Choose .md file
        </Button>
      </HStack>
      <input
        ref={inputRef}
        type="file"
        accept=".md,.markdown,text/markdown"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void onFile(f);
        }}
      />
    </Box>
  );
}
