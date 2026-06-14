import { apiJson } from "./api";

const base = (resource: string) => `/api/content/${resource}/`;

export function adminList<T>(resource: string, query = ""): Promise<T[]> {
  return apiJson<T[]>(`${base(resource)}${query}`, { cache: "no-store" });
}

export function adminGet<T>(resource: string, id: number): Promise<T> {
  return apiJson<T>(`${base(resource)}${id}/`, { cache: "no-store" });
}

export function adminCreate<T>(resource: string, data: unknown): Promise<T> {
  return apiJson<T>(base(resource), { method: "POST", body: JSON.stringify(data) });
}

export function adminUpdate<T>(resource: string, id: number, data: unknown): Promise<T> {
  return apiJson<T>(`${base(resource)}${id}/`, { method: "PATCH", body: JSON.stringify(data) });
}

export function adminDelete(resource: string, id: number): Promise<void> {
  return apiJson<void>(`${base(resource)}${id}/`, { method: "DELETE" });
}

// Create a blog post from a raw markdown document (optional YAML frontmatter).
// The backend parses the frontmatter, derives/uniquifies the slug, and returns
// the created post.
export function blogUpload<T>(markdown: string): Promise<T> {
  return apiJson<T>("/api/content/blog/upload/", {
    method: "POST",
    body: JSON.stringify({ markdown }),
  });
}

export function profileGet<T>(): Promise<T> {
  return apiJson<T>("/api/content/profile/", { cache: "no-store" });
}

export function profilePatch<T>(data: unknown): Promise<T> {
  return apiJson<T>("/api/content/profile/", { method: "PATCH", body: JSON.stringify(data) });
}
