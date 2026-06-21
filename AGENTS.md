# wenxiao.link

Monorepo for the personal site at https://wenxiao.link. Two sides:

- `frontend/` — Next.js 16 + Chakra UI v2 + TS. Server pages read content
  from the Django API first (the DB is the source of truth), falling back to a
  committed offline snapshot when the backend is unreachable: server-read
  `frontend/content/` (profile/news/projects/publications JSON + blog markdown)
  and client-read `frontend/public/fallback/` (stats + Q&A read snapshots). The
  snapshot is regenerated from the DB by the `export_content` sync (daily +
  on content edits) so a Vercel-hosted frontend stays current and degrades
  silently. Data is passed to `"use client"` components. All browser API calls
  go to same-origin `/api/*`.
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

Blog publishing:
- Whenever asked to write or publish a blog post, sync the repo first so the
  agent has the latest authoring workflow and site context.
- After syncing, read `frontend/docs/blog-authoring.md` when present and follow
  it as the current source of truth for Markdown metadata, upload, and
  verification.
- Choose blog tags with the teaser in mind. The teaser must fit the post's
  content; when introducing a new semantic tag, either verify the generated
  teaser is appropriate or add/update a curated teaser mapping in
  `frontend/app/lib/teaser.ts` and document it in
  `frontend/docs/blog-authoring.md`.

Home/projects authoring:
- Whenever asked to edit home-page or projects content through the API, sync
  the repo first, then read `frontend/docs/home-projects-authoring.md` and
  follow its REST field names, auth, ordering, and verification guidance.
