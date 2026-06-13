import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getBlogPost, getBlogPosts } from "../../lib/content";
import { BlogPostClient } from "../../components/BlogPostClient";

type Params = { slug: string };

// Unknown slugs (posts created in the admin after build) render on demand.
export const revalidate = 30;
export const dynamicParams = true;

export async function generateStaticParams(): Promise<Params[]> {
  const posts = await getBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: "Not found" };
  return { title: post.meta.title, description: post.meta.summary };
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();
  return <BlogPostClient meta={post.meta} content={post.content} />;
}
