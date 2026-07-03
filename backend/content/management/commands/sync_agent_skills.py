"""Upsert AgentSkill rows from a local plugin/skill scan.

Reads the JSON array produced by frontend/scripts/export-agent-skills.mjs
(run on the host, since only the host has access to ~/.claude and
~/.agents) and upserts it into the DB. "Detected" fields (name, description,
source, origin, category, url) are refreshed on every run; "curated" fields
(tags, highlight_blurb, highlight_order, published, order) are set only
when a row is first created and are never touched on update, so admin edits
survive re-syncs. `url` is detected-when-derivable rather than always
detected: the scanner can only compute it for plugin/npx-package entries, so
an empty scanned url never blanks an existing (e.g. hand-set) value.

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
            url = (entry.get("url") or "").strip()

            existing = AgentSkill.objects.filter(name=name, category=category, origin=origin).first()
            if existing:
                existing.description = description
                existing.source = source
                if url:
                    existing.url = url
                existing.save(update_fields=["description", "source", "url", "updated_at"])
                updated += 1
                continue

            AgentSkill.objects.create(
                slug=_unique_slug(f"{origin or 'local'}-{category}-{name}"),
                name=name,
                description=description,
                source=source,
                origin=origin,
                category=category,
                url=url,
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
