"""Bidirectional mapping between the DB content models and the committed
fallback JSON files in ``frontend/content/``.

The frontend reads content from the API first and falls back to these
committed JSON files when the backend is unreachable. To keep that fallback a
truthful snapshot:

- ``dump_content()`` builds the profile/news/projects JSON payloads from the
  DB. ``dump_all_fallbacks()`` wraps it and widens the snapshot to every
  read-only feature (publications, blog markdown, stats + Q&A read snapshots) —
  used by the periodic *DB → fallback* sync (``export_content``).
- ``load_content()`` writes JSON payloads into the DB — used by the one-time
  *fallback → DB* bootstrap (``seed_content``); it remains profile/news/projects
  only (the widened sections are export-only).

The JSON shapes mirror exactly what ``frontend/app/lib/content.ts`` and the
client fetchers expect (camelCase, summary as a paragraph array, links object),
so a regenerated file is a drop-in.
"""

import json
from pathlib import Path

from django.conf import settings

from content.models import (
    EducationItem,
    ExperienceItem,
    NewsItem,
    Profile,
    Project,
    SkillGroup,
)

# Filenames are the dict keys throughout, so a single JSON map
# ``{filename: content}`` can be piped between host and container.
PROFILE_FILE = "profile.json"
NEWS_FILE = "news.json"
PROJECTS_FILE = "projects.json"
FILES = [PROFILE_FILE, NEWS_FILE, PROJECTS_FILE]


def default_content_dir() -> Path:
    """``<repo>/frontend/content`` (BASE_DIR is the backend dir)."""
    return Path(settings.BASE_DIR).parent / "frontend" / "content"


def default_frontend_dir() -> Path:
    """``<repo>/frontend`` — the root the full fallback set is keyed against.

    ``dump_all_fallbacks()`` keys payloads by paths *relative to this dir*
    (``content/profile.json``, ``content/blog/<slug>.md``,
    ``public/fallback/stats.json``) because the snapshot now spans both the
    server-read ``content/`` files and the client-read ``public/fallback/``
    files.
    """
    return Path(settings.BASE_DIR).parent / "frontend"


# ---- DB -> JSON (export) ----------------------------------------------------


def dump_content() -> dict:
    # Read-only: never create the singleton row just to export (an unsaved
    # blank Profile yields valid empty defaults on a never-seeded DB).
    p = Profile.objects.filter(pk=1).first() or Profile()
    profile = {
        "name": p.name,
        "title": p.title,
        "affiliation": p.affiliation,
        "email": p.email,
        "links": {
            "github": p.link_github,
            "linkedin": p.link_linkedin,
            "scholar": p.link_scholar,
            "cv": p.link_cv or "/cv.pdf",
        },
        "summary": [s.strip() for s in p.summary.split("\n\n") if s.strip()],
        "researchDirection": p.research_direction,
        "interests": list(p.interests or []),
        "education": [
            {"institution": e.institution, "degree": e.degree, "period": e.period, "detail": e.detail}
            for e in EducationItem.objects.all()
        ],
        "experience": [
            {"org": x.org, "role": x.role, "period": x.period, "detail": x.detail}
            for x in ExperienceItem.objects.all()
        ],
        "skills": [
            {"group": s.group, "items": list(s.items or [])}
            for s in SkillGroup.objects.all()
        ],
    }
    news = {"news": [{"date": n.date, "text": n.text} for n in NewsItem.objects.all()]}
    projects = {"projects": [_project_dict(pr) for pr in Project.objects.all()]}
    return {PROFILE_FILE: profile, NEWS_FILE: news, PROJECTS_FILE: projects}


def _project_dict(pr: Project) -> dict:
    d = {
        "name": pr.name,
        "description": pr.description,
        "tags": list(pr.tags or []),
        "repoUrl": pr.repo_url,
    }
    if pr.stars is not None:
        d["stars"] = pr.stars
    d["highlight"] = pr.highlight
    return d


# ---- Full fallback snapshot (export) ----------------------------------------
#
# dump_content() above produces only the three core profile/news/projects files
# (its shapes also drive the reverse seed_content path, so it stays untouched).
# dump_all_fallbacks() is the export pipeline's entry point: it widens the
# snapshot to EVERY read-only feature so the Vercel-hosted frontend can render a
# complete site when the backend is unreachable. Keys are paths relative to
# frontend/ (see default_frontend_dir); .md values are raw strings, .json values
# are JSON-serialisable objects — the writer branches on the extension.

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


def _blog_frontmatter(title: str, date: str, summary: str, tags: list) -> str:
    # JSON scalars/sequences are valid YAML flow syntax, so json.dumps gives us
    # correctly-escaped frontmatter values that gray-matter (js-yaml) parses
    # back into the exact title/date/summary/tags the frontend expects.
    fields = {"title": title, "date": date, "summary": summary, "tags": list(tags or [])}
    body = "\n".join(f"{k}: {json.dumps(v, ensure_ascii=False)}" for k, v in fields.items())
    return f"---\n{body}\n---\n"


