"use client";

import {
  Box,
  Code,
  Container,
  Divider,
  Heading,
  Link,
  ListItem,
  OrderedList,
  Tag,
  Text,
  UnorderedList,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import NextLink from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { BlogPostMeta } from "../lib/types";

const components = {
  h1: (props: any) => <Heading size="lg" mt={8} mb={3} {...props} />,
  h2: (props: any) => <Heading size="md" mt={8} mb={3} {...props} />,
  h3: (props: any) => <Heading size="sm" mt={6} mb={2} {...props} />,
  p: (props: any) => <Text color="fg.default" lineHeight="1.8" mb={4} {...props} />,
  a: (props: any) => <Link isExternal {...props} />,
  ul: (props: any) => <UnorderedList mb={4} spacing={1} {...props} />,
  ol: (props: any) => <OrderedList mb={4} spacing={1} {...props} />,
  li: (props: any) => <ListItem color="fg.default" {...props} />,
  hr: () => <Divider my={6} />,
  // react-markdown v9 dropped the `inline` prop. Fenced blocks arrive as
  // <pre><code class="language-…">; render the block at the <pre> level and
  // keep bare <code> as an inline pill (resetting it inside blocks).
  pre: (props: any) => (
    <Code
      as="pre"
      display="block"
      whiteSpace="pre"
      overflowX="auto"
      p={4}
      my={4}
      borderRadius="md"
      w="full"
      sx={{ "& code": { bg: "transparent", p: 0, fontSize: "1em" } }}
      {...props}
    />
  ),
  code: (props: any) => <Code fontSize="0.9em" {...props} />,
  blockquote: (props: any) => (
    <Box
      borderLeftWidth="3px"
      borderColor="accent"
      pl={4}
      py={1}
      my={4}
      color="fg.muted"
      {...props}
    />
  ),
};

export function BlogPostClient({ meta, content }: { meta: BlogPostMeta; content: string }) {
  return (
    <Container maxW="3xl" py={{ base: 8, md: 12 }} px={{ base: 6, md: 10 }}>
      <Link as={NextLink} href="/blog" fontSize="sm" color="fg.muted">
        ← Back to blog
      </Link>
      <Heading size="xl" mt={4} mb={2}>
        {meta.title}
      </Heading>
      <Text fontSize="sm" color="fg.faint" mb={2}>
        {meta.date}
      </Text>
      {meta.tags.length > 0 ? (
        <Wrap spacing={2} mb={6}>
          {meta.tags.map((tag) => (
            <WrapItem key={tag}>
              <Tag
                size="sm"
                bg="rgba(56,189,248,0.1)"
                color="ocean"
                borderWidth="1px"
                borderColor="rgba(56,189,248,0.22)"
              >
                {tag}
              </Tag>
            </WrapItem>
          ))}
        </Wrap>
      ) : null}
      <Box>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {content}
        </ReactMarkdown>
      </Box>
    </Container>
  );
}
