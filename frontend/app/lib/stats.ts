import { apiFetch, apiJson } from "./api";

export type StatsSummary = {
  totalViews: number;
  todayViews: number;
  uniqueVisitors: number;
};

// slug -> total views
export type BlogStats = Record<string, number>;

// Fire-and-forget page-view ping. `keepalive` lets it survive a navigation,
// and admin pages are never counted (the backend also skips the owner).
export function recordHit(path: string): void {
  if (path.startsWith("/admin")) return;
  void apiFetch("/api/stats/hit/", {
    method: "POST",
    body: JSON.stringify({ path }),
    keepalive: true,
  }).catch(() => {});
}

export function getStatsSummary(): Promise<StatsSummary> {
  return apiJson<StatsSummary>("/api/stats/summary/");
}

export function getBlogStats(): Promise<BlogStats> {
  return apiJson<BlogStats>("/api/stats/blog/");
}
