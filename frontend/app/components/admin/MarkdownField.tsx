"use client";

import {
  Box,
  Button,
  HStack,
  Input,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Link, Text } from "@chakra-ui/react";

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
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const openLink = () => {
    const el = ref.current;
    if (el) {
      const sel = value.slice(el.selectionStart, el.selectionEnd);
      setLinkText(sel);
    }
    setLinkUrl("");
    setLinkOpen(true);
  };

  const insertLink = () => {
    const el = ref.current;
    const md = `[${linkText || "link"}](${linkUrl || "https://"})`;
    const start = el ? el.selectionStart : value.length;
    const end = el ? el.selectionEnd : value.length;
    onChange(value.slice(0, start) + md + value.slice(end));
    setLinkOpen(false);
    setLinkText("");
    setLinkUrl("");
  };

  return (
    <VStack align="stretch" spacing={2}>
      <HStack>
        <Button size="xs" variant="outline" onClick={openLink}>
          🔗 Insert link
        </Button>
        <Button size="xs" variant="ghost" onClick={() => setShowPreview((p) => !p)}>
          {showPreview ? "Hide preview" : "Preview"}
        </Button>
      </HStack>

      {linkOpen ? (
        <HStack
          bg="bg.subtle"
          p={2}
          borderRadius="md"
          spacing={2}
          align="end"
          flexWrap="wrap"
        >
          <Input
            size="sm"
            placeholder="Link text"
            value={linkText}
            onChange={(e) => setLinkText(e.target.value)}
            maxW="200px"
            bg="bg.surface"
          />
          <Input
            size="sm"
            placeholder="https://…"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            maxW="280px"
            bg="bg.surface"
          />
          <Button size="sm" colorScheme="orange" onClick={insertLink}>
            Insert
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setLinkOpen(false)}>
            Cancel
          </Button>
        </HStack>
      ) : null}

      <Textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        bg="bg.surface"
        fontFamily="mono"
        fontSize="sm"
      />

      {showPreview ? (
        <Box
          borderWidth="1px"
          borderColor="border.muted"
          borderRadius="md"
          bg="bg.card"
          px={4}
          py={3}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {value || "_Nothing to preview_"}
          </ReactMarkdown>
        </Box>
      ) : null}
    </VStack>
  );
}
