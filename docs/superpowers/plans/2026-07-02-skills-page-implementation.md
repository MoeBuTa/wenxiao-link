# Skills Page Implementation Plan (DB-backed)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/skills` on wenxiao-link: a filterable/searchable catalog of every Claude Code plugin, npx-installed skill, and self-authored skill on the owner's machine — DB-backed and Django-admin-editable, matching the existing `BlogPost`/`Project` pattern, with a local scan-and-sync workflow to pick up newly installed skills.

**Architecture:** A new Django model `AgentSkill` (`backend/content/models.py`) is the source of truth, exposed at `/api/content/agent-skills/` and editable in Django admin. `export_content` gains a markdown dump (`content/agent-skills/<slug>.md`) so the Next.js frontend has an offline fallback, mirroring how blog posts already work. A Node scanner (`frontend/scripts/export-agent-skills.mjs`, already validated against this machine's real `~/.claude`/`~/.agents`) produces a JSON snapshot; a new management command `sync_agent_skills` upserts it into the DB, refreshing only "detected" fields (name/description/source/origin/category) and never touching "curated" fields (tags/highlight/published/order) once a row exists. The frontend page (`frontend/app/skills/page.tsx` + `SkillsClient.tsx`) reads via a new `getAgentSkills()` that tries the API first, falls back to the committed markdown.

**Tech Stack:** Django + DRF (existing backend stack) for the model/API/admin/command; Next.js + TypeScript + Chakra UI v2 (existing frontend stack) for the page; `gray-matter` (already a frontend dependency) for markdown frontmatter, both in the scanner script and in `content.ts`'s file-fallback reader.

## Global Constraints

- URL/model naming: `/api/content/skills/` and the `SkillGroup` model are **already taken** (career-skills list on the homepage). This feature uses `/api/content/agent-skills/` and the model name `AgentSkill` — do not reuse `skills`/`Skill` anywhere in new code.
- Wire format is camelCase (repo-wide convention, see root `CLAUDE.md`): `highlightBlurb`, `highlightOrder`. Model/DB fields stay snake_case (`highlight_blurb`, `highlight_order`) per existing Django convention.
- Follow the `BlogPost` pattern exactly for: `ReadOnlyOrSuperUser` permission class (owner-only writes, public reads of `published=True`), admin registration style, `export_content` markdown-dump style (frontmatter built with `json.dumps` per field, exactly like `_blog_frontmatter`).
- No new test framework, frontend or backend — this repo has none (`find . -iname "test*.py"` and `find frontend -iname "*.test.*"` both return nothing). Verify via `docker compose` + `curl` (backend) and `npm run type-check`/`lint`/`build` + manual browser check (frontend).
- The Node scanner script is local-only tooling — never runs in CI/Vercel, never imported by a Next.js route.
- `backend/scripts/.agent-skills-scan.json` (the scanner's output, read by `sync_agent_skills`) must be gitignored — it's machine-specific transient data, not committed content.
- Dev environment: backend runs via `docker compose` in `backend/` (services `wenxiao-db`/`wenxiao-api`/`wenxiao-hasura`; already up on this machine). Frontend runs via `npm run dev` in `frontend/` (already running on port 3001 on this machine — substitute your actual port).

---

### Task 1: `AgentSkill` model, migration, admin

**Files:**
- Modify: `backend/content/models.py`
- Modify: `backend/content/admin.py`
- Create: `backend/content/migrations/0002_agentskill.py` (generated, not hand-written — see Step 2)

**Interfaces:**
- Produces: `AgentSkill` model with fields `slug, name, description, source, origin, category, tags, highlight_blurb, highlight_order, published, order, created_at, updated_at`, consumed by Tasks 2, 3, 4.

- [ ] **Step 1: Add the model**

In `backend/content/models.py`, insert this class before `class BlogPost` (keeping the file's alphabetical-by-model-name ordering — `AgentSkill` sorts before `BlogPost`):

```python
class AgentSkill(models.Model):
    """Claude Code plugin/skill/command/agent installed on the owner's
    machine, shown on the /skills page. `slug`/`name`/`description`/
    `source`/`origin`/`category` are "detected" fields refreshed by the
    `sync_agent_skills` management command; `tags`/`highlight_blurb`/
    `highlight_order`/`published`/`order` are "curated" fields set once via
    admin and never overwritten by a re-sync.
    """

    SOURCE_CHOICES = [
        ("plugin", "Plugin"),
        ("npx-package", "npx package"),
        ("self-authored", "Self-authored"),
        ("linked-project", "Linked project"),
    ]
    CATEGORY_CHOICES = [
        ("skill", "Skill"),
        ("command", "Command"),
        ("agent", "Agent"),
    ]

    slug = models.SlugField(max_length=220, unique=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")  # markdown; edited via admin
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES)
    origin = models.CharField(max_length=255, blank=True, default="")
    category = models.CharField(max_length=10, choices=CATEGORY_CHOICES)
    tags = models.JSONField(default=list)  # list[str]
    highlight_blurb = models.TextField(blank=True, default="")
    highlight_order = models.IntegerField(null=True, blank=True)
    published = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "name"]

    def __str__(self) -> str:  # pragma: no cover - admin readability
        return f"{self.name} ({self.origin or 'local'})"
```

- [ ] **Step 2: Generate the migration**

Run: `cd backend && docker compose exec platform python manage.py makemigrations content`
Expected: output ending with something like `Migrations for 'content': content/migrations/0002_agentskill.py - Create model AgentSkill`. This creates the migration file — do not hand-write it.

- [ ] **Step 3: Apply it**

Run: `docker compose exec platform python manage.py migrate content`
Expected: `Applying content.0002_agentskill... OK`.

- [ ] **Step 4: Register in admin**

In `backend/content/admin.py`, add `AgentSkill` to the import from `content.models` (keep alphabetical):

```python
from content.models import (
    AgentSkill,
    BlogPost,
    EducationItem,
    ExperienceItem,
    NewsItem,
    Profile,
    Project,
    SkillGroup,
)
```

Then add, after the `ProfileAdmin` registration (before `NewsItemAdmin`, keeping roughly the models.py ordering):

```python
@admin.register(AgentSkill)
class AgentSkillAdmin(admin.ModelAdmin):
    list_display = ("name", "source", "category", "origin", "published", "order")
    list_filter = ("source", "category", "published")
    list_editable = ("published", "order")
    prepopulated_fields = {"slug": ("origin", "name")}
```

- [ ] **Step 5: Verify in Django admin**

Run: `docker compose exec platform python manage.py shell -c "from content.models import AgentSkill; print(AgentSkill.objects.count())"`
Expected: `0` (table exists, empty).

Open `http://127.0.0.1:8002/api/django-admin/content/agentskill/` in a browser (login `wenxiao`/`123` or your local admin credentials), confirm the empty "Agent skills" list page renders with an "Add agent skill" button and the fields above are all present in the add form.

- [ ] **Step 6: Commit**

```bash
git add backend/content/models.py backend/content/admin.py backend/content/migrations/0002_agentskill.py
git commit -m "feat(agent-skills): add AgentSkill model, migration, admin"
```

---

### Task 2: Serializer, views, URLs

**Files:**
- Modify: `backend/content/serializers.py`
- Modify: `backend/content/views.py`
- Modify: `backend/content/urls.py`

**Interfaces:**
- Consumes: `AgentSkill` model from Task 1.
- Produces: `GET/POST /api/content/agent-skills/`, `GET/PATCH/DELETE /api/content/agent-skills/<id>/`, JSON shape `{id, slug, name, description, source, origin, category, tags, highlightBlurb, highlightOrder, published, order}` — consumed by Task 5 (`getAgentSkills()`).

- [ ] **Step 1: Add the serializer**

In `backend/content/serializers.py`, add `AgentSkill` to the model import (keep alphabetical):

```python
from content.models import (
    AgentSkill,
    BlogPost,
    EducationItem,
    ExperienceItem,
    NewsItem,
    Profile,
    Project,
    SkillGroup,
)
```

Then add, after `ProjectSerializer` (before `BlogPostListSerializer`):

```python
class AgentSkillSerializer(serializers.ModelSerializer):
    tags = serializers.ListField(child=serializers.CharField(), required=False)
    highlightBlurb = serializers.CharField(source="highlight_blurb", allow_blank=True, required=False)
    highlightOrder = serializers.IntegerField(source="highlight_order", allow_null=True, required=False)

    class Meta:
        model = AgentSkill
        fields = [
            "id",
            "slug",
            "name",
            "description",
            "source",
            "origin",
            "category",
            "tags",
            "highlightBlurb",
            "highlightOrder",
            "published",
            "order",
        ]
```

- [ ] **Step 2: Add the views**

In `backend/content/views.py`, add `AgentSkill` to the model import and `AgentSkillSerializer` to the serializer import (keep each list alphabetical):

```python
from content.models import (
    AgentSkill,
    BlogPost,
    EducationItem,
    ExperienceItem,
    NewsItem,
    Profile,
    Project,
    SkillGroup,
)
...
from content.serializers import (
    AgentSkillSerializer,
    BlogPostDetailSerializer,
    BlogPostListSerializer,
    EducationItemSerializer,
    ExperienceItemSerializer,
    NewsItemSerializer,
    ProfileSerializer,
    ProfileUpdateSerializer,
    ProjectSerializer,
    SkillGroupSerializer,
)
```

Then add, after `ProjectDetailView` (before the `# ---- Blog ----` section comment):

```python
# ---- Agent skills -----------------------------------------------------------


class AgentSkillListView(generics.ListCreateAPIView):
    """Public list shows published entries; the owner sees unpublished too (?all=1)."""

    permission_classes = [ReadOnlyOrSuperUser]
    serializer_class = AgentSkillSerializer

    def get_queryset(self):
        qs = AgentSkill.objects.all()
        user = self.request.user
        show_all = self.request.query_params.get("all") == "1"
        if not (show_all and user.is_authenticated and user.is_superuser):
            qs = qs.filter(published=True)
        return qs


class AgentSkillDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin edit by id (full record); public read by id is published-only."""

    permission_classes = [ReadOnlyOrSuperUser]
    serializer_class = AgentSkillSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.is_superuser:
            return AgentSkill.objects.all()
        return AgentSkill.objects.filter(published=True)
```

- [ ] **Step 3: Wire the URLs**

In `backend/content/urls.py`, add after the `projects/<int:pk>/` line (before the `blog/` lines):

```python
    path("agent-skills/", views.AgentSkillListView.as_view(), name="content-agent-skills"),
    path("agent-skills/<int:pk>/", views.AgentSkillDetailView.as_view(), name="content-agent-skills-detail"),
```

- [ ] **Step 4: Verify the API**

Run: `curl -s http://127.0.0.1:8002/api/content/agent-skills/`
Expected: `[]` (empty list, no rows yet).

Run this to confirm the API accepts an owner-authenticated create (adjust credentials/cookie handling to however you authenticate locally — e.g. via the Django admin session, or `POST /api/auth/login/` if that's the working endpoint on this machine):

```bash
docker compose exec platform python manage.py shell -c "
from content.models import AgentSkill
s = AgentSkill.objects.create(slug='test-entry', name='Test Entry', description='hello', source='self-authored', category='skill')
print(s.id, s.slug)
"
curl -s http://127.0.0.1:8002/api/content/agent-skills/
```

Expected: the curl output now shows one JSON object with `"slug": "test-entry"`, `"highlightBlurb": ""`, `"highlightOrder": null`. Then clean it up:

```bash
docker compose exec platform python manage.py shell -c "
from content.models import AgentSkill
AgentSkill.objects.filter(slug='test-entry').delete()
"
```

- [ ] **Step 5: Commit**

```bash
git add backend/content/serializers.py backend/content/views.py backend/content/urls.py
git commit -m "feat(agent-skills): add AgentSkill serializer, API views, URLs"
```

---

### Task 3: `export_content` markdown fallback dump

**Files:**
- Modify: `backend/content/fallback.py`

**Interfaces:**
- Consumes: `AgentSkill` model from Task 1.
- Produces: `content/agent-skills/<slug>.md` files (frontmatter + body) in `dump_all_fallbacks()`'s output map, consumed by Task 5's file-fallback reader.

- [ ] **Step 1: Add the dump function**

In `backend/content/fallback.py`, add after `_blog_frontmatter`/`_dump_blog` (before `_dump_publications`):

```python
def _agent_skill_frontmatter(skill) -> str:
    # Same approach as _blog_frontmatter: JSON scalars/sequences are valid
    # YAML flow syntax, so json.dumps gives correctly-escaped values that
    # gray-matter (js-yaml) parses back into exactly what the frontend expects.
    fields = {
        "name": skill.name,
        "source": skill.source,
        "origin": skill.origin,
        "category": skill.category,
        "tags": list(skill.tags or []),
        "highlightBlurb": skill.highlight_blurb,
        "highlightOrder": skill.highlight_order,
        "order": skill.order,
    }
    body = "\n".join(f"{k}: {json.dumps(v, ensure_ascii=False)}" for k, v in fields.items())
    return f"---\n{body}\n---\n"


def _dump_agent_skills() -> dict:
    """``{slug: "<frontmatter>\\n\\n<body>\\n"}`` for every published entry.

    The frontend's file fallback (content.ts ``agentSkillsFromFiles``) reads
    ``content/agent-skills/*.md`` — this is what fills that directory.
    """
    from content.models import AgentSkill

    out: dict = {}
    for skill in AgentSkill.objects.filter(published=True):
        fm = _agent_skill_frontmatter(skill)
        body = (skill.description or "").rstrip()
        out[skill.slug] = f"{fm}\n{body}\n" if body else f"{fm}\n"
    return out
```

- [ ] **Step 2: Wire it into `dump_all_fallbacks()`**

In `backend/content/fallback.py`, modify `dump_all_fallbacks()`:

```python
def dump_all_fallbacks() -> dict:
    core = dump_content()
    out: dict = {
        "content/profile.json": core[PROFILE_FILE],
        "content/news.json": core[NEWS_FILE],
        "content/projects.json": core[PROJECTS_FILE],
    }
    pubs = _dump_publications()
    if pubs is not None:  # 0-row guard: keep the last good seed, never blank it
        out["content/publications.seed.json"] = pubs
    for slug, md in _dump_blog().items():
        out[f"content/blog/{slug}.md"] = md
    for slug, md in _dump_agent_skills().items():
        out[f"content/agent-skills/{slug}.md"] = md
    out["public/fallback/stats.json"] = _dump_stats()
    out["public/fallback/qa.json"] = _dump_qa()
    return out
```

(Only the two new lines — `for slug, md in _dump_agent_skills()...` — are added; everything else in the function is unchanged.)

- [ ] **Step 3: Verify**

Run:

```bash
docker compose exec platform python manage.py shell -c "
from content.models import AgentSkill
AgentSkill.objects.create(slug='verify-dump', name='Verify Dump', description='body text', source='self-authored', category='skill', tags=['x'])
"
docker compose exec platform python manage.py export_content --to-stdout | python3 -c "import json,sys; d=json.load(sys.stdin); print('content/agent-skills/verify-dump.md' in d); print(d['content/agent-skills/verify-dump.md'])"
```

Expected: `True` printed, followed by frontmatter containing `name: "Verify Dump"` and body `body text`.

Clean up:

```bash
docker compose exec platform python manage.py shell -c "
from content.models import AgentSkill
AgentSkill.objects.filter(slug='verify-dump').delete()
"
```

- [ ] **Step 4: Commit**

```bash
git add backend/content/fallback.py
git commit -m "feat(agent-skills): dump AgentSkill entries into the export_content fallback"
```

---

### Task 4: `sync_agent_skills` management command

**Files:**
- Create: `backend/content/management/commands/sync_agent_skills.py`

**Interfaces:**
- Consumes: `AgentSkill` model from Task 1; a JSON file matching the shape Task 8's scanner script produces: `[{name, description, source, origin, category}, ...]`.
- Produces: upserted `AgentSkill` rows, consumed by Task 9 (data generation).

- [ ] **Step 1: Write the command**

Create `backend/content/management/commands/sync_agent_skills.py`:

```python
"""Upsert AgentSkill rows from a local plugin/skill scan.

Reads the JSON array produced by frontend/scripts/export-agent-skills.mjs
(run on the host, since only the host has access to ~/.claude and
~/.agents) and upserts it into the DB. "Detected" fields (name, description,
source, origin, category) are refreshed on every run; "curated" fields
(tags, highlight_blurb, highlight_order, published, order) are set only
when a row is first created and are never touched on update, so admin edits
survive re-syncs.

    python manage.py sync_agent_skills --from-json /path/to/scan.json

Run inside the API container (docker compose exec platform ...), since
that's where the DB connection lives — see backend/scripts/.agent-skills-scan.json,
which the bind-mounted volume makes visible inside the container at the same
relative path.
"""

import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.utils.text import slugify

from content.models import AgentSkill


class Command(BaseCommand):
    help = "Upsert AgentSkill rows from a JSON scan (see frontend/scripts/export-agent-skills.mjs)."

    def add_arguments(self, parser):
        parser.add_argument("--from-json", required=True, help="Path to the scan output JSON file.")

    def handle(self, *args, **opts):
        path = Path(opts["from_json"])
        if not path.exists():
            raise CommandError(f"no such file: {path}")

        entries = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(entries, list):
            raise CommandError("scan JSON must be a list of skill entries")

        created, updated, skipped = 0, 0, 0
        for entry in entries:
            name = (entry.get("name") or "").strip()
            if not name:
                skipped += 1
                continue
            category = entry.get("category") or "skill"
            origin = (entry.get("origin") or "").strip()
            source = entry.get("source") or "self-authored"
            description = entry.get("description") or ""

            existing = AgentSkill.objects.filter(name=name, category=category, origin=origin).first()
            if existing:
                existing.description = description
                existing.source = source
                existing.save(update_fields=["description", "source", "updated_at"])
                updated += 1
                continue

            AgentSkill.objects.create(
                slug=_unique_slug(f"{origin or 'local'}-{category}-{name}"),
                name=name,
                description=description,
                source=source,
                origin=origin,
                category=category,
            )
            created += 1

        self.stdout.write(
            self.style.SUCCESS(f"created {created}, updated {updated}, skipped {skipped} (of {len(entries)} scanned)")
        )


def _unique_slug(base: str) -> str:
    base = slugify(base)[:210] or "skill"
    slug, n = base, 2
    while AgentSkill.objects.filter(slug=slug).exists():
        slug = f"{base}-{n}"
        n += 1
    return slug
```

- [ ] **Step 2: Verify with a small fixture**

Run:

```bash
docker compose exec platform bash -c "cat > /tmp/scan-test.json <<'EOF'
[
  {\"name\": \"brainstorming\", \"description\": \"first run\", \"source\": \"plugin\", \"origin\": \"superpowers\", \"category\": \"skill\"},
  {\"name\": \"\", \"description\": \"should be skipped\", \"source\": \"plugin\", \"origin\": \"x\", \"category\": \"skill\"}
]
EOF
python manage.py sync_agent_skills --from-json /tmp/scan-test.json"
```

Expected: `created 1, updated 0, skipped 1 (of 2 scanned)`.

Run it again with a changed description to verify update-not-duplicate behavior:

```bash
docker compose exec platform bash -c "cat > /tmp/scan-test.json <<'EOF'
[
  {\"name\": \"brainstorming\", \"description\": \"second run\", \"source\": \"plugin\", \"origin\": \"superpowers\", \"category\": \"skill\"}
]
EOF
python manage.py sync_agent_skills --from-json /tmp/scan-test.json"
```

Expected: `created 0, updated 1, skipped 0 (of 1 scanned)`.

Run to verify curated-field preservation — hand-set a `highlight_blurb`, then re-sync, then confirm it survived:

```bash
docker compose exec platform python manage.py shell -c "
from content.models import AgentSkill
s = AgentSkill.objects.get(name='brainstorming')
s.highlight_blurb = 'do not clobber me'
s.tags = ['process']
s.save()
"
docker compose exec platform python manage.py sync_agent_skills --from-json /tmp/scan-test.json
docker compose exec platform python manage.py shell -c "
from content.models import AgentSkill
s = AgentSkill.objects.get(name='brainstorming')
print(s.description, '|', s.highlight_blurb, '|', s.tags)
"
```

Expected: `second run | do not clobber me | ['process']` — description updated, curated fields untouched.

Clean up:

```bash
docker compose exec platform python manage.py shell -c "
from content.models import AgentSkill
AgentSkill.objects.filter(name='brainstorming').delete()
"
```

- [ ] **Step 3: Commit**

```bash
git add backend/content/management/commands/sync_agent_skills.py
git commit -m "feat(agent-skills): add sync_agent_skills upsert command"
```

---

### Task 5: Frontend types + `getAgentSkills()` reader

**Files:**
- Modify: `frontend/app/lib/types.ts`
- Modify: `frontend/app/lib/content.ts`

**Interfaces:**
- Produces: `AgentSkillSource`, `AgentSkillCategory`, `AgentSkillEntry` types; `getAgentSkills(): Promise<AgentSkillEntry[]>`, consumed by Task 6.

- [ ] **Step 1: Add the types**

Append to `frontend/app/lib/types.ts` (after the existing `QAComment` type):

```typescript
export type AgentSkillSource = "plugin" | "npx-package" | "self-authored" | "linked-project";

export type AgentSkillCategory = "skill" | "command" | "agent";

export type AgentSkillEntry = {
  id: number;
  slug: string;
  name: string;
  description: string;
  source: AgentSkillSource;
  origin: string;
  category: AgentSkillCategory;
  tags: string[];
  highlightBlurb: string;
  highlightOrder: number | null;
  order: number;
};
```

- [ ] **Step 2: Add the reader**

In `frontend/app/lib/content.ts`, add `AgentSkillEntry`, `AgentSkillCategory`, `AgentSkillSource` to the type import at the top:

```typescript
import type {
  AgentSkillCategory,
  AgentSkillEntry,
  AgentSkillSource,
  BlogPostMeta,
  NewsItem,
  Project,
  PublicationsPayload,
  SiteProfile,
} from "./types";
```

Then append at the end of the file (after `getPublications`):

```typescript
// ---- Agent skills (DB-backed; file fallback is committed markdown dumped
// by export_content, mirroring how blog posts fall back) ---------------------

const AGENT_SKILLS_DIR = path.join(CONTENT_DIR, "agent-skills");

function agentSkillFromFrontmatter(
  slug: string,
  data: Record<string, unknown>,
  body: string,
): AgentSkillEntry {
  return {
    id: 0,
    slug,
    name: String(data.name ?? slug),
    description: body.trim(),
    source: (typeof data.source === "string" ? data.source : "self-authored") as AgentSkillSource,
    origin: String(data.origin ?? ""),
    category: (typeof data.category === "string" ? data.category : "skill") as AgentSkillCategory,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    highlightBlurb: String(data.highlightBlurb ?? ""),
    highlightOrder: typeof data.highlightOrder === "number" ? data.highlightOrder : null,
    order: typeof data.order === "number" ? data.order : 0,
  };
}

function agentSkillsFromFiles(): AgentSkillEntry[] {
  if (!fs.existsSync(AGENT_SKILLS_DIR)) return [];
  return fs
    .readdirSync(AGENT_SKILLS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const slug = f.replace(/\.md$/, "");
      const { data, content } = matter(fs.readFileSync(path.join(AGENT_SKILLS_DIR, f), "utf-8"));
      return agentSkillFromFrontmatter(slug, data, content);
    })
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export async function getAgentSkills(): Promise<AgentSkillEntry[]> {
  const data = await apiGet<AgentSkillEntry[]>("/agent-skills/");
  if (data) return data;
  return agentSkillsFromFiles();
}
```

- [ ] **Step 3: Type-check**

Run: `cd frontend && npm run type-check`
Expected: no errors.

- [ ] **Step 4: Manual verification**

Run: `cd frontend && npm run build 2>&1 | tail -30`
Expected: build succeeds. At this point `/api/content/agent-skills/` returns `[]` on this machine (Task 2's test data was cleaned up), so `getAgentSkills()` returns `[]` via the API branch — that's expected; Task 9 populates real data.

- [ ] **Step 5: Commit**

```bash
git add frontend/app/lib/types.ts frontend/app/lib/content.ts
git commit -m "feat(agent-skills): add AgentSkillEntry types and getAgentSkills() reader"
```

---

### Task 6: `/skills` page and `SkillsClient`

**Files:**
- Create: `frontend/app/skills/page.tsx`
- Create: `frontend/app/components/SkillsClient.tsx`

**Interfaces:**
- Consumes: `getAgentSkills()` and `AgentSkillEntry`/`AgentSkillSource`/`AgentSkillCategory` from Task 5.
- Produces: the `/skills` route, consumed by Task 7 (nav link).

- [ ] **Step 1: Write `SkillsClient.tsx`**

Create `frontend/app/components/SkillsClient.tsx`:

```tsx
"use client";

import {
  Box,
  Container,
  Flex,
  HStack,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Tag,
  Text,
  VStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { FaCode, FaMagic, FaPuzzlePiece, FaRobot, FaSearch, FaTerminal } from "react-icons/fa";
import type { IconType } from "react-icons";

import type { AgentSkillCategory, AgentSkillEntry, AgentSkillSource } from "../lib/types";

const SOURCE_LABELS: Record<AgentSkillSource, string> = {
  plugin: "Plugin",
  "npx-package": "npx package",
  "self-authored": "Self-authored",
  "linked-project": "Linked project",
};

const CATEGORY_LABELS: Record<AgentSkillCategory, string> = {
  skill: "Skill",
  command: "Command",
  agent: "Agent",
};

const CATEGORY_ICONS: Record<AgentSkillCategory, IconType> = {
  skill: FaPuzzlePiece,
  command: FaTerminal,
  agent: FaRobot,
};

const SOURCES: AgentSkillSource[] = ["plugin", "npx-package", "self-authored", "linked-project"];
const CATEGORIES: AgentSkillCategory[] = ["skill", "command", "agent"];

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Tag
      as="button"
      onClick={onClick}
      size="md"
      cursor="pointer"
      bg={active ? "accent" : "bg.card"}
      color={active ? "coal.900" : "fg.muted"}
      borderWidth="1px"
      borderColor={active ? "accent" : "border.muted"}
      fontWeight={active ? "700" : "500"}
      _hover={{ borderColor: "accent" }}
    >
      {label}
    </Tag>
  );
}

function SkillCard({ entry }: { entry: AgentSkillEntry }) {
  const CategoryIcon = CATEGORY_ICONS[entry.category];
  const isHighlighted = Boolean(entry.highlightBlurb);
  return (
    <Box
      borderWidth="1px"
      borderColor={isHighlighted ? "accent" : "border.muted"}
      borderRadius="lg"
      bg="bg.card"
      p={4}
      h="full"
      boxShadow={isHighlighted ? "0 0 0 1px rgba(249,115,22,0.25)" : undefined}
    >
      <VStack align="stretch" spacing={2}>
        <Flex align="center" gap={2}>
          <Icon as={CategoryIcon} color="fg.faint" boxSize={3.5} />
          <Text fontWeight="700" color="fg.default" noOfLines={1}>
            {entry.name}
          </Text>
          {isHighlighted ? (
            <Icon as={FaMagic} color="accent" boxSize={3.5} ml="auto" flexShrink={0} />
          ) : null}
        </Flex>
        <Text fontSize="sm" color="fg.muted" noOfLines={isHighlighted ? undefined : 3}>
          {isHighlighted ? entry.highlightBlurb : entry.description}
        </Text>
        <Wrap spacing={1.5}>
          <WrapItem>
            <Tag size="sm" bg="rgba(56,189,248,0.1)" color="ocean" fontSize="0.7em">
              {SOURCE_LABELS[entry.source]}
            </Tag>
          </WrapItem>
          {entry.tags.slice(0, 3).map((tag) => (
            <WrapItem key={tag}>
              <Tag size="sm" bg="bg.subtle" color="fg.muted" fontSize="0.7em">
                {tag}
              </Tag>
            </WrapItem>
          ))}
        </Wrap>
      </VStack>
    </Box>
  );
}

function originLabel(origin: string): string {
  return origin.trim() || "Personal";
}

export function SkillsClient({ skills }: { skills: AgentSkillEntry[] }) {
  const [search, setSearch] = useState("");
  const [activeSources, setActiveSources] = useState<Set<AgentSkillSource>>(new Set());
  const [activeCategories, setActiveCategories] = useState<Set<AgentSkillCategory>>(new Set());

  function toggle<T>(set: Set<T>, value: T, setter: (s: Set<T>) => void) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return skills.filter((s) => {
      if (activeSources.size > 0 && !activeSources.has(s.source)) return false;
      if (activeCategories.size > 0 && !activeCategories.has(s.category)) return false;
      if (!q) return true;
      const haystack = `${s.name} ${s.description} ${s.tags.join(" ")}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [skills, search, activeSources, activeCategories]);

  const grouped = useMemo(() => {
    const byOrigin = new Map<string, AgentSkillEntry[]>();
    for (const entry of filtered) {
      const key = originLabel(entry.origin);
      const list = byOrigin.get(key) ?? [];
      list.push(entry);
      byOrigin.set(key, list);
    }
    for (const list of byOrigin.values()) {
      list.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
    }
    return [...byOrigin.entries()].sort(([a], [b]) => {
      if (a === "Personal") return 1;
      if (b === "Personal") return -1;
      return a.localeCompare(b);
    });
  }, [filtered]);

  return (
    <Container maxW="6xl" py={{ base: 8, md: 12 }} px={{ base: 6, md: 10 }}>
      <Heading size="lg" mb={2}>
        Skills
      </Heading>
      <Text color="fg.muted" fontSize="sm" mb={6}>
        Claude Code plugins, agent skills, and tooling installed and in active use — how I extend
        and work with AI coding agents.
      </Text>

      <InputGroup mb={4} maxW="sm">
        <InputLeftElement pointerEvents="none">
          <Icon as={FaSearch} color="fg.faint" boxSize={3.5} />
        </InputLeftElement>
        <Input
          placeholder="Search skills..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          bg="bg.card"
          borderColor="border.muted"
        />
      </InputGroup>

      <VStack align="stretch" spacing={2} mb={8}>
        <Wrap spacing={2}>
          {SOURCES.map((s) => (
            <WrapItem key={s}>
              <FilterChip
                label={SOURCE_LABELS[s]}
                active={activeSources.has(s)}
                onClick={() => toggle(activeSources, s, setActiveSources)}
              />
            </WrapItem>
          ))}
        </Wrap>
        <Wrap spacing={2}>
          {CATEGORIES.map((c) => (
            <WrapItem key={c}>
              <FilterChip
                label={CATEGORY_LABELS[c]}
                active={activeCategories.has(c)}
                onClick={() => toggle(activeCategories, c, setActiveCategories)}
              />
            </WrapItem>
          ))}
        </Wrap>
      </VStack>

      {grouped.length === 0 ? (
        <Text color="fg.faint" fontSize="sm">
          No skills match the current filters.
        </Text>
      ) : (
        <VStack align="stretch" spacing={8}>
          {grouped.map(([origin, entries]) => (
            <Box key={origin}>
              <Heading size="sm" color="fg.muted" mb={3}>
                {origin}
              </Heading>
              <Box
                display="grid"
                gridTemplateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }}
                gap={4}
              >
                {entries.map((entry) => (
                  <SkillCard key={entry.slug} entry={entry} />
                ))}
              </Box>
            </Box>
          ))}
        </VStack>
      )}

      <HStack mt={10} spacing={1} color="fg.faint" fontSize="xs">
        <Icon as={FaCode} boxSize={3} />
        <Text>{skills.length} total, generated from this machine's Claude Code setup.</Text>
      </HStack>
    </Container>
  );
}
```

- [ ] **Step 2: Write the page**

Create `frontend/app/skills/page.tsx`:

```tsx
import type { Metadata } from "next";

import { getAgentSkills } from "../lib/content";
import { SkillsClient } from "../components/SkillsClient";

export const metadata: Metadata = {
  title: "Skills",
  description: "Claude Code plugins, agent skills, and tooling installed and in active use.",
};

export default async function SkillsPage() {
  const skills = await getAgentSkills();
  return <SkillsClient skills={skills} />;
}
```

- [ ] **Step 3: Type-check and lint**

Run: `cd frontend && npm run type-check && npm run lint`
Expected: both pass with no errors.

- [ ] **Step 4: Manual verification**

With `npm run dev` running, run: `curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3001/skills` (substitute your actual dev port)
Expected: `200`. Open it in a browser and confirm the empty-catalog state ("No skills match the current filters.") renders without errors — Task 9 populates real data.

- [ ] **Step 5: Commit**

```bash
git add frontend/app/skills/page.tsx frontend/app/components/SkillsClient.tsx
git commit -m "feat(agent-skills): add /skills catalog page with search and filters"
```

---

### Task 7: Add `/skills` to site navigation

**Files:**
- Modify: `frontend/app/components/SiteHeader.tsx:32-38`

**Interfaces:**
- Consumes: the `/skills` route from Task 6.

- [ ] **Step 1: Add the nav item**

In `frontend/app/components/SiteHeader.tsx`, change:

```typescript
const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/publications", label: "Publications" },
  { href: "/blog", label: "Blog" },
  { href: "/projects", label: "Projects" },
  ...(QA_ENABLED ? [{ href: "/qa", label: "Q&A" }] : []),
];
```

to:

```typescript
const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/publications", label: "Publications" },
  { href: "/blog", label: "Blog" },
  { href: "/projects", label: "Projects" },
  { href: "/skills", label: "Skills" },
  ...(QA_ENABLED ? [{ href: "/qa", label: "Q&A" }] : []),
];
```

- [ ] **Step 2: Type-check**

Run: `cd frontend && npm run type-check`
Expected: no errors.

- [ ] **Step 3: Manual verification**

With `npm run dev` running: `curl -s http://127.0.0.1:3001/ | grep -o 'href="/skills"'` (substitute your actual dev port)
Expected: prints `href="/skills"`.

