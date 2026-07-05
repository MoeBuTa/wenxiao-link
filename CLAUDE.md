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

## Coding guidelines

Apply these to all coding work (adapted from Karpathy's LLM-pitfall notes;
use judgment on trivial tasks):

1. **Think before coding** — State assumptions explicitly; ask when uncertain.
   Present multiple interpretations rather than silently picking one. Push back
   when a simpler approach exists.
2. **Simplicity first** — Minimum code that solves the problem. No speculative
   features, single-use abstractions, unrequested configurability, or error
   handling for impossible cases. If it could be 50 lines instead of 200,
   rewrite it.
3. **Surgical changes** — Touch only what the request needs. Don't refactor,
   reformat, or "improve" adjacent code. Match existing style. Remove only the
   orphans your own changes create; mention pre-existing dead code, don't
   delete it.
4. **Goal-driven execution** — Turn tasks into verifiable criteria (e.g. "fix
   the bug" → "write a failing test that reproduces it, then make it pass").
   State a brief plan with a verify step for multi-step work.
