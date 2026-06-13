import type { NextConfig } from "next";

// In production cloudflared splits wenxiao.link traffic by path
// (^/api/ -> Django :8002, rest -> this app :8890), so /api requests
// normally never reach Next. This rewrite is the fallback that keeps the
// app fully working when accessed directly (next dev on :3000, or the pm2
// bundle hit on :8890) — same-origin /api/* proxies through to Django.
const BACKEND = process.env.BACKEND_INTERNAL_URL ?? "http://127.0.0.1:8002";

const nextConfig: NextConfig = {
  // Django URLs end in "/" — without this Next 308-redirects them to the
  // slash-less form before the rewrite gets a chance to proxy.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    // Two forms because :path* drops a trailing slash on proxy, and
    // Django's APPEND_SLASH 301 would turn POSTs into GETs.
    return [
      {
        source: "/api/:path*/",
        destination: `${BACKEND}/api/:path*/`,
      },
      {
        source: "/api/:path*",
        destination: `${BACKEND}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
