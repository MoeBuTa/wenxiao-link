# Home & projects editing guide (for agents)

This guide is for an **automated agent** updating the home page (identity,
about, news, education, experience, skills) and the projects list via the API.
For the blog, see [`blog-authoring.md`](./blog-authoring.md).

The database is the source of truth. The committed `frontend/content/*.json`
files are only an **offline fallback** (served when the backend is
unreachable); they're regenerated from the DB by a periodic job, so don't edit
them by hand — write to the API instead. Edits appear on the live site within
~30s (the pages revalidate on that interval).

---

## 1. Authentication (same as the blog)

Writes require the **site owner (a superuser)**; reads are public. Log in once,
keep the cookie, send it on every write:

```bash
BASE=https://wenxiao.link          # local dev: http://127.0.0.1:8002

curl -s -c cookies.txt -X POST "$BASE/api/auth/login/" \
  -H 'Content-Type: application/json' \
  -d '{"username":"<owner-username>","password":"<password>"}'
# then send -b cookies.txt on every write below
```

`401` = bad credentials, `403` = logged in but not a superuser.

---

## 2. The resources

All live under `/api/content/`. List resources support `GET` (public list),
`POST` (create), and `PATCH`/`DELETE` on `/<id>/`. The wire format is
**camelCase** and matches these field names exactly.

### Profile — the home identity + about (singleton)

`GET /api/content/profile/` · `PATCH /api/content/profile/` (no POST/DELETE).

PATCH touches **only the keys you send**:

| Field | Type | Notes |
|---|---|---|
| `name` | string | |
| `title` | string | e.g. "PhD Candidate · AI Engineer" |
| `affiliation` | string | |
| `email` | string | |
| `researchDirection` | string | one-line research statement |
| `summaryText` | string | the **about** paragraphs, separated by a **blank line**. ⚠️ Edit this, not `summary`. |
| `interests` | string[] | |
| `links` | object | keys: `github`, `linkedin`, `scholar`, `cv` (send only the ones you change) |

> Note: `GET` also returns `summary` as a pre-split **array** of paragraphs —
> that's a read-only rendering of `summaryText`. To change the about text, send
> `summaryText`.

```bash
curl -s -b cookies.txt -X PATCH "$BASE/api/content/profile/" \
  -H 'Content-Type: application/json' \
  -d '{"researchDirection":"Reliable and secure LLM agent systems.",
       "summaryText":"First paragraph.\n\nSecond paragraph.",
       "links":{"linkedin":"https://www.linkedin.com/in/wenxiao-zhang-a0801b206/"}}'
```

### News — the timeline on the home page

`GET/POST /api/content/news/` · `PATCH/DELETE /api/content/news/<id>/`

| Field | Type | Notes |
|---|---|---|
| `date` | string | **`YYYY-MM`** (note: month only, unlike the blog's `YYYY-MM-DD`) |
| `text` | string | markdown; inline `[label](url)` links are supported |
| `order` | int | tiebreaker within the same month (sorted newest date first, then `order`) |

```bash
curl -s -b cookies.txt -X POST "$BASE/api/content/news/" \
  -H 'Content-Type: application/json' \
  -d '{"date":"2026-06","text":"Paper accepted at [VENUE 2026](https://example.com)!","order":0}'
```

### Education / Experience / Skills — home page sections

`GET/POST /api/content/{education|experience|skills}/` · `PATCH/DELETE …/<id>/`

| Resource | Fields |
|---|---|
| `education` | `institution`, `degree`, `period`, `detail`, `order` |
| `experience` | `org`, `role`, `period`, `detail`, `order` |
| `skills` | `group`, `items` (string[]), `order` |

`period` is free-form text, e.g. `"2024/03 – 2027/03 (expected)"`. Items render
in ascending `order` (then id), so set `order` to control position.

```bash
curl -s -b cookies.txt -X POST "$BASE/api/content/skills/" \
  -H 'Content-Type: application/json' \
  -d '{"group":"Agentic / LLM","items":["LangChain","LangGraph","MCP"],"order":0}'
```

### Projects

`GET/POST /api/content/projects/` · `PATCH/DELETE /api/content/projects/<id>/`

| Field | Type | Notes |
|---|---|---|
| `name` | string | |
| `description` | string | one paragraph |
| `tags` | string[] | |
| `repoUrl` | string | GitHub URL |
| `stars` | int \| null | optional star count |
| `highlight` | bool | featured projects are shown first |
| `order` | int | position within its group |

```bash
# Create
curl -s -b cookies.txt -X POST "$BASE/api/content/projects/" \
  -H 'Content-Type: application/json' \
  -d '{"name":"STIndex","description":"Multi-dimensional extraction…",
       "tags":["spatiotemporal","llm","python"],
       "repoUrl":"https://github.com/MoeBuTa/STIndex","stars":1,"highlight":true,"order":0}'

# Update one field by id
curl -s -b cookies.txt -X PATCH "$BASE/api/content/projects/12/" \
  -H 'Content-Type: application/json' -d '{"stars":42}'
```

To find an item's `<id>` for a PATCH/DELETE, `GET` the list first and match on a
stable field (e.g. `name`, `repoUrl`).

---

## 3. Common agent operations

- **Update the about blurb** → `PATCH /profile/` with `summaryText`.
- **Add a news entry** → `POST /news/` (remember `YYYY-MM`).
- **Add / edit a project** → `POST /projects/`, or `GET` then `PATCH /projects/<id>/`.
- **Reorder anything** → `PATCH …/<id>/` with a new `order`.

There's no markdown-upload shortcut here (that's blog-only) — these are small
structured records, so send JSON directly to the resource endpoints.

---

## 4. How the offline fallback stays fresh (FYI)

The DB is authoritative. Two management commands keep the committed
`frontend/content/*.json` fallback in sync (the blog is excluded — it's
DB-only):

- `python manage.py seed_content` — one-time bootstrap, loads the committed JSON
  into an empty DB (`--force` to replace).
- `python manage.py export_content` — writes the JSON back **from** the DB; run
  periodically (`scripts/launchd/com.wenxiao.content-sync.plist`) so the
  fallback tracks live edits.

As an agent you never touch these files — just write to the API and the sync
job regenerates them.