- [ ] **Step 4: Commit**

```bash
git add frontend/app/components/SiteHeader.tsx
git commit -m "feat(agent-skills): link /skills in site navigation"
```

---

### Task 8: Local scanner script

**Files:**
- Create: `frontend/scripts/export-agent-skills.mjs`
- Modify: `frontend/package.json`
- Modify: `.gitignore` (repo root)

**Interfaces:**
- Produces: `backend/scripts/.agent-skills-scan.json`, a JSON array of `{name, description, source, origin, category}` objects — consumed by Task 4's `sync_agent_skills` command.

This script has already been prototyped and run successfully against this machine's actual `~/.claude` and `~/.agents` directories (112 entries discovered: 68 plugin-sourced, 41 npx-package, 2 self-authored, 1 linked-project). The code below is that validated scanning logic, with the output target changed from a frontend content file to the backend-visible scan path (no merge-with-existing logic — the Django command owns upsert/preservation now).

- [ ] **Step 1: Write the script**

Create `frontend/scripts/export-agent-skills.mjs`:

```javascript
#!/usr/bin/env node
// Local-only tool: scans this machine's Claude Code plugins and skills into
// a JSON array for `python manage.py sync_agent_skills --from-json <path>`
// to upsert into the DB. Never run in CI/Vercel — describes local machine
// state the build can't see.
// Usage: node frontend/scripts/export-agent-skills.mjs
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import matter from "gray-matter";

const HOME = os.homedir();
const CLAUDE_DIR = path.join(HOME, ".claude");
const AGENTS_DIR = path.join(HOME, ".agents");
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(SCRIPT_DIR, "..", "..", "backend", "scripts", ".agent-skills-scan.json");

function readJsonSafe(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return null;
  }
}

function walk(dir, matchFile) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walk(full, matchFile));
    else if (entry.isFile() && matchFile(entry.name, full)) results.push(full);
  }
  return results;
}

// Some third-party SKILL.md/command frontmatter has unquoted YAML that
// js-yaml rejects (an inline "word: text" in `description:` reads as a
// nested mapping key). Fall back to a best-effort line scrape so one
// malformed file doesn't abort the run.
function naiveFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const block = match[1];
  const nameMatch = block.match(/^name:\s*(.+)$/m);
  const descMatch = block.match(/^description:\s*(.+)$/m);
  const clean = (s) => s?.trim().replace(/^["'>|]+\s*/, "").replace(/["']$/, "");
  return {
    name: nameMatch ? clean(nameMatch[1]) : undefined,
    description: descMatch ? clean(descMatch[1]) : "",
  };
}

function frontmatterOf(file) {
  const raw = fs.readFileSync(file, "utf-8");
  try {
    return matter(raw).data;
  } catch {
    return naiveFrontmatter(raw);
  }
}

function slugName(file) {
  return path.basename(file, ".md");
}

function collectPlugins() {
  const installed = readJsonSafe(path.join(CLAUDE_DIR, "plugins", "installed_plugins.json"));
  const out = [];
  if (!installed?.plugins) return out;

  for (const [key, installs] of Object.entries(installed.plugins)) {
    const install = installs[0];
    if (!install) continue;
    const installPath = install.installPath;
    const manifest = readJsonSafe(path.join(installPath, ".claude-plugin", "plugin.json"));
    const pluginName = manifest?.name ?? key.split("@")[0];

    for (const skillFile of walk(installPath, (n) => n === "SKILL.md")) {
      const fm = frontmatterOf(skillFile);
      out.push({
        name: fm.name ?? path.basename(path.dirname(skillFile)),
        description: fm.description ?? "",
        source: "plugin",
        origin: pluginName,
        category: "skill",
      });
    }

    for (const cmdFile of walk(
      installPath,
      (n, full) => n.endsWith(".md") && path.basename(path.dirname(full)) === "commands",
    )) {
      const fm = frontmatterOf(cmdFile);
      out.push({
        name: fm.name ?? slugName(cmdFile),
        description: fm.description ?? "",
        source: "plugin",
        origin: pluginName,
        category: "command",
      });
    }

    for (const agentFile of walk(
      installPath,
      (n, full) => n.endsWith(".md") && path.basename(path.dirname(full)) === "agents",
    )) {
      const fm = frontmatterOf(agentFile);
      out.push({
        name: fm.name ?? slugName(agentFile),
        description: fm.description ?? "",
        source: "plugin",
        origin: pluginName,
        category: "agent",
      });
    }
  }
  return out;
}

function collectUserSkills() {
  const skillsDir = path.join(CLAUDE_DIR, "skills");
  const lock = readJsonSafe(path.join(AGENTS_DIR, ".skill-lock.json"));
  const lockSkills = lock?.skills ?? {};
  const out = [];
  if (!fs.existsSync(skillsDir)) return out;

  const npxSkillsRoot = path.join(AGENTS_DIR, "skills");
  for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
    const entryPath = path.join(skillsDir, entry.name);
    const stat = fs.lstatSync(entryPath);
    const skillMd = path.join(entryPath, "SKILL.md");
    if (!fs.existsSync(skillMd)) continue;
    const fm = frontmatterOf(skillMd);

    let source = "self-authored";
    let origin = "";
    if (stat.isSymbolicLink()) {
      const resolved = fs.realpathSync(entryPath);
      if (resolved.startsWith(npxSkillsRoot)) {
        source = "npx-package";
        origin = lockSkills[entry.name]?.source ?? "";
      } else {
        source = "linked-project";
        origin = resolved;
      }
    }

    out.push({
      name: fm.name ?? entry.name,
      description: fm.description ?? "",
      source,
      origin,
      category: "skill",
    });
  }
  return out;
}

const fresh = [...collectPlugins(), ...collectUserSkills()].sort((a, b) => a.name.localeCompare(b.name));
fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, `${JSON.stringify(fresh, null, 2)}\n`);
console.log(`Wrote ${fresh.length} entries to ${path.relative(process.cwd(), OUT_FILE)}`);
```

