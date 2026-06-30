# wenxiao.link

Personal website of Wenxiao Zhang: academic homepage, blog, projects, and
a public Q&A board.

```
.
├── frontend/   Next.js 16 (App Router) + Chakra UI + TypeScript
├── backend/    Django + DRF, run as a Vercel serverless function
└── .github/workflows/deploy.yml.disabled
                Legacy self-hosted-runner deploy, kept for reference.
```

## Hosting

Everything runs on **Vercel**, backed by **Neon** (managed Postgres,
Sydney). Two git-connected Vercel projects auto-deploy from `main`:

| Project           | Serves              | Root dir   |
| ----------------- | ------------------- | ---------- |
| `wenxiao-link`    | Next.js frontend    | `frontend` |
| `wenxiao-backend` | Django API (`syd1`) | `backend`  |

The frontend owns `wenxiao.link`; its `next.config` rewrites same-origin
`/api/*` to the backend project, so cookies stay first-party and there is no
CORS in production. The backend function is pinned to `syd1` to sit next to
the Neon database.

| Route                | Service            |
| -------------------- | ------------------ |
| `wenxiao.link/api/*` | Django (backend)   |
| `wenxiao.link/*`     | Next.js (frontend) |

## Content model

The **database is the source of truth.** Profile, news, projects, and blog
posts live in Postgres (Neon) and are edited at runtime through the admin
(Django admin under `/api/django-admin/`, or the in-app owner UI). Edits go
live within a short revalidation window, no redeploy required.

The committed snapshots under `frontend/content/` (profile, news, projects,
publications) and `frontend/public/fallback/` (stats, Q&A) are **fallbacks**
only: rendered when the backend is unreachable so the site degrades to the
last-synced values instead of revealing an outage. They are regenerated from
the DB by the `export_content` sync, not edited by hand.

## Pages

- **/** academic + engineer home: summary, news, and publications
  auto-synced from Google Scholar and annotated with verified CORE ranks
  (`backend/scholar/data/core_ranks.json`; manual escape hatch in
  `rank_overrides.json`: lowercase title-substring maps to `{rank, acronym}`).
- **/blog** posts served from the database (fields: `title`, `date`,
  `summary`, `tags`).
- **/projects** project cards.
- **/qa** public comment board: guests and registered users post; the owner
  replies, edits, or deletes anything; registered authors manage their own
  comments.

## Scholar sync

`backend/scholar/sync.py` mirrors the Google Scholar profile into Postgres
(publications + metrics + per-year citation histogram). Google Scholar
blocks datacenter IPs, so on Vercel it fetches through **SerpApi**'s Google
Scholar Author API (`SERPAPI_KEY`); without the key it falls back to scraping
the HTML directly, which works from a residential IP (e.g. local dev). It
runs:

1. daily via **Vercel Cron** — `GET /api/scholar/cron-sync/` at 22:30 UTC
   (06:30 Perth), guarded by a `CRON_SECRET` bearer token,
2. on demand: `POST /api/scholar/refresh/` as the owner, or
   `python manage.py sync_scholar` locally.

## Deploy

Pushes to `main` auto-deploy via **Vercel's Git integration**: `wenxiao-link`
rebuilds the frontend and `wenxiao-backend` rebuilds the Django function. No
self-hosted runner is involved — the old macOS workflow is retained, disabled,
at `.github/workflows/deploy.yml.disabled`.

Configuration lives in Vercel project env vars:

- **backend** — `DATABASE_URL` (Neon), `JWT_SECRET`, `PROD_ENV=True`,
  `CRON_SECRET`, `SERPAPI_KEY`
- **frontend** — `BACKEND_INTERNAL_URL` (the backend project's URL)

Neon provides managed backups and point-in-time restore, so there is no
separate dump job.

## Local dev

```bash
# backend — docker compose Postgres + Django (needs backend/.env; see
# backend/.env.example). With no DATABASE_URL set, settings use the
# compose DB_* vars, so local runs against the container, not Neon.
cd backend && docker compose up -d

# frontend
cd frontend && npm install && npm run dev   # http://localhost:3000
```
