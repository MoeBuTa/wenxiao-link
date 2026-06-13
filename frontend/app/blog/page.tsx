import type { Metadata } from "next";

import { getBlogPosts } from "../lib/content";
import { BlogListClient } from "../components/BlogListClient";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Blog",
  description: "Notes on LLM agents, retrieval systems, and engineering.",
};

export default async function BlogPage() {
  const posts = await getBlogPosts();
  return <BlogListClient posts={posts} />;
}
