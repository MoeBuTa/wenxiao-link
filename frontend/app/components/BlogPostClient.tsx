"use client";

import {
  Box,
  Code,
  Container,
  Divider,
  Flex,
  HStack,
  Heading,
  Icon,
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
import { useEffect, useState } from "react";
import { FaRegEye } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { getBlogStats } from "../lib/stats";
import { teaserForTags } from "../lib/teaser";
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
  const { gradient, Icon: CoverIcon } = teaserForTags(meta.tags);
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    getBlogStats()
      .then((m) => alive && setViews(m[meta.slug] ?? 0))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [meta.slug]);

  return (
    <Container maxW="3xl" py={{ base: 8, md: 12 }} px={{ base: 6, md: 10 }}>
      <Link as={NextLink} href="/blog" fontSize="sm" color="fg.muted">
        ← Back to blog
      </Link>
      <Flex
        h="120px"
        align="center"
        justify="center"
        bgGradient={gradient}
        borderRadius="lg"
        mt={4}
        mb={5}
      >
        <Icon as={CoverIcon} boxSize={10} color="whiteAlpha.900" />
      </Flex>
      <Heading size="xl" mb={2}>
        {meta.title}
      </Heading>
      <HStack spacing={2} fontSize="sm" color="fg.faint" mb={2}>
        <Text>{meta.date}</Text>
        {views !== null ? (
          <HStack spacing={1}>
            <Icon as={FaRegEye} boxSize={3.5} />
            <Text>{views.toLocaleString()} views</Text>
          </HStack>
        ) : null}
      </HStack>
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
