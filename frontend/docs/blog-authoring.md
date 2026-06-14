# Blog authoring guide (for agents)

This guide is written for an **automated agent**. The goal: given a topic or
prompt, write a markdown post and publish it to https://wenxiao.link/blog by
calling the API. No human UI is required.

The database is the source of truth. A published post appears on the public
blog within ~30s (the Next.js pages revalidate on that interval).

---

## 0. TL;DR recipe

```bash
BASE=https://wenxiao.link          # local dev: http://127.0.0.1:8002

# 1. Log in (must be the site owner / a superuser). Saves the auth cookie.
curl -s -c cookies.txt -X POST "$BASE/api/auth/login/" \
  -H 'Content-Type: application/json' \
  -d '{"username":"<owner-username>","password":"<password>"}'

# 2. Write post.md (see §2), then upload it. Sends the saved cookie.
curl -s -b cookies.txt -X POST "$BASE/api/content/blog/upload/" \
  -F file=@post.md

# → 201 {"id":…, "slug":"…", "title":"…", … }  Post is live at /blog/<slug>.
```

That's the whole loop: **log in → write markdown → upload**. The rest of this
doc explains each step and the conventions to follow.

---

## 1. Authentication

Auth is a cookie-based JWT. You must be a **superuser** (the site owner) to
create posts; a normal registered account gets `403`.

`POST /api/auth/login/` — JSON `{"username", "password"}`. On success it sets
an httpOnly cookie `wenxiao_access` (a 30-day JWT). Use a cookie jar:

```bash
curl -s -c cookies.txt -X POST "$BASE/api/auth/login/" \
  -H 'Content-Type: application/json' \
  -d '{"username":"owner","password":"…"}'
```

Then send `-b cookies.txt` on every write. `GET /api/auth/me/` confirms who
you are. Wrong credentials → `401`; rate limit is 20 writes/hour per IP.

---

## 2. Writing the markdown

A post is a markdown document with an **optional YAML frontmatter** block, then
the body in GitHub-flavoured markdown.

```markdown
---
title: How I built the review visualizer
date: 2026-06-14
summary: A one- or two-sentence teaser shown on the blog card.
tags: [reviewviz, engineering]
slug: review-visualizer          # optional — derived from the title if omitted
published: true                  # optional — defaults to true
---

Opening paragraph. This becomes the post body…

## A section

- bullet
- list

`inline code`, **bold**, _italic_, and [links](https://example.com).

```python
print("fenced code blocks render as a styled block")
```

> Blockquotes render with an accent bar.
```

### Frontmatter fields

| Key         | Required | Notes |
|-------------|----------|-------|
| `title`     | yes\*    | \*Required unless the body starts with a `# Heading` (see below). |
| `date`      | no       | `YYYY-MM-DD`. Defaults to **today** if omitted. Drives ordering (newest first). |
| `summary`   | no       | Card teaser. If omitted, the first body paragraph is used. |
| `tags`      | no       | `[a, b]` inline list, a `- a` block list, or `a, b`. **Drives the teaser image — see §3.** |
| `slug`      | no       | URL path. Derived from the title (slugified) if omitted, and de-duplicated (`-2`, `-3`, …). **Slugs are ASCII-only** — for a non-ASCII (e.g. CJK) title, supply an explicit ASCII `slug:`, otherwise it falls back to `post`, `post-2`, …. |
| `published` | no       | `true`/`false`. Defaults to `true`. Set `false` for a draft (hidden from the public blog). |

### The leading-H1 rule

The post title is rendered separately from the body, so **don't repeat it as an
`# H1` in the body** — it would show twice. The parser consumes the first
leading `# Heading` it sees:

- If frontmatter has no `title`, that first `# Heading` **becomes** the title.
- Either way the first leading `# Heading` line is **stripped** from the body.

So you can write a title-less file that just starts with `# My title` and it
works. Use `##`/`###` for in-body section headings.

### Supported markdown

Rendered with `react-markdown` + `remark-gfm`. Supported: headings, paragraphs,
**bold**/_italic_, links (open in a new tab), ordered/unordered lists, fenced
code blocks with language hints, inline code, blockquotes, horizontal rules
(`---`), and GFM tables. There is **no image hosting** — reference images by
absolute URL only; there is no cover-image upload (covers are generated, §3).

---

