"""Turn an uploaded markdown document into BlogPost fields.

The document is plain markdown with an optional leading YAML frontmatter
block. The supported frontmatter subset is small and documented (for agents)
in ``frontend/docs/blog-authoring.md``:

    ---
    title: My Post
    date: 2026-06-14
    summary: One-line teaser.
    tags: [llm, agents]
    slug: my-post          # optional; derived from the title when absent
    published: true        # optional; defaults to true
    ---

    Body in GitHub-flavoured markdown…

A real YAML parser is used when PyYAML is installed; otherwise a minimal
parser handles the documented subset so the feature works without the extra
dependency.
"""

from __future__ import annotations

import re
from datetime import date as _date

try:  # Prefer a real YAML parser when available.
    import yaml  # type: ignore
except Exception:  # pragma: no cover - exercised only when PyYAML is absent
    yaml = None

_FRONTMATTER_RE = re.compile(r"^﻿?---[ \t]*\r?\n(.*?)\r?\n---[ \t]*\r?\n?", re.DOTALL)
_H1_RE = re.compile(r"^#[ \t]+(.+?)[ \t]*$")


def parse_blog_markdown(text: str, *, today: str | None = None) -> dict:
    """Return ``{title, slug, date, summary, tags, body, published}``.

    Raises ``ValueError`` when no title can be determined (neither a
    ``title:`` frontmatter key nor a leading ``# Heading``).
    """
    # Normalise newlines first so every path (including the no-H1 body path)
    # is CRLF-safe and stores LF-only text.
    text = (text or "").replace("\r\n", "\n").replace("\r", "\n")
    meta, body = _split_frontmatter(text)

    # A leading H1 is consumed as the title and removed from the body, so the
    # rendered post (which prints the title separately) never shows it twice.
    h1_title, body = _strip_leading_h1(body)

    title = (_as_str(meta.get("title")) or h1_title).strip()
    if not title:
        raise ValueError(
            "Markdown needs a title: add a `title:` frontmatter key or a leading `# Heading`."
        )

    date = _as_str(meta.get("date")).strip() or (today or _date.today().isoformat())
    summary = (_as_str(meta.get("summary")) or _first_paragraph(body)).strip()
    # Cap scalar fields to their model column widths so an absurdly long value
    # is a clean truncation rather than a DB DataError (500) on insert.
    return {
        "title": title[:300],
        "slug": _as_str(meta.get("slug")).strip(),  # caller fills/uniquifies if blank
        "date": date[:20],
        "summary": summary,
        "tags": _as_tags(meta.get("tags")),
        "body": body.strip("\n"),
        "published": _as_bool(meta.get("published"), default=True),
    }


# ---- frontmatter ------------------------------------------------------------


def _split_frontmatter(text: str) -> tuple[dict, str]:
    m = _FRONTMATTER_RE.match(text)
    if not m:
        return {}, text.lstrip("﻿")
    return _parse_yaml(m.group(1)), text[m.end():]


def _parse_yaml(raw: str) -> dict:
    if yaml is not None:
        try:
            data = yaml.safe_load(raw)
            if isinstance(data, dict):
                return data
        except Exception:
            pass
    return _minimal_yaml(raw)


def _minimal_yaml(raw: str) -> dict:
    """Parse ``key: value``, inline ``[a, b]`` lists, and ``- item`` blocks."""
    out: dict = {}
    key: str | None = None
    block: list | None = None
    for line in raw.splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if block is not None and re.match(r"^[ \t]+-[ \t]*", line):
            block.append(_unquote(re.sub(r"^[ \t]+-[ \t]*", "", line).strip()))
            continue
        block = None
        m = re.match(r"^([A-Za-z0-9_-]+):[ \t]*(.*)$", line)
        if not m:
            continue
        key, val = m.group(1), m.group(2).strip()
        if val == "":
            block = []
            out[key] = block  # same list object the block appends grow
        elif val.startswith("[") and val.endswith("]"):
            inner = val[1:-1].strip()
            out[key] = [_unquote(x.strip()) for x in inner.split(",") if x.strip()]
        else:
            out[key] = _coerce(_unquote(val))
    return out


def _unquote(s: str) -> str:
    if len(s) >= 2 and s[0] == s[-1] and s[0] in "\"'":
        return s[1:-1]
    return s


def _coerce(s: str):
    low = s.lower()
    if low in ("true", "yes"):
        return True
    if low in ("false", "no"):
        return False
    return s


# ---- body helpers -----------------------------------------------------------


def _strip_leading_h1(body: str) -> tuple[str, str]:
    lines = body.splitlines()
    i = 0
    while i < len(lines) and not lines[i].strip():
        i += 1
    if i < len(lines):
        m = _H1_RE.match(lines[i].strip())
        if m:
            del lines[i]
            return m.group(1).strip(), "\n".join(lines)
    return "", body


def _first_paragraph(body: str) -> str:
    for block in re.split(r"\n[ \t]*\n", body.strip()):
        b = block.strip()
        if b and not b.startswith("#") and not b.startswith("```") and not b.startswith(">"):
            return " ".join(line.strip() for line in b.splitlines()).strip()
    return ""


# ---- coercion ---------------------------------------------------------------


def _as_str(v) -> str:
    if v is None:
        return ""
    return v if isinstance(v, str) else str(v)


def _as_tags(v) -> list:
    if isinstance(v, list):
        return [str(x).strip() for x in v if str(x).strip()]
    if isinstance(v, str):
        return [t.strip() for t in v.split(",") if t.strip()]
    return []


def _as_bool(v, *, default: bool) -> bool:
    if isinstance(v, bool):
        return v
    if isinstance(v, str):
        s = v.strip().lower()
        return default if s == "" else s not in ("false", "no", "0", "off")
    if v is None:
        return default
    return bool(v)
