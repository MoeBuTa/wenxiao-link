"""Bidirectional mapping between the DB content models and the committed
fallback JSON files in ``frontend/content/``.

The frontend reads content from the API first and falls back to these
committed JSON files when the backend is unreachable. To keep that fallback a
truthful snapshot:

- ``dump_content()`` builds the JSON payloads from the DB — used by the
  periodic *DB → fallback* sync (``export_content``).
- ``load_content()`` writes JSON payloads into the DB — used by the one-time
  *fallback → DB* bootstrap (``seed_content``).

The JSON shapes mirror exactly what ``frontend/app/lib/content.ts`` expects
(camelCase, summary as a paragraph array, links object), so a regenerated file
is a drop-in. The blog is intentionally excluded — it is DB-only with no file
fallback.
"""

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
