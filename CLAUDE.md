# wenxiao.link

Monorepo for the personal site at https://wenxiao.link. Two sides:

- `frontend/` — Next.js 16 + Chakra UI v2 + TS. Server pages read content
  from the Django API first (the DB is the source of truth), falling back
  to `frontend/content/` JSON (profile/news/projects/publications) when the
  backend is unreachable; the blog is DB-only with no file fallback. Data is
  passed to `"use client"` components. All browser API calls go to
  same-origin `/api/*`.
- `backend/` — Django + DRF + Postgres (docker compose, project name
  `wenxiao`). Every URL is under `/api/`. Cookie-JWT auth
  (`authenticate/`), Q&A comments (`qa/`), Google Scholar mirror with
  CORE-rank annotation (`scholar/`).

Conventions: explicit compose project name, env-driven secrets via
`backend/.env` (CI-written, never committed), path-diff deploy workflow,
persistent data outside the runner workspace in
`/Users/wenxiao/wenxiao-link-data/`.

Wire format is camelCase, hand-mapped in each app's serializers — the
backend payload builders are the single source of truth; keep
`frontend/app/lib/types.ts` in lockstep.

Gotchas:
- `STATIC_URL` is `/api/static/` (whitenoise) so Django admin assets ride
  the same cloudflared path rule. Admin lives at `/api/django-admin/`.
- `sync_scholar` refuses to run if it parses 0 rows (markup-change guard).
- CORE rank table is ordered — first matching pattern wins; add specific
  patterns above generic ones.