## 3. Tags and the teaser (cover) image

Posts have **no stored cover image**. The teaser — a gradient panel + an icon,
shown on the blog card and at the top of the post — is **derived from the
post's tags**. This means:

- **The teaser is bound to the tags.** Same tags → same teaser, always (stable
  across the list and the post page).
- **A new tag automatically gets a new teaser.** Uncurated tags are hashed
  deterministically to a gradient + icon, so introducing a fresh primary tag
  yields a fresh, stable cover with zero extra work.

How it's picked (see `frontend/app/lib/teaser.ts`, function `teaserForTags`):

1. **Curated tags win.** A small registry (`CURATED`) maps known tag substrings
   to a pinned gradient + icon. Current entries:
   - `reviewviz` / `peer-review` / `rebuttal` → highlighter
   - `pentest` / `cybersecurity` / `security` → terminal
   - `stindex` / `spatiotemporal` / `rag` / `retrieval` → map
   - `self-hosting` / `engineering` / `meta` / `infra` → server
   - `llm` / `agent` / `agents` → robot
   Matching is case-insensitive and by substring, and the first matching row
   wins, checked against **all** of the post's tags.
2. **Otherwise, generate.** The post's **primary (first) tag** is hashed
   (FNV-1a) to pick a gradient from the palette and an icon from the pool. A
   post with no tags falls back to the string `"post"`.

### How to "make a new tag / new teaser"

- **New auto teaser:** just put a new word as the **first** tag. The hash gives
  it a stable gradient + icon immediately — nothing else to change.
- **Pin a specific look for a tag:** add a row to `CURATED` in
  `frontend/app/lib/teaser.ts`, choosing a `gradient` from `GRADIENTS` and an
  `Icon` from `react-icons/fa`. Example:

  ```ts
  { match: ["diffusion", "image-gen"], teaser: { gradient: GRADIENTS[6], Icon: FaCube } },
  ```

  To widen the palette or icon set, extend `GRADIENTS` / `ICON_POOL` in the same
  file. (This is a code change — it needs a frontend deploy, unlike the
  auto-generated teasers which are pure runtime functions of the tag.)

Practical tag guidance for an agent: pick **2–4** short, lowercase, hyphenated
tags; make the **first** tag the one that best categorizes the post (it drives
the auto teaser); reuse a curated tag when the post fits one of the families
above so the cover matches its siblings.

---

## 4. Uploading

`POST /api/content/blog/upload/` — owner only. Two equivalent input modes:

**Multipart file** (most convenient when you have a `.md` on disk):

```bash
curl -s -b cookies.txt -X POST "$BASE/api/content/blog/upload/" -F file=@post.md
```

**JSON** (when the markdown is in a string):

```bash
curl -s -b cookies.txt -X POST "$BASE/api/content/blog/upload/" \
  -H 'Content-Type: application/json' \
  -d "$(jq -Rs '{markdown: .}' < post.md)"
```

An optional `published` field (JSON or form) overrides the frontmatter value,
e.g. `-F published=false` to force a draft.

### Response

`201 Created` with the stored record — note the final `slug` (it may have been
de-duplicated):

```json
{
  "id": 12,
  "slug": "review-visualizer",
  "title": "How I built the review visualizer",
  "date": "2026-06-14",
  "summary": "…",
  "tags": ["reviewviz", "engineering"],
  "body": "…",
  "published": true
}
```

Errors: `400` (empty document, or no title resolvable), `401` (not logged in),
`403` (logged in but not a superuser).

### Verify

The post is live at `"$BASE"/blog/<slug>` and listed at `"$BASE"/blog` within
~30s. To confirm via API: `GET /api/content/blog/by-slug/<slug>/` (published
posts only).

---

## 5. Full agent loop

1. Decide the topic from the prompt; choose a title, 2–4 tags (first tag drives
   the teaser — §3), and a one-line summary.
2. Write `post.md` with frontmatter + GFM body. Don't repeat the title as a body
   `# H1`.
3. `POST /api/auth/login/` with the owner credentials → save the cookie.
4. `POST /api/content/blog/upload/` with the file → read the returned `slug`.
5. `GET /api/content/blog/by-slug/<slug>/` to confirm it published.

Keep posts as drafts (`published: false`) while iterating; flip to `true` (or
edit via `PATCH /api/content/blog/<id>/`) when ready.