def _dump_blog() -> dict:
    """``{slug: "<frontmatter>\\n\\n<body>\\n"}`` for every published post.

    The frontend's file fallback (content.ts ``blogPostsFromFiles``) reads
    ``content/blog/*.md`` — this is what finally fills that directory.
    """
    from content.models import BlogPost

    out: dict = {}
    for post in BlogPost.objects.filter(published=True):
        fm = _blog_frontmatter(post.title, post.date, post.summary, post.tags)
        body = (post.body or "").rstrip()
        out[post.slug] = f"{fm}\n{body}\n" if body else f"{fm}\n"
    return out


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
        "url": skill.url,
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


def _dump_publications():
    """Reuse the scholar API's payload builders so the seed file is a drop-in
    for ``GET /api/scholar/publications/``. Returns None when there are no
    publications (mirrors sync_scholar's 0-row guard — don't blank the seed)."""
    from scholar.models import Publication, ScholarProfile
    from scholar.views import _profile_payload, _publication_payload

    pubs = list(Publication.objects.all())
    if not pubs:
        return None
    profile = ScholarProfile.objects.filter(user_id=settings.SCHOLAR_USER_ID).first()
    return {
        "profile": _profile_payload(profile),
        "publications": [_publication_payload(p) for p in pubs],
    }


def _dump_stats() -> dict:
    """``{"summary": {...}, "blog": {slug: views}}`` — the read side of the
    stats endpoints, snapshotted for the client-side fallback."""
    from stats.views import blog_stats_payload, summary_payload

    return {"summary": summary_payload(), "blog": blog_stats_payload()}


def _dump_qa() -> list:
    """The public Q&A board as an anonymous viewer sees it (canModify/isOwner
    are all false offline — posting/editing needs the live backend anyway)."""
    from django.contrib.auth.models import AnonymousUser

    from qa.views import board_payload

    return board_payload(AnonymousUser())


# ---- JSON -> DB (seed) ------------------------------------------------------


def load_content(data: dict, *, replace: bool = False) -> dict:
    """Apply a ``{filename: content}`` map to the DB.

    ``replace=False`` (default) only populates empty tables / a blank profile,
    so re-running never clobbers live edits. ``replace=True`` flushes and
    reloads each table present in ``data``. Returns ``{section: count|None}``
    where ``None`` means the section was skipped (already populated).
    """
    counts: dict = {}
    prof = data.get(PROFILE_FILE)
    if prof:
        counts["profile"] = _load_profile(prof, replace)
        counts["education"] = _load_list(EducationItem, prof.get("education", []), replace, _edu_fields)
        counts["experience"] = _load_list(ExperienceItem, prof.get("experience", []), replace, _exp_fields)
        counts["skills"] = _load_list(SkillGroup, prof.get("skills", []), replace, _skill_fields)
    news = data.get(NEWS_FILE)
    if news:
        counts["news"] = _load_list(NewsItem, news.get("news", []), replace, _news_fields)
    projects = data.get(PROJECTS_FILE)
    if projects:
        counts["projects"] = _load_list(Project, projects.get("projects", []), replace, _project_fields)
    return counts


def _load_list(model, items, replace, field_fn):
    if not replace and model.objects.exists():
        return None
    # Under --force, an empty list means "no data supplied for this section" —
    # leave the table as-is rather than wiping it (avoids partial-input loss).
    if replace and not items:
        return None
    model.objects.all().delete()
    model.objects.bulk_create([model(order=i, **field_fn(it)) for i, it in enumerate(items)])
    return model.objects.count()


def _load_profile(prof, replace):
    p = Profile.load()
    if not replace and p.name.strip():
        return None
    p.name = prof.get("name", "")
    p.title = prof.get("title", "")
    p.affiliation = prof.get("affiliation", "")
    p.email = prof.get("email", "")
    p.research_direction = prof.get("researchDirection", "")
    summary = prof.get("summary", [])
    p.summary = "\n\n".join(summary) if isinstance(summary, list) else str(summary or "")
    p.interests = prof.get("interests", []) or []
    links = prof.get("links", {}) or {}
    p.link_github = links.get("github", "")
    p.link_linkedin = links.get("linkedin", "")
    p.link_scholar = links.get("scholar", "")
    p.link_cv = links.get("cv", "/cv.pdf")
    p.save()
    return 1


def _news_fields(i):
    return {"date": i.get("date", ""), "text": i.get("text", "")}


def _edu_fields(i):
    return {
        "institution": i.get("institution", ""),
        "degree": i.get("degree", ""),
        "period": i.get("period", ""),
        "detail": i.get("detail", ""),
    }


def _exp_fields(i):
    return {
        "org": i.get("org", ""),
        "role": i.get("role", ""),
        "period": i.get("period", ""),
        "detail": i.get("detail", ""),
    }


def _skill_fields(i):
    return {"group": i.get("group", ""), "items": i.get("items", []) or []}


def _project_fields(i):
    return {
        "name": i.get("name", ""),
        "description": i.get("description", ""),
        "tags": i.get("tags", []) or [],
        "repo_url": i.get("repoUrl", ""),
        "stars": i.get("stars"),
        "highlight": bool(i.get("highlight", False)),
    }