- [ ] **Step 2: Add an npm script**

In `frontend/package.json`, add to `"scripts"` (after `"lint"`):

```json
    "export:skills": "node scripts/export-agent-skills.mjs",
```

- [ ] **Step 3: Gitignore the scan output**

In the repo root `.gitignore`, add (near the other `backend/` entries):

```
backend/scripts/.agent-skills-scan.json
```

- [ ] **Step 4: Run it and verify**

Run: `cd frontend && npm run export:skills`
Expected: prints `Wrote <N> entries to ../backend/scripts/.agent-skills-scan.json` with `N` > 0 (this machine currently has 112 entries — the exact count will drift as skills are installed/removed; confirm non-zero and valid JSON, don't hardcode the number).

Run: `node -e "JSON.parse(require('fs').readFileSync('../backend/scripts/.agent-skills-scan.json','utf-8')); console.log('valid json')"` (from `frontend/`)
Expected: `valid json`.

- [ ] **Step 5: Commit**

```bash
git add frontend/scripts/export-agent-skills.mjs frontend/package.json .gitignore
git commit -m "feat(agent-skills): add local export-agent-skills scanner script"
```

---

### Task 9: Generate real data, curate highlights

**Files:** none tracked in git (DB rows + admin edits)

**Interfaces:**
- Consumes: Task 8's scanner, Task 4's `sync_agent_skills` command, Task 1's Django admin.
- Produces: real `AgentSkill` rows rendered by Task 6's page.

- [ ] **Step 1: Scan and sync**

Run: `cd frontend && npm run export:skills`
Then: `cd ../backend && docker compose exec platform python manage.py sync_agent_skills --from-json scripts/.agent-skills-scan.json`
Expected: `created <N>, updated 0, skipped 0 (of <N> scanned)` with `N` matching the scanner's count.

- [ ] **Step 2: Curate highlights via Django admin**

Open `http://127.0.0.1:8002/api/django-admin/content/agentskill/`. For a small set of standout entries, edit and set `highlight_blurb` (a hand-written CV-style sentence) and `highlight_order` (1, 2, 3...) and 2-3 `tags`. Suggested starting set (adjust wording to taste):

- `brainstorming` (origin `superpowers`) — order 1: "Gates every non-trivial change behind an explicit design + user-approval step before any code gets written."
- `systematic-debugging` (origin `superpowers`) — order 2
- `test-driven-development` (origin `superpowers`) — order 3
- `karpathy-guidelines` (origin `andrej-karpathy-skills`) — order 4
- `reviewviz` or `rebuttal-review-visualizer` (self-authored, empty origin) — order 5
- `career-ops` (linked-project) — order 6

- [ ] **Step 3: Verify the sync preserves curation**

Run: `docker compose exec platform python manage.py sync_agent_skills --from-json scripts/.agent-skills-scan.json` again.
Expected: `created 0, updated <N>, skipped 0`. Then confirm in admin that the `highlight_blurb`/`tags` you just set are still there (unchanged).

- [ ] **Step 4: Regenerate the fallback and confirm it picks up real data**

Run: `docker compose exec platform python manage.py export_content`
Expected: output listing `content/agent-skills/<slug>.md` for every published entry, ending in `export_content done`.

Run: `ls ../frontend/content/agent-skills/ | wc -l` (from `backend/`)
Expected: matches the number of published `AgentSkill` rows.

- [ ] **Step 5: Manual verification in browser**

With `npm run dev` running, open `/skills`:
- Confirm highlighted cards show their blurb and an accent border/magic-wand icon.
- Confirm search filters by name/description/tags.
- Confirm source and category filter chips narrow the results.
- Confirm entries are grouped by origin (plugin name / npx package repo / "Personal" for self-authored+linked-project).

- [ ] **Step 6: Commit the generated fallback files**

```bash
git add frontend/content/agent-skills/
git commit -m "feat(agent-skills): generate real catalog data and curate highlights"
```

(This commits the fallback markdown snapshot, matching how `content/blog/*.md` is committed. The DB rows themselves live only in the local Postgres container — they're not committed and don't need to be; the fallback snapshot is what production build/deploy actually needs to be current.)

---

### Task 10: Final verification pass

**Files:** none (verification only)

- [ ] **Step 1: Backend sanity**

Run: `cd backend && docker compose ps`
Expected: `wenxiao-api`, `wenxiao-db`, `wenxiao-hasura` all `Up`/`healthy`.

Run: `curl -s http://127.0.0.1:8002/api/content/agent-skills/ | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d), 'entries')"`
Expected: prints a nonzero entry count.

- [ ] **Step 2: Frontend type-check, lint, build**

Run: `cd frontend && npm run type-check && npm run lint && npm run build`
Expected: all three pass with zero errors.

- [ ] **Step 3: Full manual walkthrough**

With `npm run dev` running:
- `/` → confirm "Skills" appears in nav and the page still loads correctly.
- `/skills` → confirm the full catalog renders, grouped, with working search and filters, highlighted entries visually distinct.
- Resize to mobile width → confirm the nav drawer includes "Skills" and the catalog grid collapses to one column.
- Stop the backend (`docker compose stop platform` in `backend/`), reload `/skills`, confirm it still renders from the committed markdown fallback (Task 9 Step 6's commit) rather than erroring. Restart it afterward (`docker compose start platform`).

- [ ] **Step 4: Commit if any fixes were needed during this pass**

```bash
git add -A
git commit -m "fix(agent-skills): address issues found in final verification"
```

(Skip this commit if nothing needed fixing.)
