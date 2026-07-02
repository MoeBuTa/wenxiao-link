# `/skills` — installed agent-skills showcase

## Purpose

A dual-purpose page on wenxiao.link: CV-credible evidence of how the site's
owner extends and works with AI coding agents, and a genuinely browsable
showcase for any visitor. Lists everything installed in Claude Code on the
owner's machine — plugins, npx-installed skill packages, and self-authored
skills — grouped and filterable, with a handful of curated highlights.

## Scope

In scope: a new page, its data file, and a local generation script.
Out of scope: backend/Django changes, Hasura, any DB-backed editing (this
content is not part of the DB-is-source-of-truth model used elsewhere in
this repo — it describes local machine state that Vercel's build cannot
see).

## Data model

`frontend/content/skills.json`, following the shape of the existing
`frontend/content/projects.json` fallback file:

```json
{
  "skills": [
    {
      "name": "brainstorming",
      "description": "Explores user intent, requirements and design before implementation.",
      "source": "plugin",
      "origin": "superpowers",
      "category": "skill",
      "tags": ["process", "design"],
      "highlight": {
        "blurb": "Gate every non-trivial change behind an explicit design + user approval step before any code is written.",
        "order": 1
      }
    }
  ]
}
```

Fields:
- `name` — skill/command/agent identifier.
- `description` — from the source manifest (`plugin.json` description,
  `SKILL.md` frontmatter `description`, or command frontmatter).
- `source` — one of `plugin`, `npx-package`, `self-authored`,
  `linked-project`. Reflects install mechanism found during discovery:
  - `plugin`: installed via Claude Code's `/plugin install`, tracked in
    `~/.claude/plugins/installed_plugins.json`.
  - `npx-package`: installed via an npx-based skill installer, tracked in
    `~/.agents/.skill-lock.json`, symlinked under `~/.claude/skills/`.
  - `self-authored`: a real directory (not a symlink) under
    `~/.claude/skills/` with no lockfile entry.
  - `linked-project`: a symlink under `~/.claude/skills/` pointing outside
    `~/.agents/skills/` (e.g. into another local project).
- `origin` — the plugin name, npx package source repo, or `null` for
  self-authored/linked entries.
- `category` — `skill`, `command`, or `agent`, based on which manifest
  file/directory it came from.
- `tags` — freeform, hand-assigned during curation for filtering.
- `highlight` — optional. Present only for the small curated set; `blurb`
  is a hand-written CV-style sentence, `order` controls its position among
  highlighted entries. Absent for the rest of the raw catalog.

This file is committed, static, and edited only by re-running the
generation script (or, for `highlight.blurb`/`tags`, by hand — the script
must not clobber existing `highlight`/`tags` values on re-run for entries
it has already seen, so curation work isn't lost on regeneration).

## Generation script

A local-only script (not run in CI/Vercel) that:
1. Reads `~/.claude/plugins/installed_plugins.json` and each installed
   plugin's `.claude-plugin/plugin.json`, walking each plugin's `skills/`,
   `commands/`, and `agents/` directories for entries.
2. Reads `~/.agents/.skill-lock.json` for npx-installed skills, and lists
   `~/.claude/skills/` to classify remaining entries as self-authored (real
   directory) or linked-project (symlink outside `~/.agents/skills/`).
3. Merges the result into `frontend/content/skills.json`, preserving any
   existing `highlight` and `tags` fields for entries matched by `name`.
4. Is run manually by the owner after installing/removing skills, with the
   diff reviewed and committed like any other content change.

Location: alongside other maintenance scripts, e.g.
`backend/scripts/export-skills.py` (or `.sh`/`.ts` — implementation detail
for the planning step), independent of the Django `export_content`
pipeline since it has nothing to do with the database.

## Page

- `frontend/app/skills/page.tsx` — server component. `revalidate` not
  needed (static file, changes only on deploy); reads via a new
  `getSkills()` in `frontend/app/lib/content.ts` that parses
  `frontend/content/skills.json` the same way `getProjects()` parses
  `projects.json`.
- `frontend/app/components/SkillsClient.tsx` — client component:
  - Curated highlights render inline within the catalog (visually
    distinguished, e.g. an accent border/badge — consistent with how
    `highlight: true` projects are styled on `/projects`), not a separate
    section — the design favors one filterable catalog over a two-part
    layout.
  - Filter controls: `source` and `category` (chip/toggle filters), plus a
    text search over `name` + `description` + `tags`.
  - Grouping: entries grouped by `origin` within the filtered set, so
    e.g. all `superpowers` skills cluster together.
- Metadata: page title "Skills", short description for `<head>`.

## Navigation

Added to `SiteHeader`'s nav link list alongside Home/Blog/Projects/
Publications, pointing at `/skills`.

## Testing

- `getSkills()` unit-testable against a fixture JSON the same way other
  `content.ts` readers are (if such tests exist for `getProjects`/
  `getPublications` — follow existing convention).
- Manual verification: run the generation script locally, confirm
  `skills.json` reflects actual installed plugins/skills, load `/skills`
  in dev, exercise filters/search, confirm curated entries render blurbs
  and non-curated entries don't.
