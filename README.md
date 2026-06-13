# wenxiao.link

Personal website of Wenxiao Zhang: academic homepage, blog, projects, and
a public Q&A board.

```
.
├── frontend/   Next.js 16 (App Router) + Chakra UI + TypeScript (pm2)
├── backend/    Django + DRF + Postgres + Hasura (docker compose)
└── .github/workflows/deploy.yml
                Path-diff deploy: only the side that changed redeploys.
```

## Routing

One hostname, split by path at a Cloudflare Tunnel:

| Route                | Service          |
| -------------------- | ---------------- |
| `wenxiao.link/api/*` | Django (backend) |
| `wenxiao.link/*`     | Next.js (frontend) |

Same origin everything: no CORS in production, cookies are first-party.
The Next config also rewrites `/api/*` to the backend so the app works when
hit directly in `next dev`. Postgres and Hasura are bound to loopback only
and are never exposed through the tunnel.

## Content model

The **database is the source of truth.** Profile, news, projects, and blog
posts are stored in Postgres and edited at runtime through the admin
(Django admin under `/api/django-admin/`, or the in-app owner UI). Edits go
live within a short revalidation window, no redeploy required.

The JSON files under `frontend/content/` (profile, news, projects, and
publications) are **build-time fallbacks** only: the server renders from
them when the backend is unreachable. They are not the live content, and
editing them does not change the site. The blog has no file fallback, so it
renders empty if the backend is ever down.

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

`python manage.py sync_scholar` scrapes the Scholar profile and upserts into
Postgres. It runs:

1. on container first boot (entrypoint, only when the table is empty),
2. daily via the `com.wenxiao.scholar-sync` launchd job
   (`backend/scripts/launchd/sync-scholar.sh`, which runs `docker exec`),
3. on demand: `POST /api/scholar/refresh/` as the owner.

## Backups

The database is dumped daily by the `com.wenxiao.backup-db` launchd job
(`backend/scripts/launchd/backup-db.sh`): `pg_dump` custom format,
date-stamped, with a rolling retention window. Restore a dump with:

```bash
docker exec -i wenxiao-db pg_restore --clean --if-exists -U wenxiao -d wenxiao \
  < "$WENXIAO_DATA_ROOT/backups/wenxiao-YYYY-MM-DD.dump"
```

## Deploy

Pushes to `main` trigger `.github/workflows/deploy.yml` on a self-hosted
runner. Frontend job: `npm ci`, `npm run build`, `pm2 reload`. Backend job:
`docker compose up -d`, restart the API, health-check `/api/health/`.
Secrets (`ADMIN_USERNAME`, `ADMIN_PASSWORD`, `JWT_SECRET`,
`HASURA_ADMIN_SECRET`) come from GitHub repo secrets and are written to
`backend/.env` on first deploy only. Postgres data and backups persist
outside the runner workspace so a re-checkout never touches them.

## Local dev

```bash
# backend (needs backend/.env — see backend/.env.example)
cd backend && docker compose up -d

# frontend
cd frontend && npm install && npm run dev   # http://localhost:3000
```
