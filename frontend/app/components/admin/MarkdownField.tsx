"use client";

import { Box, Button, HStack, Link, Text, Textarea, VStack } from "@chakra-ui/react";
import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const mdComponents = {
  p: (props: any) => <Text color="fg.default" lineHeight="1.7" mb={2} {...props} />,
  a: (props: any) => <Link isExternal color="accent.subtle" {...props} />,
  code: (props: any) => (
    <Box as="code" bg="bg.subtle" px={1} borderRadius="sm" fontSize="0.85em" {...props} />
  ),
};

export function MarkdownField({
  value,
  onChange,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Wrap the current selection (or a placeholder) with markdown markers and
  // keep the inner text selected.
  const surround = (before: string, after: string, placeholder: string) => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const sel = value.slice(start, end) || placeholder;
    onChange(value.slice(0, start) + before + sel + after + value.slice(end));
    requestAnimationFrame(() => {
      const p1 = start + before.length;
      el.setSelectionRange(p1, p1 + sel.length);
      el.focus();
    });
  };

  // Insert [text](url) and select the "url" so it's ready to type over.
  const insertLink = () => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const sel = value.slice(start, end) || "text";
    const md = `[${sel}](url)`;
    onChange(value.slice(0, start) + md + value.slice(end));
    requestAnimationFrame(() => {
      const urlStart = start + md.lastIndexOf("(") + 1;
      el.setSelectionRange(urlStart, urlStart + 3);
      el.focus();
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === "b") {
      e.preventDefault();
      surround("**", "**", "bold");
    } else if (k === "i") {
      e.preventDefault();
      surround("*", "*", "italic");
    } else if (k === "k") {
      e.preventDefault();
      insertLink();
    } else if (k === "e") {
      e.preventDefault();
      surround("`", "`", "code");
    }
  };

  return (
    <VStack align="stretch" spacing={2}>
      <HStack justify="space-between">
        <Text fontSize="xs" color="fg.faint">
          ⌘/Ctrl+B bold · +I italic · +K link · +E code
        </Text>
        <Button size="xs" variant="ghost" onClick={() => setShowPreview((p) => !p)}>
          {showPreview ? "Hide preview" : "Preview"}
        </Button>
      </HStack>

      <Textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        rows={rows}
        bg="bg.surface"
        fontFamily="mono"
        fontSize="sm"
      />

      {showPreview ? (
        <Box borderWidth="1px" borderColor="border.muted" borderRadius="md" bg="bg.card" px={4} py={3}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {value || "_Nothing to preview_"}
          </ReactMarkdown>
        </Box>
      ) : null}
    </VStack>
  );
}
