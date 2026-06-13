"use client";

import {
  Box,
  Container,
  Flex,
  Heading,
  Icon,
  Link,
  Tag,
  Text,
  VStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import NextLink from "next/link";

import { PaginatedGrid } from "./PaginatedGrid";
import type { IconType } from "react-icons";
import {
  FaHighlighter,
  FaMapMarkedAlt,
  FaPenNib,
  FaServer,
  FaTerminal,
} from "react-icons/fa";

import type { BlogPostMeta } from "../lib/types";

// Teaser cover icon derived from the post's tags.
function iconForPost(tags: string[]): IconType {
  const t = tags.map((x) => x.toLowerCase());
  const has = (k: string) => t.some((x) => x.includes(k));
  if (has("reviewviz") || has("peer-review") || has("rebuttal")) return FaHighlighter;
  if (has("pentest") || has("cybersecurity")) return FaTerminal;
  if (has("stindex") || has("spatiotemporal") || has("rag")) return FaMapMarkedAlt;
  if (has("self-hosting") || has("engineering") || has("meta")) return FaServer;
  return FaPenNib;
}

const COVERS = [
  "linear(135deg, #f97316, #ea580c)",
  "linear(135deg, #0ea5e9, #38bdf8)",
  "linear(135deg, #f97316, #38bdf8)",
  "linear(135deg, #14b8a6, #0ea5e9)",
  "linear(135deg, #ea580c, #9a3412)",
];

function BlogCard({ post, index }: { post: BlogPostMeta; index: number }) {
  const CoverIcon = iconForPost(post.tags);
  return (
    <Link as={NextLink} href={`/blog/${post.slug}`} _hover={{ textDecoration: "none" }}>
      <Box
        borderWidth="1px"
        borderColor="border.muted"
        borderRadius="lg"
        bg="bg.card"
        overflow="hidden"
        h="full"
        _hover={{ borderColor: "accent", boxShadow: "0 0 0 1px rgba(249,115,22,0.25)" }}
        transition="all 0.15s ease"
      >
        <Flex h="80px" align="center" justify="center" bgGradient={COVERS[index % COVERS.length]}>
          <Icon as={CoverIcon} boxSize={8} color="whiteAlpha.900" />
        </Flex>
        <VStack align="stretch" spacing={2} p={4}>
          <Text fontSize="xs" color="fg.faint">
            {post.date}
          </Text>
          <Heading size="sm" fontFamily="heading" color="fg.default" noOfLines={2}>
            {post.title}
          </Heading>
          {post.summary ? (
            <Text fontSize="sm" color="fg.muted" noOfLines={3}>
              {post.summary}
            </Text>
          ) : null}
          <Wrap spacing={1.5} pt={1}>
            {post.tags.slice(0, 2).map((tag) => (
              <WrapItem key={tag}>
                <Tag size="sm" bg="rgba(56,189,248,0.1)" color="ocean" fontSize="0.7em">
                  {tag}
                </Tag>
              </WrapItem>
            ))}
          </Wrap>
        </VStack>
      </Box>
    </Link>
  );
}

export function BlogListClient({ posts }: { posts: BlogPostMeta[] }) {
  return (
    <Container maxW="6xl" py={{ base: 8, md: 12 }} px={{ base: 6, md: 10 }}>
      <Heading size="lg" mb={2}>
        Blog
      </Heading>
      <Text color="fg.muted" fontSize="sm" mb={8}>
        Notes on LLM agents, retrieval systems, and engineering.
      </Text>
      {posts.length === 0 ? (
        <Text color="fg.muted">No posts yet — coming soon.</Text>
      ) : (
        <PaginatedGrid
          items={posts}
          renderItem={(post, i) => <BlogCard key={post.slug} post={post} index={i} />}
        />
      )}
    </Container>
  );
}
