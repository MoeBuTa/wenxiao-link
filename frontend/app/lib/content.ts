// Server-only content layer. Reads editable content from the Django API
// (revalidated, so admin edits appear within ~30s) and falls back to the
// committed files in frontend/content/ when the backend is unreachable.
import fs from "fs";
import path from "path";
import matter from "gray-matter";

import type {
  BlogPostMeta,
  NewsItem,
  Project,
  PublicationsPayload,
  SiteProfile,
} from "./types";

const CONTENT_DIR = path.join(process.cwd(), "content");
const BACKEND = process.env.BACKEND_INTERNAL_URL ?? "http://127.0.0.1:8002";

function readJson<T>(name: string): T {
  return JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, name), "utf-8")) as T;
}

async function apiGet<T>(endpoint: string, revalidate = 30): Promise<T | null> {
  try {
    const resp = await fetch(`${BACKEND}/api/content${endpoint}`, {
      next: { revalidate },
    });
    if (!resp.ok) return null;
    return (await resp.json()) as T;
  } catch {
    return null;
  }
}

// ---- File fallbacks ---------------------------------------------------------

function siteProfileFromFile(): SiteProfile {
  return readJson<SiteProfile>("profile.json");
}

function newsFromFile(): NewsItem[] {
  const items = readJson<{ news: NewsItem[] }>("news.json").news;
  return [...items].sort((a, b) => (a.date < b.date ? 1 : -1));
}

// ---- Home page (profile + news + education/experience/skills) --------------

export async function getSiteContent(): Promise<{ profile: SiteProfile; news: NewsItem[] }> {
  const site = await apiGet<{
    profile: Omit<SiteProfile, "education" | "experience" | "skills">;
    news: NewsItem[];
    education: SiteProfile["education"];
    experience: SiteProfile["experience"];
    skills: SiteProfile["skills"];
  }>("/site/");

  if (site && site.profile && site.profile.name) {
    return {
      profile: {
        ...site.profile,
        education: site.education,
        experience: site.experience,
        skills: site.skills,
      },
      news: site.news,
    };
  }
  return { profile: siteProfileFromFile(), news: newsFromFile() };
}

// ---- Projects ---------------------------------------------------------------

export async function getProjects(): Promise<Project[]> {
  const data = await apiGet<Project[]>("/projects/");
  if (data) return data;
  return readJson<{ projects: Project[] }>("projects.json").projects;
}

// ---- Blog -------------------------------------------------------------------

const BLOG_DIR = path.join(CONTENT_DIR, "blog");

function postMeta(slug: string, data: Record<string, unknown>): BlogPostMeta {
  return {
    slug,
    title: String(data.title ?? slug),
    date: String(data.date ?? ""),
    summary: String(data.summary ?? ""),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
  };
}

function blogPostsFromFiles(): BlogPostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const slug = f.replace(/\.md$/, "");
      const { data } = matter(fs.readFileSync(path.join(BLOG_DIR, f), "utf-8"));
      return postMeta(slug, data);
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getBlogPosts(): Promise<BlogPostMeta[]> {
  const data = await apiGet<BlogPostMeta[]>("/blog/");
  if (data) return data;
  return blogPostsFromFiles();
}

export async function getBlogPost(
  slug: string,
): Promise<{ meta: BlogPostMeta; content: string } | null> {
  if (!/^[a-zA-Z0-9-_]+$/.test(slug)) return null;

  const post = await apiGet<{
    slug: string;
    title: string;
    date: string;
    summary: string;
    tags: string[];
    body: string;
  }>(`/blog/by-slug/${slug}/`);
  if (post && post.slug) {
    return {
      meta: { slug: post.slug, title: post.title, date: post.date, summary: post.summary, tags: post.tags },
      content: post.body,
    };
  }

  // File fallback.
  const file = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const { data, content } = matter(fs.readFileSync(file, "utf-8"));
  return { meta: postMeta(slug, data), content };
}

// ---- Publications (Scholar-synced; unchanged) ------------------------------

export async function getPublications(): Promise<PublicationsPayload> {
  try {
    const resp = await fetch(`${BACKEND}/api/scholar/publications/`, {
      next: { revalidate: 300 },
    });
    if (!resp.ok) throw new Error(`backend returned ${resp.status}`);
    const data = (await resp.json()) as PublicationsPayload;
    if (data.publications.length > 0) return data;
  } catch {
    /* fall through to seed */
  }
  return readJson<PublicationsPayload>("publications.seed.json");
}
